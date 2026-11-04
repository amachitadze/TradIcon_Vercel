/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type, Chat, Modality, LiveServerMessage } from '@google/genai';
import { Language } from './types.js';
import * as usageTracker from './usage-tracker.js';

// --- Gemini Initialization ---
const resolvedApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

export function assertApiKey(): void {
    if (!resolvedApiKey || resolvedApiKey.trim().length === 0) {
        throw new Error("Gemini API გასაღები (GEMINI_API_KEY) არ არის კონფიგურირებული. გთხოვთ, მიუთითოთ ის Vercel Settings > Environment Variables-ში ან .env.local ფაილში.");
    }
}

const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

// --- Helper for Robust JSON Parsing ---
function sanitizeAndParseJson(text: string): any {
    // The API might sometimes wrap the JSON in ```json ... ```.
    // This regex extracts the content inside.
    const match = text.match(/```(?:json)?\s*([\sS]*?)\s*```/);
    const jsonText = match ? match[1] : text;

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Failed to parse JSON response from AI:", { originalText: text, extractedText: jsonText, error });
        // Throw a user-friendly error if parsing fails.
        throw new Error("The AI returned a response that could not be understood. Please try again.");
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    return response.text;
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

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: chatProcessingSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    if (!response || !response.text) {
        throw new Error("Received an empty response from the AI model.");
    }
    
    return sanitizeAndParseJson(response.text);
}

export function startChat(persona: string, history?: any[]): Chat {
    assertApiKey();
    const systemInstruction = `You are a chat companion. Your personality or role is: "${persona}". You must always respond in Spanish. Keep your responses concise and conversational.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
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

    return ai.live.connect({
        model: 'gem-2.5-flash-native-audio-preview-09-2025',
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: conjugatorSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    if (!response || !response.text) {
        throw new Error("Received an empty response from the AI model.");
    }

    const data = sanitizeAndParseJson(response.text);

    // If an error field is present in the response, we treat it as an error.
    if (data && 'error' in data) {
        // If the error value is a non-empty string and not the literal string "null", use it as the message.
        if (typeof data.error === 'string' && data.error.trim().length > 0 && data.error.trim().toLowerCase() !== 'null') {
            throw new Error(data.error);
        }
        // Otherwise, throw a generic error.
        console.error("Received unhelpful or null error response from Gemini:", data);
        throw new Error("The AI returned an error. Please try again.");
    }

    // If no error field, validate essential data.
    if (!data?.infinitivo || !data?.presente) {
        console.error("Incomplete response from Gemini:", data);
        throw new Error("The AI returned an incomplete or invalid response. Please try again.");
    }
    
    return data;
}


// --- On-Demand Dictionary Functions ---

async function fetchOnDemandData<T>(prompt: string, schema: any): Promise<T> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    if (!response || !response.text) {
        throw new Error("Received an empty response from the AI model.");
    }

    return sanitizeAndParseJson(response.text);
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: initialDictionarySchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    if (!response || !response.text) {
        throw new Error("Received an empty response from the AI model.");
    }
    const data = sanitizeAndParseJson(response.text);

    if (data && data.error) {
        throw new Error(data.error);
    }
    if (!data?.palabra || !data?.definicion) {
        console.error("Incomplete initial response from Gemini:", data);
        throw new Error("The AI returned an incomplete or invalid response. Please try again.");
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

    const extractionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, extractionPrompt] },
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    return extractionResponse.text.trim();
}

export async function fetchTranslation(prompt: string): Promise<string> {
    assertApiKey();
    usageTracker.incrementRequestCount();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    return response.text;
}