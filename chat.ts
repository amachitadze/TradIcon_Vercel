/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as dom from './dom.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gemini from './gemini.js';
import * as utils from './utils.js';
import * as usageTracker from './usage-tracker.js';
import { translations, SOUND_ON_ICON_SVG, SPEAKER_SIMPLE_ICON_SVG, AVATAR_ICONS, MIC_ICON_SVG } from './constants.js';
import { ChatMessage, Persona } from './types.js';
import { LiveServerMessage } from '@google/genai';

// --- RENDER FUNCTIONS ---

export function initializeChatState() {
    const personas = storage.getChatPersonas();
    state.setChatPersonas(personas);
    const activePersonaId = state.getActivePersonaId();

    // If there's an active persona, load its history. Otherwise, clear it.
    if (activePersonaId && personas.some(p => p.id === activePersonaId)) {
        const histories = storage.getChatHistories();
        state.setActiveChatHistory(histories[activePersonaId] || []);
    } else {
        // If no active persona or active one was deleted, select the latest one
        if (personas.length > 0) {
            const latestPersona = personas.sort((a,b) => b.timestamp - a.timestamp)[0];
            state.setActivePersonaId(latestPersona.id);
            const histories = storage.getChatHistories();
            state.setActiveChatHistory(histories[latestPersona.id] || []);
        } else {
            state.setActivePersonaId(null);
            state.setActiveChatHistory([]);
        }
    }
}

function renderPersonaList() {
    const t = translations[state.getCurrentLanguage()];
    const personas = storage.getChatPersonas();
    const activePersonaId = state.getActivePersonaId();

    const listItems = personas.map(p => `
        <li class="persona-item ${p.id === activePersonaId ? 'active' : ''}" data-persona-id="${p.id}" role="button" tabindex="0">
            <div class="persona-avatar">${AVATAR_ICONS[p.avatar] || AVATAR_ICONS['default']}</div>
            <div class="persona-info">
                <div class="persona-name">${utils.escapeHtml(p.name)}</div>
            </div>
            <div class="persona-item-controls">
                <button class="persona-control-btn edit-persona-btn" title="Edit Persona">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                </button>
                 <button class="persona-control-btn delete-persona-btn" title="Delete Persona">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                </button>
            </div>
        </li>
    `).join('');

    return `
        <div class="chat-sidebar-header">
            <button id="new-persona-btn" class="main-action-btn" style="width: 100%;">${t.chatTab}</button>
        </div>
        <ul class="persona-list">${listItems}</ul>
    `;
}

function renderChatInterface() {
    const t = translations[state.getCurrentLanguage()];
    const activePersonaId = state.getActivePersonaId();
    if (!activePersonaId) {
        return `<div class="chat-placeholder"><p>← Select a persona to start chatting</p></div>`;
    }

    const activePersona = state.getChatPersonas().find(p => p.id === activePersonaId);
    if (!activePersona) {
        return `<div class="chat-placeholder"><p>Error: Persona not found.</p></div>`;
    }
    
    const isChatAutoSpeakEnabled = state.getIsChatAutoSpeakEnabled();
    const autoSpeakBtnHTML = `
        <button id="chat-auto-speak-toggle" class="practice-header-btn ${isChatAutoSpeakEnabled ? 'active' : ''}" title="${t.toggleSound}">
            ${isChatAutoSpeakEnabled ? SOUND_ON_ICON_SVG : SPEAKER_SIMPLE_ICON_SVG}
        </button>
    `;

    const clearChatHistoryBtnHTML = `
        <button id="clear-chat-history-btn" class="practice-header-btn" title="${t.clearChatHistory}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
        </button>
    `;

    return `
        <div class="chat-header">
            <div class="chat-header-left-group">
                <button class="practice-header-btn chat-back-btn" title="${t.back}">←</button>
                <div class="chat-header-persona">
                    <div class="persona-avatar">${AVATAR_ICONS[activePersona.avatar] || AVATAR_ICONS['default']}</div>
                    <span>${utils.escapeHtml(activePersona.name)}</span>
                </div>
            </div>
            <div class="chat-header-right-controls">
                ${autoSpeakBtnHTML}
                ${clearChatHistoryBtnHTML}
            </div>
        </div>
        <div id="chat-messages" class="chat-messages">
            <!-- Messages will be rendered here -->
        </div>
        <form id="chat-input-form-text" class="chat-input-form">
            <textarea id="chat-input" placeholder="${t.chatInputPlaceholder}" rows="1" ${state.getIsLiveChatActive() ? 'disabled' : ''}></textarea>
            <button id="chat-action-btn" type="button" title="${t.startLiveChat}">
               ${MIC_ICON_SVG}
            </button>
        </form>
        <p id="chat-status-text"></p>
    `;
}

function renderChatMessage(msg: ChatMessage) {
    const t = translations[state.getCurrentLanguage()];
    const textContent = utils.escapeHtml(msg.text).replace(/\n/g, '<br>');
    const originalTextContent = msg.originalText ? `<small class="original-text">${utils.escapeHtml(msg.originalText).replace(/\n/g, '<br>')}</small>` : '';

    return `
        <div class="message-bubble ${msg.role}-message" data-role="${msg.role}">
            <div class="message-content">
                ${textContent}
                ${originalTextContent}
            </div>
            <button class="message-speak-btn" title="${t.speak}" data-text="${utils.escapeHtml(msg.text)}">
                 ${SPEAKER_SIMPLE_ICON_SVG}
            </button>
        </div>`;
}

export function updateChatMessagesUI() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = state.getActiveChatHistory().map(renderChatMessage).join('');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function renderPersonaModal(personaToEdit?: Persona) {
    const t = translations[state.getCurrentLanguage()];
    const isEditing = !!personaToEdit;
    const modalTitle = isEditing ? "Edit Persona" : "Create New Persona";

    const avatarOptions = Object.keys(AVATAR_ICONS).map(key => `
        <button class="persona-avatar-option ${personaToEdit?.avatar === key ? 'selected' : ''}" data-avatar="${key}" type="button">
            ${AVATAR_ICONS[key]}
        </button>
    `).join('');

    const modalHtml = `
      <div id="persona-modal" class="modal-overlay">
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="persona-modal-title">
          <button class="modal-close" aria-label="Cerrar">&times;</button>
          <h2 id="persona-modal-title">${modalTitle}</h2>
          <form id="persona-form">
            <div class="persona-modal-grid">
              <div class="persona-modal-form-group">
                <label for="persona-name-input">Persona Name</label>
                <input type="text" id="persona-name-input" required value="${utils.escapeHtml(personaToEdit?.name || '')}">
              </div>
              <div class="persona-modal-form-group">
                <label>Avatar</label>
                <div id="persona-avatar-selection" class="persona-avatar-selection">
                    ${avatarOptions}
                </div>
              </div>
              <div class="persona-modal-form-group">
                <label for="persona-prompt-input">Description / Prompt</label>
                <textarea id="persona-prompt-input" rows="5" required placeholder="${t.chatPersonaPlaceholder}">${utils.escapeHtml(personaToEdit?.prompt || '')}</textarea>
              </div>
              <div class="persona-modal-buttons">
                <button type="button" class="pwa-install-btn pwa-install-btn--decline" id="persona-modal-cancel-btn">Cancel</button>
                <button type="submit" class="pwa-install-btn pwa-install-btn--confirm">Save</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners for the new modal
    const modalEl = document.getElementById('persona-modal');
    modalEl?.querySelector('.modal-close')?.addEventListener('click', () => modalEl.remove());
    modalEl?.querySelector('#persona-modal-cancel-btn')?.addEventListener('click', () => modalEl.remove());
    modalEl?.querySelector('#persona-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSavePersona(personaToEdit?.id);
        modalEl.remove();
    });
    modalEl?.querySelector('#persona-avatar-selection')?.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const button = target.closest('.persona-avatar-option');
        if (button) {
            modalEl.querySelectorAll('.persona-avatar-option.selected').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
    });
}


export function renderChatView() {
    const t = translations[state.getCurrentLanguage()];
    dom.form.hidden = true;
    state.setChatPersonas(storage.getChatPersonas());

    if (state.getChatPersonas().length === 0) {
        dom.resultsContainer.innerHTML = `
            <div class="chat-container">
                <div class="chat-welcome-screen">
                    <h2>${t.chatPersonaTitle}</h2>
                    <p>${t.chatPersonaDescription}</p>
                    <button id="new-persona-btn" class="main-action-btn">${t.startChatButton}</button>
                </div>
            </div>
        `;
    } else {
        const isMobile = window.innerWidth <= 768;
        const gridClass = isMobile ? 'show-sidebar' : '';

        dom.resultsContainer.innerHTML = `
            <div id="chat-grid-container" class="chat-container chat-grid-container ${gridClass}">
                <aside class="chat-sidebar">${renderPersonaList()}</aside>
                <main class="chat-main-window">${renderChatInterface()}</main>
            </div>
        `;
        if (state.getActivePersonaId()) {
            updateChatMessagesUI();
            configureChatInputArea();
            updateChatInputState();
        }
    }
}

// --- HANDLER FUNCTIONS ---

function updateChatInputState() {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const chatActionBtn = document.getElementById('chat-action-btn') as HTMLButtonElement;
    const statusText = document.getElementById('chat-status-text') as HTMLParagraphElement;
    if (!chatInput || !chatActionBtn || !statusText) return;

    const t = translations[state.getCurrentLanguage()];

    // Check for daily limit first
    if (usageTracker.isChatLimitReached()) {
        chatInput.disabled = true;
        chatActionBtn.disabled = true;
        chatInput.placeholder = t.chatLimitReached;
        statusText.textContent = t.chatLimitResets;
        chatActionBtn.style.backgroundColor = '#b0b0b0';
        chatActionBtn.style.cursor = 'not-allowed';
        chatActionBtn.innerHTML = MIC_ICON_SVG;
        return;
    }

    // Normal state
    chatInput.disabled = state.getIsLiveChatActive();
    chatActionBtn.disabled = false;
    chatActionBtn.style.backgroundColor = '';
    chatActionBtn.style.cursor = 'pointer';
    chatInput.placeholder = t.chatInputPlaceholder;
    statusText.textContent = '';
    updateChatActionButton();
}


function updateChatActionButton() {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const chatActionBtn = document.getElementById('chat-action-btn') as HTMLButtonElement;
    if (!chatInput || !chatActionBtn || state.getIsLiveChatActive()) return;

    const t = translations[state.getCurrentLanguage()];
    const sendSVG = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>`;

    if (chatInput.value.trim().length > 0) {
        chatActionBtn.innerHTML = sendSVG;
        chatActionBtn.type = 'submit';
        chatActionBtn.title = 'Send';
        chatActionBtn.disabled = false;
    } else {
        chatActionBtn.innerHTML = MIC_ICON_SVG;
        chatActionBtn.type = 'button';
        chatActionBtn.title = t.startLiveChat;
        chatActionBtn.disabled = false;
    }
}

function configureChatInputArea() {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (!chatInput) return;

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = `${chatInput.scrollHeight}px`;
        updateChatActionButton();
    });

    chatInput.addEventListener('keydown', (e) => {
        const chatActionBtn = document.getElementById('chat-action-btn') as HTMLButtonElement;
        if (e.key === 'Enter' && !e.shiftKey && chatActionBtn?.type === 'submit') {
            e.preventDefault();
            document.getElementById('chat-input-form-text')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    });
    
    updateChatActionButton();
}


function handlePersonaSelect(personaId: string) {
    state.setActivePersonaId(personaId);

    // Update active class on persona list
    document.querySelectorAll('.persona-item.active').forEach(el => el.classList.remove('active'));
    const newActiveItem = document.querySelector(`.persona-item[data-persona-id="${personaId}"]`);
    newActiveItem?.classList.add('active');

    const histories = storage.getChatHistories();
    state.setActiveChatHistory(histories[personaId] || []);
    
    const mainWindow = document.querySelector('.chat-main-window');
    if (mainWindow) {
        mainWindow.innerHTML = renderChatInterface();
        updateChatMessagesUI();
        configureChatInputArea();
        updateChatInputState();
    }

    // Mobile view: switch to chat window
    const grid = document.getElementById('chat-grid-container');
    grid?.classList.remove('show-sidebar');
}


function handleSavePersona(personaIdToUpdate?: string) {
    const nameInput = document.getElementById('persona-name-input') as HTMLInputElement;
    const promptInput = document.getElementById('persona-prompt-input') as HTMLTextAreaElement;
    const selectedAvatar = document.querySelector('.persona-avatar-option.selected') as HTMLButtonElement;

    const name = nameInput.value.trim();
    const prompt = promptInput.value.trim();
    const avatar = selectedAvatar?.dataset.avatar || 'default';

    if (!name || !prompt) return;

    let personas = storage.getChatPersonas();
    if (personaIdToUpdate) {
        // Update existing
        const index = personas.findIndex(p => p.id === personaIdToUpdate);
        if (index > -1) {
            personas[index] = { ...personas[index], name, prompt, avatar, timestamp: Date.now() };
        }
    } else {
        // Create new
        const newPersona: Persona = {
            id: `persona_${Date.now()}`,
            name,
            prompt,
            avatar,
            timestamp: Date.now(),
        };
        personas.push(newPersona);
        state.setActivePersonaId(newPersona.id); // Select the new one
        state.setActiveChatHistory([]);
    }

    storage.saveChatPersonas(personas);
    renderChatView();
}


function handleDeletePersona(personaIdToDelete: string) {
    const t = translations[state.getCurrentLanguage()];
    utils.showConfirmModal(
        t.confirmDeletePersonaTitle,
        t.confirmDeletePersonaBody,
        t.yesButton,
        t.noButton,
        () => {
            let personas = storage.getChatPersonas();
            storage.saveChatPersonas(personas.filter(p => p.id !== personaIdToDelete));

            let histories = storage.getChatHistories();
            delete histories[personaIdToDelete];
            storage.saveChatHistories(histories);

            if (state.getActivePersonaId() === personaIdToDelete) {
                state.setActivePersonaId(null);
                state.setActiveChatHistory([]);
            }
            
            renderChatView();
        }
    );
}


async function sendChatMessage() {
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    const actionBtn = document.getElementById('chat-action-btn') as HTMLButtonElement;
    const messagesContainer = document.getElementById('chat-messages') as HTMLDivElement;
    const activePersona = state.getChatPersonas().find(p => p.id === state.getActivePersonaId());
    
    if (!input || !actionBtn || !messagesContainer || !activePersona) return;
    
    if (usageTracker.isChatLimitReached()) {
        console.warn("Chat limit reached. Cannot send message.");
        return;
    }

    const message = input.value.trim();
    if (!message || actionBtn.disabled) return;
    
    input.value = '';
    input.style.height = 'auto';
    actionBtn.disabled = true;
    updateChatActionButton();

    usageTracker.incrementDailyChatCount();
    updateChatInputState(); // Update UI immediately, might disable if limit reached

    let textToSend: string;
    let userMessage: ChatMessage;

    try {
        const processingResult = await gemini.processUserChatMessage(message);
        textToSend = processingResult.finalText;
        let displayOriginalText = processingResult.originalText || '';
        if (processingResult.isCorrection && processingResult.explanation) {
            displayOriginalText = `${processingResult.originalText}\n${processingResult.explanation}`;
        }
        userMessage = { role: 'user', text: processingResult.finalText, originalText: displayOriginalText || undefined };
    } catch (err) {
        textToSend = message;
        userMessage = { role: 'user', text: message };
    }
    
    state.setActiveChatHistory([...state.getActiveChatHistory(), userMessage]);
    updateChatMessagesUI();

    if (state.getIsChatAutoSpeakEnabled()) {
        utils.speakText(textToSend, 'es', messagesContainer.querySelector('.user-message:last-child .message-speak-btn') as HTMLButtonElement);
    }
    
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message-bubble model-message loading-message';
    loadingEl.innerHTML = '<div class="dot-flashing"></div>';
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const histories = storage.getChatHistories();
    const activePersonaId = state.getActivePersonaId();
    const initialHistory = (activePersonaId && histories[activePersonaId]) ? histories[activePersonaId] : [];
    const chatSession = gemini.startChat(activePersona.prompt, initialHistory);

    try {
        usageTracker.incrementRequestCount();
        const response = await chatSession.sendMessageStream({ message: textToSend });
        loadingEl.remove();

        let responseText = '';
        messagesContainer.insertAdjacentHTML('beforeend', renderChatMessage({role: 'model', text: ''}));
        const lastBubble = messagesContainer.querySelector('.model-message:last-child');
        const contentEl = lastBubble?.querySelector('.message-content');
        const speakBtn = lastBubble?.querySelector('.message-speak-btn');
        
        if (contentEl && speakBtn) {
             for await (const chunk of response) {
                responseText += chunk.text;
                contentEl.innerHTML = utils.escapeHtml(responseText).replace(/\n/g, '<br>');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            (speakBtn as HTMLElement).dataset.text = responseText;
            if (state.getIsChatAutoSpeakEnabled()) {
                utils.speakText(responseText, 'es', speakBtn as HTMLButtonElement);
            }
        }
        
        const finalModelMessage: ChatMessage = { role: 'model', text: responseText };
        state.setActiveChatHistory([...state.getActiveChatHistory(), finalModelMessage]);
        const allHistories = storage.getChatHistories();
        if (activePersonaId) {
            allHistories[activePersonaId] = state.getActiveChatHistory();
            storage.saveChatHistories(allHistories);
        }

    } catch(error) {
        console.error("Chat error:", error);

        // ავტომატური ფოლბექის მცდელობა Groq / OpenRouter / Gemini Lite-ით
        try {
            console.log("ჩატის ფოლბექის გაშვება...");
            const fallbackResponse = await gemini.sendChatMessageFallback(textToSend, activePersona.prompt);
            loadingEl.remove();

            messagesContainer.insertAdjacentHTML('beforeend', renderChatMessage({role: 'model', text: fallbackResponse}));
            const lastBubble = messagesContainer.querySelector('.model-message:last-child');
            const speakBtn = lastBubble?.querySelector('.message-speak-btn');
            if (speakBtn) {
                (speakBtn as HTMLElement).dataset.text = fallbackResponse;
                if (state.getIsChatAutoSpeakEnabled()) {
                    utils.speakText(fallbackResponse, 'es', speakBtn as HTMLButtonElement);
                }
            }

            const finalModelMessage: ChatMessage = { role: 'model', text: fallbackResponse };
            state.setActiveChatHistory([...state.getActiveChatHistory(), finalModelMessage]);
            const allHistories = storage.getChatHistories();
            if (activePersonaId) {
                allHistories[activePersonaId] = state.getActiveChatHistory();
                storage.saveChatHistories(allHistories);
            }
            return;
        } catch (fallbackErr) {
            console.error("ჩატის ფოლბექიც ჩავარდა:", fallbackErr);
        }

        loadingEl.remove();

        const t = translations[state.getCurrentLanguage()];
        const errorString = (error instanceof Error) ? error.message : JSON.stringify(error);
        let displayMessage;

        if (errorString.includes('500') || errorString.includes('UNKNOWN') || errorString.includes('server')) {
            displayMessage = t.errorServer;
        } else {
            displayMessage = t.errorDefault;
        }

        const errorMessage: ChatMessage = { role: 'model', text: displayMessage };
        state.setActiveChatHistory([...state.getActiveChatHistory(), errorMessage]);
        updateChatMessagesUI();
    } finally {
        updateChatInputState();
        if (!usageTracker.isChatLimitReached()) {
            input.focus();
        }
    }
}

export async function stopLiveChat() {
    if (!state.getIsLiveChatActive()) return;

    try {
        const liveSessionPromise = state.getLiveSessionPromise();
        if (liveSessionPromise) {
            const session = await liveSessionPromise;
            session.close();
        }
    } catch (e) {
        console.error("Error closing live session:", e);
    }
    
    const mediaStream = state.getMediaStream();
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }

    const mediaStreamSource = state.getMediaStreamSource();
    if (mediaStreamSource) mediaStreamSource.disconnect();
    
    const scriptProcessor = state.getScriptProcessor();
    if (scriptProcessor) scriptProcessor.disconnect();

    const inputAudioContext = state.getInputAudioContext();
    if (inputAudioContext && inputAudioContext.state !== 'closed') {
        inputAudioContext.close();
    }
    
    const outputAudioContext = state.getOutputAudioContext();
    if (outputAudioContext && outputAudioContext.state !== 'closed') {
        outputAudioContext.close();
    }

    state.setIsLiveChatActive(false);
    state.setLiveSessionPromise(null);
    state.setMediaStream(null);
    state.setMediaStreamSource(null);
    state.setScriptProcessor(null);
    state.setInputAudioContext(null);
    state.setOutputAudioContext(null);
    
    updateChatInputState();
}

async function startLiveChat() {
    if (state.getIsLiveChatActive()) return;

    const t = translations[state.getCurrentLanguage()];
    const activePersona = state.getChatPersonas().find(p => p.id === state.getActivePersonaId());
    if (!activePersona) return;

    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const chatActionBtn = document.getElementById('chat-action-btn') as HTMLButtonElement;
    const statusText = document.getElementById('chat-status-text') as HTMLParagraphElement;

    state.setIsLiveChatActive(true);
    if (chatInput) chatInput.disabled = true;
    if (statusText) statusText.textContent = t.chatStatusConnecting;
    if (chatActionBtn) {
        chatActionBtn.classList.add('is-active');
        chatActionBtn.title = t.stopLiveChat;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.setMediaStream(stream);

        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        state.setInputAudioContext(inputAudioContext);
        state.setOutputAudioContext(outputAudioContext);
        
        state.setNextStartTime(0);
        const sources = new Set<AudioBufferSourceNode>();

        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        const sessionPromise = gemini.connectLiveChat(activePersona.prompt, {
            onopen: () => {
                if (statusText) statusText.textContent = t.chatStatusListening;

                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                state.setMediaStreamSource(source);
                state.setScriptProcessor(scriptProcessor);

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = utils.createBlob(inputData);
                    state.getLiveSessionPromise()?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscription += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                }

                if (message.serverContent?.turnComplete) {
                    const activeChatHistory = state.getActiveChatHistory();
                    if (currentInputTranscription.trim()) {
                        activeChatHistory.push({ role: 'user', text: currentInputTranscription.trim() });
                    }
                    if (currentOutputTranscription.trim()) {
                        activeChatHistory.push({ role: 'model', text: currentOutputTranscription.trim() });
                    }
                    state.setActiveChatHistory(activeChatHistory);
                    updateChatMessagesUI();

                    const allHistories = storage.getChatHistories();
                    const activePersonaId = state.getActivePersonaId();
                    if(activePersonaId) {
                        allHistories[activePersonaId] = state.getActiveChatHistory();
                        storage.saveChatHistories(allHistories);
                    }

                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64EncodedAudioString && outputAudioContext) {
                    let nextStartTime = Math.max(state.getNextStartTime(), outputAudioContext.currentTime);
                    
                    const audioBuffer = await utils.decodeAudioData(
                        utils.decode(base64EncodedAudioString),
                        outputAudioContext, 24000, 1
                    );
                    
                    const sourceNode = outputAudioContext.createBufferSource();
                    sourceNode.buffer = audioBuffer;
                    sourceNode.connect(outputAudioContext.destination);
                    sourceNode.addEventListener('ended', () => sources.delete(sourceNode));

                    sourceNode.start(nextStartTime);
                    state.setNextStartTime(nextStartTime + audioBuffer.duration);
                    sources.add(sourceNode);
                }
                
                if (message.serverContent?.interrupted) {
                    sources.forEach(source => {
                        source.stop();
                        sources.delete(source);
                    });
                    state.setNextStartTime(0);
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Live chat error:', e);
                const errorString = e.message || '';
                let displayMessage = t.chatStatusError; // default

                if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
                    displayMessage = t.errorDefault;
                } else if (errorString.includes('500') || errorString.includes('UNKNOWN')) {
                    displayMessage = t.errorServer;
                }
                
                if (statusText) statusText.textContent = displayMessage;
                stopLiveChat();
            },
            onclose: () => {
                stopLiveChat();
            },
        });
        
        state.setLiveSessionPromise(sessionPromise);

    } catch (err) {
        console.error("Failed to start live chat:", err);
        utils.showAlertModal("Microphone Error", "Could not access the microphone. Please check your browser permissions.");
        stopLiveChat();
    }
}

function handleClearChatHistory() {
    const activePersonaId = state.getActivePersonaId();
    if (!activePersonaId) return;

    const t = translations[state.getCurrentLanguage()];

    utils.showConfirmModal(
        t.clearChatHistory,
        t.confirmClearChatBody,
        t.yesButton,
        t.noButton,
        () => {
            const currentActivePersonaId = state.getActivePersonaId(); // Re-check inside async callback
            if (!currentActivePersonaId) return;
            // Clear state
            state.setActiveChatHistory([]);

            // Clear storage
            const allHistories = storage.getChatHistories();
            delete allHistories[currentActivePersonaId];
            storage.saveChatHistories(allHistories);

            // Update UI
            updateChatMessagesUI();
        }
    );
}

export function addChatDelegatedEventListeners() {
    document.body.addEventListener('click', (e) => {
        if (state.getCurrentView() !== 'chat') return;
        const target = e.target as HTMLElement;
        const grid = document.getElementById('chat-grid-container');

        if (target.closest('#new-persona-btn')) { renderPersonaModal(); return; }
        if (target.closest('.chat-back-btn')) { grid?.classList.add('show-sidebar'); return; }

        const personaItem = target.closest('.persona-item');
        if (personaItem && !target.closest('.persona-control-btn')) {
            handlePersonaSelect((personaItem as HTMLElement).dataset.personaId!);
            return;
        }
        if (target.closest('.edit-persona-btn')) {
            const personaId = (target.closest('.persona-item') as HTMLElement).dataset.personaId!;
            const persona = state.getChatPersonas().find(p => p.id === personaId);
            if (persona) renderPersonaModal(persona);
            return;
        }
        if (target.closest('.delete-persona-btn')) {
            const personaId = (target.closest('.persona-item') as HTMLElement).dataset.personaId!;
            handleDeletePersona(personaId);
            return;
        }

        if (target.closest('#chat-auto-speak-toggle')) {
            const isEnabled = !state.getIsChatAutoSpeakEnabled();
            state.setIsChatAutoSpeakEnabled(isEnabled);
            const btn = document.getElementById('chat-auto-speak-toggle');
            if (btn) {
                btn.innerHTML = isEnabled ? SOUND_ON_ICON_SVG : SPEAKER_SIMPLE_ICON_SVG;
                btn.classList.toggle('active', isEnabled);
            }
            return;
        }

        if (target.closest('#clear-chat-history-btn')) {
            handleClearChatHistory();
            return;
        }
        
        if (target.closest('#chat-action-btn')) {
            const btn = target.closest('#chat-action-btn') as HTMLButtonElement;
            if (btn.type === 'button') {
                e.preventDefault();
                if (state.getIsLiveChatActive()) {
                    stopLiveChat();
                } else {
                    startLiveChat();
                }
            }
            return;
        }
        
        if (target.closest('.message-speak-btn')) {
            const button = target.closest('.message-speak-btn') as HTMLButtonElement;
            const textToSpeak = button.dataset.text;
            if (textToSpeak) {
                // Determine the language based on the message role
                const messageBubble = button.closest('.message-bubble');
                // FIX: Cast messageBubble to HTMLElement to access the dataset property.
                const role = (messageBubble as HTMLElement)?.dataset.role;
                // Only speak Spanish messages (model always replies in Spanish, user input is processed to Spanish)
                if (role === 'model' || role === 'user') {
                     utils.speakText(textToSpeak, 'es', button);
                }
            }
            return;
        }
    });

    document.body.addEventListener('submit', (e) => {
        if (state.getCurrentView() !== 'chat') return;
        if ((e.target as HTMLElement).id === 'chat-input-form-text') {
            e.preventDefault();
            sendChatMessage();
        }
    });
}
