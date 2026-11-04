/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gemini from './gemini.js';
import * as utils from './utils.js';
import { translations, MOST_COMMON_WORDS, PRINTER_ICON_SVG } from './constants.js';
import { setView } from './ui.js';
import { conjugateVerb, getConjugationTablesHtml } from './conjugator.js';

// --- RENDER FUNCTIONS ---

export function renderDictionaryView() {
    dom.form.hidden = false;
    const recents = storage.getRecentWords();
    const favorites = storage.getFavoriteWords();
    const t = translations[state.getCurrentLanguage()];

    const tabsData = [
        { id: 'populares', title: t.popularTab, items: MOST_COMMON_WORDS, emptyText: '' },
        { id: 'favoritos', title: t.favoritesTab, items: favorites, emptyText: t.favoritesEmptyDictionary },
        { id: 'recientes', title: t.recentsTab, items: recents, emptyText: t.recentsEmpty }
    ];

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs';
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-nav';
    tabNav.setAttribute('role', 'tablist');
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';

    tabsData.forEach((tab, index) => {
        const button = document.createElement('button');
        button.className = 'tab-link' + (index === 0 ? ' active' : '');
        button.textContent = tab.title;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', `tab-${tab.id}`);
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.dataset.tabTarget = `#tab-${tab.id}`;
        tabNav.appendChild(button);

        const pane = document.createElement('div');
        pane.id = `tab-${tab.id}`;
        pane.className = 'tab-pane' + (index === 0 ? ' active' : '');
        pane.setAttribute('role', 'tabpanel');

        if (tab.items.length > 0) {
            const gridEl = document.createElement('div');
            gridEl.className = 'item-card-grid';
            gridEl.innerHTML = tab.items.map(item =>
                `<button class="item-card" data-word="${item}">${item.charAt(0).toUpperCase() + item.slice(1)}</button>`
            ).join('');
            pane.appendChild(gridEl);
        } else {
            const emptyEl = document.createElement('p');
            emptyEl.className = 'empty-section-text';
            emptyEl.textContent = tab.emptyText;
            pane.appendChild(emptyEl);
        }
        tabContent.appendChild(pane);
    });

    tabsContainer.appendChild(tabNav);
    tabsContainer.appendChild(tabContent);
    dom.resultsContainer.innerHTML = '';
    dom.resultsContainer.appendChild(tabsContainer);
}

function renderDictionaryLayoutSkeleton() {
    dom.resultsContainer.innerHTML = `
        <div class="word-results-container">
            <div class="skeleton-header">
                <div class="skeleton-title"></div>
                <div class="skeleton-star"></div>
            </div>
            <div class="result-block skeleton" style="height: 120px; margin-top: 1rem;"></div>
            <div class="result-block skeleton" style="height: 150px;"></div>
        </div>
    `;
}

async function populateDictionaryResults(data: any) {
    const t = translations[state.getCurrentLanguage()];
    const isFav = storage.isFavoriteWord(data.palabra);

    const mainInfoHtml = `
        <div class="verb-header-container">
            <h1 class="word-title">
                ${data.articulo ? `<span class="article">${data.articulo}</span>` : ''}
                ${data.palabra}
            </h1>
            <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-word="${data.palabra}" aria-label="${isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd}">★</button>
            <button class="speak-btn" data-speak-text="${data.palabra}" aria-label="${t.speak}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
            </button>
            <button class="print-btn" id="dictionary-print-btn" title="${t.print}">
                ${PRINTER_ICON_SVG}
            </button>
        </div>
        <div class="result-block result-card-enter" style="--delay-index: 0;">
            <h3>${t.definitionLabel}</h3>
            <div class="collapsible-content">
                <p class="word-definition-text">${data.definicion}</p>
            </div>
        </div>
    `;
    
    let onDemandSections = [];
    if (data.isVerbInfinitive) {
        onDemandSections.push({ action: 'conjugations', label: t.conjugateButton });
    } else {
        onDemandSections.push({ action: 'derived_verb', label: t.derivedVerbAction });
    }
    onDemandSections.push(
        { action: 'derived_adjective', label: t.derivedAdjectiveAction },
        { action: 'synonyms', label: t.synonymsLabel },
        { action: 'antonyms', label: t.antonymsLabel },
        { action: 'plural', label: t.pluralFormLabel },
    );

    const onDemandHtml = `
      <div class="action-buttons-grid">
          ${onDemandSections.map(s => `<button class="action-btn on-demand-btn" data-action="${s.action}" data-word="${data.palabra}">${s.label}</button>`).join('')}
      </div>
      <div id="dynamic-block-conjugations" class="dynamic-result-block" hidden></div>
      <div id="dynamic-block-derived_verb" class="dynamic-result-block" hidden></div>
      <div id="dynamic-block-derived_adjective" class="dynamic-result-block" hidden></div>
      <div id="dynamic-block-synonyms" class="dynamic-result-block" hidden></div>
      <div id="dynamic-block-antonyms" class="dynamic-result-block" hidden></div>
      <div id="dynamic-block-plural" class="dynamic-result-block" hidden></div>
    `;
    
    dom.resultsContainer.innerHTML = `
        <div class="word-results-container">
            ${mainInfoHtml}
            ${onDemandHtml}
            <div id="dynamic-block-examples" class="dynamic-result-block" hidden></div>
        </div>
    `;
    await utils.delay(10);
    dom.resultsContainer.querySelectorAll('.result-card-enter').forEach(el => el.classList.add('active'));

    const examplesContainer = document.getElementById(`dynamic-block-examples`);

    if (examplesContainer) {
        examplesContainer.hidden = false;
        examplesContainer.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
        handleOnDemandData('examples', data.palabra, examplesContainer, null);
    }
}

function renderOnDemandData(action: string, data: any, container: HTMLElement) {
    const t = translations[state.getCurrentLanguage()];
    let headerHtml = '';
    let bodyHtml = '';
    let hasContent = false;

    switch (action) {
        case 'examples':
            hasContent = true;
            headerHtml = `<h3>${t.examplesLabel}</h3>`;
            if (data && data.length > 0) {
                bodyHtml = `<ul class="examples-list">${data.map((item: string) => {
                    const [spanish, georgian] = item.split(' // ');
                    return `<li class="example-list-item"><div>${utils.escapeHtml(spanish.trim())} ${georgian ? `<small class="translation">${georgian.trim()}</small>` : ''}</div><button class="speak-btn-inline" data-speak-text="${utils.escapeHtml(spanish.trim())}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"></path></svg></button></li>`;
                }).join('')}</ul>`;
            } else {
                bodyHtml = `<p class="empty-section-text">${t.examplesNotFound}</p>`;
            }
            break;
        case 'synonyms':
        case 'antonyms':
            hasContent = true;
            const label = action === 'synonyms' ? t.synonymsLabel : t.antonymsLabel;
            headerHtml = `<h3>${label}</h3>`;
            if (data && data.length > 0) {
                bodyHtml = `<ul class="word-list">${data.map((item: string) => `<li class="word-tag" data-word="${item}">${item}</li>`).join('')}</ul>`;
            } else {
                const notFoundText = action === 'synonyms' ? t.synonymsNotFound : t.antonymsNotFound;
                bodyHtml = `<p class="empty-section-text">${notFoundText}</p>`;
            }
            break;
        case 'plural':
            hasContent = true;
            headerHtml = `<h3>${t.pluralFormLabel}</h3>`;
            if (data && data.trim().toLowerCase() !== 'null') {
                bodyHtml = `<p class="plural-form-text">${data}</p>`;
            } else {
                bodyHtml = `<p class="empty-section-text">${t.pluralNotFound}</p>`;
            }
            break;
        case 'derived_verb':
            hasContent = true;
            headerHtml = `<h3>${t.derivedVerbTitle}</h3>`;
            if (data && data.verbo) {
                bodyHtml = `
                    <div class="derived-verb-content" style="padding-top: 1rem;">
                        <div class="derived-verb-info">
                            <p class="derived-verb-word">${data.verbo}</p>
                            <p class="derived-verb-def">${data.definicion_verbo}</p>
                        </div>
                        <button class="conjugate-link-btn" data-verb="${data.verbo}">${t.conjugateButton} <span>→</span></button>
                    </div>`;
            } else {
                bodyHtml = `<p class="empty-section-text">${t.derivedVerbNotFound}</p>`;
            }
            break;
        case 'derived_adjective':
            hasContent = true;
            headerHtml = `<h3>${t.derivedAdjectiveTitle}</h3>`;
            if (data && data.adjetivo) {
                bodyHtml = `
                    <div class="derived-verb-content" style="padding-top: 1rem;">
                        <div class="derived-verb-info">
                            <p class="derived-verb-word">${data.adjetivo}</p>
                            <p class="derived-verb-def">${data.definicion_adjetivo}</p>
                        </div>
                    </div>`;
            } else {
                bodyHtml = `<p class="empty-section-text">${t.derivedAdjectiveNotFound}</p>`;
            }
            break;
    }

    if (hasContent) {
        container.innerHTML = `${headerHtml}<div class="collapsible-content">${bodyHtml}</div>`;
        container.hidden = false;
    } else {
        container.innerHTML = '';
        container.hidden = true;
    }
}

// --- HANDLER FUNCTIONS ---

export async function searchWord(word: string, force = false) {
    if (!word) return;
    if (word === state.getLastSearchedTerm() && !force) return;
    state.setLastSearchedTerm(word);

    const t = translations[state.getCurrentLanguage()];
    dom.button.disabled = true;
    dom.button.textContent = t.searchingText;
    dom.input.value = word;
    (document.activeElement as HTMLElement)?.blur();
    
    renderDictionaryLayoutSkeleton();
    window.scrollTo(0, 0);

    const cacheKey = `cache:dictionary:initial:${state.getCurrentLanguage()}:${word.toLowerCase()}`;
    const cachedData = storage.getFromStorage(cacheKey, null);

    if (cachedData) {
        console.log(`Cache hit for initial dictionary definition: ${word}`);
        await populateDictionaryResults(cachedData);
        dom.button.disabled = false;
        dom.button.textContent = t.dictionarySubmitButton;
        return;
    }

    try {
        storage.addRecentWord(word);
        const data = await gemini.fetchInitialWordDefinition(word, state.getCurrentLanguage());
        storage.saveToStorage(cacheKey, data);
        await populateDictionaryResults(data);
    } catch (error) {
        console.error("Dictionary search error:", error);
        const errorString = (error instanceof Error) ? error.message : JSON.stringify(error);
        let displayMessage;

        if (errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')) {
            displayMessage = t.errorServer;
        } else {
            displayMessage = errorString || t.errorDefault;
        }

        dom.resultsContainer.innerHTML = `<p class="error-message">${t.errorPrefix}: ${displayMessage}</p>`;
    } finally {
        dom.button.disabled = false;
        dom.button.textContent = t.dictionarySubmitButton;
    }
}

async function handleConjugationInData(word: string, container: HTMLElement, button: HTMLButtonElement) {
    if (!word || !container || !button) return;
    
    button.disabled = true;
    container.hidden = false;
    container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
    
    try {
        const conjugationData = await gemini.fetchConjugation(word, state.getCurrentLanguage());
        storage.saveToStorage(`cache:conjugator:${state.getCurrentLanguage()}:${word.toLowerCase()}`, conjugationData);

        const t = translations[state.getCurrentLanguage()];
        const tablesHtml = getConjugationTablesHtml(conjugationData);
        container.innerHTML = `
            <h3>${t.conjugatorTab}</h3>
            <div class="collapsible-content">
                ${tablesHtml}
            </div>
        `;
        await utils.delay(10);
        container.querySelectorAll('.result-card-enter').forEach(el => el.classList.add('active'));
        button.remove();
    } catch (e) {
        const t = translations[state.getCurrentLanguage()];
        const errorString = (e instanceof Error) ? e.message : JSON.stringify(e);
        let displayMessage = errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')
            ? t.errorServer
            : errorString || t.errorDefault;
        container.innerHTML = `<p class="error-message">${t.errorPrefix}: ${displayMessage}</p>`;
    }
}

async function handleOnDemandData(action: string, word: string, container: HTMLElement, button: HTMLButtonElement | null) {
    const t = translations[state.getCurrentLanguage()];
    const cacheKey = `cache:dictionary:${action}:${state.getCurrentLanguage()}:${word.toLowerCase()}`;
    const cachedData = storage.getFromStorage(cacheKey, null);
    
    if (button) button.disabled = true;

    if (cachedData) {
        console.log(`Cache hit for on-demand dictionary data: ${action} for ${word}`);
        renderOnDemandData(action, cachedData, container);
        if (button) button.disabled = false;
        return;
    }
    
    try {
        let resultData: any;
        switch (action) {
            case 'examples':
                resultData = await gemini.fetchWordExamples(word, state.getCurrentLanguage());
                break;
            case 'synonyms':
                resultData = await gemini.fetchWordSynonyms(word);
                break;
            case 'antonyms':
                resultData = await gemini.fetchWordAntonyms(word);
                break;
            case 'plural':
                resultData = await gemini.fetchWordPlural(word);
                break;
            case 'derived_verb':
                resultData = await gemini.fetchDerivedVerb(word, state.getCurrentLanguage());
                break;
            case 'derived_adjective':
                resultData = await gemini.fetchDerivedAdjective(word, state.getCurrentLanguage());
                break;
            default:
                throw new Error('Unknown action');
        }
        storage.saveToStorage(cacheKey, resultData);
        renderOnDemandData(action, resultData, container);
    } catch (e) {
        console.error(`On-demand fetch error for ${action}:`, e);
        const errorString = (e instanceof Error) ? e.message : JSON.stringify(e);
        let displayMessage;
        if (errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')) {
            displayMessage = t.errorServer;
        } else {
             displayMessage = t.errorDefault;
        }
        container.innerHTML = `<p class="error-message" style="text-align: left; padding: 0;">${displayMessage}</p>`;
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

// --- EVENT LISTENERS ---

export function addDictionaryEventListeners() {
    document.body.addEventListener('click', (e) => {
        if (state.getCurrentView() !== 'dictionary') return;
        const target = e.target as HTMLElement;

        // New listener for collapsing/expanding
        const blockHeader = target.closest('.result-block h3, .dynamic-result-block h3');
        if (blockHeader && target.tagName.toLowerCase() === 'h3') {
            const block = blockHeader.closest('.result-block, .dynamic-result-block');
            block?.classList.toggle('is-collapsed');
            return;
        }

        const favoriteBtn = target.closest('.favorite-btn');
        if (favoriteBtn) {
            const word = (favoriteBtn as HTMLElement).dataset.word;
            if (word) {
                storage.toggleFavoriteWord(word);
                favoriteBtn.classList.toggle('favorited', storage.isFavoriteWord(word));
            }
            return;
        }

        const onDemandBtn = target.closest('.on-demand-btn');
        if (onDemandBtn) {
            const btn = onDemandBtn as HTMLButtonElement;
            const action = btn.dataset.action;
            const word = btn.dataset.word;
            const container = document.getElementById(`dynamic-block-${action}`);

            if (action === 'conjugations' && word && container) {
                handleConjugationInData(word, container, btn);
            } else if (action && word && container) {
                container.hidden = false;
                container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
                handleOnDemandData(action, word, container, btn);
            }
            return;
        }
        const wordTag = target.closest('.word-tag');
        if (wordTag) {
            const word = (wordTag as HTMLElement).dataset.word || wordTag.textContent;
            if (word) { dom.input.value = word; searchWord(word); }
            return;
        }
        const conjugateLinkBtn = target.closest('.conjugate-link-btn');
        if (conjugateLinkBtn) {
            const verb = (conjugateLinkBtn as HTMLElement).dataset.verb;
            if (verb) { setView('conjugator'); dom.input.value = verb; conjugateVerb(verb); }
            return;
        }

        const itemCard = target.closest('.item-card');
        if (itemCard) {
            const word = (itemCard as HTMLElement).dataset.word;
            if (word) searchWord(word);
            return;
        }

        const tabLink = target.closest('.tab-link');
        if (tabLink) {
            const tabContainer = tabLink.closest('.tabs');
            if (!tabContainer) return;

            tabContainer.querySelectorAll('.tab-link.active').forEach(link => link.classList.remove('active'));
            tabContainer.querySelectorAll('.tab-pane.active').forEach(pane => pane.classList.remove('active'));

            tabLink.classList.add('active');
            const targetPaneSelector = tabLink.getAttribute('data-tab-target');
            if(targetPaneSelector) (tabContainer.querySelector(targetPaneSelector) as HTMLElement)?.classList.add('active');
            return;
        }

        const speakBtn = target.closest('.speak-btn, .speak-btn-inline');
        if (speakBtn) {
            const textToSpeak = (speakBtn as HTMLElement).dataset.speakText;
            if (textToSpeak) {
                utils.speakText(textToSpeak, 'es', speakBtn as HTMLButtonElement);
            }
            return;
        }

        if (target.closest('#dictionary-print-btn')) {
            utils.handlePrint('.word-results-container');
            return;
        }

        const tenseTitle = target.closest('.tense-title-btn');
        if (tenseTitle) {
            const tenseKey = (tenseTitle as HTMLElement).dataset.tense;
            if (tenseKey) utils.openTenseModal(tenseKey);
            return;
        }
    });
}