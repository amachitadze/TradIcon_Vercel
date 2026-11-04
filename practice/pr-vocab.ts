/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { PracticeQuestion } from '../types.js';

export const VOCAB_QUESTIONS: PracticeQuestion[] = [
    {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'Which of these is a fruit?',
        options: ['Pan', 'Leche', 'Manzana', 'Pollo'],
        correct_answer: 'Manzana',
        explanation: '"Manzana" means apple, which is a fruit.'
    },
    {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'What is the opposite of "rápido" (fast)?',
        options: ['Grande', 'Lento', 'Caliente', 'Frío'],
        correct_answer: 'Lento',
        explanation: '"Lento" means slow, the opposite of "rápido".'
    },
    {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'Which word refers to a family member?',
        options: ['Amigo', 'Profesor', 'Hermano', 'Perro'],
        correct_answer: 'Hermano',
        explanation: '"Hermano" means brother.'
    },
     {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'Which of these colors is "yellow"?',
        options: ['Rojo', 'Azul', 'Verde', 'Amarillo'],
        correct_answer: 'Amarillo',
        explanation: '"Amarillo" is the Spanish word for yellow.'
    },
    {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'რომელი სიტყვა აღნიშნავს ოჯახის წევრს?',
        options: ['Amigo', 'Profesor', 'Hermano', 'Perro'],
        correct_answer: 'Hermano',
        explanation: '„Hermano“ ნიშნავს ძმას, რომელიც ოჯახის წევრია.'
    },
    {
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: 'რომელი სიტყვა ნიშნავს „დრო“-ს ესპანურად?',
        options: ['Tiempo', 'Lugar', 'Año', 'Día'],
        correct_answer: 'Tiempo',
        explanation: '„Tiempo“ ნიშნავს „დრო“-ს (ასევე „ამინდი“-საც).'
    },
    ...[
        { esp: 'Casa', geo: 'სახლი' }, { esp: 'Gato', geo: 'კატა' }, { esp: 'Pan', geo: 'პური' }, { esp: 'Libro', geo: 'წიგნი' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რა არის სიტყვის "${pair.esp}" ქართული შესატყვისი?`,
        options: ['სახლი', 'კატა', 'პური', 'წიგნი'],
        correct_answer: pair.geo,
        explanation: 'ეს არის საბაზისო ლექსიკა ყოველდღიური თემებიდან.'
    })),
    ...[
        { esp: 'Rojo', geo: 'წითელი' }, { esp: 'Azul', geo: 'ლურჯი' }, { esp: 'Verde', geo: 'მწვანე' }, { esp: 'Amarillo', geo: 'ყვითელი' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რა არის ფერის "${pair.esp}" ქართული შესატყვისი?`,
        options: ['წითელი', 'ლურჯი', 'მწვანე', 'ყვითელი'],
        correct_answer: pair.geo,
        explanation: 'ეს არის ფერების ძირითადი ფორმები.'
    })),
    ...[
        { esp: 'Comer', geo: 'ჭამა' }, { esp: 'Beber', geo: 'სმა' }, { esp: 'Dormir', geo: 'ძილი' }, { esp: 'Estudiar', geo: 'სწავლა' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რა არის ზმნის "${pair.esp}" ქართული შესატყვისი?`,
        options: ['ჭამა', 'სმა', 'ძილი', 'სწავლა'],
        correct_answer: pair.geo,
        explanation: 'ეს არის ხშირი ზმნები ყოველდღიური კომუნიკაციისთვის.'
    })),
    ...[
        { esp: 'Madre', geo: 'დედა' }, { esp: 'Padre', geo: 'მამა' }, { esp: 'Hermano', geo: 'ძმა' }, { esp: 'Hermana', geo: 'და' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `როგორ ითარგმნება ოჯახის წევრი "${pair.esp}"?`,
        options: ['დედა', 'მამა', 'ძმა', 'და'],
        correct_answer: pair.geo,
        explanation: 'ეს არის ოჯახის წევრების ძირითადი ტერმინები.'
    })),
    ...[
        { esp: 'encima de', geo: 'ზემოთ' }, { esp: 'debajo de', geo: 'ქვემოთ' }, { esp: 'entre', geo: 'შორის' }, { esp: 'detrás de', geo: 'უკან' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რას ნიშნავს "${pair.esp}"?`,
        options: ['ზემოთ', 'ქვემოთ', 'შორის', 'უკან'],
        correct_answer: pair.geo,
        explanation: 'ეს არის სივრცითი წინდებულები საგნების ადგილმდებარეობის აღსანიშნად.'
    })),
    ...[
        { esp: 'Lunes', geo: 'ორშაბათი' }, { esp: 'Martes', geo: 'სამშაბათი' }, { esp: 'Miércoles', geo: 'ოთხშაბათი' }, { esp: 'Jueves', geo: 'ხუთშაბათი' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რომელი დღეა "${pair.esp}"?`,
        options: ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი'],
        correct_answer: pair.geo,
        explanation: 'ეს არის კვირის დღეების დასამახსოვრებელი ვარჯიში.'
    })),
    ...[
        { esp: 'Enero', geo: 'იანვარი' }, { esp: 'Febrero', geo: 'თებერვალი' }, { esp: 'Marzo', geo: 'მარტი' }, { esp: 'Abril', geo: 'აპრილი' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რომელი თვეა "${pair.esp}"?`,
        options: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი'],
        correct_answer: pair.geo,
        explanation: 'ეს არის თვეების დასაწყისი ფორმები – მარტივი მეხსიერებითი სავარჯიშო.'
    })),
    ...[
        { esp: 'Feliz', geo: 'ბედნიერი' }, { esp: 'Triste', geo: 'სევდიანი' }, { esp: 'Cansado', geo: 'დაღლილი' }, { esp: 'Enojado', geo: 'გაბრაზებული' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_VOCAB' as const,
        question_text: `რომელ ემოციას აღნიშნავს "${pair.esp}"?`,
        options: ['ბედნიერი', 'სევდიანი', 'დაღლილი', 'გაბრაზებული'],
        correct_answer: pair.geo,
        explanation: 'ეს არის ემოციების ძირითადი სიტყვები, მარტივი და ვიზუალურად ამოსაცნობი.'
    }))
].flat()