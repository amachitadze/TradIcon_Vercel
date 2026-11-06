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
import { getApiKey, getApiKeys, saveApiKeyToStorage, getPreferredProvider, setPreferredProvider, testApiSpeed, ProviderPreference, getCustomEndpoint, saveCustomEndpoint, getCustomModel, saveCustomModel } from './gemini.js';

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
    
    updateDesktopApiStatusDot();
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

export function updateDesktopApiStatusDot() {
    const dot = document.getElementById('desktop-api-status-dot');
    if (!dot) return;
    const hasAny = getApiKeys('gemini').length > 0 || getApiKeys('groq').length > 0 || getApiKeys('openrouter').length > 0;
    const isKa = state.getCurrentLanguage() === 'ka';
    if (hasAny) {
        dot.classList.remove('inactive');
        dot.title = isKa ? 'API აქტიურია (ხელმისაწვდომია)' : 'API Activo';
    } else {
        dot.classList.add('inactive');
        dot.title = isKa ? 'API გასაღებები არ არის კონფიგურირებული' : 'Sin claves API';
    }
}

export function openApiSettingsModal() {
    const modal = document.getElementById('api-settings-modal');
    if (!modal) return;

    const geminiInput = document.getElementById('gemini-key-input') as HTMLInputElement | null;
    const groqInput = document.getElementById('groq-key-input') as HTMLInputElement | null;
    const openrouterInput = document.getElementById('openrouter-key-input') as HTMLInputElement | null;
    const customInput = document.getElementById('custom-key-input') as HTMLInputElement | null;
    const customModelInput = document.getElementById('custom-model-input') as HTMLInputElement | null;
    const customEndpointInput = document.getElementById('custom-endpoint-input') as HTMLInputElement | null;
    const prefSelect = document.getElementById('preferred-provider-select') as HTMLSelectElement | null;
    const testResultEl = document.getElementById('api-settings-test-result') as HTMLDivElement | null;

    if (testResultEl) {
        testResultEl.style.display = 'none';
        testResultEl.innerHTML = '';
    }

    if (prefSelect) {
        prefSelect.value = getPreferredProvider();
    }

    const geminiBadge = document.getElementById('gemini-status-badge');
    const groqBadge = document.getElementById('groq-status-badge');
    const openrouterBadge = document.getElementById('openrouter-status-badge');
    const customBadge = document.getElementById('custom-status-badge');

    const geminiKeys = getApiKeys('gemini');
    const groqKeys = getApiKeys('groq');
    const openrouterKeys = getApiKeys('openrouter');
    const customKeys = getApiKeys('custom');

    const isKa = state.getCurrentLanguage() === 'ka';

    const updateBadge = (badge: HTMLElement | null, keys: string[]) => {
        if (!badge) return;
        if (keys.length > 0) {
            badge.textContent = isKa
                ? (keys.length > 1 ? `✅ აქტიურია (${keys.length} გასაღები)` : '✅ აქტიურია')
                : (keys.length > 1 ? `✅ Activo (${keys.length} claves)` : '✅ Activo');
            badge.style.background = '#e6f7ed';
            badge.style.color = '#0e8a3a';
        } else {
            badge.textContent = isKa ? '⚠️ არ არის' : '⚠️ No configurada';
            badge.style.background = '#fff4e5';
            badge.style.color = '#d97706';
        }
    };

    updateBadge(geminiBadge, geminiKeys);
    updateBadge(groqBadge, groqKeys);
    updateBadge(openrouterBadge, openrouterKeys);
    updateBadge(customBadge, customKeys);

    if (geminiInput) geminiInput.value = localStorage.getItem('GEMINI_API_KEY') || '';
    if (groqInput) groqInput.value = localStorage.getItem('GROQ_API_KEY') || '';
    if (openrouterInput) openrouterInput.value = localStorage.getItem('OPENROUTER_API_KEY') || '';
    if (customInput) customInput.value = localStorage.getItem('CUSTOM_API_KEY') || '';
    if (customModelInput) customModelInput.value = localStorage.getItem('CUSTOM_API_MODEL') || 'gpt-4o-mini';
    if (customEndpointInput) customEndpointInput.value = localStorage.getItem('CUSTOM_API_ENDPOINT') || '';

    modal.hidden = false;
    toggleMobileMenu(true);
}

export function closeApiSettingsModal() {
    const modal = document.getElementById('api-settings-modal');
    if (modal) modal.hidden = true;
}

export function addDelegatedEventListeners() {
    addConjugatorEventListeners();
    addDictionaryEventListeners();
    addTranslatorEventListeners();
    addChatDelegatedEventListeners();
    addPracticeDelegatedEventListeners();
    addViewsEventListeners();

    // Global listener for API settings modal buttons and error triggers
    document.body.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.open-api-settings-btn, #mobile-menu-api-settings')) {
            openApiSettingsModal();
            return;
        }
        if (target.matches('#api-settings-close-btn') || (target.id === 'api-settings-modal' && e.target === target)) {
            closeApiSettingsModal();
            return;
        }
        if (target.matches('#api-settings-save-btn')) {
            const geminiInput = document.getElementById('gemini-key-input') as HTMLInputElement | null;
            const groqInput = document.getElementById('groq-key-input') as HTMLInputElement | null;
            const openrouterInput = document.getElementById('openrouter-key-input') as HTMLInputElement | null;
            const customInput = document.getElementById('custom-key-input') as HTMLInputElement | null;
            const customModelInput = document.getElementById('custom-model-input') as HTMLInputElement | null;
            const customEndpointInput = document.getElementById('custom-endpoint-input') as HTMLInputElement | null;
            const prefSelect = document.getElementById('preferred-provider-select') as HTMLSelectElement | null;

            if (geminiInput) saveApiKeyToStorage('gemini', geminiInput.value.trim());
            if (groqInput) saveApiKeyToStorage('groq', groqInput.value.trim());
            if (openrouterInput) saveApiKeyToStorage('openrouter', openrouterInput.value.trim());
            if (customInput) saveApiKeyToStorage('custom', customInput.value.trim());
            if (customModelInput) saveCustomModel(customModelInput.value.trim());
            if (customEndpointInput) saveCustomEndpoint(customEndpointInput.value.trim());
            if (prefSelect) setPreferredProvider(prefSelect.value as ProviderPreference);

            updateDesktopApiStatusDot();
            closeApiSettingsModal();
            const isKa = state.getCurrentLanguage() === 'ka';
            utils.showAlertModal(
                isKa ? "პარამეტრები შენახულია" : "Configuración Guardada",
                isKa ? "API გასაღებები და პრიორიტეტი წარმატებით შეინახა ბრაუზერში!" : "¡Las claves API y la prioridad se guardaron correctamente en el navegador!"
            );
            return;
        }
        if (target.matches('#api-settings-test-btn')) {
            const testBtn = target as HTMLButtonElement;
            const testResultEl = document.getElementById('api-settings-test-result') as HTMLDivElement | null;
            const isKa = state.getCurrentLanguage() === 'ka';

            testBtn.disabled = true;
            testBtn.textContent = isKa ? 'მოწმდება... ⏳' : 'Probando... ⏳';
            if (testResultEl) {
                testResultEl.style.display = 'block';
                testResultEl.style.background = '#f0f4ff';
                testResultEl.style.color = '#1a365d';
                testResultEl.textContent = isKa ? 'მიმდინარეობს პროვაიდერების სისწრაფის გაზომვა...' : 'Midiendo velocidad de proveedores...';
            }

            try {
                const results = await testApiSpeed();
                if (results.length === 0) {
                    if (testResultEl) {
                        testResultEl.style.background = '#fff4e5';
                        testResultEl.style.color = '#d97706';
                        testResultEl.textContent = isKa
                            ? '⚠️ არცერთი API გასაღები არ არის მითითებული. გთხოვთ ჩაწეროთ გასაღები და დააჭიროთ შენახვას.'
                            : '⚠️ No hay claves configuradas. Ingrese una clave y haga clic en Guardar.';
                    }
                } else {
                    const html = results.map(r => {
                        const icon = r.success ? '✅' : '❌';
                        const color = r.success ? '#0e8a3a' : '#d93025';
                        return `<div style="margin-bottom: 2px;"><strong>${icon} ${r.provider}:</strong> <span style="color: ${color}; font-weight: 600;">${r.message}</span></div>`;
                    }).join('');
                    if (testResultEl) {
                        testResultEl.style.background = '#f6fdf9';
                        testResultEl.style.color = '#111';
                        testResultEl.innerHTML = html;
                    }
                }
            } catch (err: any) {
                if (testResultEl) {
                    testResultEl.style.background = '#fef2f2';
                    testResultEl.style.color = '#d93025';
                    testResultEl.textContent = `შეცდომა: ${err?.message || err}`;
                }
            } finally {
                testBtn.disabled = false;
                testBtn.textContent = isKa ? '⚡ ტესტი' : '⚡ Probar';
            }
            return;
        }
        if (target.matches('#api-settings-clear-btn')) {
            saveApiKeyToStorage('gemini', '');
            saveApiKeyToStorage('groq', '');
            saveApiKeyToStorage('openrouter', '');
            saveApiKeyToStorage('custom', '');
            saveCustomModel('');
            saveCustomEndpoint('');
            const geminiInput = document.getElementById('gemini-key-input') as HTMLInputElement | null;
            const groqInput = document.getElementById('groq-key-input') as HTMLInputElement | null;
            const openrouterInput = document.getElementById('openrouter-key-input') as HTMLInputElement | null;
            const customInput = document.getElementById('custom-key-input') as HTMLInputElement | null;
            const customModelInput = document.getElementById('custom-model-input') as HTMLInputElement | null;
            const customEndpointInput = document.getElementById('custom-endpoint-input') as HTMLInputElement | null;
            if (geminiInput) geminiInput.value = '';
            if (groqInput) groqInput.value = '';
            if (openrouterInput) openrouterInput.value = '';
            if (customInput) customInput.value = '';
            if (customModelInput) customModelInput.value = 'gpt-4o-mini';
            if (customEndpointInput) customEndpointInput.value = '';
            updateDesktopApiStatusDot();
            openApiSettingsModal(); // refresh badges
            return;
        }
    });

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