/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { PracticeQuestion } from '../types.js';

export const PREPOSITIONS_QUESTIONS: PracticeQuestion[] = [
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'El libro está ___ la mesa.',
        correct_answer: 'sobre',
        explanation: '„Sobre“ ნიშნავს „ზედა“, ამიტომ „El libro está sobre la mesa.“ ნიშნავს „წიგნი მაგიდაზეა.“'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'Vivo ___ España.',
        correct_answer: 'en',
        explanation: 'ქვეყნების და ქალაქების წინ ყოველთვის გამოიყენება „en“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'Vamos ___ la playa el domingo.',
        correct_answer: 'a',
        explanation: 'მიმართულების აღსანიშნავად ვიყენებთ „a“ („vamos a“ = მივდივართ).'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'El gato está ___ la silla.',
        correct_answer: 'debajo de',
        explanation: '„Debajo de“ ნიშნავს „ქვეშ“. აქ ნიშნავს, რომ კატა არის სკამის ქვეშ.'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'Trabajo ___ una empresa internacional.',
        correct_answer: 'en',
        explanation: 'სამუშაო ადგილის აღსანიშნავად ვიყენებთ „en“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'El autobús pasa ___ el centro de la ciudad.',
        correct_answer: 'por',
        explanation: '„Por“ გამოიყენება როდესაც რაღაც გავლით ხდება („გავლით ქალაქის ცენტრში“).'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'El regalo es ___ ti.',
        correct_answer: 'para',
        explanation: '„Para“ გამოიყენება მიზნის ან მიმღების აღსანიშნავად („შენთვის“).'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'Mis padres vienen ___ Argentina.',
        correct_answer: 'de',
        explanation: 'წარმომავლობის აღსანიშნავად ვიყენებთ „de“ („მოვდივარ არგენტინიდან“).'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'Estoy esperando ___ el autobús.',
        correct_answer: 'a',
        explanation: 'ზმნა „esperar a alguien/algo“ მოითხოვს წინდებულ „a“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_PREPOSITION' as const,
        sentence_template: 'La tienda está ___ la esquina.',
        correct_answer: 'en',
        explanation: '„En la esquina“ ნიშნავს „კუთხეში“. ადგილმდებარეობის გამოსახატად გამოიყენება „en“.'
    }
];