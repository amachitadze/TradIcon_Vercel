/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { PracticeQuestion } from '../types.js';

export const VERBS_QUESTIONS: PracticeQuestion[] = [
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Yo ___ (hablar) español todos los días.',
        verb_infinitive: 'hablar',
        tense_hint: 'Presente',
        correct_answer: 'hablo',
        explanation: 'For "yo" in the present tense, the -ar verb "hablar" becomes "hablo".'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Ayer, nosotros ___ (comer) paella.',
        verb_infinitive: 'comer',
        tense_hint: 'Pretérito Indefinido',
        correct_answer: 'comimos',
        explanation: 'For "nosotros" in the Pretérito Indefinido, the -er verb "comer" becomes "comimos".'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Mañana, tú ___ (vivir) una nueva aventura.',
        verb_infinitive: 'vivir',
        tense_hint: 'Futuro Simple',
        correct_answer: 'vivirás',
        explanation: 'For "tú" in the future tense, the verb "vivir" becomes "vivirás".'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Cuando era niño, yo siempre ___ (jugar) en el parque.',
        verb_infinitive: 'jugar',
        tense_hint: 'Pretérito Imperfecto',
        correct_answer: 'jugaba',
        explanation: 'For "yo" in the Pretérito Imperfecto, the verb "jugar" becomes "jugaba" to describe a habitual past action.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Esta mañana, él ___ (escribir) un correo electrónico.',
        verb_infinitive: 'escribir',
        tense_hint: 'Pretérito Perfecto',
        correct_answer: 'ha escrito',
        explanation: 'For "él" in the Pretérito Perfecto, we use "ha" + the past participle "escrito".'
    },
     {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Ellos ___ (ir) a la playa el verano pasado.',
        verb_infinitive: 'ir',
        tense_hint: 'Pretérito Indefinido',
        correct_answer: 'fueron',
        explanation: '"Ir" is irregular. For "ellos" in the Pretérito Indefinido, the conjugation is "fueron".'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: '¿Usted ___ (poder) ayudarme, por favor?',
        verb_infinitive: 'poder',
        tense_hint: 'Presente',
        correct_answer: 'puede',
        explanation: 'For a formal "Usted" in the present tense, the verb "poder" is conjugated as "puede".'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Yo ___ (beber) agua todos los días.',
        verb_infinitive: 'beber',
        tense_hint: 'Presente',
        correct_answer: 'bebo',
        explanation: 'Presente დროში „beber“-ის ფორმა „yo“-სთან არის „bebo“, რაც ნიშნავს „მე ვსვამ“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Nosotros ___ (vivir) en una casa grande.',
        verb_infinitive: 'vivir',
        tense_hint: 'Presente',
        correct_answer: 'vivimos',
        explanation: 'ზმნა „vivir“ Presente დროში „nosotros“-თან იხრება როგორც „vivimos“ — ჩვენ ვცხოვრობთ.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Tú ___ (trabajar) en un restaurante.',
        verb_infinitive: 'trabajar',
        tense_hint: 'Presente',
        correct_answer: 'trabajas',
        explanation: '„Trabajar“ არის რეგულარული ზმნა -ar დაბოლოებით, „tú trabajas“ ნიშნავს „შენ მუშაობ“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Él ___ (comer) una manzana.',
        verb_infinitive: 'comer',
        tense_hint: 'Presente',
        correct_answer: 'come',
        explanation: '„Él come“ არის ზუსტი ფორმა „comer“-ის „él“-თან — ის ჭამს.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Ellos ___ (estudiar) español en la escuela.',
        verb_infinitive: 'estudiar',
        tense_hint: 'Presente',
        correct_answer: 'estudian',
        explanation: '„Ellos estudian“ ნიშნავს „ისინი სწავლობენ“. ზმნა რეგულარულად იხრება -ar წესით.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Yo ___ (levantarse) temprano todos los días.',
        verb_infinitive: 'levantarse',
        tense_hint: 'Presente (verbo reflexivo)',
        correct_answer: 'me levanto',
        explanation: '„Levantarse“ არის დამბრუნებელი ზმნა; ფორმა „yo me levanto“ ნიშნავს „მე ვდგები“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Nosotros ___ (escuchar) música en casa.',
        verb_infinitive: 'escuchar',
        tense_hint: 'Presente',
        correct_answer: 'escuchamos',
        explanation: 'რეგულარული ზმნა -ar; ფორმა „nosotros escuchamos“ ნიშნავს „ჩვენ ვუსმენთ“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Tú ___ (abrir) la puerta.',
        verb_infinitive: 'abrir',
        tense_hint: 'Presente',
        correct_answer: 'abres',
        explanation: 'ზმნა „abrir“ (-ir დაბოლოებით) „tú“-თან იხრება როგორც „abres“ — შენ აღებ კარს.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Ella ___ (estar) feliz hoy.',
        verb_infinitive: 'estar',
        tense_hint: 'Presente',
        correct_answer: 'está',
        explanation: '„Estar“ არარეგულარული ზმნაა; „ella está“ ნიშნავს „ის არის“.'
    },
    {
        type: 'FILL_IN_THE_BLANK_VERB' as const,
        sentence_template: 'Vosotros ___ (jugar) al fútbol los domingos.',
        verb_infinitive: 'jugar',
        tense_hint: 'Presente',
        correct_answer: 'jugáis',
        explanation: '„Jugar“ არარეგულარულია; „vosotros jugáis“ ნიშნავს „თქვენ თამაშობთ“.'
    }
];