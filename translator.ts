/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gemini from './gemini.js';
import * as utils from './utils.js';
import { translations } from './constants.js';
import { setView } from './ui.js';
import { openFullscreenTranslation } from './fullscreen.js';
import { Tone } from './types.js';

// --- RENDER FUNCTIONS ---

function renderTranslateMode() {
    const t = translations[state.getCurrentLanguage()];
    const sourceLangName = t[state.getTranslatorSourceLang() === 'es' ? 'spanish' : 'georgian'];
    const targetLangName = t[state.getTranslatorTargetLang() === 'es' ? 'spanish' : 'georgian'];
    const placeholderText = translations[state.getTranslatorSourceLang()].sourceTextPlaceholder;
    
    const simplifyOptionHTML = `
        <div class="translator-options">
            <label for="simplify-toggle" class="simplify-label-wrapper">
                <div class="switch">
                    <input type="checkbox" id="simplify-toggle" ${state.getSimplifyTranslation() ? 'checked' : ''}>
                    <span class="slider round"></span>
                </div>
                <span id="simplify-label-text">${t.simplifyLabel}</span>
            </label>
        </div>
    `;

    return `
         <div class="translator-io-grid">
            <div class="translator-box">
                 <div class="textarea-wrapper">
                    ${renderEditorToolbar()}
                    <div id="source-text" class="translator-input-area" contenteditable="true" spellcheck="true" placeholder="${placeholderText}"></div>
                    <div class="translator-box-footer">
                       <div class="translator-box-footer-start">
                           <button type="button" id="source-speak-btn" class="translator-action-btn" title="${t.speak}" hidden>
                               <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                           </button>
                           <button type="button" id="clear-text-btn" class="translator-action-btn" title="${t.clearText}" hidden>&times;</button>
                       </div>
                       <button class="lang-btn-inline" id="source-lang-btn" title="Swap languages">${sourceLangName}</button>
                    </div>
                </div>
            </div>
            
            <div id="main-translate-btn-container">
                ${simplifyOptionHTML}
                <button type="submit" id="translate-button">${t.translateButton}</button>
            </div>

            <div class="translator-box">
                <div class="textarea-wrapper">
                    <div id="target-text" class="translator-output-area"></div>
                    <div class="translator-box-footer">
                        <div class="translator-box-footer-start">
                            <button type="button" id="fullscreen-btn" class="translator-action-btn" title="Fullscreen" hidden>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path></svg>
                            </button>
                            <button type="button" id="target-speak-btn" class="translator-action-btn" title="${t.speak}" hidden>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                            </button>
                            <button type="button" id="copy-btn" class="translator-action-btn" title="${t.copy}">📄</button>
                            <button type="button" id="print-btn" class="translator-action-btn" title="${t.print}" hidden>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path></svg>
                            </button>
                            <button type="button" id="favorite-result-btn" class="translator-action-btn favorite-toggle-btn" title="${t.favoriteAriaLabelAdd}" hidden>★</button>
                        </div>
                        <button class="lang-btn-inline" id="target-lang-btn" title="Swap languages">${targetLangName}</button>
                    </div>
                </div>
            </div>
         </div>
    `;
}

function renderPolishMode() {
    const t = translations[state.getCurrentLanguage()];
    const polisherLangName = t[state.getPolisherLanguage() === 'es' ? 'spanish' : 'georgian'];
    const placeholderText = t.sourceTextPlaceholder; // Generic placeholder
    const activeTone = state.getActiveTone();

    const tones: Tone[] = ['Formal', 'Friendly', 'Business', 'Creative', 'Simplified'];
    
    const toneButtonsHTML = tones.map(tone => `
        <button 
            type="button" 
            class="tone-btn ${tone === activeTone ? 'active' : ''}" 
            data-tone="${tone}">
            ${t[`tone${tone}` as keyof typeof t]}
        </button>
    `).join('');

    return `
        <div class="translator-io-grid">
            <div class="translator-box">
                 <div class="textarea-wrapper">
                    ${renderEditorToolbar()}
                    <div id="source-text" class="translator-input-area" contenteditable="true" spellcheck="true" placeholder="${placeholderText}"></div>
                    <div class="translator-box-footer">
                       <div class="translator-box-footer-start">
                           <button type="button" id="source-speak-btn" class="translator-action-btn" title="${t.speak}" hidden>
                               <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                           </button>
                           <button type="button" id="clear-text-btn" class="translator-action-btn" title="${t.clearText}" hidden>&times;</button>
                       </div>
                       <button class="lang-btn-inline" id="polisher-lang-btn">${polisherLangName}</button>
                    </div>
                </div>
            </div>
            
            <div class="polisher-controls">
                <div class="tone-selector-container">${toneButtonsHTML}</div>
                <button type="submit" id="polish-button" class="main-action-btn">${t.polishButton}</button>
            </div>

            <div class="translator-box">
                <div class="textarea-wrapper">
                    <div id="target-text" class="translator-output-area"></div>
                    <div class="translator-box-footer">
                        <div class="translator-box-footer-start">
                            <button type="button" id="target-speak-btn" class="translator-action-btn" title="${t.speak}" hidden>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                            </button>
                            <button type="button" id="copy-btn" class="translator-action-btn" title="${t.copy}">📄</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="polisher-bottom-actions">
                <label class="simplify-label-wrapper">
                     <div class="switch">
                        <input type="checkbox" id="show-changes-toggle" ${state.getShowPolishChanges() ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </div>
                    <span>${t.showChanges}</span>
                </label>
                <button type="button" id="translate-polished-text-btn" class="action-btn" hidden>${t.translateThisText}</button>
            </div>
        </div>
    `;
}


function renderEditorToolbar() {
    const t = translations[state.getCurrentLanguage()];
    return `
        <div class="editor-toolbar">
            <button type="button" class="toolbar-btn" data-command="bold" title="Bold (Ctrl+B)"><b>B</b></button>
            <button type="button" class="toolbar-btn" data-command="italic" title="Italic (Ctrl+I)"><i>I</i></button>
            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h16v-2H4v2zm0-5h16v-2H4v2zm0-7v2h16V6H4z"></path></svg>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.1V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg>
            </button>
            <div class="toolbar-separator"></div>
            <button type="button" id="paste-btn" class="toolbar-btn" title="${t.paste}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path></svg>
            </button>
             <button type="button" id="mic-btn" class="toolbar-btn" title="${t.speak}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path></svg>
            </button>
            <button type="button" id="image-btn" class="toolbar-btn" title="${t.image}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>
            </button>
            <button type="button" id="doc-btn" class="toolbar-btn" title="${t.uploadDocument}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
            </button>
        </div>
    `;
}


export function renderTranslatorView() {
    const t = translations[state.getCurrentLanguage()];

    const favoritePhrases = storage.getFavoriteTranslations()
        .filter(fav => fav.sourceLang === state.getTranslatorSourceLang())
        .slice(0, 5);

    let phrasesHTML = '';
    if (favoritePhrases.length > 0) {
        const tempDiv = document.createElement('div');
        const phraseButtons = favoritePhrases.map(fav => {
            tempDiv.innerHTML = fav.sourceText;
            const plainText = tempDiv.innerText.trim();
            const buttonText = plainText.length > 50 ? plainText.substring(0, 47) + '...' : plainText;
            return `<button class="phrase-example-btn" data-phrase="${utils.escapeHtml(fav.sourceText)}" title="${utils.escapeHtml(plainText)}">${utils.escapeHtml(buttonText)}</button>`;
        }).join('');

        phrasesHTML = `
            <div id="phrase-examples-container">
                <h3 class="phrase-examples-title">${t.commonPhrasesTitle}</h3>
                <div class="phrase-examples-grid">
                    ${phraseButtons}
                </div>
            </div>
        `;
    }
    
    const mode = state.getTranslatorMode();
    const modeContentHTML = mode === 'polish' ? renderPolishMode() : renderTranslateMode();

    const headerShortcutsHTML = `
        <div class="header-shortcuts">
            <button id="swap-lang-btn" class="shortcut-btn-circle" aria-label="Swap languages" title="Swap languages" ${mode === 'polish' ? 'hidden' : ''}>⇄</button>
            <button id="history-shortcut-btn" class="shortcut-btn-circle" aria-label="${t.history}" title="${t.history}">◷</button>
            <button id="favorites-shortcut-btn" class="shortcut-btn-circle" aria-label="${t.favorites}" title="${t.favorites}">★</button>
        </div>
    `;

    dom.form.hidden = true;
    dom.resultsContainer.innerHTML = `
        <div id="translator-container">
             <div class="translator-header-controls">
                <div class="tab-nav">
                    <button class="tab-link ${mode === 'translate' ? 'active' : ''}" data-mode="translate">${t.translatorTab}</button>
                    <button class="tab-link ${mode === 'polish' ? 'active' : ''}" data-mode="polish">${t.polishTab}</button>
                </div>
                ${headerShortcutsHTML}
            </div>
            
            <form id="translator-form">${modeContentHTML}</form>
            
            ${phrasesHTML}
        </div>
    `;

    const simplifyToggle = document.getElementById('simplify-toggle') as HTMLInputElement;
    if (simplifyToggle) {
        simplifyToggle.checked = state.getSimplifyTranslation();
    }
}


// --- HANDLER FUNCTIONS ---
async function polishText(sourceHtml: string) {
    const t = translations[state.getCurrentLanguage()];
    const targetDiv = document.getElementById('target-text') as HTMLDivElement;
    const polishButton = document.getElementById('polish-button') as HTMLButtonElement;
    const translatePolishedBtn = document.getElementById('translate-polished-text-btn') as HTMLButtonElement;

    if (!targetDiv || !polishButton || !translatePolishedBtn) return;
    
    targetDiv.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
    polishButton.disabled = true;
    polishButton.textContent = t.polishingText;
    translatePolishedBtn.hidden = true;

    try {
        const [cleanResult, diffResult] = await Promise.all([
            gemini.polishText(sourceHtml, state.getPolisherLanguage(), state.getActiveTone(), false),
            gemini.polishText(sourceHtml, state.getPolisherLanguage(), state.getActiveTone(), true)
        ]);

        state.setLastPolishedCleanText(cleanResult);
        state.setLastPolishedDiffText(diffResult);

        const showChanges = state.getShowPolishChanges();
        targetDiv.innerHTML = showChanges ? diffResult : cleanResult;

        if (cleanResult.trim()) {
            translatePolishedBtn.hidden = false;
            const speakBtn = document.getElementById('target-speak-btn') as HTMLButtonElement;
            speakBtn.hidden = state.getPolisherLanguage() !== 'es';
        }

    } catch (error) {
        console.error("Polishing error:", error);
        state.setLastPolishedCleanText(null);
        state.setLastPolishedDiffText(null);
        const errorString = (error instanceof Error) ? error.message : JSON.stringify(error);
        const displayMessage = errorString.includes('500') ? t.errorServer : errorString || t.errorDefault;
        targetDiv.innerHTML = `<p class="error-message">${t.errorPrefix}: ${displayMessage}</p>`;
    } finally {
        polishButton.disabled = false;
        polishButton.textContent = t.polishButton;
    }
}


async function translateText(sourceHtml: string) {
    const t = translations[state.getCurrentLanguage()];
    const targetDiv = document.getElementById('target-text') as HTMLDivElement;
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
    const favoriteResultBtn = document.getElementById('favorite-result-btn') as HTMLButtonElement;
    const targetSpeakBtn = document.getElementById('target-speak-btn') as HTMLButtonElement;
    const printBtn = document.getElementById('print-btn') as HTMLButtonElement;
    const fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;

    if (!targetDiv || !translateButton || !favoriteResultBtn || !targetSpeakBtn || !printBtn || !fullscreenBtn) return;

    targetDiv.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
    translateButton.disabled = true;
    translateButton.textContent = t.translatingText;
    favoriteResultBtn.hidden = true;
    printBtn.hidden = true;
    targetSpeakBtn.hidden = true;
    fullscreenBtn.hidden = true;

    try {
        const sourceLangName = t[state.getTranslatorSourceLang() === 'es' ? 'spanish' : 'georgian'];
        const targetLangName = t[state.getTranslatorTargetLang() === 'es' ? 'spanish' : 'georgian'];
        let prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Preserve the original HTML formatting (like <b>, <i>, <ul>, <li>). Only translate the text content. Text to translate: \n\n${sourceHtml}`;
        if (state.getSimplifyTranslation()) {
            prompt += `\n\nIMPORTANT: Translate the text into simple, easy-to-understand language, suitable for a beginner learning the target language.`;
        }
        
        const fullTranslatedText = await gemini.fetchTranslation(prompt);
        targetDiv.innerHTML = fullTranslatedText;
        
        if (fullTranslatedText.trim().length > 0) {
            const newHistoryItem = storage.addTranslationToHistory({
                sourceLang: state.getTranslatorSourceLang(),
                targetLang: state.getTranslatorTargetLang(),
                sourceText: sourceHtml,
                translatedText: fullTranslatedText,
            });
            state.setLastTranslationItem(newHistoryItem);

            const isFav = storage.isFavoriteTranslation(newHistoryItem);
            favoriteResultBtn.hidden = false;
            favoriteResultBtn.classList.toggle('favorited', isFav);
            favoriteResultBtn.title = isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd;
            targetSpeakBtn.hidden = state.getTranslatorTargetLang() !== 'es';
            printBtn.hidden = false;
            fullscreenBtn.hidden = false;
            utils.requestWakeLock();
        } else {
            targetDiv.innerHTML = '';
        }

    } catch (error) {
        console.error("Translation error:", error);
        const errorString = (error instanceof Error) ? error.message : JSON.stringify(error);
        let displayMessage;

        if (errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')) {
            displayMessage = t.errorServer;
        } else {
            displayMessage = errorString || t.errorDefault;
        }
        targetDiv.innerHTML = `<p class="error-message">${t.errorPrefix}: ${displayMessage}</p>`;
    } finally {
        translateButton.disabled = false;
        translateButton.textContent = t.translateButton;
    }
}

async function translateImage(base64Data: string, mimeType: string) {
    const t = translations[state.getCurrentLanguage()];
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const targetDiv = document.getElementById('target-text') as HTMLDivElement;
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;

    if (!sourceDiv || !targetDiv || !translateButton) return;

    sourceDiv.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>${t.translatingImage}</p></div>`;
    targetDiv.innerHTML = '';
    translateButton.disabled = true;
    translateButton.textContent = t.translatingText;
    
    try {
        const extractedText = await gemini.fetchImageText(base64Data, mimeType);

        if (extractedText) {
            sourceDiv.innerHTML = utils.escapeHtml(extractedText).replace(/\n/g, '<br>');
            const clearBtn = document.getElementById('clear-text-btn') as HTMLButtonElement;
            const sourceSpeakBtn = document.getElementById('source-speak-btn') as HTMLButtonElement;
            clearBtn.hidden = false;
            sourceSpeakBtn.hidden = state.getTranslatorSourceLang() !== 'es';
            await translateText(sourceDiv.innerHTML);
        } else {
            sourceDiv.innerHTML = '';
            targetDiv.innerHTML = `<p class="error-message">${t.noTextInImage}</p>`;
        }

    } catch (error) {
        console.error("Image translation error:", error);
        const errorString = (error instanceof Error) ? error.message : JSON.stringify(error);
        let displayMessage;

        if (errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')) {
            displayMessage = t.errorServer;
        } else {
            displayMessage = errorString || t.errorDefault;
        }
        
        sourceDiv.innerHTML = '';
        targetDiv.innerHTML = `<p class="error-message">${t.errorPrefix}: ${displayMessage}</p>`;
    } finally {
         if (!sourceDiv.textContent?.trim()) {
            translateButton.disabled = false;
            translateButton.textContent = t.translateButton;
         }
    }
}


function handleSwapLanguages() {
    utils.releaseWakeLock();
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const targetDiv = document.getElementById('target-text') as HTMLDivElement;
    
    if (!sourceDiv || !targetDiv) return;

    const sourceHTML = sourceDiv.innerHTML;
    const targetHTML = targetDiv.innerHTML;

    const oldSource = state.getTranslatorSourceLang();
    state.setTranslatorSourceLang(state.getTranslatorTargetLang());
    state.setTranslatorTargetLang(oldSource);
    
    renderTranslatorView();

    const newSourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const newTargetDiv = document.getElementById('target-text') as HTMLDivElement;
    if (newSourceDiv) newSourceDiv.innerHTML = targetHTML;
    if (newTargetDiv) newTargetDiv.innerHTML = sourceHTML;

    const clearBtn = document.getElementById('clear-text-btn') as HTMLButtonElement;
    const sourceSpeakBtn = document.getElementById('source-speak-btn') as HTMLButtonElement;
    const targetSpeakBtn = document.getElementById('target-speak-btn') as HTMLButtonElement;
    const printBtn = document.getElementById('print-btn') as HTMLButtonElement;
    const fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
    
    if (newSourceDiv) {
        const hasText = !!newSourceDiv.textContent?.trim();
        if(clearBtn) clearBtn.hidden = !hasText;
        if(sourceSpeakBtn) sourceSpeakBtn.hidden = !hasText || state.getTranslatorSourceLang() !== 'es';
    }
    if (newTargetDiv) {
        const hasTargetText = !!newTargetDiv.textContent?.trim();
        if(targetSpeakBtn) targetSpeakBtn.hidden = !hasTargetText || state.getTranslatorTargetLang() !== 'es';
        if(printBtn) printBtn.hidden = !hasTargetText;
        if(fullscreenBtn) fullscreenBtn.hidden = !hasTargetText;
    }
}

async function handleCopy() {
    const targetDiv = document.getElementById('target-text') as HTMLDivElement;
    const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
    const t = translations[state.getCurrentLanguage()];
    if (targetDiv && copyBtn && targetDiv.innerHTML) {
        try {
            const htmlBlob = new Blob([targetDiv.innerHTML], { type: 'text/html' });
            const textBlob = new Blob([targetDiv.innerText], { type: 'text/plain' });
            const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
            await navigator.clipboard.write(data);
            
            const originalText = copyBtn.title;
            copyBtn.textContent = '✅';
            copyBtn.title = t.copied;
            setTimeout(() => { copyBtn.textContent = '📄'; copyBtn.title = originalText; }, 2000);
        } catch (err) {
            console.error('Failed to copy rich text: ', err);
            try {
                await navigator.clipboard.writeText(targetDiv.innerText);
                const originalText = copyBtn.title;
                copyBtn.textContent = '✅';
                copyBtn.title = t.copied;
                setTimeout(() => { copyBtn.textContent = '📄'; copyBtn.title = originalText; }, 2000);
            } catch (fallbackErr) {
                 console.error('Failed to copy plain text: ', fallbackErr);
            }
        }
    }
}

async function handlePaste() {
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const clearBtn = document.getElementById('clear-text-btn') as HTMLButtonElement;
    const sourceSpeakBtn = document.getElementById('source-speak-btn') as HTMLButtonElement;
    if (!sourceDiv || !clearBtn || !sourceSpeakBtn) return;

    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            document.execCommand('insertText', false, text);
            sourceDiv.focus();
            const hasText = !!sourceDiv.textContent?.trim();
            clearBtn.hidden = !hasText;
            sourceSpeakBtn.hidden = !hasText || state.getTranslatorSourceLang() !== 'es';
        }
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
}

function handleMic() {
    const t = translations[state.getCurrentLanguage()];
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const micBtn = document.getElementById('mic-btn') as HTMLButtonElement;

    if (!sourceDiv || !micBtn) return;
    if (state.getRecognition()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        utils.showAlertModal("Unsupported", "Speech recognition is not supported in this browser.");
        return;
    }

    const rec = new SpeechRecognition();
    state.setRecognition(rec);
    const lang = state.getTranslatorMode() === 'polish' 
        ? state.getPolisherLanguage() 
        : state.getTranslatorSourceLang();
    rec.lang = lang === 'es' ? 'es-ES' : 'ka-GE';

    rec.continuous = false;
    rec.interimResults = false;

    sourceDiv.focus();

    rec.onstart = () => {
        micBtn.classList.add('mic-listening');
        if (!sourceDiv.textContent?.trim()) {
            sourceDiv.setAttribute('data-original-placeholder', sourceDiv.getAttribute('placeholder') || '');
            sourceDiv.setAttribute('placeholder', t.speakNow);
        }
    };

    rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        document.execCommand('insertText', false, transcript);
    };

    rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            utils.showAlertModal(t.micPermissionDeniedTitle, t.micPermissionDeniedBody);
        } else if (event.error === 'no-speech' && !sourceDiv.textContent?.trim()) {
            sourceDiv.setAttribute('placeholder', t.micErrorNoSpeech);
        } else if (!sourceDiv.textContent?.trim()){
            sourceDiv.setAttribute('placeholder', t.micErrorGeneric);
        }
    };

    rec.onend = () => {
        state.setRecognition(null);
        micBtn.classList.remove('mic-listening');
        const placeholder = state.getTranslatorMode() === 'polish' ? t.sourceTextPlaceholder : translations[state.getTranslatorSourceLang()].sourceTextPlaceholder;
        const originalPlaceholder = sourceDiv.getAttribute('data-original-placeholder') || placeholder;
        sourceDiv.setAttribute('placeholder', originalPlaceholder);
        
        const hasText = !!sourceDiv.textContent?.trim();
        (document.getElementById('clear-text-btn') as HTMLButtonElement).hidden = !hasText;
        const sourceSpeakBtn = document.getElementById('source-speak-btn') as HTMLButtonElement;
        const sourceLang = state.getTranslatorMode() === 'polish' ? state.getPolisherLanguage() : state.getTranslatorSourceLang();
        sourceSpeakBtn.hidden = !hasText || sourceLang !== 'es';
    };
    
    rec.start();
}

export async function handleImageUpload(event: Event) {
    utils.closeModalByEvent({ currentTarget: dom.imageOptionsModal } as unknown as Event);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        openCropperModal(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
}

export async function handleDocumentUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!sourceDiv) return;
    input.value = '';

    try {
        let text = '';
        if (fileExtension === 'txt') {
            text = await file.text();
        } else if (fileExtension === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await (window as any).mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            text = result.value;
        } else if (fileExtension === 'pdf') {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageTexts = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                pageTexts.push(textContent.items.map((s: any) => s.str).join(' '));
            }
            text = pageTexts.join('\n\n');
        } else {
            utils.showAlertModal("Unsupported File", "Please upload a .txt, .docx, or .pdf file.");
            return;
        }

        sourceDiv.textContent = text;
        sourceDiv.innerHTML = sourceDiv.innerHTML.replace(/\n/g, '<br>');

        const hasText = !!sourceDiv.textContent?.trim();
        (document.getElementById('clear-text-btn') as HTMLButtonElement).hidden = !hasText;
        (document.getElementById('source-speak-btn') as HTMLButtonElement).hidden = !hasText || state.getTranslatorSourceLang() !== 'es';
        sourceDiv.focus();
    } catch (error) {
        console.error("Error processing document:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        utils.showAlertModal("Document Error", `Could not process the file. ${errorMessage}`);
    }
}

function openCropperModal(imageUrl: string) {
    const cropperImage = document.getElementById('cropper-image') as HTMLImageElement;
    const t = translations[state.getCurrentLanguage()];

    (document.getElementById('cropper-modal-title') as HTMLElement).textContent = t.cropTitle;
    (document.getElementById('crop-and-translate-btn') as HTMLElement).textContent = t.cropAndTranslate;

    cropperImage.src = imageUrl;
    utils.openModalById('cropper-modal');

    cropperImage.onload = () => {
        const cropperInstance = state.getCropper();
        if (cropperInstance) {
            cropperInstance.destroy();
        }
        state.setCropper(new (window as any).Cropper(cropperImage, {
            aspectRatio: NaN,
            viewMode: 1,
        }));
    };
}

async function handleCropAndTranslate() {
    const cropperInstance = state.getCropper();
    if (!cropperInstance) return;

    const canvas = cropperInstance.getCroppedCanvas();
    if (!canvas) return;

    const mimeType = 'image/jpeg';
    const base64Data = canvas.toDataURL(mimeType).split(',')[1];
    
    utils.closeModalByEvent({ currentTarget: dom.cropperModal } as unknown as Event);
    await translateImage(base64Data, mimeType);
}

// --- EVENT LISTENERS ---

function handleTranslatorFormEvents(e: Event) {
    const target = e.target as HTMLElement;
    const sourceDiv = document.getElementById('source-text') as HTMLDivElement;

    if (e.type === 'submit') {
        e.preventDefault();
        if (!sourceDiv) return;
        const html = sourceDiv.innerHTML.trim();
        if (html && sourceDiv.textContent?.trim()) {
            if (state.getTranslatorMode() === 'translate') {
                translateText(html);
            } else {
                polishText(html);
            }
        }
        return;
    }

    // Handle all button clicks within the translator form/container
    const button = target.closest('button, .phrase-example-btn');
    if (button) {
        if (button.classList.contains('phrase-example-btn')) {
            const phrase = (button as HTMLElement).dataset.phrase;
            if (phrase && sourceDiv) {
                sourceDiv.innerHTML = phrase;
                state.getTranslatorMode() === 'translate' ? translateText(phrase) : polishText(phrase);
                (document.getElementById('clear-text-btn') as HTMLButtonElement).hidden = false;
                (document.getElementById('source-speak-btn') as HTMLButtonElement).hidden = state.getTranslatorSourceLang() !== 'es';
            }
            return;
        }

        const command = (button as HTMLElement).dataset.command;
        if (command && sourceDiv) {
            e.preventDefault();
            document.execCommand(command, false);
            sourceDiv.focus();
            return;
        }

        switch (button.id) {
            case 'paste-btn': e.preventDefault(); handlePaste(); break;
            case 'mic-btn': e.preventDefault(); handleMic(); break;
            case 'image-btn': e.preventDefault(); utils.openModalById('image-options-modal'); break;
            case 'doc-btn': e.preventDefault(); dom.documentUploadInput.click(); break;
            case 'source-speak-btn':
                if (sourceDiv?.textContent) {
                     const sourceLang = state.getTranslatorMode() === 'polish' ? state.getPolisherLanguage() : state.getTranslatorSourceLang();
                     utils.speakText(sourceDiv.textContent, sourceLang, button as HTMLButtonElement);
                }
                break;
            case 'target-speak-btn':
                const targetDiv = document.getElementById('target-text') as HTMLDivElement;
                if (targetDiv?.textContent) {
                    const targetLang = state.getTranslatorMode() === 'polish' ? state.getPolisherLanguage() : state.getTranslatorTargetLang();
                    utils.speakText(targetDiv.textContent, targetLang, button as HTMLButtonElement);
                }
                break;
            case 'copy-btn': handleCopy(); break;
            case 'print-btn': utils.handlePrint('.translator-io-grid'); break;
            case 'fullscreen-btn': openFullscreenTranslation(); break;
            case 'favorite-result-btn':
                const lastTranslationItem = state.getLastTranslationItem();
                if (lastTranslationItem) {
                    storage.toggleFavoriteTranslation(lastTranslationItem);
                    const isFav = storage.isFavoriteTranslation(lastTranslationItem);
                    button.classList.toggle('favorited', isFav);
                    const t = translations[state.getCurrentLanguage()];
                    (button as HTMLElement).title = isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd;
                }
                break;
            case 'clear-text-btn':
                if (sourceDiv) sourceDiv.innerHTML = '';
                const targetText = document.getElementById('target-text');
                if(targetText) targetText.innerHTML = '';
                (button as HTMLElement).hidden = true;
                (document.getElementById('source-speak-btn') as HTMLButtonElement).hidden = true;
                (document.getElementById('favorite-result-btn') as HTMLButtonElement).hidden = true;
                (document.getElementById('print-btn') as HTMLButtonElement).hidden = true;
                (document.getElementById('fullscreen-btn') as HTMLButtonElement).hidden = true;
                const translatePolishedBtn = document.getElementById('translate-polished-text-btn') as HTMLButtonElement;
                if (translatePolishedBtn) translatePolishedBtn.hidden = true;
                utils.releaseWakeLock();
                break;
        }
        return;
    }

    // Handle input on the source text area
    if (target === sourceDiv && e.type === 'input') {
        const hasText = !!sourceDiv.textContent?.trim();
        (document.getElementById('clear-text-btn') as HTMLButtonElement).hidden = !hasText;
        const sourceLang = state.getTranslatorMode() === 'polish' ? state.getPolisherLanguage() : state.getTranslatorSourceLang();
        (document.getElementById('source-speak-btn') as HTMLButtonElement).hidden = !hasText || sourceLang !== 'es';
        (document.getElementById('favorite-result-btn') as HTMLButtonElement).hidden = true;
        (document.getElementById('print-btn') as HTMLButtonElement).hidden = true;
        (document.getElementById('fullscreen-btn') as HTMLButtonElement).hidden = true;
        const translatePolishedBtn = document.getElementById('translate-polished-text-btn') as HTMLButtonElement;
        if(translatePolishedBtn) translatePolishedBtn.hidden = true;
        state.setLastTranslationItem(null);
        if (state.getTranslatorMode() === 'polish') {
            state.setLastPolishedCleanText(null);
            state.setLastPolishedDiffText(null);
        }
    }
}

export function addTranslatorEventListeners() {
    document.body.addEventListener('submit', (e) => {
        if (state.getCurrentView() !== 'translator') return;
        if ((e.target as HTMLElement).id === 'translator-form') {
            handleTranslatorFormEvents(e);
        }
    });

    document.body.addEventListener('click', (e) => {
        if (state.getCurrentView() !== 'translator') return;
        const target = e.target as HTMLElement;

        handleTranslatorFormEvents(e);
        
        const modeTab = target.closest('.tab-link[data-mode]');
        if (modeTab) {
            const mode = (modeTab as HTMLElement).dataset.mode as 'translate' | 'polish';
            if (mode && mode !== state.getTranslatorMode()) {
                state.setTranslatorMode(mode);
                renderTranslatorView();
            }
            return;
        }

        const toneBtn = target.closest('.tone-btn[data-tone]');
        if (toneBtn) {
            const tone = (toneBtn as HTMLElement).dataset.tone as Tone;
            if (tone === state.getActiveTone()) return; // Do nothing if already active

            state.setActiveTone(tone);
            
            const sourceDiv = document.getElementById('source-text') as HTMLDivElement;
            const sourceContent = sourceDiv ? sourceDiv.innerHTML : '';
            const targetDiv = document.getElementById('target-text') as HTMLDivElement;
            const hadResult = targetDiv && targetDiv.textContent?.trim() && !targetDiv.querySelector('.loading-container, .error-message');
        
            renderTranslatorView(); // Re-render the view
            
            const newSourceDiv = document.getElementById('source-text') as HTMLDivElement;
            if (newSourceDiv && sourceContent) {
                newSourceDiv.innerHTML = sourceContent;
                const hasText = !!newSourceDiv.textContent?.trim();
                (document.getElementById('clear-text-btn') as HTMLButtonElement).hidden = !hasText;
                (document.getElementById('source-speak-btn') as HTMLButtonElement).hidden = !hasText || state.getPolisherLanguage() !== 'es';
            }
        
            // If there was content and a result before, re-polish with the new tone
            if (sourceContent.trim() && hadResult) {
                polishText(sourceContent);
            }
            return;
        }

        if(target.closest('#polisher-lang-btn')) {
            const current = state.getPolisherLanguage();
            state.setPolisherLanguage(current === 'es' ? 'ka' : 'es');
            renderTranslatorView();
            return;
        }

        if(target.closest('#translate-polished-text-btn')) {
            const polishedText = document.getElementById('target-text')?.innerHTML;
            if (polishedText) {
                state.setTranslatorMode('translate');
                renderTranslatorView(); // Re-render in translate mode
                const newSourceDiv = document.getElementById('source-text') as HTMLDivElement;
                newSourceDiv.innerHTML = polishedText;
                translateText(polishedText); // Auto-translate
            }
            return;
        }

        const swapBtn = target.closest('#swap-lang-btn, #source-lang-btn, #target-lang-btn');
        if(swapBtn) handleSwapLanguages();
        if(target.closest('#history-shortcut-btn')) setView('history');
        if(target.closest('#favorites-shortcut-btn')) setView('favorites');

        const takePhotoBtn = target.closest('#take-photo-btn');
        if (takePhotoBtn) {
            dom.imageUploadCameraInput.click();
            return;
        }

        const fromGalleryBtn = target.closest('#from-gallery-btn');
        if (fromGalleryBtn) {
            dom.imageUploadGalleryInput.click();
            return;
        }

        const cropAndTranslateBtn = target.closest('#crop-and-translate-btn');
        if (cropAndTranslateBtn) {
            handleCropAndTranslate();
            return;
        }
    });

    document.body.addEventListener('input', (e) => {
        if (state.getCurrentView() !== 'translator') return;
        const target = e.target as HTMLElement;
        if (target.id === 'source-text') {
            handleTranslatorFormEvents(e);
        }
    });
    
    document.body.addEventListener('change', (e) => {
        if (state.getCurrentView() !== 'translator') return;
        const target = e.target as HTMLInputElement;

        if (target.id === 'show-changes-toggle') {
            const isChecked = target.checked;
            state.setShowPolishChanges(isChecked);

            const targetDiv = document.getElementById('target-text') as HTMLDivElement;
            if (!targetDiv) return;

            const cleanText = state.getLastPolishedCleanText();
            const diffText = state.getLastPolishedDiffText();

            // If we have cached results, just swap them out
            if (cleanText !== null && diffText !== null) {
                targetDiv.innerHTML = isChecked ? diffText : cleanText;
            }
            // If no cached results, do nothing. User must click "Polish Text" first.

        } else if (target.id === 'simplify-toggle') {
             state.setSimplifyTranslation(target.checked);
        }
    });
}