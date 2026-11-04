/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as utils from './utils.js';

// --- HANDLER FUNCTIONS ---

function applyFullscreenSettings(settings: { fontSize: number, theme: string }) {
    if (!dom.fullscreenOverlay || !dom.fullscreenTextContainer) return;

    // Apply theme
    dom.fullscreenOverlay.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    dom.fullscreenOverlay.classList.add(`theme-${settings.theme}`);

    // Apply font size directly via inline style for maximum specificity
    dom.fullscreenTextContainer.style.fontSize = `${settings.fontSize}px`;
    state.setCurrentFontSize(settings.fontSize);

    // Update UI controls
    if (dom.fsFontSizeValue) dom.fsFontSizeValue.textContent = `${settings.fontSize}px`;
    if (dom.fsFontSizeSlider) dom.fsFontSizeSlider.value = String(settings.fontSize);
    if (dom.fsThemeBtns) {
        dom.fsThemeBtns.forEach(btn => {
            const button = btn as HTMLButtonElement;
            button.classList.toggle('active', button.dataset.theme === settings.theme);
        });
    }
}

function updateFullscreenSetting(key: 'fontSize' | 'theme', value: string | number) {
    const settings = storage.getAppSettings();
    if (key === 'fontSize') {
        const newSize = Math.max(16, Math.min(128, Number(value)));
        settings.fullscreen.fontSize = newSize;
    } else {
        settings.fullscreen.theme = String(value);
    }
    
    storage.saveAppSettings(settings);
    applyFullscreenSettings(settings.fullscreen);
}

async function toggleScreenOrientation() {
    try {
        if (state.getIsLandscapeLocked()) {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                await screen.orientation.unlock();
            }
            state.setIsLandscapeLocked(false);
        } else {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                await screen.orientation.lock('landscape');
                state.setIsLandscapeLocked(true);
            }
        }
    } catch (error) {
        console.warn('Could not change screen orientation.', error);
        alert('Screen rotation could not be changed. Please check your device settings.');
    }
}

function openFullscreenSettingsPanel() {
    dom.fullscreenSettingsPanel.hidden = false;
}

function closeFullscreenSettingsPanel() {
    dom.fullscreenSettingsPanel.hidden = true;
}

export function openFullscreenTranslation() {
    const targetDiv = document.getElementById('target-text');
    if (!targetDiv) return;

    const htmlContent = targetDiv.innerHTML;
    const textContent = targetDiv.innerText;

    if (!textContent.trim()) return;
    
    const settings = storage.getAppSettings();
    applyFullscreenSettings(settings.fullscreen);

    const wrappedHtml = utils.wrapWordsInSpans(htmlContent);
    dom.fullscreenTextContainer.innerHTML = wrappedHtml;
    
    dom.fullscreenSpeakBtn.dataset.textToSpeak = textContent;
    dom.fullscreenSpeakBtn.hidden = state.getTranslatorTargetLang() !== 'es';
    dom.fullscreenSettingsPanel.hidden = true;

    dom.fullscreenOverlay.hidden = false;
    document.body.classList.add('fullscreen-active');
    state.setIsLandscapeLocked(false);
}

function closeFullscreenTranslation() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    dom.fullscreenOverlay.hidden = true;
    document.body.classList.remove('fullscreen-active');

    if (state.getIsLandscapeLocked() && screen.orientation && typeof screen.orientation.unlock === 'function') {
        screen.orientation.unlock();
    }
    state.setIsLandscapeLocked(false);
}

// --- EVENT LISTENERS ---

export function addFullscreenEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        if (target.closest('#fs-settings-close-btn')) {
            closeFullscreenSettingsPanel();
            return;
        }
        
        if (!dom.fullscreenOverlay.hidden && !dom.fullscreenSettingsPanel.hidden) {
            if (!target.closest('#fullscreen-settings-btn') && !target.closest('#fullscreen-settings-panel')) {
                closeFullscreenSettingsPanel();
                return;
            }
        }

        if (target.closest('#fullscreen-close-btn')) {
            closeFullscreenTranslation();
            return;
        }
        if (target.closest('#fullscreen-settings-btn')) {
            if (dom.fullscreenSettingsPanel.hidden) {
                openFullscreenSettingsPanel();
            } else {
                closeFullscreenSettingsPanel();
            }
            return;
        }
        const fullscreenSpeakBtn = target.closest('#fullscreen-speak-btn');
        if (fullscreenSpeakBtn) {
            const button = fullscreenSpeakBtn as HTMLButtonElement;
            const textContainer = dom.fullscreenTextContainer;
            if (textContainer) {
                utils.speakText("", state.getTranslatorTargetLang(), button, textContainer);
            }
            return;
        }
        const themeBtn = target.closest('.fs-theme-btn');
        if (themeBtn) {
            const theme = (themeBtn as HTMLElement).dataset.theme;
            if (theme) updateFullscreenSetting('theme', theme);
            return;
        }
        if (target.closest('#fs-font-size-decrease-btn')) {
            updateFullscreenSetting('fontSize', state.getCurrentFontSize() - 2);
            return;
        }
        if (target.closest('#fs-font-size-increase-btn')) {
            updateFullscreenSetting('fontSize', state.getCurrentFontSize() + 2);
            return;
        }
        if (target.closest('#fs-rotate-screen-btn')) {
            toggleScreenOrientation();
            return;
        }
    });

    document.body.addEventListener('input', (e) => {
        const target = e.target as HTMLElement;
        if (target.id === 'fs-font-size-slider') {
            const size = parseInt((target as HTMLInputElement).value, 10);
            updateFullscreenSetting('fontSize', size);
        }
    });
}