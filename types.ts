/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { translations } from './constants.js';

export type Language = keyof typeof translations;
export type View = 'conjugator' | 'dictionary' | 'translator' | 'practice' | 'history' | 'favorites' | 'about' | 'chat' | 'guidelines' | 'browser';
export type Tone = 'Formal' | 'Friendly' | 'Business' | 'Creative' | 'Simplified';

export type Persona = {
    id: string;
    name: string;
    avatar: string; // Icon identifier
    prompt: string;
    timestamp: number;
};

export type ChatMessage = {
    role: 'user' | 'model';
    text: string;
    originalText?: string; // For user's original Georgian message
};

export type TranslationItem = {
    sourceLang: Language;
    targetLang: Language;
    sourceText: string;
    translatedText: string;
    timestamp: number;
};

export type PracticeQuestion = {
    type: 'FILL_IN_THE_BLANK_VERB' | 'MULTIPLE_CHOICE_TRANSLATION' | 'MULTIPLE_CHOICE_VOCAB' | 'FILL_IN_THE_BLANK_PREPOSITION';
    sentence_template?: string;
    verb_infinitive?: string;
    tense_hint?: string;
    question_text?: string;
    options?: string[];
    correct_answer: string;
    explanation: string;
};

export type PracticeSession = {
    questions: PracticeQuestion[];
    userAnswers: (string | null)[];
    currentQuestionIndex: number;
    isComplete: boolean;
};

export type PracticeHistoryItem = {
    timestamp: number;
    score: number;
    total: number;
    mistakes: {
        question: PracticeQuestion;
        userAnswer: string;
    }[];
};