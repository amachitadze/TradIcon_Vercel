/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gemini from './gemini.js';
import * as utils from './utils.js';
import { translations, MOST_COMMON_VERBS, VERB_LIST, tenseTitleMap, pronounMap, PRINTER_ICON_SVG } from './constants.js';

// --- RENDER FUNCTIONS ---

export function renderConjugatorView() {
    dom.form.hidden = false;
    const recents = storage.getRecentVerbs();
    const favorites = storage.getFavoriteVerbs();
    const t = translations[state.getCurrentLanguage()];

    const tabsData = [
        { id: 'populares', title: t.popularTab, items: MOST_COMMON_VERBS, emptyText: '' },
        { id: 'favoritos', title: t.favoritesTab, items: favorites, emptyText: t.favoritesEmptyConjugator },
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
                `<button class="item-card" data-verb="${item}">${item.charAt(0).toUpperCase() + item.slice(1)}</button>`
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

function renderConjugatorLayoutSkeleton() {
    const skeletonTables = Array(5).fill(`
        <div class="tense-container skeleton"></div>
    `).join('');
     const skeletonForms = Array(2).fill('<div class="form-card skeleton"></div>').join('');

    dom.resultsContainer.innerHTML = `
      <div class="conjugator-results-container">
        <div>
            <div class="skeleton skeleton-header">
              <div class="skeleton-title"></div>
              <div class="skeleton-star"></div>
            </div>
             <div class="verb-main-forms" style="margin-top: 1.5rem;">
                ${skeletonForms}
             </div>
        </div>
        <div class="tables-grid">${skeletonTables}</div>
      </div>
    `;
}

export function getConjugationTablesHtml(data: any): string {
    const t = translations[state.getCurrentLanguage()];
    // ქართული კომენტარი: Pretérito Imperfecto დრო დამალულია მომხმარებლის მოთხოვნით.
    // მისი ჩვენების აღსადგენად, წაშალეთ კომენტარის ნიშნები 'preterito_imperfecto'-ს წინ.
    const tenses = ['presente', 'preterito_perfecto', 'preterito_indefinido', /*'preterito_imperfecto',*/ 'futuro_simple'];
    const pronouns = ['yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos'];

    const tablesHtml = tenses.map((tenseKey, index) => {
        const tenseData = data[tenseKey];
        if (!tenseData) return '';
        const tenseTitle = tenseTitleMap[tenseKey as keyof typeof tenseTitleMap];

        const rows = pronouns.map(pronounKey => {
            const pronoun = pronounMap[pronounKey as keyof typeof pronounMap];
            const conjugation = tenseData.conjugaciones[pronounKey];
            return `<tr>
                      <th>${pronoun}</th>
                      <td>
                        <span>${conjugation}</span>
                        <button class="speak-btn-inline" data-speak-text="${conjugation}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"></path></svg></button>
                      </td>
                    </tr>`;
        }).join('');
        
        const [exampleSentence, exampleTranslation] = (tenseData.ejemplo || '').split(' // ');

        return `
          <div class="tense-container result-card-enter" style="--delay-index: ${index};">
            <table class="conjugation-table">
              <caption><button class="tense-title-btn" data-tense="${tenseKey}">${tenseTitle}</button></caption>
              <tbody>${rows}</tbody>
            </table>
            ${exampleSentence ? `
            <div class="example-sentence">
              <div class="example-text-content">
                <span>${utils.highlightVerbInSentence(exampleSentence, tenseData.conjugaciones)}</span>
                ${exampleTranslation ? `<small class="translation">${exampleTranslation.trim()}</small>` : ''}
              </div>
              <button class="speak-btn-inline" data-speak-text="${exampleSentence.replace(/<\/?b>/g, '')}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"></path></svg></button>
            </div>` : ''}
          </div>
        `;
    }).join('');

    return `<div class="tables-grid">${tablesHtml}</div>`;
}

async function populateConjugatorResults(data: any) {
    const t = translations[state.getCurrentLanguage()];
    const isFav = storage.isFavoriteVerb(data.infinitivo);
    
    const mainInfoHtml = `
      <div>
        <div class="verb-header-container">
          <h2 class="verb-title">${data.infinitivo}</h2>
          <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-verb="${data.infinitivo}" aria-label="${isFav ? t.favoriteAriaLabelRemove : t.favoriteAriaLabelAdd}">★</button>
          <button class="speak-btn" data-speak-text="${data.infinitivo}" aria-label="${t.speak}">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
          </button>
           <button class="print-btn" id="conjugator-print-btn" title="${t.print}">
              ${PRINTER_ICON_SVG}
          </button>
        </div>

        <div class="result-block result-card-enter" style="margin-bottom: 1.5rem; --delay-index: 0;">
            <h3>${t.definitionLabel}</h3>
            <div class="collapsible-content">
                <p class="word-definition-text">${data.definicion}</p>
            </div>
        </div>

        <div class="verb-main-forms">
            <div class="form-card-wrapper">
              <button class="form-card" data-tense="gerundio"><h3>${t.gerundCard}</h3><p>${data.gerundio}</p></button>
              <button class="speak-btn-inline" data-speak-text="${data.gerundio}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"></path></svg></button>
            </div>
            <div class="form-card-wrapper">
              <button class="form-card" data-tense="participio"><h3>${t.participleCard}</h3><p>${data.participio}</p></button>
              <button class="speak-btn-inline" data-speak-text="${data.participio}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"></path></svg></button>
            </div>
        </div>
      </div>
    `;

    const tablesHtml = getConjugationTablesHtml(data);

    dom.resultsContainer.innerHTML = `<div class="conjugator-results-container">${mainInfoHtml}${tablesHtml}</div>`;
    
    await utils.delay(10);
    dom.resultsContainer.querySelectorAll('.result-card-enter').forEach(el => el.classList.add('active'));
}


// --- HANDLER FUNCTIONS ---

export async function conjugateVerb(verb: string, force = false) {
    if (!verb) return;
    if (verb === state.getLastSearchedTerm() && !force) return;
    state.setLastSearchedTerm(verb);

    const t = translations[state.getCurrentLanguage()];
    dom.button.disabled = true;
    dom.button.textContent = t.conjugatingText;
    dom.input.value = verb;
    (document.activeElement as HTMLElement)?.blur();
    
    renderConjugatorLayoutSkeleton();
    window.scrollTo(0, 0);

    const cacheKey = `cache:conjugator:${state.getCurrentLanguage()}:${verb.toLowerCase()}`;
    const cachedData = storage.getFromStorage(cacheKey, null);

    if (cachedData) {
        console.log(`Cache hit for conjugator: ${verb}`);
        await populateConjugatorResults(cachedData);
        dom.button.disabled = false;
        dom.button.textContent = t.submitButton;
        return;
    }

    try {
        storage.addRecentVerb(verb);
        const data = await gemini.fetchConjugation(verb, state.getCurrentLanguage());
        storage.saveToStorage(cacheKey, data);
        await populateConjugatorResults(data);
    } catch (error) {
        console.error("Conjugation error:", error);
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
        dom.button.textContent = t.submitButton;
    }
}

// --- Autocomplete Handlers ---
function showAutocomplete(matches: {es: string, ka: string}[]) {
    if (matches.length > 0) {
        dom.suggestionsContainer.innerHTML = matches.map(match => `
            <div data-value="${match.es}">
                <span>${match.es}</span>
                <span class="ka-suggestion">${match.ka}</span>
            </div>
        `).join('');
        dom.suggestionsContainer.hidden = false;
    } else {
        dom.suggestionsContainer.hidden = true;
    }
}

export function handleAutocompleteInput() {
    const value = dom.input.value.toLowerCase();
    if (value.length < 2) {
        dom.suggestionsContainer.hidden = true;
        return;
    }

    const matches = VERB_LIST.filter(verb =>
        verb.es.toLowerCase().startsWith(value) || (state.getCurrentLanguage() === 'ka' && verb.ka.startsWith(value))
    ).slice(0, 5);

    showAutocomplete(matches);
}

export function handleSuggestionClick(suggestionDiv: HTMLDivElement) {
    const value = suggestionDiv.dataset.value;
    if (value) {
        dom.input.value = value;
        dom.suggestionsContainer.hidden = true;
        conjugateVerb(value);
    }
}


// --- EVENT LISTENERS ---

export function addConjugatorEventListeners() {
    document.body.addEventListener('click', (e) => {
        if (state.getCurrentView() !== 'conjugator') return;
        
        const target = e.target as HTMLElement;

        // Listener for collapsing/expanding the definition card
        const blockHeader = target.closest('.result-block h3');
        if (blockHeader && target.tagName.toLowerCase() === 'h3') {
            const block = blockHeader.closest('.result-block');
            block?.classList.toggle('is-collapsed');
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

        const itemCard = target.closest('.item-card');
        if (itemCard) {
            const verb = (itemCard as HTMLElement).dataset.verb;
            if (verb) {
                conjugateVerb(verb);
            }
            return;
        }
        
        const tenseTitle = target.closest('.tense-title-btn, .form-card');
        if (tenseTitle) {
            const tenseKey = (tenseTitle as HTMLElement).dataset.tense;
            if (tenseKey) utils.openTenseModal(tenseKey);
            return;
        }
        const favoriteBtn = target.closest('.favorite-btn');
        if (favoriteBtn) {
            const verb = (favoriteBtn as HTMLElement).dataset.verb;
            if (verb) {
                storage.toggleFavoriteVerb(verb);
                favoriteBtn.classList.toggle('favorited', storage.isFavoriteVerb(verb));
            }
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
        
        if (target.closest('#conjugator-print-btn')) {
            utils.handlePrint('.conjugator-results-container');
            return;
        }
    });
}