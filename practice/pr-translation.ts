/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { PracticeQuestion } from '../types.js';

export const TRANSLATION_QUESTIONS: PracticeQuestion[] = [
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ იტყვით ესპანურად " დიდი სახლი"?',
        options: ['La casa bonita', 'La casa grande', 'El coche rojo', 'Una mesa'],
        correct_answer: 'La casa grande',
        explanation: '"დიდი" translates to "grande" and "სახლი" to "casa". "Casa" is feminine, so it\'s "La casa grande".'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ იტყვით ესპანურად "მე ვსვამ წყალს"?',
        options: ['Yo como pan', 'Ella corre rápido', 'Yo bebo agua', 'Nosotros cantamos'],
        correct_answer: 'Yo bebo agua',
        explanation: '"მე" is "Yo", "ვსვამ" is "bebo" (from beber), and "წყალს" is "agua".'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'What is the Georgian translation for "Buenos días"?',
        options: ['ნახვამდის', 'გმადლობთ', 'დილა მშვიდობისა', 'ბოდიში'],
        correct_answer: 'დილა მშვიდობისა',
        explanation: '"Buenos días" is a greeting that means "Good morning".'
    },
     {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'What is the Georgian translation for "Perdón"?',
        options: ['კი', 'არა', 'გთხოვთ', 'ბოდიში'],
        correct_answer: 'ბოდიში',
        explanation: '"Perdón" means "Sorry" or "Excuse me".'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ ითარგმნება ესპანურად „მე ვსწავლობ ესპანურს“?',
        options: ['Yo trabajo español', 'Yo estudio español', 'Yo hablo español', 'Yo como español'],
        correct_answer: 'Yo estudio español',
        explanation: 'ზმნა “estudiar” ნიშნავს „სწავლას“, ხოლო „Yo estudio español“ ნიშნავს „მე ვსწავლობ ესპანურს“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'რას ნიშნავს ფრაზა „Nosotros comemos pan“?',
        options: ['მე ვჭამ პურს', 'შენ ჭამ პურს', 'ჩვენ ვჭამთ პურს', 'ისინი ჭამენ პურს'],
        correct_answer: 'ჩვენ ვჭამთ პურს',
        explanation: 'ზმნა „comemos“ არის „comer“-ის ფორმა „nosotros“-თან — ჩვენ ვჭამთ.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: '„Él bebe café por la mañana“ ნიშნავს...',
        options: ['ის სვამს ყავას დილით', 'ის სვამს ღვინოს ღამით', 'ის კითხულობს წიგნს დილით', 'ის ამზადებს ყავას საღამოს'],
        correct_answer: 'ის სვამს ყავას დილით',
        explanation: '„bebe“ ნიშნავს „სვამს“, ხოლო „por la mañana“ — დილით.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ ითარგმნება ქართულად „Ellos viven en España“?',
        options: ['ისინი ცხოვრობენ ესპანეთში', 'ისინი სწავლობენ ესპანურად', 'ისინი ლაპარაკობენ ესპანურად', 'ისინი მიემგზავრებიან ესპანეთში'],
        correct_answer: 'ისინი ცხოვრობენ ესპანეთში',
        explanation: 'ზმნა „vivir“ ნიშნავს „ცხოვრებას“, ამიტომ „Ellos viven en España“ — „ისინი ცხოვრობენ ესპანეთში“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ ითარგმნება ესპანურად „ჩვენ ვმუშაობთ ბანკში“?',
        options: ['Nosotros trabajamos en el banco', 'Nosotros vivimos en el banco', 'Nosotros escribimos en el banco', 'Nosotros hablamos el banco'],
        correct_answer: 'Nosotros trabajamos en el banco',
        explanation: 'ზმნა „trabajar“ ნიშნავს „მუშაობას“. წინადადება ნიშნავს „ჩვენ ვმუშაობთ ბანკში“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'რას ნიშნავს ფრაზა „Ella cocina muy bien“?',
        options: ['ის ძალიან კარგად ამზადებს საჭმელს', 'ის კარგად ცურავს', 'ის კარგად კითხულობს', 'ის კარგად მღერის'],
        correct_answer: 'ის ძალიან კარგად ამზადებს საჭმელს',
        explanation: '„cocinar“ ნიშნავს „მომზადებას“ ან „საჭმლის კეთებას“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'როგორ ითარგმნება ქართულად „Yo tengo un gato“?',
        options: ['მე მყავს კატა', 'მე მიყვარს კატა', 'მე ვხედავ კატას', 'მე ვჭამ კატას'],
        correct_answer: 'მე მყავს კატა',
        explanation: 'ზმნა „tener“ ნიშნავს „ყოლას“, ამიტომ „Yo tengo un gato“ ნიშნავს „მე მყავს კატა“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'რას ნიშნავს ფრაზა „Nos gusta viajar“?',
        options: ['ჩვენ გვიყვარს მოგზაურობა', 'ჩვენ გვინდა წავიდეთ', 'ჩვენ მივდივართ შვებულებაში', 'ჩვენ ვმუშაობთ მოგზაურობაზე'],
        correct_answer: 'ჩვენ გვიყვარს მოგზაურობა',
        explanation: '„Nos gusta“ ნიშნავს „ჩვენ მოგვწონს“, ხოლო „viajar“ ნიშნავს „მოგზაურობას“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: მე მიყვარს მუსიკა.',
        options: ['Yo amo la música.', 'Yo escucho la música.', 'Yo toco la música.'],
        correct_answer: 'Yo amo la música.',
        explanation: '„Amar“ ნიშნავს „სიყვარული“. სწორი თარგმანია „Yo amo la música.“'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: ჩვენ ვცხოვრობთ მადრიდში.',
        options: ['Nosotros comemos en Madrid.', 'Nosotros vivimos en Madrid.', 'Nosotros trabajamos en Madrid.'],
        correct_answer: 'Nosotros vivimos en Madrid.',
        explanation: '„Vivir“ ნიშნავს „ცხოვრება“. სწორი ფორმაა „Nosotros vivimos en Madrid.“'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: ის მუშაობს ბანკში.',
        options: ['Él trabaja en un banco.', 'Él estudia en un banco.', 'Él va en un banco.'],
        correct_answer: 'Él trabaja en un banco.',
        explanation: '„Trabajar en un banco“ ნიშნავს „მუშაობს ბანკში“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: მე მინდა წყალი.',
        options: ['Yo tengo agua.', 'Yo quiero agua.', 'Yo bebo agua.'],
        correct_answer: 'Yo quiero agua.',
        explanation: '„Querer“ ნიშნავს „მინდა“. ამიტომ „Yo quiero agua.“ არის სწორი.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: ისინი სწავლობენ სკოლაში.',
        options: ['Ellos comen en la escuela.', 'Ellos viven en la escuela.', 'Ellos estudian en la escuela.'],
        correct_answer: 'Ellos estudian en la escuela.',
        explanation: 'ზმნა „estudiar“ ნიშნავს „სწავლა“. სწორი ფორმაა „Ellos estudian en la escuela.“'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: შენ ლამაზი ხარ.',
        options: ['Tú eres bonito/bonita.', 'Tú estás bonito/bonita.', 'Tú tienes bonito.'],
        correct_answer: 'Tú eres bonito/bonita.',
        explanation: 'მახასიათებლის გამოსახატავად ვიყენებთ „ser“ – „Tú eres bonita.“'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: დღეს ცხელა.',
        options: ['Hoy hace calor.', 'Hoy está caliente.', 'Hoy tiene calor.'],
        correct_answer: 'Hoy hace calor.',
        explanation: 'ამინდის დროს ყოველთვის გამოიყენება „hacer“: „Hace calor.“'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: მე არ ვიცი.',
        options: ['No conozco.', 'No sé.', 'No tengo idea.'],
        correct_answer: 'No sé.',
        explanation: '„Saber“ ნიშნავს „ცოდნა“. „No sé“ — მე არ ვიცი.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: გუშინ წავედი კინოთეატრში.',
        options: ['Ayer voy al cine.', 'Ayer fui al cine.', 'Ayer he ido al cine.'],
        correct_answer: 'Ayer fui al cine.',
        explanation: 'გუშინ მოხდა, ამიტომ საჭიროა Pretérito Indefinido ფორმა: „fui“.'
    },
    {
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: 'თარგმნე ესპანურად: მე მირჩევნია ჩაი.',
        options: ['Prefiero el té.', 'Quiero el té.', 'Tomo el té.'],
        correct_answer: 'Prefiero el té.',
        explanation: '„Preferir“ ნიშნავს „მირჩევნია“. სწორი ფორმაა „Prefiero el té.“'
    },
    ...[
        { esp: 'Yo tengo', geo: 'მე მაქვს' }, { esp: 'Tú tienes', geo: 'შენ გაქვს' }, { esp: 'Él tiene', geo: 'მას აქვს' }, { esp: 'Nosotros tenemos', geo: 'ჩვენ გვაქვს' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: `რას ნიშნავს "${pair.esp}"?`,
        options: ['მე მაქვს', 'შენ გაქვს', 'მას აქვს', 'ჩვენ გვაქვს'],
        correct_answer: pair.geo,
        explanation: 'ზმნა „tener“ არარეგულარულია, მაგრამ ხშირად გამოიყენება ფუნდამენტურ ფრაზებში.'
    })),
    ...[
        { esp: '¿Cómo estás?', geo: 'როგორ ხარ?' }, { esp: 'Gracias', geo: 'გმადლობ' }, { esp: 'Por favor', geo: 'გთხოვ' }, { esp: 'Adiós', geo: 'ნახვამდის' }
    ].map(pair => ({
        type: 'MULTIPLE_CHOICE_TRANSLATION' as const,
        question_text: `რას ნიშნავს ფრაზა "${pair.esp}"?`,
        options: ['როგორ ხარ?', 'გმადლობ', 'გთხოვ', 'ნახვამდის'],
        correct_answer: pair.geo,
        explanation: 'ეს არის ყოველდღიური კომუნიკაციის ძირითადი გამოთქმები.'
    }))
].flat()