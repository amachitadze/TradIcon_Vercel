/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as storage from './storage.js';
import * as utils from './utils.js';
import * as state from './state.js';
import { translations } from './constants.js';

const USER_DATA_KEYS = [
    'favoriteVerbs', 'recentVerbs', 'favoriteWords', 'recentWords',
    'translationHistory', 'favoriteTranslations', 'practiceHistory', 'userLanguage',
    'chatPersonas', 'chatHistories'
];

/**
 * Gathers all user data from localStorage and triggers a download.
 */
export function exportUserData() {
    const userData: { [key: string]: any } = {};
    USER_DATA_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                userData[key] = JSON.parse(data);
            } catch (e) {
                // If it's not JSON, it might be a simple string like userLanguage
                userData[key] = data;
            }
        }
    });

    const jsonString = JSON.stringify(userData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `tradicon_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Opens a file picker and imports user data from a selected JSON file.
 * @param mode 'replace' will overwrite all data, 'merge' will combine it.
 */
export function importUserData(mode: 'replace' | 'merge') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result as string;
                const importedData = JSON.parse(result);

                // Basic validation: Check if at least one of our expected keys exists.
                const hasRequiredKeys = USER_DATA_KEYS.some(key => key in importedData);
                if (typeof importedData !== 'object' || importedData === null || !hasRequiredKeys) {
                    throw new Error('Invalid file format.');
                }
                
                const t = translations[state.getCurrentLanguage()];
                
                const onConfirm = () => {
                     if (mode === 'replace') {
                        USER_DATA_KEYS.forEach(key => localStorage.removeItem(key)); // Clear existing data
                        Object.keys(importedData).forEach(key => {
                            if (USER_DATA_KEYS.includes(key)) {
                                const valueToStore = typeof importedData[key] === 'string' ? importedData[key] : JSON.stringify(importedData[key]);
                                localStorage.setItem(key, valueToStore);
                            }
                        });
                        utils.showAlertModal(t.importSuccessTitle, t.importSuccessBody);
                    } else { // mode === 'merge'
                        // String arrays
                        ['favoriteVerbs', 'recentVerbs', 'favoriteWords', 'recentWords'].forEach(key => {
                            const existing = storage.getFromStorage<string[]>(key, []);
                            const incoming = (importedData[key] || []) as string[];
                            storage.saveToStorage(key, [...new Set([...incoming, ...existing])]);
                        });

                        // Object arrays with timestamp
                        const mergeObjectArrays = (key: 'translationHistory' | 'favoriteTranslations' | 'practiceHistory') => {
                            const existing = storage.getFromStorage<any[]>(key, []);
                            const incoming = (importedData[key] || []) as any[];
                            if (!Array.isArray(existing) || !Array.isArray(incoming)) return;

                            const existingTimestamps = new Set(existing.map(i => i.timestamp));
                            const newItems = incoming.filter(i => i.timestamp && !existingTimestamps.has(i.timestamp));
                            const merged = [...newItems, ...existing].sort((a,b) => b.timestamp - a.timestamp);
                            storage.saveToStorage(key, merged);
                        }
                        mergeObjectArrays('translationHistory');
                        mergeObjectArrays('favoriteTranslations');
                        mergeObjectArrays('practiceHistory');

                        // userLanguage
                        if (importedData.userLanguage) {
                            storage.saveToStorage('userLanguage', importedData.userLanguage);
                        }
                        utils.showAlertModal(t.importMergeSuccessTitle, t.importMergeSuccessBody);
                    }

                    // Reload after user clicks OK on the success alert
                    const okBtn = document.getElementById('alert-modal-close-btn');
                    if (okBtn) {
                        okBtn.addEventListener('click', () => window.location.reload(), { once: true });
                    }
                };
                
                const confirmBody = mode === 'replace' ? t.importConfirmBody : t.importMergeDesc;

                utils.showConfirmModal(
                    t.importConfirmTitle,
                    confirmBody,
                    t.yesButton,
                    t.noButton,
                    onConfirm
                );

            } catch (error) {
                console.error("Import error:", error);
                const t = translations[state.getCurrentLanguage()];
                utils.showAlertModal(t.importErrorTitle, t.importErrorBody);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}