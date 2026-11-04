/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { TranslationItem, PracticeHistoryItem, Persona, ChatMessage } from './types.js';
import { translations } from './constants.js';
import * as state from './state.js';

const MAX_RECENTS = 12;

// --- Generic Storage Helpers ---
export function getFromStorage<T>(key: string, fallback: T): T {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return fallback;
    }
}

export function saveToStorage(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
}

// --- App-wide Settings (including fullscreen) ---
const DEFAULT_APP_SETTINGS = {
    fullscreen: {
        fontSize: 32,
        theme: 'light', // 'light', 'dark', 'sepia'
    }
};

export function getAppSettings() {
    const settings = getFromStorage('appSettings', DEFAULT_APP_SETTINGS);
    // Merge with defaults to ensure all keys are present
    return { ...DEFAULT_APP_SETTINGS, ...settings };
}

export function saveAppSettings(newSettings: any) {
    saveToStorage('appSettings', newSettings);
}


// --- Conjugator Specific Storage ---
export function getFavoriteVerbs(): string[] { return getFromStorage('favoriteVerbs', []); }
export function isFavoriteVerb(verb: string): boolean { return getFavoriteVerbs().includes(verb.toLowerCase()); }
export function toggleFavoriteVerb(verb: string) {
    verb = verb.toLowerCase();
    const favorites = getFavoriteVerbs();
    const index = favorites.indexOf(verb);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.unshift(verb);
    }
    saveToStorage('favoriteVerbs', favorites);
}
export function getRecentVerbs(): string[] { return getFromStorage('recentVerbs', []); }
export function addRecentVerb(verb: string) {
    verb = verb.toLowerCase();
    let recents = getRecentVerbs();
    recents = recents.filter(v => v !== verb);
    recents.unshift(verb);
    if (recents.length > MAX_RECENTS) recents.pop();
    saveToStorage('recentVerbs', recents);
}

// --- Dictionary Specific Storage ---
export function getFavoriteWords(): string[] { return getFromStorage('favoriteWords', []); }
export function isFavoriteWord(word: string): boolean { return getFavoriteWords().includes(word.toLowerCase()); }
export function toggleFavoriteWord(word: string) {
    word = word.toLowerCase();
    const favorites = getFavoriteWords();
    const index = favorites.indexOf(word);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.unshift(word);
    }
    saveToStorage('favoriteWords', favorites);
}
export function getRecentWords(): string[] { return getFromStorage('recentWords', []); }
export function addRecentWord(word: string) {
    word = word.toLowerCase();
    let recents = getRecentWords();
    recents = recents.filter(w => w !== word);
    recents.unshift(word);
    if (recents.length > MAX_RECENTS) recents.pop();
    saveToStorage('recentWords', recents);
}

// --- Translation History & Favorites Storage ---
export function getTranslationHistory(): TranslationItem[] { return getFromStorage('translationHistory', []); }
function saveTranslationHistory(history: TranslationItem[]) { saveToStorage('translationHistory', history); }
export function addTranslationToHistory(item: Omit<TranslationItem, 'timestamp'>): TranslationItem {
    const history = getTranslationHistory();
    const newEntry: TranslationItem = { ...item, timestamp: Date.now() };
    history.unshift(newEntry);
    if (history.length > 50) history.pop(); // Limit history size
    saveTranslationHistory(history);
    return newEntry;
}

export function clearTranslationHistoryData() {
    saveTranslationHistory([]);
}

export function getFavoriteTranslations(): TranslationItem[] { return getFromStorage('favoriteTranslations', []); }
function saveFavoriteTranslations(favorites: TranslationItem[]) { saveToStorage('favoriteTranslations', favorites); }
export function isFavoriteTranslation(itemToFind: TranslationItem): boolean {
    const favorites = getFavoriteTranslations();
    return favorites.some(fav => fav.timestamp === itemToFind.timestamp);
}
export function toggleFavoriteTranslation(itemToToggle: TranslationItem) {
    let favorites = getFavoriteTranslations();
    const index = favorites.findIndex(fav => fav.timestamp === itemToToggle.timestamp);
    if (index > -1) {
        favorites.splice(index, 1); // Unfavorite
    } else {
        favorites.unshift(itemToToggle); // Favorite
    }
    saveFavoriteTranslations(favorites);
}

// --- Practice History Storage ---
export function getPracticeHistory(): PracticeHistoryItem[] { return getFromStorage('practiceHistory', []); }
export function addPracticeResultToHistory(result: PracticeHistoryItem) {
    const history = getPracticeHistory();
    history.unshift(result);
    if (history.length > 20) history.pop(); // Keep last 20 sessions
    saveToStorage('practiceHistory', history);
}

// --- Chat Storage ---
export function getChatPersonas(): Persona[] {
    const personas = getFromStorage<Persona[]>('chatPersonas', []);
    return personas.sort((a, b) => b.timestamp - a.timestamp);
}
export function saveChatPersonas(personas: Persona[]) {
    saveToStorage('chatPersonas', personas);
}
export function getChatHistories(): { [key: string]: ChatMessage[] } {
    return getFromStorage<{ [key: string]: ChatMessage[] }>('chatHistories', {});
}
export function saveChatHistories(histories: { [key: string]: ChatMessage[] }) {
    saveToStorage('chatHistories', histories);
}