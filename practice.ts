/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';

// --- RENDER FUNCTIONS ---

export function renderPracticeView() {
    const container = document.getElementById('results-container');
    if (!container) return;

    // Hide the main form just in case
    dom.form.hidden = true;
    
    // Render Iframe
    container.innerHTML = `
        <div class="practice-iframe-container">
            <iframe 
                src="https://quiz-avma.vercel.app/" 
                class="practice-iframe"
                title="Quiz"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                loading="lazy">
            </iframe>
        </div>
    `;
}

export function addPracticeDelegatedEventListeners() {
    // No event listeners needed for the iframe
}