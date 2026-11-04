/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as state from './state.js';
import * as dom from './dom.js';
import { translations, pronounMap } from './constants.js';
import { Language } from './types.js';
import { Blob } from '@google/genai';

// --- Audio Encoding/Decoding Utilities for Gemini API ---

/**
 * Encodes a Uint8Array of audio data into a base64 string.
 * @param bytes The raw audio data.
 * @returns A base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * @param data The raw PCM audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini TTS/Live).
 * @param numChannels The number of audio channels (typically 1).
 * @returns A promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Creates a Blob object suitable for the Gemini Live API from raw audio data.
 * @param data Float32Array from an audio processing event.
 * @returns A Gemini API Blob object.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp the values to the Int16 range
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


// --- Text-to-Speech ---
export function loadVoices() {
    state.setVoices(window.speechSynthesis.getVoices());
}

/**
 * Wraps individual words in an HTML string with <span class="word"> for highlighting.
 * Traverses the DOM to correctly handle existing HTML tags.
 * @param htmlContent The input HTML string.
 * @returns A new HTML string with words wrapped in spans.
 */
export function wrapWordsInSpans(htmlContent: string): string {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let node;
    const nodesToReplace: { parent: Node, oldNode: Node, newNodes: Node[] }[] = [];

    while (node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;

        const parent = node.parentNode;
        if (!parent || parent.nodeName === 'STYLE' || parent.nodeName === 'SCRIPT') continue;

        const words = node.textContent.split(/(\s+)/); // Split by whitespace but keep it
        const newNodes: Node[] = [];
        words.forEach(word => {
            if (word.trim().length > 0) {
                const span = document.createElement('span');
                span.className = 'word';
                span.textContent = word;
                newNodes.push(span);
            } else {
                newNodes.push(document.createTextNode(word));
            }
        });

        if (newNodes.length > 0) {
            nodesToReplace.push({ parent, oldNode: node, newNodes });
        }
    }

    nodesToReplace.forEach(({ parent, oldNode, newNodes }) => {
        newNodes.forEach(newNode => {
            parent.insertBefore(newNode, oldNode);
        });
        parent.removeChild(oldNode);
    });

    return container.innerHTML;
}

export function speakText(text: string, lang: Language, btn: HTMLButtonElement | null, highlightContainer?: HTMLElement) {
    // Determine the text to be spoken. Prioritize the container's text if provided.
    const textToSpeak = highlightContainer ? highlightContainer.innerText : text;

    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        // Check against the actual text that would be spoken
        if (state.getCurrentSpeech()?.text === textToSpeak) {
            return;
        }
    }

    // Now check if there's anything to speak and if the language is supported (Spanish only)
    if (!textToSpeak.trim() || lang !== 'es') {
        return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    state.setCurrentSpeech(utterance);
    
    const spanishVoice = state.getVoices().find(voice => voice.lang === 'es-ES') || state.getVoices().find(voice => voice.lang.startsWith('es-'));
    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;

    const t = translations[state.getCurrentLanguage()];
    const originalTitle = btn?.title;
    let lastHighlightedSpan: HTMLElement | null = null;
    let wordBoundaries: { span: Element, start: number }[] = [];

    if (highlightContainer) {
        const wordSpans = Array.from(highlightContainer.querySelectorAll('.word'));
        // textToSpeak is already `highlightContainer.innerText`, so we use it directly.
        let processedLength = 0;
        wordSpans.forEach(span => {
            const word = span.textContent || '';
            const startIndex = textToSpeak.indexOf(word, processedLength);
            if (startIndex !== -1) {
                 wordBoundaries.push({ span, start: startIndex });
                 processedLength = startIndex + word.length;
            }
        });
    }

    const cleanup = () => {
        if (btn) {
            btn.classList.remove('speaking');
            btn.title = originalTitle || t.speak;
        }
        if (highlightContainer && lastHighlightedSpan) {
            lastHighlightedSpan.classList.remove('word-highlight');
            lastHighlightedSpan = null;
        }
        state.setCurrentSpeech(null);
    };

    utterance.onstart = () => {
        if (btn) {
            btn.classList.add('speaking');
            btn.title = t.speaking;
        }
    };
    
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (!highlightContainer || event.name !== 'word') return;
        
        if (lastHighlightedSpan) {
            lastHighlightedSpan.classList.remove('word-highlight');
        }

        let currentWord = null;
        for(let i = wordBoundaries.length - 1; i >= 0; i--) {
            if (event.charIndex >= wordBoundaries[i].start) {
                currentWord = wordBoundaries[i].span;
                break;
            }
        }
        
        if (currentWord) {
            currentWord.classList.add('word-highlight');
            lastHighlightedSpan = currentWord as HTMLElement;
        }
    };

    utterance.onend = cleanup;
    
    utterance.onerror = (e) => {
         if ((e as SpeechSynthesisErrorEvent).error !== 'interrupted') {
            console.error('Speech synthesis error:', (e as SpeechSynthesisErrorEvent).error);
        }
        cleanup();
    };

    speechSynthesis.speak(utterance);
}

// --- Audio Effects ---
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }
    return audioCtx;
}

export function playSound(type: 'correct' | 'incorrect') {
    if (!state.getIsSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure context is running (for autoplay policies)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
    } else { // incorrect
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
}


// --- Screen Wake Lock ---
export const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
        try {
            if (state.getWakeLockSentinel()) {
                return;
            }
            const sentinel = await navigator.wakeLock.request('screen');
            sentinel.addEventListener('release', () => {
                state.setWakeLockSentinel(null);
            });
            state.setWakeLockSentinel(sentinel);
        } catch (err: any) {
            if (err.name !== 'NotAllowedError') {
                console.error(`Could not acquire Wake Lock: ${err.name}, ${err.message}`);
            }
        }
    }
};

export const releaseWakeLock = async () => {
    const wakeLockSentinel = state.getWakeLockSentinel();
    if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        state.setWakeLockSentinel(null);
    }
};

// --- Print Handler ---
export function handlePrint(printableAreaSelector: string, cleanupCallback?: () => void) {
    const printableArea = document.querySelector(printableAreaSelector);
    if (!printableArea) {
        if (cleanupCallback) cleanupCallback();
        return;
    }
    
    document.body.classList.add('is-printing');
    printableArea.classList.add('printable-area');

    window.print();

    setTimeout(() => {
        document.body.classList.remove('is-printing');
        printableArea.classList.remove('printable-area');
        if (cleanupCallback) {
            cleanupCallback();
        }
    }, 500);
}

// --- Modal Helpers ---
export function openModalById(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }
}

export function closeModalByEvent(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (target) {
        const modal = target.closest('.modal-overlay');
        if (modal) {
            (modal as HTMLElement).hidden = true;
            document.body.style.overflow = '';
        }
    }
}

export function showAlertModal(title: string, body: string) {
    if (!dom.alertModal || !dom.alertModalTitle || !dom.alertModalBody || !dom.alertModalCloseBtn) return;
    
    dom.alertModalTitle.textContent = title;
    dom.alertModalBody.innerHTML = body;
    dom.alertModalCloseBtn.textContent = translations[state.getCurrentLanguage()].okButton;

    openModalById('alert-modal');
}

export function showConfirmModal(title: string, body: string, confirmText: string, declineText: string, onConfirm: () => void) {
    if (!dom.confirmModal || !dom.confirmModalTitle || !dom.confirmModalBody || !dom.confirmModalConfirmBtn || !dom.confirmModalDeclineBtn) return;

    dom.confirmModalTitle.textContent = title;
    dom.confirmModalBody.innerHTML = body;
    dom.confirmModalConfirmBtn.textContent = confirmText;
    dom.confirmModalDeclineBtn.textContent = declineText;

    const confirmHandler = () => {
        onConfirm();
        closeModalByEvent({ currentTarget: dom.confirmModalConfirmBtn } as unknown as Event);
        cleanup();
    };

    const declineHandler = () => {
        closeModalByEvent({ currentTarget: dom.confirmModalDeclineBtn } as unknown as Event);
        cleanup();
    };

    const cleanup = () => {
        dom.confirmModalConfirmBtn.removeEventListener('click', confirmHandler);
        dom.confirmModalDeclineBtn.removeEventListener('click', declineHandler);
    };

    dom.confirmModalConfirmBtn.addEventListener('click', confirmHandler, { once: true });
    dom.confirmModalDeclineBtn.addEventListener('click', declineHandler, { once: true });

    openModalById('confirm-modal');
}

const boldEndingForTable = (tenseKey: string, verbType: 'ar' | 'er' | 'ir', fullConjugation: string): string => {
    // For compound tenses, bold the auxiliary verb
    if (tenseKey === 'preterito_perfecto') {
        const parts = fullConjugation.split(' ');
        if (parts.length === 2) {
            return `<strong>${parts[0]}</strong> ${parts[1]}`;
        }
    }

    // For future tense, bold the ending added to the infinitive
    if (tenseKey === 'futuro_simple') {
        const verbRoot = verbType === 'ar' ? 'hablar' : verbType === 'er' ? 'comer' : 'vivir'; // base infinitive
        if (fullConjugation.startsWith(verbRoot)) {
            const ending = fullConjugation.substring(verbRoot.length);
            return `${verbRoot}<strong>${ending}</strong>`;
        }
    }
    
    // For simple tenses (presente, imperfecto, indefinido)
    const verbRoot = verbType === 'ar' ? 'habl' : verbType === 'er' ? 'com' : 'viv';
    if (fullConjugation.startsWith(verbRoot)) {
        const ending = fullConjugation.substring(verbRoot.length);
        return `${verbRoot}<strong>${ending}</strong>`;
    }

    // Fallback for any irregular forms shown in the regular endings table
    return fullConjugation;
};

export function openTenseModal(tenseKey: string) {
    const t = translations[state.getCurrentLanguage()];
    const tenseInfo = t.tenseExplanations[tenseKey as keyof typeof t.tenseExplanations];

    if (!tenseInfo || !dom.modal || !dom.modalBody) return;

    let examplesHtml = '';
    if (tenseInfo.examples) {
         // Check if it's the structure for the regular endings table
        if (typeof tenseInfo.examples === 'object' && 'hablar' in tenseInfo.examples) {
             const pronouns = ['yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos'];
             const verbExamples = {
                ar: tenseInfo.examples.hablar as string[],
                er: tenseInfo.examples.comer as string[],
                ir: tenseInfo.examples.vivir as string[]
             };

            const tableHeader = `<thead><tr><th>Pron.</th><th>-ar (hablar)</th><th>-er (comer)</th><th>-ir (vivir)</th></tr></thead>`;

            const tableBodyRows = pronouns.map((pronounKey, index) => {
                const cellAr = `<td>${boldEndingForTable(tenseKey, 'ar', verbExamples.ar[index])}</td>`;
                const cellEr = `<td>${boldEndingForTable(tenseKey, 'er', verbExamples.er[index])}</td>`;
                const cellIr = `<td>${boldEndingForTable(tenseKey, 'ir', verbExamples.ir[index])}</td>`;
                
                return `<tr><th>${pronounMap[pronounKey as keyof typeof pronounMap]}</th>${cellAr}${cellEr}${cellIr}</tr>`;
            }).join('');

            examplesHtml = `<table class="endings-table mobile-friendly">${tableHeader}<tbody>${tableBodyRows}</tbody></table>`;
        } else { // Handle simple non-table examples (infinitivo, gerundio, etc.)
             examplesHtml = `<ul class="modal-examples-list">${Object.values(tenseInfo.examples).map(ex => `<li>${ex}</li>`).join('')}</ul>`;
        }
    }

    dom.modalBody.innerHTML = `
        <h2 id="modal-title">${tenseInfo.title}</h2>
        <p>${tenseInfo.explanation}</p>
        <h3>${tenseInfo.adverbsTitle}</h3>
        <p>${tenseInfo.adverbs}</p>
        ${examplesHtml ? `<h3>${tenseInfo.examplesTitle}</h3>${examplesHtml}`: ''}
    `;
    openModalById('tense-modal');
}

// --- PWA Install Prompt ---
export function setupPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.setDeferredInstallPrompt(e);
        const pwaModal = document.getElementById('pwa-install-modal');
        if (pwaModal) {
            const t = translations[state.getCurrentLanguage()];
            (document.getElementById('pwa-install-title') as HTMLElement).textContent = t.pwaInstallTitle;
            (document.getElementById('pwa-install-body') as HTMLElement).textContent = t.pwaInstallBody;
            (document.getElementById('pwa-install-confirm-btn') as HTMLElement).textContent = t.pwaInstallConfirm;
            (document.getElementById('pwa-install-decline-btn') as HTMLElement).textContent = t.pwaInstallDecline;
            openModalById('pwa-install-modal');
        }
    });
}

async function handlePwaInstall() {
     closeModalByEvent({ currentTarget: document.getElementById('pwa-install-modal') } as unknown as Event);
     const deferredInstallPrompt = state.getDeferredInstallPrompt();
     if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        state.setDeferredInstallPrompt(null);
    }
}

export function setPwaInstallHandlers() {
    document.getElementById('pwa-install-confirm-btn')?.addEventListener('click', handlePwaInstall);
    document.getElementById('pwa-install-decline-btn')?.addEventListener('click', () => closeModalByEvent({ currentTarget: document.getElementById('pwa-install-modal') } as unknown as Event));
}

// --- Misc Utilities ---
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function highlightVerbInSentence(sentence: string, conjugations: { [key: string]: string }): string {
    const allForms = Object.values(conjugations);
    allForms.sort((a, b) => b.length - a.length);

    for (const form of allForms) {
        if (!form) continue;
        const regex = new RegExp(`\\b(${form.replace(/ /g, '\\s')})\\b`, 'gi');
        if (regex.test(sentence)) {
            return sentence.replace(regex, '<strong>$1</strong>');
        }
    }
    return sentence;
}