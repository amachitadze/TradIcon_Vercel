/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import { translations } from './constants.js';

export function renderGuidelinesView() {
    const t = translations[state.getCurrentLanguage()];
    const currentLang = state.getCurrentLanguage();

    const colors = [
        { name: 'Background', var: '--background-color', hex: '#F7F7FF' },
        { name: 'Surface', var: '--surface-color', hex: '#FFFFFF' },
        { name: 'Primary', var: '--primary-color', hex: '#1d0ee2' },
        { name: 'Accent', var: '--accent-color', hex: '#ffd902' },
        { name: 'Text', var: '--text-color', hex: '#212529' },
        { name: 'Border', var: '--border-color', hex: '#6A63D6' },
        { name: 'Correct', var: '--correct-color', hex: '#0eb93f' },
        { name: 'Error', var: '--error-color', hex: '#FF5656' },
    ];

    const paletteHtml = colors.map(c => `
        <div class="color-swatch">
            <div class="color-swatch-color" style="background-color: ${c.hex};"></div>
            <div class="color-swatch-info">
                <strong>${c.name}</strong>
                <code>${c.var}</code><br>
                <span>${c.hex}</span>
            </div>
        </div>
    `).join('');
    
    const content = currentLang === 'ka' ? `
        <section class="guidelines-section">
            <h2>ფერთა პალიტრა</h2>
            <p>ფერთა პალიტრა შექმნილია იმისთვის, რომ იყოს თანამედროვე, ხელმისაწვდომი და Google-ის ბრენდინგთან შესაბამისობაში.</p>
            <p>დამატებითი ინფორმაცია ფერების გამოყენების შესახებ იხილეთ აქ: <a href="https://drive.google.com/file/d/1jtkRErzgXtISNNKsf_qYRv3MAeI3e-mZ/view?usp=drive_link" target="_blank" rel="noopener noreferrer">ფერთა გამოყენების სახელმძღვანელო</a>.</p>
            <div class="color-palette">${paletteHtml}</div>
        </section>
        <section class="guidelines-section">
            <h2>ტიპოგრაფია</h2>
            <p>მთავარი შრიფტია <strong>Inter</strong>, სუფთა და კითხვადი sans-serif შრიფტი Google Fonts-იდან. საბაზისო შრიფტის ზომაა <code>16px</code>.</p>
            <h1>სათაური H1</h1>
            <h2>სათაური H2</h2>
            <h3>სათაური H3</h3>
            <p>ეს არის ჩვეულებრივი ტექსტის პარაგრაფი, ძირითადი ტექსტის სტილის საჩვენებლად.</p>
        </section>
        <section class="guidelines-section">
            <h2>დიზაინის სისტემა</h2>
            <p>ინტერფეისის ელემენტები იყენებენ ერთიან დიზაინ სისტემას, რათა უზრუნველყონ თანმიმდევრული მომხმარებლის გამოცდილება.</p>
            <ul>
                <li><strong>საზღვრის რადიუსი:</strong> ელემენტების უმეტესობისთვის, როგორიცაა ღილაკები, ბარათები და ველები, გამოიყენება <code>12px</code>-იანი რადიუსი (<code>--border-radius</code>).</li>
                <li><strong>ჩრდილი:</strong> ინტერაქტიულ ელემენტებზე სიღრმის ეფექტისთვის გამოიყენება მსუბუქი ჩრდილი (<code>--box-shadow</code>).</li>
                <li><strong>დაშორებები:</strong> დაშორებები დაფუძნებულია ფარდობით ერთეულებზე (<code>rem</code>), რაც უზრუნველყოფს მასშტაბურობასა და საპასუხო დიზაინს.</li>
            </ul>
        </section>
        <section class="guidelines-section">
            <h2>აპლიკაციის სტრუქტურა</h2>
            <p>აპლიკაცია აგებულია როგორც Single Page Application (SPA) TypeScript-ის და მოდულური ხედების სისტემის გამოყენებით.</p>
            <ul>
                <li><code>index.html</code>: მთავარი შესვლის წერტილი.</li>
                <li><code>index.tsx</code>: აპლიკაციის კონფიგურაცია, მთავარი ივენთების დაკავშირება და მდგომარეობის ინიციალიზაცია.</li>
                <li><code>ui.ts</code>: მართავს სხვადასხვა ხედების რენდერინგს და ინტერფეისის განახლებებს.</li>
                <li><code>state.ts</code>: ინახავს აპლიკაციის გლობალურ მდგომარეობას (მიმდინარე ხედი, ენა და ა.შ.).</li>
                <li><code>gemini.ts</code>: შეიცავს Google Gemini API-სთან კომუნიკაციის მთელ ლოგიკას.</li>
                <li><code>storage.ts</code>: ამუშავებს მონაცემთა შენახვას ბრაუზერის <code>localStorage</code>-ში (ფავორიტები, ისტორია და ა.შ.).</li>
                <li><code>views/</code>: თითოეულ მთავარ ხედს (Conjugator, Dictionary, Translator) აქვს საკუთარი ფაილი რენდერინგის ლოგიკისა და სპეციფიკური ივენთების სამართავად.</li>
            </ul>
        </section>
        <section class="guidelines-section">
            <h2>შინაარსის დამატება</h2>
            <p>აპლიკაციის პრაქტიკული სავარჯიშოების ბაზის გაფართოება შესაძლებელია ახალი კითხვების დამატებით.</p>
            <ul>
                <li><strong>პრაქტიკის კითხვები:</strong> ინსტრუქციები, თუ როგორ უნდა შეიქმნას და დაემატოს ახალი კითხვები პრაქტიკის სექციისთვის, იხილეთ დოკუმენტში: <a href="https://drive.google.com/file/d/1ISqYC8Q2FOF7TQAjGNB0W1wSTXFwwB3P/view?usp=drive_link" target="_blank" rel="noopener noreferrer">პრაქტიკის კითხვების შექმნის სახელმძღვანელო</a>.</li>
            </ul>
        </section>
    ` : `
        <section class="guidelines-section">
            <h2>Color Palette</h2>
            <p>The color palette is designed to be modern, accessible, and consistent with Google's branding.</p>
            <p>For more information on color usage, see the <a href="https://drive.google.com/file/d/1jtkRErzgXtISNNKsf_qYRv3MAeI3e-mZ/view?usp=drive_link" target="_blank" rel="noopener noreferrer">Color Usage Guide</a>.</p>
            <div class="color-palette">${paletteHtml}</div>
        </section>
        <section class="guidelines-section">
            <h2>Typography</h2>
            <p>The primary font is <strong>Inter</strong>, a clean and readable sans-serif typeface sourced from Google Fonts. The base font size is <code>16px</code>.</p>
            <h1>Heading H1</h1>
            <h2>Heading H2</h2>
            <h3>Heading H3</h3>
            <p>This is a paragraph of normal text to demonstrate the body copy.</p>
        </section>
        <section class="guidelines-section">
            <h2>Design System</h2>
            <p>UI elements follow a consistent design system to ensure a cohesive user experience.</p>
            <ul>
                <li><strong>Border Radius:</strong> A consistent border radius of <code>12px</code> (<code>--border-radius</code>) is used for most elements like buttons, cards, and inputs.</li>
                <li><strong>Box Shadow:</strong> A subtle shadow (<code>--box-shadow</code>) is applied to give depth to interactive elements.</li>
                <li><strong>Spacing:</strong> Spacing is based on relative units (<code>rem</code>) to ensure scalability and responsiveness.</li>
            </ul>
        </section>
        <section class="guidelines-section">
            <h2>Application Structure</h2>
            <p>The application is built as a Single Page Application (SPA) using TypeScript and a modular view system.</p>
            <ul>
                <li><code>index.html</code>: The main entry point.</li>
                <li><code>index.tsx</code>: Sets up the application, binds main events, and initializes state.</li>
                <li><code>ui.ts</code>: Manages the rendering of different views and UI updates.</li>
                <li><code>state.ts</code>: Holds the global application state (current view, language, etc.).</li>
                <li><code>gemini.ts</code>: Encapsulates all logic for communicating with the Google Gemini API.</li>
                <li><code>storage.ts</code>: Handles storing data in the browser's <code>localStorage</code> (favorites, history, etc.).</li>
                <li><code>views/</code>: Each main view (Conjugator, Dictionary, Translator) has its own file for rendering logic and specific event handlers.</li>
            </ul>
        </section>
        <section class="guidelines-section">
            <h2>Content Management</h2>
            <p>The application's practice exercise base can be expanded by adding new questions.</p>
            <ul>
                <li><strong>Practice Questions:</strong> Instructions on how to create and add new questions for the practice section can be found in the following document: <a href="https://drive.google.com/file/d/1ISqYC8Q2FOF7TQAjGNB0W1wSTXFwwB3P/view?usp=drive_link" target="_blank" rel="noopener noreferrer">Guide for Creating Practice Questions</a>.</li>
            </ul>
        </section>
    `;

    dom.form.hidden = true;
    dom.resultsContainer.innerHTML = `
        <div class="history-container">
            <div class="history-header">
                <button id="back-to-about-btn" class="back-btn" title="${t.back}">←</button>
                <h2>${t.guidelinesHeaderTitle}</h2>
                <div style="width: 40px;"></div>
            </div>
            <div class="guidelines-content about-content">
                ${content}
            </div>
        </div>
    `;
}
