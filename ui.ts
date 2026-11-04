/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as utils from './utils.js';
import * as dataManager from './data-manager.js';
import { translations } from './constants.js';
import { View } from './types.js';
import { renderChatView, addChatDelegatedEventListeners, initializeChatState, stopLiveChat } from './chat.js';
import { renderPracticeView, addPracticeDelegatedEventListeners } from './practice.js';
import { renderConjugatorView, addConjugatorEventListeners, conjugateVerb, handleAutocompleteInput, handleSuggestionClick as handleConjugatorSuggestionClick } from './conjugator.js';
import { renderDictionaryView, addDictionaryEventListeners, searchWord } from './dictionary.js';
import { renderTranslatorView, addTranslatorEventListeners, handleImageUpload, handleDocumentUpload } from './translator.js';
import { renderAboutView, renderHistoryView, renderFavoritesView, addViewsEventListeners, showImportOptions } from './views.js';
import { renderGuidelinesView } from './guidelines.js';
import * as usageTracker from './usage-tracker.js';

// --- View Management ---

export function setView(view: View) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    const recognition = state.getRecognition();
    if (recognition) {
        recognition.stop();
    }
    utils.releaseWakeLock();
    toggleMobileMenu(true); // Close menu on navigation

    // Reset translator sub-view when navigating away
    if (view !== 'translator') {
        state.setTranslatorMode('translate');
    }
    
    if (view !== 'chat' && state.getIsLiveChatActive()) {
        stopLiveChat(); 
    }
    
    // Add view class to app container for view-specific global layout
    const appEl = document.getElementById('app');
    if (appEl) {
        // Remove any other view-* classes before adding the new one
        appEl.className = Array.from(appEl.classList).filter(c => !c.startsWith('view-')).join(' ');
        appEl.classList.add(`view-${view}`);
    }

    state.setCurrentView(view);
    window.scrollTo(0, 0);

    // More robust way to handle active button state using data attributes
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
        const button = btn as HTMLElement;
        if (button.dataset.view === view) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    if (view === 'chat') {
        initializeChatState();
    }

    state.setLastSearchedTerm(null);
    dom.input.value = '';
    dom.suggestionsContainer.hidden = true;

    updateUIForLanguage(); // This call updates the header and then calls renderApp
    updateGlobalUI();
}

export function toggleMobileMenu(forceClose = false) {
    const isOpen = !dom.mobileMenu.hidden;
    if (forceClose || isOpen) {
        dom.mobileMenu.hidden = true;
        dom.mobileMenuOverlay.hidden = true;
        document.body.classList.remove('menu-open');
    } else {
        dom.mobileMenu.hidden = false;
        dom.mobileMenuOverlay.hidden = false;
        document.body.classList.add('menu-open');
    }
}

// --- Language & UI Updates ---

export function updateGlobalUI() {
    const container = document.getElementById('global-usage-bar-container');
    if (!container) return;

    // Hide on about page since it has a bigger version
    if (state.getCurrentView() === 'about' || state.getCurrentView() === 'guidelines') {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';

    const t = translations[state.getCurrentLanguage()];
    const usage = usageTracker.getCurrentUsage();
    const percentage = Math.min(100, (usage.count / usage.limit) * 100);

    container.title = t.apiUsageTooltip;
    container.innerHTML = `
        <div class="progress-bar-inner" style="width: ${percentage}%;"></div>
    `;
}

export function updateUIForLanguage() {
    const currentLanguage = state.getCurrentLanguage();
    const t = translations[currentLanguage];
    document.documentElement.lang = currentLanguage;
    document.title = t.pageTitle;

    // Update mobile menu text
    const updateMenuLinkText = (id: string, text: string) => {
        const element = document.getElementById(id);
        const span = element?.querySelector('span');
        if (span) {
            span.textContent = text;
        } else if (element) {
            // Fallback for elements without icons/spans
            element.textContent = text;
        }
    };

    updateMenuLinkText('mobile-menu-practice', t.practiceTab);
    updateMenuLinkText('mobile-menu-chat', t.chatTab);
    updateMenuLinkText('mobile-menu-about', t.footerAbout);
    updateMenuLinkText('mobile-menu-export', t.exportButton);
    updateMenuLinkText('mobile-menu-import', t.importButton);
    updateMenuLinkText('mobile-menu-drive', t.driveBackupLinkText);
    updateMenuLinkText('mobile-menu-materials', t.auxiliaryMaterials);
    
    (document.getElementById('mobile-menu-lang-es') as HTMLElement).textContent = t.spanish;
    (document.getElementById('mobile-menu-lang-ka') as HTMLElement).textContent = t.georgian;

    document.querySelectorAll('.mobile-menu-lang-btn').forEach(btn => {
        const button = btn as HTMLButtonElement;
        if (button.dataset.lang === currentLanguage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });


    dom.navConjugatorBtn.textContent = t.conjugatorTab;
    dom.navDictionaryBtn.textContent = t.dictionaryTab;
    dom.navTranslatorBtn.textContent = t.translatorTab;
    dom.navPracticeBtn.textContent = t.practiceTab;
    dom.navChatBtn.textContent = t.chatTab;

    dom.bottomNavConjugatorBtn.querySelector('span')!.textContent = t.conjugatorTab;
    dom.bottomNavDictionaryBtn.querySelector('span')!.textContent = t.dictionaryTab;
    dom.bottomNavTranslatorBtn.querySelector('span')!.textContent = t.translatorTab;

    const headerTitle = document.getElementById('header-title') as HTMLElement;
    const currentView = state.getCurrentView();
    if (currentView === 'conjugator') {
        headerTitle.textContent = t.headerTitle;
        dom.input.placeholder = t.inputPlaceholder;
        dom.button.textContent = t.submitButton;
    } else if (currentView === 'dictionary') {
        headerTitle.textContent = t.dictionaryHeaderTitle;
        dom.input.placeholder = t.dictionaryInputPlaceholder;
        dom.button.textContent = t.dictionarySubmitButton;
    } else if (currentView === 'translator') {
        headerTitle.textContent = t.translatorHeaderTitle;
    } else if (currentView === 'practice') {
        headerTitle.textContent = t.practiceHeaderTitle;
    } else if (currentView === 'chat') {
        headerTitle.textContent = t.chatHeaderTitle;
    } else if (currentView === 'history') {
        headerTitle.textContent = t.historyHeaderTitle;
    } else if (currentView === 'favorites') {
        headerTitle.textContent = t.favoritesHeaderTitle;
    } else if (currentView === 'about') {
        headerTitle.textContent = t.aboutHeaderTitle;
    } else if (currentView === 'guidelines') {
        headerTitle.textContent = t.guidelinesHeaderTitle;
    }

    // Update footer links if they exist
    if (dom.footerMaterialsLink && dom.footerAboutBtn) {
        dom.footerMaterialsLink.textContent = t.auxiliaryMaterials;
        dom.footerAboutBtn.textContent = t.footerAbout;
    }
    
    renderApp();
    updateGlobalUI();
}

export function renderApp() {
    switch (state.getCurrentView()) {
        case 'conjugator': renderConjugatorView(); break;
        case 'dictionary': renderDictionaryView(); break;
        case 'translator': renderTranslatorView(); break;
        case 'practice': renderPracticeView(); break;
        case 'chat': renderChatView(); break;
        case 'history': renderHistoryView(); break;
        case 'favorites': renderFavoritesView(); break;
        case 'about': renderAboutView(); break;
        case 'guidelines': renderGuidelinesView(); break;
    }
}


// --- Delegated Event Handlers ---

export function addDelegatedEventListeners() {
    addConjugatorEventListeners();
    addDictionaryEventListeners();
    addTranslatorEventListeners();
    addChatDelegatedEventListeners();
    addPracticeDelegatedEventListeners();
    addViewsEventListeners();

    // The container is static, so we can add a direct listener here.
    const globalUsageBar = document.getElementById('global-usage-bar-container');
    globalUsageBar?.addEventListener('click', () => {
        if (state.getCurrentView() === 'about') return; // Don't do anything if already on the page
        
        setView('about');
        
        // Use timeout to ensure the view has rendered before scrolling
        setTimeout(() => {
            const section = document.getElementById('api-usage-section');
            section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); 
    });
}

// --- Global Handlers passed from index.tsx ---

export function handleMainFormSubmit(e: Event) {
    e.preventDefault();
    if (state.getCurrentView() === 'conjugator') {
        conjugateVerb(dom.input.value.trim());
    } else if (state.getCurrentView() === 'dictionary') {
        searchWord(dom.input.value.trim());
    }
}

export function handleMainFormInput() {
    if (state.getCurrentView() === 'conjugator') {
        handleAutocompleteInput();
    } else {
        dom.suggestionsContainer.hidden = true;
    }
}

export function handleSuggestionClick(e: Event) {
    const target = e.target as HTMLElement;
    const suggestionDiv = target.closest('div[data-value]') as HTMLDivElement;
    if (suggestionDiv) {
        handleConjugatorSuggestionClick(suggestionDiv);
    }
}

export function handleImageUploadEvent(event: Event) {
    handleImageUpload(event);
}

export function handleDocumentUploadEvent(event: Event) {
    handleDocumentUpload(event);
}

export function handleShowImportOptions() {
    showImportOptions();
}

export function refetchLastTermInNewLanguage() {
    const lastSearchedTerm = state.getLastSearchedTerm();
    if (!lastSearchedTerm) return;

    if (state.getCurrentView() === 'conjugator') {
        conjugateVerb(lastSearchedTerm, true);
    } else { // Dictionary view
        searchWord(lastSearchedTerm, true);
    }
}