/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { PracticeQuestion } from '../types.js';
import { VERBS_QUESTIONS } from './pr-verbs.js';
import { VOCAB_QUESTIONS } from './pr-vocab.js';
import { TRANSLATION_QUESTIONS } from './pr-translation.js';
import { PREPOSITIONS_QUESTIONS } from './pr-prepositions.js';
import { PORQUE_QUESTIONS } from './pr-porque.js';
import { SER_ESTAR_QUESTIONS } from './pr-ser-estar.js';
import { POR_PARA_QUESTIONS } from './pr-por-para.js';

export const TOPICS = {
    'all': {
        es: 'Práctica Mixta',
        ka: 'შერეული პრაქტიკა',
        description_es: '10 preguntas aleatorias de todas las categorías.',
        description_ka: '10 შემთხვევითი კითხვა ყველა კატეგორიიდან.',
    },
    'verbs': {
        es: 'Verbos',
        ka: 'ზმნები',
        description_es: 'Conjuga los verbos en el tiempo correcto.',
        description_ka: 'ჩასვით ზმნები სწორ დროში.',
    },
    'ser-estar': {
        es: 'Ser vs. Estar',
        ka: 'Ser vs. Estar',
        description_es: 'Elige la forma correcta de "ser" o "estar".',
        description_ka: 'აირჩიეთ "ser" ან "estar"-ის სწორი ფორმა.',
    },
    'por-para': {
        es: 'Por vs. Para',
        ka: 'Por vs. Para',
        description_es: 'Completa la frase con "por" o "para".',
        description_ka: 'შეავსეთ წინადადება "por" ან "para"-თი.',
    },
    'vocab': {
        es: 'Vocabulario',
        ka: 'ლექსიკა',
        description_es: 'Elige la palabra o el significado correcto.',
        description_ka: 'აირჩიეთ სწორი სიტყვა ან მნიშვნელობა.',
    },
    'translation': {
        es: 'Traducción',
        ka: 'თარგმანი',
        description_es: 'Traduce frases entre español y georgiano.',
        description_ka: 'თარგმნეთ ფრაზები ესპანურსა და ქართულს შორის.',
    },
    'prepositions': {
        es: 'Preposiciones',
        ka: 'წინდებულები',
        description_es: 'Completa la frase con la preposición correcta.',
        description_ka: 'შეავსეთ წინადადება სწორი წინდებულით.',
    },
    'porque': {
        es: 'Por qué / Porque / Porqué',
        ka: 'Por qué, Porque თუ Porqué?',
        description_es: 'Elige la forma correcta para cada oración.',
        description_ka: 'აირჩიეთ სწორი ფორმა თითოეული წინადადებისთვის.',
    },
};

export const QUESTIONS_BY_TOPIC: { [key: string]: PracticeQuestion[] } = {
    verbs: VERBS_QUESTIONS,
    'ser-estar': SER_ESTAR_QUESTIONS,
    'por-para': POR_PARA_QUESTIONS,
    vocab: VOCAB_QUESTIONS,
    translation: TRANSLATION_QUESTIONS,
    prepositions: PREPOSITIONS_QUESTIONS,
    porque: PORQUE_QUESTIONS,
};

// For mixed quiz, a flat array is useful.
export const ALL_PRACTICE_QUESTIONS: PracticeQuestion[] = Object.values(QUESTIONS_BY_TOPIC).flat();