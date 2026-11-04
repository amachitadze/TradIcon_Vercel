/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as storage from './storage.js';

const RPM_LIMIT = 60; // Requests Per Minute limit for Gemini free tier
const STORAGE_KEY = 'apiUsageTracker';

interface UsageData {
    count: number;
    resetTime: number; // Timestamp when the count should reset
}

/**
 * Increments the API request count for the current minute.
 * Resets the count if the minute has passed.
 */
export function incrementRequestCount() {
    let data = storage.getFromStorage<UsageData>(STORAGE_KEY, { count: 0, resetTime: 0 });
    const now = Date.now();

    if (now > data.resetTime) {
        // The minute has passed, reset the counter.
        data = {
            count: 1,
            resetTime: now + 60000 // Set reset time to 60 seconds from now
        };
    } else {
        // Still within the same minute, just increment.
        data.count++;
    }

    storage.saveToStorage(STORAGE_KEY, data);

    // Dispatch a custom event to notify the UI of the change
    document.dispatchEvent(new CustomEvent('apiUsageChanged'));
}

/**
 * Gets the current API usage count and the limit for the minute.
 * @returns An object with the current count and the RPM limit.
 */
export function getCurrentUsage(): { count: number; limit: number } {
    const data = storage.getFromStorage<UsageData>(STORAGE_KEY, { count: 0, resetTime: 0 });
    const now = Date.now();

    if (now > data.resetTime) {
        // If the time has already passed, the current count is effectively 0.
        return { count: 0, limit: RPM_LIMIT };
    }

    return { count: data.count, limit: RPM_LIMIT };
}


// --- Daily Chat Usage Tracker ---

export const DAILY_CHAT_LIMIT = 12;
const DAILY_CHAT_STORAGE_KEY = 'dailyChatUsage';

interface DailyChatUsage {
    count: number;
    date: string; // YYYY-MM-DD format
}

function getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Gets the current daily chat usage. Resets if the date has changed.
 */
function getDailyChatUsage(): DailyChatUsage {
    const todayStr = getTodayDateString();
    const data = storage.getFromStorage<DailyChatUsage>(DAILY_CHAT_STORAGE_KEY, { count: 0, date: '' });

    if (data.date !== todayStr) {
        // New day, reset the counter
        return { count: 0, date: todayStr };
    }

    return data;
}

/**
 * Increments the daily chat message count.
 */
export function incrementDailyChatCount() {
    const data = getDailyChatUsage(); // This correctly gets or resets the data for today
    data.count++;
    storage.saveToStorage(DAILY_CHAT_STORAGE_KEY, data);
}

/**
 * Checks if the daily chat limit has been reached.
 */
export function isChatLimitReached(): boolean {
    const data = getDailyChatUsage();
    return data.count >= DAILY_CHAT_LIMIT;
}