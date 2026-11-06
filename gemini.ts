/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type, Chat, Modality, LiveServerMessage } from '@google/genai';
import { Language } from './types.js';
import * as usageTracker from './usage-tracker.js';

// --- Multi-Provider Key Resolution (Dynamic & Tree-Shaking Immune) ---

export type ProviderName = 'gemini' | 'groq' | 'openrouter';
export type ProviderPreference = 'auto' | 'groq' | 'gemini' | 'openrouter';

export function getPreferredProvider(): ProviderPreference {
    if (typeof window === 'undefined') return 'auto';
    try {
        const p = localStorage.getItem('PREFERRED_AI_PROVIDER');
        if (p === 'groq' || p === 'gemini' || p === 'openrouter' || p === 'auto') {
            return p;
        }
    } catch {}
    return 'auto';
}

export function setPreferredProvider(pref: ProviderPreference): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('PREFERRED_AI_PROVIDER', pref);
    } catch (e) {
        console.error("Failed to save preferred provider:", e);
    }
}

/**
 * აბრუნებს პროვაიდერის ყველა ხელმისაწვდომ გასაღებს მასივის სახით.
 * მხარს უჭერს მძიმით, წერტილ-მძიმით ან ახალი ხაზით გამოყოფილ მრავალ გასაღებს ლიმიტების გასაზრდელად.
 */
export function getApiKeys(provider: ProviderName): string[] {
    const rawKeys: string[] = [];

    // 1. Check window.__TRADICON_ENV__ (injected via Vite define at build time)
    if (typeof window !== 'undefined') {
        const win = window as any;
        if (win.__TRADICON_ENV__) {
            if (provider === 'gemini' && win.__TRADICON_ENV__.GEMINI_API_KEY) {
                rawKeys.push(String(win.__TRADICON_ENV__.GEMINI_API_KEY));
            }
            if (provider === 'groq' && win.__TRADICON_ENV__.GROQ_API_KEY) {
                rawKeys.push(String(win.__TRADICON_ENV__.GROQ_API_KEY));
            }
            if (provider === 'openrouter' && win.__TRADICON_ENV__.OPENROUTER_API_KEY) {
                rawKeys.push(String(win.__TRADICON_ENV__.OPENROUTER_API_KEY));
            }
        }
    }

    // 2. Check process.env runtime replacements
    try {
        if (provider === 'gemini') {
            const k = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (k) rawKeys.push(String(k));
        } else if (provider === 'groq') {
            const k = process.env.GROQ_API_KEY;
            if (k) rawKeys.push(String(k));
        } else if (provider === 'openrouter') {
            const k = process.env.OPENROUTER_API_KEY;
            if (k) rawKeys.push(String(k));
        }
    } catch {}

    // 3. Check localStorage
    if (typeof window !== 'undefined') {
        try {
            if (provider === 'gemini') {
                const ls = localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('API_KEY');
                if (ls) rawKeys.push(ls);
            } else if (provider === 'groq') {
                const ls = localStorage.getItem('GROQ_API_KEY') || localStorage.getItem('VITE_GROQ_API_KEY');
                if (ls) rawKeys.push(ls);
            } else if (provider === 'openrouter') {
                const ls = localStorage.getItem('OPENROUTER_API_KEY') || localStorage.getItem('VITE_OPENROUTER_API_KEY');
                if (ls) rawKeys.push(ls);
            }
        } catch {}
    }

    // Split any comma/semicolon/newline-delimited keys and remove duplicates
    const resultSet = new Set<string>();
    for (const raw of rawKeys) {
        if (!raw) continue;
        const tokens = String(raw).split(/[,;\n\r\t]+/);
        for (const token of tokens) {
            const clean = token.trim();
            if (clean.length > 5) {
                resultSet.add(clean);
            }
        }
    }

    return Array.from(resultSet);
}

export function getApiKey(provider: ProviderName): string {
    const keys = getApiKeys(provider);
    return keys[0] || '';
}

export function saveApiKeyToStorage(provider: ProviderName, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        const key = provider === 'gemini' ? 'GEMINI_API_KEY' : provider === 'groq' ? 'GROQ_API_KEY' : 'OPENROUTER_API_KEY';
        if (value && value.trim()) {
            localStorage.setItem(key, value.trim());
        } else {
            localStorage.removeItem(key);
        }
    } catch (e) {
        console.error("Failed to save API key to localStorage:", e);
    }
}

export function assertApiKey(): void {
    const hasGemini = getApiKeys('gemini').length > 0;
    const hasGroq = getApiKeys('groq').length > 0;
    const hasOpenRouter = getApiKeys('openrouter').length > 0;

    if (!hasGemini && !hasGroq && !hasOpenRouter) {
        throw new Error("AI API გასაღები (GEMINI_API_KEY, GROQ_API_KEY ან OPENROUTER_API_KEY) არ არის კონფიგურირებული. გთხოვთ მიუთითოთ ის Vercel Settings-ში ან აპლიკაციის პარამეტრებში.");
    }
}

function getGoogleGenAI(apiKey?: string): GoogleGenAI {
    const key = apiKey || getApiKey('gemini') || 'unconfigured';
    return new GoogleGenAI({ apiKey: key });
}

interface AiExecuteOptions {
    prompt: string;
    systemInstruction?: string;
    schema?: any;
    isJson?: boolean;
}

export function isServiceUnavailableError(error: any): boolean {
    const str = String(error?.message || error || '').toLowerCase();
    return str.includes('503') ||
           str.includes('unavailable') ||
           str.includes('high demand') ||
           str.includes('429') ||
           str.includes('quota') ||
           str.includes('rate limit') ||
           str.includes('resource_exhausted') ||
           str.includes('overloaded') ||
           str.includes('ტაიმაუტი') ||
           str.includes('timeout');
}

/**
 * ტაიმაუტის შეფუთვა — ხელს უშლის 40-180 წამიან გაჭედვას
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, providerName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        let isDone = false;
        const timer = setTimeout(() => {
            if (!isDone) {
                isDone = true;
                reject(new Error(`${providerName} ტაიმაუტი (${(ms / 1000).toFixed(1)} წმ) - სერვერი არ პასუხობს`));
            }
        }, ms);

        promise.then(
            res => {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    resolve(res);
                }
            },
            err => {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    reject(err);
                }
            }
        );
    });
}

async function callGeminiSingleKey(model: string, options: AiExecuteOptions, key: string): Promise<string> {
    const ai = getGoogleGenAI(key);
    const config: any = {};
    if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
    }
    if (options.isJson || options.schema) {
        config.responseMimeType = "application/json";
    }
    if (options.schema) {
        config.responseSchema = options.schema;
    }

    const response = await ai.models.generateContent({
        model,
        contents: options.prompt,
        config: Object.keys(config).length > 0 ? config : undefined
    });

    if (!response || !response.text) {
        throw new Error("Received an empty response from Gemini.");
    }
    return response.text;
}

async function callGeminiWithKeys(model: string, options: AiExecuteOptions, keys: string[], timeoutMs = 4500): Promise<string> {
    if (keys.length === 0) throw new Error("GEMINI_API_KEY არ არის კონფიგურირებული.");
    const errors: string[] = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
            return await withTimeout(callGeminiSingleKey(model, options, key), timeoutMs, `Gemini (${i + 1}/${keys.length})`);
        } catch (err: any) {
            const errStr = String(err?.message || err || '');
            console.warn(`Gemini გასაღები #${i + 1} შეცდომა:`, errStr);
            errors.push(`Key #${i + 1}: ${errStr}`);
        }
    }
    throw new Error(`ყველა Gemini გასაღები ჩავარდა: ${errors.join('; ')}`);
}

async function callGroqSingleKey(options: AiExecuteOptions, key: string): Promise<string> {
    let userPrompt = options.prompt;
    const isJsonMode = Boolean(options.isJson || options.schema);

    if (isJsonMode) {
        userPrompt += "\n\nCRITICAL: Respond ONLY with a valid, raw JSON object matching the requested schema. Do NOT wrap in markdown formatting (no ```json).";
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    let systemText = options.systemInstruction || '';
    if (isJsonMode) {
        systemText = systemText
            ? `${systemText} You must output valid JSON.`
            : "You are a helpful assistant that outputs valid JSON.";
    }

    if (systemText) {
        messages.push({ role: 'system', content: systemText });
    }
    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key.trim()}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            response_format: isJsonMode ? { type: 'json_object' } : undefined,
            temperature: 0.1,
            max_tokens: 4096
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq შეცდომა (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Groq-მა დააბრუნა ცარიელი პასუხი.");
    }
    return content;
}

async function callGroqWithKeys(options: AiExecuteOptions, keys: string[], timeoutMs = 5000): Promise<string> {
    if (keys.length === 0) throw new Error("GROQ_API_KEY არ არის კონფიგურირებული.");
    const errors: string[] = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
            return await withTimeout(callGroqSingleKey(options, key), timeoutMs, `Groq LPU (${i + 1}/${keys.length})`);
        } catch (err: any) {
            const errStr = String(err?.message || err || '');
            console.warn(`Groq გასაღები #${i + 1} შეცდომა:`, errStr);
            errors.push(`Key #${i + 1}: ${errStr}`);
        }
    }
    throw new Error(`ყველა Groq გასაღები ჩავარდა: ${errors.join('; ')}`);
}

async function callOpenRouterSingleKey(options: AiExecuteOptions, key: string): Promise<string> {
    let userPrompt = options.prompt;
    const isJsonMode = Boolean(options.isJson || options.schema);

    if (isJsonMode) {
        userPrompt += "\n\nCRITICAL: Respond ONLY with a valid, raw JSON object matching the requested schema. Do NOT wrap in markdown formatting (no ```json).";
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    let systemText = options.systemInstruction || '';
    if (isJsonMode) {
        systemText = systemText
            ? `${systemText} You must output valid JSON.`
            : "You are a helpful assistant that outputs valid JSON.";
    }

    if (systemText) {
        messages.push({ role: 'system', content: systemText });
    }
    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key.trim()}`,
            'HTTP-Referer': 'https://tradicon.vercel.app',
            'X-Title': 'Tradicon'
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages,
            response_format: isJsonMode ? { type: 'json_object' } : undefined,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter შეცდომა (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("OpenRouter-მა დააბრუნა ცარიელი პასუხი.");
    }
    return content;
}

async function callOpenRouterWithKeys(options: AiExecuteOptions, keys: string[], timeoutMs = 6000): Promise<string> {
    if (keys.length === 0) throw new Error("OPENROUTER_API_KEY არ არის კონფიგურირებული.");
    const errors: string[] = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
            return await withTimeout(callOpenRouterSingleKey(options, key), timeoutMs, `OpenRouter (${i + 1}/${keys.length})`);
        } catch (err: any) {
            const errStr = String(err?.message || err || '');
            console.warn(`OpenRouter გასაღები #${i + 1} შეცდომა:`, errStr);
            errors.push(`Key #${i + 1}: ${errStr}`);
        }
    }
    throw new Error(`ყველა OpenRouter გასაღები ჩავარდა: ${errors.join('; ')}`);
}

/**
 * ასრულებს AI მოთხოვნას მრავალპროვაიდერიანი კასკადითა და გასაღებების პულინგით.
 * ტაიმაუტები: Gemini (4.5 წმ), Groq (5 წმ), OpenRouter (6 წმ).
 * გადართვა ხდება მომენტალურად (წამების მეასედში).
 */
export async function executeAiWithFallback(options: AiExecuteOptions): Promise<string> {
    assertApiKey();
    const errors: string[] = [];

    const geminiKeys = getApiKeys('gemini');
    const groqKeys = getApiKeys('groq');
    const openRouterKeys = getApiKeys('openrouter');
    const pref = getPreferredProvider();

    const tryGroq = async (): Promise<string | null> => {
        if (groqKeys.length === 0) return null;
        try {
            console.log("⚡ [Groq LPU] მოთხოვნის გაგზავნა (სავარაუდო პასუხი ~0.2 წმ)...");
            return await callGroqWithKeys(options, groqKeys, 5000);
        } catch (err: any) {
            const msg = String(err?.message || err || '');
            console.warn("Groq შეფერხება:", msg);
            errors.push(`Groq LPU: ${msg}`);
            return null;
        }
    };

    const tryGeminiFlash = async (): Promise<string | null> => {
        if (geminiKeys.length === 0) return null;
        try {
            console.log("✨ [Gemini 3.8 Flash] მოთხოვნის გაგზავნა (Timeout: 4.5 წმ)...");
            return await callGeminiWithKeys('gemini-3.8-flash', options, geminiKeys, 4500);
        } catch (err: any) {
            const msg = String(err?.message || err || '');
            console.warn("Gemini 3.8 Flash შეფერხება:", msg);
            errors.push(`Gemini 3.8 Flash: ${msg}`);
            return null;
        }
    };

    const tryOpenRouter = async (): Promise<string | null> => {
        if (openRouterKeys.length === 0) return null;
        try {
            console.log("🌐 [OpenRouter] მოთხოვნის გაგზავნა...");
            return await callOpenRouterWithKeys(options, openRouterKeys, 6000);
        } catch (err: any) {
            const msg = String(err?.message || err || '');
            console.warn("OpenRouter შეფერხება:", msg);
            errors.push(`OpenRouter: ${msg}`);
            return null;
        }
    };

    const tryGeminiLite = async (): Promise<string | null> => {
        if (geminiKeys.length === 0) return null;
        try {
            console.log("✨ [Gemini 3.1 Flash-Lite] ფოლბექი (Timeout: 5 წმ)...");
            return await callGeminiWithKeys('gemini-3.1-flash-lite', options, geminiKeys, 5000);
        } catch (err: any) {
            const msg = String(err?.message || err || '');
            console.warn("Gemini 3.1 Flash-Lite შეფერხება:", msg);
            errors.push(`Gemini 3.1 Flash-Lite: ${msg}`);
            return null;
        }
    };

    // მომხმარებლის მიერ არჩეული თანმიმდევრობა
    const chain: Array<() => Promise<string | null>> = [];

    if (pref === 'groq') {
        chain.push(tryGroq, tryGeminiFlash, tryOpenRouter, tryGeminiLite);
    } else if (pref === 'gemini') {
        chain.push(tryGeminiFlash, tryGroq, tryOpenRouter, tryGeminiLite);
    } else if (pref === 'openrouter') {
        chain.push(tryOpenRouter, tryGroq, tryGeminiFlash, tryGeminiLite);
    } else {
        // 'auto' mode: თუ Groq გასაღები არსებობს, პრიორიტეტი Groq-ია 0.2 წამიანი სისწრაფისთვის!
        if (groqKeys.length > 0) {
            chain.push(tryGroq, tryGeminiFlash, tryOpenRouter, tryGeminiLite);
        } else {
            chain.push(tryGeminiFlash, tryOpenRouter, tryGeminiLite);
        }
    }

    for (const step of chain) {
        const result = await step();
        if (result !== null && result !== undefined && result !== '') {
            return result;
        }
    }

    // თუ ყველა პროვაიდერი ჩავარდა
    console.error("ყველა AI პროვაიდერი ჩავარდა:", errors);

    let helpMsg = "სერვერები ამჟამად გადატვირთულია მაღალი მოთხოვნის გამო (503 / 429 / Quota / Timeout).";
    if (groqKeys.length === 0) {
        helpMsg += " 💡 რჩევა: დაამატეთ უფასო GROQ_API_KEY პარამეტრებში (⚙️) მომენტალური 0.2 წამიანი პასუხისთვის!";
    } else {
        helpMsg += " 💡 რჩევა: პარამეტრებში (⚙️) შეგიძლიათ დაამატოთ რამდენიმე Groq/Gemini გასაღები მძიმით გამოყოფილი (key1, key2) ლიმიტების გასაზრდელად.";
    }
    throw new Error(helpMsg);
}

export interface SpeedTestResult {
    provider: string;
    success: boolean;
    latencyMs: number;
    message: string;
}

export async function testApiSpeed(): Promise<SpeedTestResult[]> {
    const results: SpeedTestResult[] = [];
    const groqKeys = getApiKeys('groq');
    const geminiKeys = getApiKeys('gemini');
    const openRouterKeys = getApiKeys('openrouter');

    // Test Groq
    if (groqKeys.length > 0) {
        const start = performance.now();
        try {
            await withTimeout(callGroqSingleKey({ prompt: 'Respond with exactly: OK' }, groqKeys[0]), 4000, 'Groq');
            const duration = Math.round(performance.now() - start);
            results.push({ provider: `Groq (${groqKeys.length} გასაღები)`, success: true, latencyMs: duration, message: `${duration}ms ⚡ (სწრაფი)` });
        } catch (e: any) {
            const duration = Math.round(performance.now() - start);
            results.push({ provider: 'Groq', success: false, latencyMs: duration, message: e?.message || 'შეცდომა' });
        }
    }

    // Test Gemini
    if (geminiKeys.length > 0) {
        const start = performance.now();
        try {
            await withTimeout(callGeminiSingleKey('gemini-3.8-flash', { prompt: 'Respond with exactly: OK' }, geminiKeys[0]), 4500, 'Gemini');
            const duration = Math.round(performance.now() - start);
            results.push({ provider: `Gemini (${geminiKeys.length} გასაღები)`, success: true, latencyMs: duration, message: `${duration}ms` });
        } catch (e: any) {
            const duration = Math.round(performance.now() - start);
            results.push({ provider: 'Gemini', success: false, latencyMs: duration, message: e?.message || 'შეცდომა' });
        }
    }

    // Test OpenRouter
    if (openRouterKeys.length > 0) {
        const start = performance.now();
        try {
            await withTimeout(callOpenRouterSingleKey({ prompt: 'Respond with exactly: OK' }, openRouterKeys[0]), 6000, 'OpenRouter');
            const duration = Math.round(performance.now() - start);
            results.push({ provider: `OpenRouter (${openRouterKeys.length} გასაღები)`, success: true, latencyMs: duration, message: `${duration}ms` });
        } catch (e: any) {
            const duration = Math.round(performance.now() - start);
            results.push({ provider: 'OpenRouter', success: false, latencyMs: duration, message: e?.message || 'შეცდომა' });
        }
    }

    return results;
}

// --- Helper for Robust JSON Parsing ---
function sanitizeAndParseJson(text: string): any {
    if (!text || typeof text !== 'string') {
        throw new Error("ცარიელი პასუხი AI-სგან.");
    }

    let cleaned = text.trim();
    // Regex matches any markdown code block with dotAll pattern [\s\S]*?
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        cleaned = match[1].trim();
    } else {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
    }

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Failed to parse JSON response from AI:", { originalText: text, cleaned, error });
        throw new Error("AI-სგან მიღებული მონაცემების დამუშავება ვერ მოხერხდა (JSON პარსინგის შეცდომა). გთხოვთ, სცადოთ ხელახლა.");
    }
}

// --- Gemini JSON Schemas ---
const pronounConjugationSchema = {
    type: Type.OBJECT,
    properties: {
        yo: { type: Type.STRING },
        tu: { type: Type.STRING },
        el: { type: Type.STRING },
        nosotros: { type: Type.STRING },
        vosotros: { type: Type.STRING },
        ellos: { type: Type.STRING },
    },
    required: ["yo", "tu", "el", "nosotros", "vosotros", "ellos"]
};

const tenseSchema = {
    type: Type.OBJECT,
    properties: {
        conjugaciones: pronounConjugationSchema,
        ejemplo: { type: Type.STRING, description: "Una frase de ejemplo usando una de las conjugaciones." }
    },
    required: ["conjugaciones", "ejemplo"]
};

const conjugatorSchema = {
    type: Type.OBJECT,
    properties: {
        infinitivo: { type: Type.STRING, description: "El infinitivo del verbo." },
        definicion: { type: Type.STRING, description: "Una breve definición del verbo." },
        presente: tenseSchema,
        preterito_perfecto: tenseSchema,
        preterito_indefinido: tenseSchema,
        // ქართული კომენტარი: Pretérito Imperfecto დრო დამალულია მომხმარებლის მოთხოვნით.
        // მისი ჩვენების აღსადგენად, დააბრუნეთ "preterito_imperfecto" ქვემოთ მოცემულ `required` მასივში.
        preterito_imperfecto: tenseSchema,
        futuro_simple: tenseSchema,
        gerundio: { type: Type.STRING },
        participio: { type: Type.STRING },
        error: { type: Type.STRING, description: "Mensaje de error si la entrada no es un verbo en infinitivo válido en español." }
    },
    required: [
        "infinitivo",
        "gerundio",
        "participio",
        "presente",
        "preterito_perfecto",
        "preterito_indefinido",
        // "preterito_imperfecto",
        "futuro_simple"
    ]
};

const initialDictionarySchema = {
    type: Type.OBJECT,
    properties: {
        palabra: { type: Type.STRING, description: "The word being searched for in its base form in Spanish." },
        articulo: { type: Type.STRING, description: "The definite article ('el' or 'la'). If the word has both genders, it should be a string like 'El (La)'. Null if not applicable." },
        definicion: { type: Type.STRING, description: "The definition of the word in the request's language." },
        isVerbInfinitive: { type: Type.BOOLEAN, description: "True if the word is a verb infinitive, false otherwise." },
        error: { type: Type.STRING, description: "Error message if the input is not a valid word." }
    },
    required: ["palabra", "definicion", "isVerbInfinitive"]
};

// --- API Functions ---

export async function polishText(text: string, lang: string, tone: string, showChanges: boolean): Promise<string> {
    assertApiKey();
    usageTracker.incrementRequestCount();

    const langName = lang === 'es' ? 'Spanish' : 'Georgian';

    const changeInstruction = showChanges
        ? "You MUST wrap deleted text in `<del>` tags and added text in `<ins>` tags. For example, if the input is 'ola como esta', your output must be '<del>ola</del><ins>Hola</ins>, como <del>esta</del><ins>estás</ins>?'. Do not return the text unchanged simply wrapped in tags. Your entire response must be a single string of HTML."
        : "Return only the final, polished text as a single, clean string without any HTML tags.";

    const prompt = `You are an expert ${langName} editor. Your task is to meticulously correct and improve the following text. You MUST find and fix errors. Do not return the text unchanged.
- The polished text MUST be in ${langName}. DO NOT translate it to another language.
- The tone of the text must be ${tone}.
- You MUST correct all errors in:
    1. Orthography (spelling).
    2. Syntax (grammar and sentence structure).
    3. Punctuation.
- Improve clarity and make the text sound natural and fluent.
- ${changeInstruction}

Original text to polish:
"${text}"`;

    const rawText = await executeAiWithFallback({
        prompt,
        systemInstruction: `You are an expert ${langName} editor.`
    });

    return rawText;
}

export async function processUserChatMessage(userMessage: string): Promise<{ isCorrection: boolean; finalText: string; originalText?: string; explanation?: string; }> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const chatProcessingSchema = {
        type: Type.OBJECT,
        properties: {
            isCorrection: { type: Type.BOOLEAN },
            finalText: { type: Type.STRING },
            originalText: { type: Type.STRING, description: "Optional original text if it was translated or corrected." },
            explanation: { type: Type.STRING, description: "Optional brief explanation in Spanish for corrections." }
        },
        required: ["isCorrection", "finalText"]
    };

    const prompt = `You are a language processing expert for a Spanish learning chat app. Analyze the user's message: "${userMessage}".
    Determine if the message is primarily in Spanish or Georgian.

    1.  If the message is in Georgian:
        - Translate it to Spanish.
        - Respond with a JSON object: {"isCorrection": false, "finalText": "[translated Spanish text]", "originalText": "[original Georgian text]"}

    2.  If the message is in Spanish and is grammatically perfect:
        - Respond with a JSON object: {"isCorrection": false, "finalText": "[original Spanish text]"}

    3.  If the message is in Spanish and contains grammatical errors:
        - Correct the message.
        - Provide a very brief, helpful explanation for the correction IN SPANISH. Start the explanation with an emoji like '💡'.
        - Respond with a JSON object: {"isCorrection": true, "finalText": "[corrected Spanish text]", "originalText": "[original Spanish text]", "explanation": "[brief Spanish explanation]"}

    Your entire response MUST be a single, valid JSON object following one of the formats above. Do not add any other text.`;

    const rawText = await executeAiWithFallback({
        prompt,
        schema: chatProcessingSchema,
        isJson: true
    });

    return sanitizeAndParseJson(rawText);
}

export function startChat(persona: string, history?: any[]): Chat {
    assertApiKey();
    const systemInstruction = `You are a chat companion. Your personality or role is: "${persona}". You must always respond in Spanish. Keep your responses concise and conversational.`;
    const ai = getGoogleGenAI();

    const chat = ai.chats.create({
        model: 'gemini-3.8-flash',
        history: history,
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
}

export function connectLiveChat(persona: string, callbacks: {
    onopen: () => void,
    onmessage: (message: LiveServerMessage) => void,
    onerror: (e: ErrorEvent) => void,
    onclose: (e: CloseEvent) => void
}) {
    assertApiKey();
    const systemInstruction = `You are a chat companion. Your personality or role is: "${persona}". You must always respond in Spanish. Keep your responses concise and conversational.`;
    const ai = getGoogleGenAI();

    return ai.live.connect({
        model: 'gemini-3.8-live',
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
    });
}

export async function fetchConjugation(verb: string, lang: Language): Promise<any> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const prompt = lang === 'ka'
        ? `Analyze the verb "${verb}". The verb can be in Spanish or Georgian. Your task is to generate a JSON object based on the provided schema with Spanish verb conjugations.
1.  **Translation and Identification**: If the input is in Georgian, first find the corresponding Spanish infinitive.
2.  **infinitivo**: The correct Spanish infinitive of the verb.
3.  **definicion**: A brief definition of the verb in Georgian.
4.  **gerundio / participio**: The Spanish gerund and participle forms.
5.  **Tenses**: For each of the following tenses (presente, preterito_perfecto, preterito_indefinido, preterito_imperfecto, futuro_simple), provide:
    - \`conjugaciones\`: The six pronoun conjugations (yo, tu, el, etc.).
    - \`ejemplo\`: A Spanish example sentence using one of the conjugations, with the conjugated verb in <b> tags. The sentence must be followed by " // " and its Georgian translation.
6.  **error**: If the input is not a valid verb, provide an error message in Georgian. Otherwise, omit this field.

Always return a single, valid JSON object that strictly follows the schema.`
        : `Analyze the Spanish verb "${verb}". Your task is to generate a JSON object based on the provided schema with its conjugations.
1.  **infinitivo**: The infinitive form of the verb.
2.  **definicion**: A brief definition of the verb in Spanish.
3.  **gerundio / participio**: The Spanish gerund and participle forms.
4.  **Tenses**: For each of the following tenses (presente, preterito_perfecto, preterito_indefinido, preterito_imperfecto, futuro_simple), provide:
    - \`conjugaciones\`: The six pronoun conjugations (yo, tu, el, etc.).
    - \`ejemplo\`: A Spanish example sentence using one of the conjugations, with the conjugated verb in <b> tags.
5.  **error**: If the input is not a valid Spanish infinitive verb, provide an error message in Spanish. Otherwise, omit this field.

Always return a single, valid JSON object that strictly follows the schema.`;

    const rawText = await executeAiWithFallback({
        prompt,
        schema: conjugatorSchema,
        isJson: true
    });

    const data = sanitizeAndParseJson(rawText);

    // If an error field is present in the response, we treat it as an error.
    if (data && 'error' in data) {
        if (typeof data.error === 'string' && data.error.trim().length > 0 && data.error.trim().toLowerCase() !== 'null') {
            throw new Error(data.error);
        }
        console.error("Received unhelpful or null error response from AI:", data);
        throw new Error("AI-მ დააბრუნა გაურკვეველი შეცდომა. გთხოვთ სცადოთ ხელახლა.");
    }

    // If no error field, validate essential data.
    if (!data?.infinitivo || !data?.presente) {
        console.error("Incomplete response from AI:", data);
        throw new Error("AI-მ დააბრუნა არასრული პასუხი. გთხოვთ სცადოთ ხელახლა.");
    }

    return data;
}

// --- On-Demand Dictionary Functions ---

async function fetchOnDemandData<T>(prompt: string, schema: any): Promise<T> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const rawText = await executeAiWithFallback({
        prompt,
        schema,
        isJson: true
    });

    return sanitizeAndParseJson(rawText);
}

export async function fetchInitialWordDefinition(word: string, lang: Language): Promise<any> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const prompt = lang === 'ka'
        ? `Analyze the word "${word}". The word can be in Spanish or Georgian. Provide a JSON object with:
1.  **palabra**: The Spanish base form of the word.
2.  **definicion**: The definition of the word in Georgian.
3.  **articulo**: (Optional) The Spanish definite article if it's a noun.
4.  **isVerbInfinitive**: true if the Spanish base form is a verb infinitive, otherwise false.
5.  **error**: If not a valid word, an error message in Georgian.
Strictly follow the JSON schema.`
        : `Analyze the Spanish word "${word}". Provide a JSON object with:
1.  **palabra**: The base form of the word.
2.  **definicion**: The definition of the word in Spanish.
3.  **articulo**: (Optional) The definite article ('el', 'la') if it's a noun.
4.  **isVerbInfinitive**: true if the word is a verb infinitive, otherwise false.
5.  **error**: If not a valid Spanish word, an error message in Spanish.
Strictly follow the JSON schema.`;

    const rawText = await executeAiWithFallback({
        prompt,
        schema: initialDictionarySchema,
        isJson: true
    });

    const data = sanitizeAndParseJson(rawText);

    if (data && data.error) {
        throw new Error(data.error);
    }
    if (!data?.palabra || !data?.definicion) {
        console.error("Incomplete initial response from AI:", data);
        throw new Error("AI-მ დააბრუნა არასრული განმარტება. გთხოვთ სცადოთ ხელახლა.");
    }
    return data;
}

export async function fetchWordExamples(word: string, lang: Language): Promise<string[]> {
    const prompt = lang === 'ka'
        ? `Generate a JSON object containing an array of 5 example sentences for the Spanish word "${word}".
The key for the array must be "ejemplos".
Each item in the array must be a single string containing a Spanish sentence, followed by " // ", followed by its Georgian translation.
For example: "El perro es grande // ძაღლი დიდია".
Your response must strictly follow this structure.`
        : `Generate a JSON object containing an array of 5 example sentences for the Spanish word "${word}".
The key for the array must be "ejemplos".
Each sentence must be in Spanish only. Do not include any translations.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            ejemplos: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["ejemplos"]
    };
    const result = await fetchOnDemandData<{ ejemplos: string[] }>(prompt, schema);
    return result.ejemplos;
}

export async function fetchWordSynonyms(word: string): Promise<string[]> {
    const prompt = `Generate a JSON object containing an array of Spanish synonyms for the word "${word}". The key for the array must be "sinonimos".`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            sinonimos: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["sinonimos"]
    };
    const result = await fetchOnDemandData<{ sinonimos: string[] }>(prompt, schema);
    return result.sinonimos;
}

export async function fetchWordAntonyms(word: string): Promise<string[]> {
    const prompt = `Generate a JSON object containing an array of Spanish antonyms for the word "${word}". The key for the array must be "antonimos".`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            antonimos: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["antonimos"]
    };
    const result = await fetchOnDemandData<{ antonimos: string[] }>(prompt, schema);
    return result.antonimos;
}

export async function fetchWordPlural(word: string): Promise<string> {
    const prompt = `Generate a JSON object with the plural form of the Spanish noun "${word}". The key must be "forma_plural". If it does not have a plural, return null.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            forma_plural: { type: Type.STRING }
        },
    };
    const result = await fetchOnDemandData<{ forma_plural: string }>(prompt, schema);
    return result.forma_plural;
}

export async function fetchDerivedVerb(word: string, lang: Language): Promise<{ verbo: string; definicion_verbo: string; }> {
    const definitionLang = lang === 'ka' ? 'Georgian' : 'Spanish';
    const prompt = `If the Spanish noun or adjective "${word}" is derived from a verb, generate a JSON object with that verb's infinitive form ('verbo') and its definition ('definicion_verbo') in ${definitionLang}. If no verb is directly derived, return an empty JSON object {}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            verbo: { type: Type.STRING, description: "The infinitive form of the derived verb." },
            definicion_verbo: { type: Type.STRING, description: `A brief definition of the derived verb in ${definitionLang}.` }
        }
    };
    return await fetchOnDemandData<{ verbo: string; definicion_verbo: string; }>(prompt, schema);
}

export async function fetchDerivedAdjective(word: string, lang: Language): Promise<{ adjetivo: string; definicion_adjetivo: string; }> {
    const definitionLang = lang === 'ka' ? 'Georgian' : 'Spanish';
    const prompt = `If the Spanish word "${word}" has a directly related adjective sharing the same root (e.g., ciencia -> científico, crear -> creativo), generate a JSON object with that adjective form ('adjetivo') and its definition ('definicion_adjetivo') in ${definitionLang}. If no obvious related adjective exists, return an empty JSON object {}.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            adjetivo: { type: Type.STRING, description: "The related adjective form." },
            definicion_adjetivo: { type: Type.STRING, description: `A brief definition of the adjective in ${definitionLang}.` }
        }
    };
    return await fetchOnDemandData<{ adjetivo: string; definicion_adjetivo: string; }>(prompt, schema);
}

export async function fetchImageText(base64Data: string, mimeType: string): Promise<string> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    const extractionPrompt = {
        text: `Extract any text you see in this image. Respond with only the extracted text.`
    };
    const ai = getGoogleGenAI();

    try {
        const extractionResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts: [imagePart, extractionPrompt] },
        });
        return (extractionResponse.text || '').trim();
    } catch (err: any) {
        if (isServiceUnavailableError(err)) {
            console.log("ფოლბექი OCR: გადართვა gemini-3.1-flash-lite-image-ზე...");
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite-image',
                contents: { parts: [imagePart, extractionPrompt] },
            });
            return (fallbackResponse.text || '').trim();
        }
        throw err;
    }
}

export async function fetchTranslation(prompt: string): Promise<string> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    return await executeAiWithFallback({ prompt });
}

export async function sendChatMessageFallback(userMessage: string, persona: string): Promise<string> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    return await executeAiWithFallback({
        prompt: userMessage,
        systemInstruction: `You are a chat companion. Your personality or role is: "${persona}". You must always respond in Spanish. Keep your responses concise and conversational.`
    });
}