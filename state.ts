/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Language, View, TranslationItem, PracticeSession, ChatMessage, Persona, Tone } from './types.js';

// --- State Variables ---

let currentLanguage: Language = 'es';
let currentView: View = 'translator';
let lastSearchedTerm: string | null = null;
let lastTranslationItem: TranslationItem | null = null;
let cropper: any = null;
let recognition: any = null;
let deferredInstallPrompt: any = null;
let wakeLockSentinel: any = null;
let currentSpeech: SpeechSynthesisUtterance | null = null;
let voices: SpeechSynthesisVoice[] = [];
let currentPracticeSession: PracticeSession | null = null;
let isSoundEnabled = true;
let currentFontSize = 32;
let isLandscapeLocked = false;

// --- Translator / Polisher State ---
let translatorMode: 'translate' | 'polish' = 'translate';
let translatorSourceLang: Language = 'es';
let translatorTargetLang: Language = 'ka';
let simplifyTranslation = false;
let polisherLanguage: Language = 'es';
let activeTone: Tone = 'Friendly';
let showPolishChanges = false;
let lastPolishedCleanText: string | null = null;
let lastPolishedDiffText: string | null = null;


// --- Chat State ---
let chatPersonas: Persona[] = [];
let activePersonaId: string | null = null;
let activeChatHistory: ChatMessage[] = [];
let isChatAutoSpeakEnabled = false;
let isLiveChatActive = false;
let liveSessionPromise: Promise<any> | null = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let mediaStream: MediaStream | null = null;
let nextStartTime = 0;

// --- Browser State ---
let browserUrl: string = 'https://quiz-avma.vercel.app/';


// --- State Getters ---

export const getCurrentLanguage = () => currentLanguage;
export const getCurrentView = () => currentView;
export const getLastSearchedTerm = () => lastSearchedTerm;
export const getLastTranslationItem = () => lastTranslationItem;
export const getCropper = () => cropper;
export const getRecognition = () => recognition;
export const getDeferredInstallPrompt = () => deferredInstallPrompt;
export const getWakeLockSentinel = () => wakeLockSentinel;
export const getCurrentSpeech = () => currentSpeech;
export const getVoices = () => voices;
export const getCurrentPracticeSession = () => currentPracticeSession;
export const getIsSoundEnabled = () => isSoundEnabled;
export const getCurrentFontSize = () => currentFontSize;
export const getIsLandscapeLocked = () => isLandscapeLocked;

// Translator / Polisher Getters
export const getTranslatorMode = () => translatorMode;
export const getTranslatorSourceLang = () => translatorSourceLang;
export const getTranslatorTargetLang = () => translatorTargetLang;
export const getSimplifyTranslation = () => simplifyTranslation;
export const getPolisherLanguage = () => polisherLanguage;
export const getActiveTone = () => activeTone;
export const getShowPolishChanges = () => showPolishChanges;
export const getLastPolishedCleanText = () => lastPolishedCleanText;
export const getLastPolishedDiffText = () => lastPolishedDiffText;


// Chat Getters
export const getChatPersonas = () => chatPersonas;
export const getActivePersonaId = () => activePersonaId;
export const getActiveChatHistory = () => activeChatHistory;
export const getIsChatAutoSpeakEnabled = () => isChatAutoSpeakEnabled;
export const getIsLiveChatActive = () => isLiveChatActive;
export const getLiveSessionPromise = () => liveSessionPromise;
export const getInputAudioContext = () => inputAudioContext;
export const getOutputAudioContext = () => outputAudioContext;
export const getScriptProcessor = () => scriptProcessor;
export const getMediaStreamSource = () => mediaStreamSource;
export const getMediaStream = () => mediaStream;
export const getNextStartTime = () => nextStartTime;

// Browser Getters
export const getBrowserUrl = () => browserUrl;

// --- State Setters ---

export const setCurrentLanguage = (lang: Language) => { currentLanguage = lang; };
export const setCurrentView = (view: View) => { currentView = view; };
export const setLastSearchedTerm = (term: string | null) => { lastSearchedTerm = term; };
export const setLastTranslationItem = (item: TranslationItem | null) => { lastTranslationItem = item; };
export const setCropper = (instance: any) => { cropper = instance; };
export const setRecognition = (instance: any) => { recognition = instance; };
export const setDeferredInstallPrompt = (prompt: any) => { deferredInstallPrompt = prompt; };
export const setWakeLockSentinel = (sentinel: any) => { wakeLockSentinel = sentinel; };
export const setCurrentSpeech = (utterance: SpeechSynthesisUtterance | null) => { currentSpeech = utterance; };
export const setVoices = (v: SpeechSynthesisVoice[]) => { voices = v; };
export const setCurrentPracticeSession = (session: PracticeSession | null) => { currentPracticeSession = session; };
export const setIsSoundEnabled = (enabled: boolean) => { isSoundEnabled = enabled; };
export const setCurrentFontSize = (size: number) => { currentFontSize = size; };
export const setIsLandscapeLocked = (locked: boolean) => { isLandscapeLocked = locked; };

// --- Translator / Polisher Setters ---
export const setTranslatorMode = (mode: 'translate' | 'polish') => { translatorMode = mode; };
export const setTranslatorSourceLang = (lang: Language) => { translatorSourceLang = lang; };
export const setTranslatorTargetLang = (lang: Language) => { translatorTargetLang = lang; };
export const setSimplifyTranslation = (simplify: boolean) => { simplifyTranslation = simplify; };
export const setPolisherLanguage = (lang: Language) => { polisherLanguage = lang; };
export const setActiveTone = (tone: Tone) => { activeTone = tone; };
export const setShowPolishChanges = (show: boolean) => { showPolishChanges = show; };
export const setLastPolishedCleanText = (text: string | null) => { lastPolishedCleanText = text; };
export const setLastPolishedDiffText = (text: string | null) => { lastPolishedDiffText = text; };


// --- Chat Setters ---
export const setChatPersonas = (personas: Persona[]) => { chatPersonas = personas; };
export const setActivePersonaId = (id: string | null) => { activePersonaId = id; };
export const setActiveChatHistory = (history: ChatMessage[]) => { activeChatHistory = history; };
export const setIsChatAutoSpeakEnabled = (enabled: boolean) => { isChatAutoSpeakEnabled = enabled; };
export const setIsLiveChatActive = (active: boolean) => { isLiveChatActive = active; };
export const setLiveSessionPromise = (promise: Promise<any> | null) => { liveSessionPromise = promise; };
export const setInputAudioContext = (context: AudioContext | null) => { inputAudioContext = context; };
export const setOutputAudioContext = (context: AudioContext | null) => { outputAudioContext = context; };
export const setScriptProcessor = (node: ScriptProcessorNode | null) => { scriptProcessor = node; };
export const setMediaStreamSource = (source: MediaStreamAudioSourceNode | null) => { mediaStreamSource = source; };
export const setMediaStream = (stream: MediaStream | null) => { mediaStream = stream; };
export const setNextStartTime = (time: number) => { nextStartTime = time; };

// Browser Setters
export const setBrowserUrl = (url: string) => { browserUrl = url; };