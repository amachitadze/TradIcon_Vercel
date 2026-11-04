/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as utils from './utils.js';
import * as dataManager from './data-manager.js';
import * as usageTracker from './usage-tracker.js';
import { translations } from './constants.js';
import { setView } from './ui.js';

// --- RENDER FUNCTIONS ---

export function renderAboutView() {
    const t = translations[state.getCurrentLanguage()];
    const usage = usageTracker.getCurrentUsage();
    const percentage = Math.min(100, (usage.count / usage.limit) * 100);

    const usageMonitorHtml = `
        <div class="about-section" id="api-usage-section">
            <h2>${t.apiUsageTitle}</h2>
            <p>${t.apiUsageDesc}</p>
            <div class="usage-tracker-container">
                <div class="usage-text">${usage.count} / ${usage.limit} ${t.apiUsageLabel}</div>
                <div class="progress-bar">
                    <div class="progress-bar-inner" style="width: ${percentage}%;"></div>
                </div>
            </div>
        </div>
    `;

    const aboutHtml = t.aboutContent.replace(
        '{{GUIDELINES_LINK}}',
        `<p><button class="footer-link" id="guidelines-link">${t.guidelinesLinkText}</button></p>`
    );

    dom.form.hidden = true;
    dom.resultsContainer.innerHTML = `
        <div class="history-container">
            <div class="history-header">
                <button id="back-btn" class="back-btn" title="${t.back}">←</button>
                <h2>${t.aboutHeaderTitle}</h2>
                <div style="width: 40px;"></div>
            </div>
            <div class="about-content">
                ${aboutHtml}
                ${usageMonitorHtml}
                <div class="about-section">
                    <h2>${t.dataManagementTitle}</h2>
                    <p>${t.dataManagementDesc}</p>
                    <div class="image-options-buttons" style="margin-top: 1rem; gap: 1.5rem;">
                        <div style="display: flex; gap: 1rem;">
                            <button id="export-data-btn" class="image-option-btn" style="flex: 1;">${t.exportButton}</button>
                            <button id="import-data-btn" class="image-option-btn" style="flex: 1;">${t.importButton}</button>
                        </div>
                        <a href="https://drive.google.com/drive/folders/1O8IKASUAdMJlqL1c5Abr-RERVARlae_z?usp=drive_link" target="_blank" rel="noopener noreferrer" class="image-option-btn">${t.driveBackupLinkText}</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderFavoritesView() {
    const t = translations[state.getCurrentLanguage()];
    dom.form.hidden = true;
    const favorites = storage.getFavoriteTranslations();

    let contentHTML: string;
    if (favorites.length === 0) {
        contentHTML = `<p class="empty-section-text">${t.favoritesEmptyTranslator}</p>`;
    } else {
        const listEl = favorites.map(item => {
            const isFav = storage.isFavoriteTranslation(item);
            const sourceTempDiv = document.createElement('div');
            sourceTempDiv.innerHTML = item.sourceText;
            const plainSourceText = sourceTempDiv.innerText;
            const targetTempDiv = document.createElement('div');
            targetTempDiv.innerHTML = item.translatedText;
            const plainTargetText = targetTempDiv.innerText;

            const sourceSpeakBtn = item.sourceLang === 'es' ? `<button class="speak-btn-inline" title="${t.speak}" data-speak-text="${utils.escapeHtml(plainSourceText)}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg></button>` : '';
            const targetSpeakBtn = item.targetLang === 'es' ? `<button class="speak-btn-inline" title="${t.speak}" data-speak-text="${utils.escapeHtml(plainTargetText)}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg></button>` : '';
            const expandIcon = `<button class="expand-indicator" title="Expand">▾</button>`;

            return `
                <article class="history-item" data-timestamp="${item.timestamp}">
                    <div class="history-item-content">
                        <div class="history-text-block source-block">
                            <div class="history-text-block-header"><h4>${t.sourceText}</h4><div class="history-item-controls">${sourceSpeakBtn}</div></div>
                            <div class="history-item-html-content">${item.sourceText}</div>
                        </div>
                        <div class="history-text-block">
                            <div class="history-text-block-header">
                                <h4>${t.translatedText}</h4>
                                <div class="history-item-controls">
                                    ${targetSpeakBtn}
                                    <button class="favorite-toggle-btn ${isFav ? 'favorited' : ''}" title="${isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd}">★</button>
                                    <button class="history-copy-btn" title="${t.copy}" data-text="${utils.escapeHtml(plainTargetText)}">📄</button>
                                    ${expandIcon}
                                </div>
                            </div>
                            <div class="history-item-html-content translated-block">${item.translatedText}</div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
        contentHTML = `<div class="history-list">${listEl}</div>`;
    }

    dom.resultsContainer.innerHTML = `
        <div class="history-container">
            <div class="history-header">
                <button id="back-btn" class="back-btn" title="${t.back}">←</button>
                <h2>${t.favoritesHeaderTitle}</h2>
                <div style="width: 40px;"></div>
            </div>
            ${contentHTML}
        </div>
    `;
}

export function renderHistoryView() {
    const t = translations[state.getCurrentLanguage()];
    dom.form.hidden = true;
    const history = storage.getTranslationHistory();

    let contentHTML: string;
    if (history.length === 0) {
        contentHTML = `<p class="empty-section-text">${t.historyEmpty}</p>`;
    } else {
        const listEl = history.map(item => {
            const isFav = storage.isFavoriteTranslation(item);
            const sourceTempDiv = document.createElement('div');
            sourceTempDiv.innerHTML = item.sourceText;
            const plainSourceText = sourceTempDiv.innerText;
            const targetTempDiv = document.createElement('div');
            targetTempDiv.innerHTML = item.translatedText;
            const plainTargetText = targetTempDiv.innerText;
            
            const sourceSpeakBtn = item.sourceLang === 'es' ? `<button class="speak-btn-inline" title="${t.speak}" data-speak-text="${utils.escapeHtml(plainSourceText)}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg></button>` : '';
            const targetSpeakBtn = item.targetLang === 'es' ? `<button class="speak-btn-inline" title="${t.speak}" data-speak-text="${utils.escapeHtml(plainTargetText)}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg></button>` : '';
            const expandIcon = `<button class="expand-indicator" title="Expand">▾</button>`;

            return `
                <article class="history-item" data-timestamp="${item.timestamp}">
                    <div class="history-item-content">
                        <div class="history-text-block source-block">
                            <div class="history-text-block-header">
                                 <h4>${t.sourceText}</h4>
                                 <div class="history-item-controls">${sourceSpeakBtn}</div>
                            </div>
                            <div class="history-item-html-content">${item.sourceText}</div>
                        </div>
                        <div class="history-text-block">
                            <div class="history-text-block-header">
                                <h4>${t.translatedText}</h4>
                                <div class="history-item-controls">
                                    ${targetSpeakBtn}
                                    <button class="favorite-toggle-btn ${isFav ? 'favorited' : ''}" title="${isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd}">★</button>
                                    <button class="history-copy-btn" title="${t.copy}" data-text="${utils.escapeHtml(plainTargetText)}">📄</button>
                                    ${expandIcon}
                                </div>
                            </div>
                            <div class="history-item-html-content translated-block">${item.translatedText}</div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
        contentHTML = `<div class="history-list">${listEl}</div>`;
    }

    dom.resultsContainer.innerHTML = `
        <div class="history-container">
            <div class="history-header">
                <button id="back-btn" class="back-btn" title="${t.back}">←</button>
                <h2>${t.historyHeaderTitle}</h2>
                <button id="clear-history-btn" class="clear-history-btn" ${history.length === 0 ? 'hidden' : ''}>${t.clearHistory}</button>
            </div>
            ${contentHTML}
        </div>
    `;
}

// --- HANDLER FUNCTIONS ---

export function showImportOptions() {
    const t = translations[state.getCurrentLanguage()];
    dom.importModalTitle.textContent = t.importOptionsTitle;
    dom.importReplaceBtn.textContent = t.importReplace;
    dom.importReplaceDesc.textContent = t.importReplaceDesc;
    dom.importMergeBtn.textContent = t.importMerge;
    dom.importMergeDesc.textContent = t.importMergeDesc;

    const replaceHandler = () => {
        utils.closeModalByEvent({ currentTarget: dom.importReplaceBtn } as unknown as Event);
        dataManager.importUserData('replace');
    };

    const mergeHandler = () => {
        utils.closeModalByEvent({ currentTarget: dom.importMergeBtn } as unknown as Event);
        dataManager.importUserData('merge');
    };

    dom.importReplaceBtn.addEventListener('click', replaceHandler, { once: true });
    dom.importMergeBtn.addEventListener('click', mergeHandler, { once: true });

    utils.openModalById('import-options-modal');
}


// --- EVENT LISTENERS ---

export function addViewsEventListeners() {
    document.body.addEventListener('click', (e) => {
        const view = state.getCurrentView();
        if (view !== 'history' && view !== 'favorites' && view !== 'about' && view !== 'guidelines') return;

        const target = e.target as HTMLElement;

        if (target.closest('#back-btn')) {
            setView('translator');
            return;
        }

        if (view === 'guidelines' && target.closest('#back-to-about-btn')) {
            setView('about');
            return;
        }

        // History & Favorites View
        if (view === 'history' || view === 'favorites') {
            if (target.closest('#clear-history-btn')) {
                const t = translations[state.getCurrentLanguage()];
                utils.showConfirmModal(
                    t.clearHistory,
                    t.confirmClearHistory,
                    t.yesButton,
                    t.noButton,
                    () => {
                        storage.clearTranslationHistoryData(); // Call the new, clean storage function
                        renderHistoryView(); // Re-render the view after data is cleared
                    }
                );
                return;
            }
            const historyItem = target.closest('.history-item');
            if (historyItem) {
                const timestamp = Number((historyItem as HTMLElement).dataset.timestamp);
                const list = view === 'history' ? storage.getTranslationHistory() : storage.getFavoriteTranslations();
                const item = list.find(i => i.timestamp === timestamp);
                if (!item) return;

                if (target.closest('.favorite-toggle-btn')) {
                    storage.toggleFavoriteTranslation(item);
                    if (view === 'favorites') renderFavoritesView();
                    else renderHistoryView();
                } else if (target.closest('.history-copy-btn')) {
                    const text = (target.closest('.history-copy-btn') as HTMLElement).dataset.text;
                    if(text) navigator.clipboard.writeText(text);
                } else if (target.closest('.expand-indicator, .history-item-html-content')) {
                    historyItem.classList.toggle('is-expanded');
                }
            }
        }

        // About View
        if (view === 'about') {
            if (target.closest('#export-data-btn')) {
                dataManager.exportUserData();
                return;
            }
            if (target.closest('#import-data-btn')) {
                showImportOptions();
                return;
            }
            if (target.closest('#guidelines-link')) {
                setView('guidelines');
                return;
            }
        }
        
        // Speak button is common
        const speakBtn = target.closest('.speak-btn-inline');
        if (speakBtn) {
            const textToSpeak = (speakBtn as HTMLElement).dataset.speakText || (speakBtn as HTMLElement).dataset.textToSpeak;
            if (textToSpeak) {
                utils.speakText(textToSpeak, 'es', speakBtn as HTMLButtonElement);
            }
            return;
        }

    });
}
