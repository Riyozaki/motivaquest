
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Quest, QuestRarity, StoryDay, Task, TaskType } from '../types';
import { RootState } from './index';

interface QuestsState {
  list: Quest[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const getMinMinutes = (rarity: QuestRarity): number => {
    switch(rarity) {
        case 'Common': return 1; 
        case 'Rare': return 5;
        case 'Epic': return 15;
        case 'Legendary': return 30;
        default: return 1;
    }
};

// --- CAMPAIGN DATA (Updated IDs to match new list) ---
export const CAMPAIGN_DATA: StoryDay[] = [
    { day: 1, title: "Пробуждение", locationId: 'village', locationName: "Деревня", description: "Начало пути. Приведи дела в порядок.", character: 'wizard', dialogue: "Здравствуй! Приведи в порядок свой штаб и тело.", questIds: [65, 55, 1], rewardText: "Начало Пути" },
    { day: 2, title: "Дисциплина", locationId: 'village', locationName: "Деревня", description: "Укрепление духа и режима.", character: 'wizard', dialogue: "Продолжай тренировки. Благодарность — сила героя.", questIds: [66, 75, 56], rewardText: "Бонус Стрика" },
    { day: 3, title: "Лесная Арифметика", locationId: 'forest', locationName: "Лес", description: "Основы вычислений.", character: 'fairy', dialogue: "Цифры запутали тропы! Помоги распутать их.", questIds: [2, 3, 57], rewardText: "Разблокирован Дух" },
    { day: 4, title: "Тропа Грамотности", locationId: 'forest', locationName: "Лес", description: "Работа с текстом.", character: 'fairy', dialogue: "Нужно больше усилий. Читай и записывай.", questIds: [11, 21, 67], rewardText: "Скин Леса" },
    { day: 5, title: "Научный Подход", locationId: 'forest', locationName: "Лес", description: "Изучение природы.", character: 'wizard', dialogue: "Мир полон загадок. Исследуй их!", questIds: [37, 81, 4], rewardText: "1-й Кристалл" },
    { day: 6, title: "Восхождение", locationId: 'mountains', locationName: "Горы", description: "Физика и выносливость.", character: 'wizard', dialogue: "В горах тяжело дышать. Законы Ньютона здесь суровы.", questIds: [38, 58, 5], rewardText: "Зелье Силы" },
    { day: 7, title: "Спасение Воина", locationId: 'mountains', locationName: "Горы", description: "Английский и логика.", character: 'warrior', dialogue: "Язык — это ключ к союзникам. Освободи меня!", questIds: [29, 93, 6], rewardText: "Разблокирован Воин" },
    { day: 8, title: "Лавина Задач", locationId: 'mountains', locationName: "Горы", description: "Многозадачность.", character: 'warrior', dialogue: "Держи ритм! Спорт и учеба — наш щит.", questIds: [59, 12, 68], rewardText: "2-й Кристалл" },
    { day: 9, title: "Руины Истории", locationId: 'castle', locationName: "Замок", description: "Исторические даты.", character: 'wizard', dialogue: "История учит нас не повторять ошибок.", questIds: [47, 48, 69], rewardText: "Щит Мудрости" },
    { day: 10, title: "Зал Литературы", locationId: 'castle', locationName: "Замок", description: "Чтение и анализ.", character: 'fairy', dialogue: "Слова имеют силу. Говори красиво и уверенно.", questIds: [22, 23, 76], rewardText: "Свиток Речи" },
    { day: 11, title: "Финансовая Грамота", locationId: 'castle', locationName: "Замок", description: "Учет ресурсов.", character: 'warrior', dialogue: "Золото требует счета. Подготовь казну.", questIds: [87, 88, 70], rewardText: "3-й Кристалл" },
    { day: 12, title: "Живой Песок", locationId: 'desert', locationName: "Пустыня", description: "Биология жизни.", character: 'fairy', dialogue: "В каждой клетке — жизнь. Изучи её.", questIds: [39, 82, 60], rewardText: "Зелье Жизни" },
    { day: 13, title: "Буря Кода", locationId: 'desert', locationName: "Пустыня", description: "Логика и IT.", character: 'warrior', dialogue: "Тень сопротивляется! Используй алгоритмы!", questIds: [94, 95, 7], rewardText: "4-й Кристалл" },
    { day: 14, title: "Трон Лени", locationId: 'throne', locationName: "Трон", description: "Финальный экзамен.", character: 'king', dialogue: "Я — твоя Лень. Сможешь ли ты победить себя?", questIds: [74, 100, 71], rewardText: "5-й Кристалл" }
];

// Helper for task creation
const t = (type: TaskType, q: string, correct: string, opts?: any): Task => {
    return {
        id: Math.random(),
        type,
        question: q,
        correctAnswer: correct,
        ...opts
    };
};

// --- QUEST DATABASE (100 Quests) ---
const rawQuests: any[] = [
    // --- MATH (1-10) ---
    { id: 1, title: "Быстрый счет: Таблица x7", description: "Вспомни таблицу умножения", category: "Math", rarity: "Common", xp: 15, coins: 10, grades: [5,8], tasks: [
        t('timer_challenge', "7 × 6 = ?", "42", { timerSeconds: 15 }),
        t('timer_challenge', "7 × 8 = ?", "56", { timerSeconds: 15 }),
        t('timer_challenge', "7 × 9 = ?", "63", { timerSeconds: 15 })
    ]},
    { id: 2, title: "Дроби: Сложение", description: "Сложи простые дроби", category: "Math", rarity: "Rare", xp: 30, coins: 20, grades: [5,7], tasks: [
        t('quiz', "1/2 + 1/4 = ?", "", { options: ["3/4", "2/6", "1/6", "2/4"], correctIndex: 0 }),
        t('number_input', "Числитель 3/5 + 1/5?", "4", {})
    ]},
    { id: 3, title: "Проценты: Скидки", description: "Посчитай выгоду", category: "Math", rarity: "Rare", xp: 30, coins: 20, grades: [6,9], tasks: [
        t('timer_challenge', "Цена 100, скидка 20%. Итог?", "80", { timerSeconds: 20 }),
        t('timer_challenge', "50% от 400?", "200", { timerSeconds: 15 })
    ]},
    { id: 4, title: "Геометрия: Площадь", description: "Найди площадь фигур", category: "Math", rarity: "Common", xp: 20, coins: 15, grades: [5,9], tasks: [
        t('number_input', "Прямоугольник 5x8. Площадь?", "40", {}),
        t('number_input', "Квадрат со стороной 6. Площадь?", "36", {})
    ]},
    { id: 5, title: "Уравнения: Найти X", description: "Реши линейные уравнения", category: "Math", rarity: "Epic", xp: 50, coins: 40, grades: [7,11], tasks: [
        t('timer_challenge', "2x + 10 = 20. x=?", "5", { timerSeconds: 30 }),
        t('timer_challenge', "3x - 5 = 10. x=?", "5", { timerSeconds: 30 })
    ]},
    { id: 6, title: "Логика: Ряды чисел", description: "Продолжи последовательность", category: "Math", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('quiz', "2, 4, 8, 16...?", "", { options: ["32", "24", "30"], correctIndex: 0 }),
        t('quiz', "1, 1, 2, 3, 5...?", "", { options: ["8", "7", "6"], correctIndex: 0 })
    ]},
    { id: 7, title: "Степени двойки", description: "Информатика и математика", category: "Math", rarity: "Epic", xp: 50, coins: 40, grades: [8,11], tasks: [
        t('matching', "Степени", "", { pairs: [{left:'2^3', right:'8'}, {left:'2^5', right:'32'}, {left:'2^10', right:'1024'}] })
    ]},
    { id: 8, title: "Отрицательные числа", description: "Сложение и вычитание", category: "Math", rarity: "Common", xp: 20, coins: 15, grades: [6,8], tasks: [
        t('timer_challenge', "-5 + 3 = ?", "-2", { timerSeconds: 20 }),
        t('timer_challenge', "-10 - 5 = ?", "-15", { timerSeconds: 20 })
    ]},
    { id: 9, title: "Округление", description: "Приближенные значения", category: "Math", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "3.7 до целых?", "", { options: ["4", "3", "3.5"], correctIndex: 0 }),
        t('quiz', "12.2 до целых?", "", { options: ["12", "13", "12.5"], correctIndex: 0 })
    ]},
    { id: 10, title: "Римские цифры", description: "Древний счет", category: "Math", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('matching', "Цифры", "", { pairs: [{left:'V', right:'5'}, {left:'IX', right:'9'}, {left:'X', right:'10'}] })
    ]},

    // --- RUSSIAN (11-20) ---
    { id: 11, title: "Жи/Ши", description: "Основы правописания", category: "Russian", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Какое слово верное?", "", { options: ["Шина", "Шына"], correctIndex: 0 }),
        t('quiz', "Какое слово верное?", "", { options: ["Жизнь", "Жызнь"], correctIndex: 0 })
    ]},
    { id: 12, title: "Тся/Ться", description: "Мягкий знак в глаголах", category: "Russian", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "Он (что делает?)", "", { options: ["Учится", "Учиться"], correctIndex: 0 }),
        t('quiz', "Надо (что делать?)", "", { options: ["Учиться", "Учится"], correctIndex: 0 })
    ]},
    { id: 13, title: "Ударения: Базовые", description: "Говори правильно", category: "Russian", rarity: "Rare", xp: 25, coins: 15, tasks: [
        t('quiz', "Звон...", "", { options: ["ЗвонИт", "ЗвОнит"], correctIndex: 0 }),
        t('quiz', "Торт...", "", { options: ["ТортЫ", "тОрты"], correctIndex: 1 })
    ]},
    { id: 14, title: "Словарные слова", description: "Проверь память", category: "Russian", rarity: "Epic", xp: 50, coins: 35, tasks: [
        t('text_input', "В_кзал (буква)", "о", { acceptableAnswers: ["о", "О"] }),
        t('text_input', "К_рова (буква)", "о", { acceptableAnswers: ["о", "О"] })
    ]},
    { id: 15, title: "Части речи", description: "Морфология", category: "Russian", rarity: "Common", xp: 20, coins: 10, tasks: [
        t('matching', "Сортировка", "", { pairs: [{left:'Бежать', right:'Глагол'}, {left:'Синий', right:'Прилагательное'}, {left:'Дом', right:'Сущ'}] })
    ]},
    { id: 16, title: "НЕ с глаголами", description: "Слитно или раздельно", category: "Russian", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Не_знаю", "", { options: ["Раздельно", "Слитно"], correctIndex: 0 }),
        t('quiz', "Не_навижу", "", { options: ["Слитно", "Раздельно"], correctIndex: 0 })
    ]},
    { id: 17, title: "Род имен существительных", description: "Определи род", category: "Russian", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Кофе", "", { options: ["Мужской", "Средний", "Женский"], correctIndex: 0 }),
        t('quiz', "Метро", "", { options: ["Средний", "Мужской"], correctIndex: 0 })
    ]},
    { id: 18, title: "Антонимы", description: "Противоположности", category: "Russian", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('matching', "Пары", "", { pairs: [{left:'Холодный', right:'Горячий'}, {left:'День', right:'Ночь'}, {left:'Свет', right:'Тьма'}] })
    ]},
    { id: 19, title: "Фразеологизмы", description: "Значение выражений", category: "Russian", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('quiz', "Бить баклуши - это?", "", { options: ["Бездельничать", "Работа", "Играть"], correctIndex: 0 }),
        t('quiz', "Водить за нос - это?", "", { options: ["Обманывать", "Вести", "Учить"], correctIndex: 0 })
    ]},
    { id: 20, title: "Приставки ПРЕ/ПРИ", description: "Сложные правила", category: "Russian", rarity: "Epic", xp: 50, coins: 40, grades: [6,11], tasks: [
        t('quiz', "Пр_ехать (приближение)", "", { options: ["При", "Пре"], correctIndex: 0 }),
        t('quiz', "Пр_мудрый (очень)", "", { options: ["Пре", "При"], correctIndex: 0 })
    ]},

    // --- LITERATURE (21-28) ---
    { id: 21, title: "Чтение: Марафон", description: "Прочитай 15 страниц", category: "Literature", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Чтение", "", { checklistItems: [{id:'1', label: '15 страниц книги'}, {id:'2', label: 'Выписал цитату'}]})
    ]},
    { id: 22, title: "Жанры литературы", description: "Различия жанров", category: "Literature", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('matching', "Жанры", "", { pairs: [{left:'Колобок', right:'Сказка'}, {left:'Бородино', right:'Стих'}, {left:'Война и Мир', right:'Роман'}] })
    ]},
    { id: 23, title: "Пушкин: Знание", description: "Факты о поэте", category: "Literature", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Имя Пушкина?", "", { options: ["Александр", "Михаил", "Лев"], correctIndex: 0 }),
        t('quiz', "Няня Пушкина?", "", { options: ["Арина Родионовна", "Татьяна", "Ольга"], correctIndex: 0 })
    ]},
    { id: 24, title: "Учим стих", description: "Тренировка памяти", category: "Literature", rarity: "Epic", xp: 60, coins: 45, tasks: [
        t('checklist', "Процесс", "", { checklistItems: [{id:'1', label: 'Прочитал 5 раз'}, {id:'2', label: 'Рассказал по памяти'}]})
    ]},
    { id: 25, title: "Средства выразительности", description: "Эпитеты и метафоры", category: "Literature", rarity: "Rare", xp: 35, coins: 25, grades: [7,11], tasks: [
        t('quiz', "'Золотая осень' это?", "", { options: ["Эпитет", "Сравнение", "Гипербола"], correctIndex: 0 }),
        t('quiz', "'Лес точно терем' это?", "", { options: ["Сравнение", "Метафора"], correctIndex: 0 })
    ]},
    { id: 26, title: "Анализ героя", description: "Подумай о персонаже", category: "Literature", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('text_input', "Любимый герой книги?", "*", {}),
        t('checklist', "Анализ", "", { checklistItems: [{id:'1', label: 'Назвал черты характера'}, {id:'2', label: 'Понял мотив'}]})
    ]},
    { id: 27, title: "Пословицы", description: "Народная мудрость", category: "Literature", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('ordering', "Собери", "", { correctOrder: ["Без", "труда", "не", "выловишь", "рыбку"], shuffledItems: ["рыбку", "Без", "не", "труда", "выловишь"] })
    ]},
    { id: 28, title: "Басни Крылова", description: "Мораль сей басни", category: "Literature", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Кто уронил сыр?", "", { options: ["Ворона", "Лисица", "Волк"], correctIndex: 0 }),
        t('quiz', "Кто пел все лето?", "", { options: ["Стрекоза", "Муравей", "Жук"], correctIndex: 0 })
    ]},

    // --- ENGLISH (LANG) (29-36) ---
    { id: 29, title: "English: To Be", description: "Глагол быть", category: "Lang", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "I ___ a student", "", { options: ["am", "is", "are"], correctIndex: 0 }),
        t('quiz', "They ___ friends", "", { options: ["are", "is", "am"], correctIndex: 0 })
    ]},
    { id: 30, title: "English: Animals", description: "Животные", category: "Lang", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('matching', "Перевод", "", { pairs: [{left:'Dog', right:'Собака'}, {left:'Cat', right:'Кошка'}, {left:'Bear', right:'Медведь'}] })
    ]},
    { id: 31, title: "English: Colors", description: "Цвета", category: "Lang", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('matching', "Цвета", "", { pairs: [{left:'Red', right:'Красный'}, {left:'Blue', right:'Синий'}, {left:'Green', right:'Зеленый'}] })
    ]},
    { id: 32, title: "English: Present Simple", description: "Простое настоящее", category: "Lang", rarity: "Rare", xp: 30, coins: 25, grades: [5,11], tasks: [
        t('quiz', "He ___ football", "", { options: ["plays", "play", "playing"], correctIndex: 0 }),
        t('quiz', "We ___ like pizza", "", { options: ["don't", "doesn't", "isn't"], correctIndex: 0 })
    ]},
    { id: 33, title: "English: Numbers", description: "Числа до 100", category: "Lang", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('text_input', "Напиши '10' словом", "ten", { acceptableAnswers: ["Ten"] }),
        t('text_input', "Напиши '5' словом", "five", { acceptableAnswers: ["Five"] })
    ]},
    { id: 34, title: "English: Irregular Verbs", description: "Неправильные глаголы", category: "Lang", rarity: "Epic", xp: 50, coins: 40, grades: [7,11], tasks: [
        t('matching', "Формы", "", { pairs: [{left:'Go', right:'Went'}, {left:'See', right:'Saw'}, {left:'Do', right:'Did'}] })
    ]},
    { id: 35, title: "English: Family", description: "Семья", category: "Lang", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Mother is...", "", { options: ["Мама", "Папа", "Сестра"], correctIndex: 0 }),
        t('quiz', "Uncle is...", "", { options: ["Дядя", "Брат", "Дед"], correctIndex: 0 })
    ]},
    { id: 36, title: "English: Days", description: "Дни недели", category: "Lang", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('ordering', "Порядок", "", { correctOrder: ["Monday", "Tuesday", "Wednesday"], shuffledItems: ["Wednesday", "Monday", "Tuesday"] })
    ]},

    // --- SCIENCE (37-46) ---
    { id: 37, title: "Биология: Клетка", description: "Строение клетки", category: "Science", rarity: "Rare", xp: 30, coins: 20, grades: [6,9], tasks: [
        t('quiz', "Центр клетки?", "", { options: ["Ядро", "Мембрана"], correctIndex: 0 }),
        t('matching', "Органоиды", "", { pairs: [{left:'Митохондрия', right:'Энергия'}, {left:'Рибосома', right:'Белок'}] })
    ]},
    { id: 38, title: "Физика: Скорость", description: "Формула пути", category: "Science", rarity: "Common", xp: 25, coins: 15, grades: [7,9], tasks: [
        t('quiz', "V = ?", "", { options: ["S / t", "S * t", "t / S"], correctIndex: 0 }),
        t('number_input', "S=100м, t=10с. V=?", "10", {})
    ]},
    { id: 39, title: "Химия: Вода", description: "Свойства H2O", category: "Science", rarity: "Common", xp: 20, coins: 15, grades: [8,11], tasks: [
        t('quiz', "Формула воды?", "", { options: ["H2O", "CO2", "O2"], correctIndex: 0 }),
        t('quiz', "Кипит при?", "", { options: ["100C", "90C", "0C"], correctIndex: 0 })
    ]},
    { id: 40, title: "Астрономия: Планеты", description: "Солнечная система", category: "Science", rarity: "Common", xp: 25, coins: 20, tasks: [
        t('ordering', "От Солнца", "", { correctOrder: ["Меркурий", "Венера", "Земля"], shuffledItems: ["Земля", "Меркурий", "Венера"] })
    ]},
    { id: 41, title: "География: Материки", description: "Карта мира", category: "Science", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Самый большой материк?", "", { options: ["Евразия", "Африка", "Америка"], correctIndex: 0 }),
        t('number_input', "Сколько всего материков?", "6", {})
    ]},
    { id: 42, title: "Природоведение: Царства", description: "Живая природа", category: "Science", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Грибы это растения?", "", { options: ["Нет", "Да"], correctIndex: 0 }),
        t('quiz', "Человек это животное?", "", { options: ["Да (млекопитающее)", "Нет"], correctIndex: 0 })
    ]},
    { id: 43, title: "Физика: Сила", description: "Законы Ньютона", category: "Science", rarity: "Epic", xp: 50, coins: 40, grades: [8,11], tasks: [
        t('quiz', "F = m * ?", "", { options: ["a", "g", "v"], correctIndex: 0 }),
        t('quiz', "Единица силы?", "", { options: ["Ньютон", "Джоуль", "Ватт"], correctIndex: 0 })
    ]},
    { id: 44, title: "Химия: Атомы", description: "Строение вещества", category: "Science", rarity: "Rare", xp: 35, coins: 25, grades: [8,11], tasks: [
        t('quiz', "Заряд электрона?", "", { options: ["Отрицательный", "Положительный"], correctIndex: 0 }),
        t('quiz', "В ядре находятся...", "", { options: ["Протоны и нейтроны", "Электроны"], correctIndex: 0 })
    ]},
    { id: 45, title: "Биология: Фотосинтез", description: "Как едят растения", category: "Science", rarity: "Rare", xp: 30, coins: 20, grades: [6,9], tasks: [
        t('quiz', "Растения выделяют...", "", { options: ["Кислород", "Углекислый газ"], correctIndex: 0 }),
        t('quiz', "Для фотосинтеза нужен...", "", { options: ["Свет", "Темнота"], correctIndex: 0 })
    ]},
    { id: 46, title: "Электричество: Основы", description: "Ток и напряжение", category: "Science", rarity: "Rare", xp: 35, coins: 25, grades: [8,11], tasks: [
        t('quiz', "Единица напряжения?", "", { options: ["Вольт", "Ампер"], correctIndex: 0 }),
        t('matching', "Приборы", "", { pairs: [{left:'Лампа', right:'Свет'}, {left:'Батарейка', right:'Источник'}] })
    ]},

    // --- HISTORY (47-54) ---
    { id: 47, title: "Древняя Русь: Даты", description: "Ключевые события", category: "History", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Крещение Руси?", "", { options: ["988", "1147", "1242"], correctIndex: 0 }),
        t('matching', "Князья", "", { pairs: [{left:'Владимир', right:'Креститель'}, {left:'Ярослав', right:'Мудрый'}] })
    ]},
    { id: 48, title: "Петр I", description: "Эпоха реформ", category: "History", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "Основал город...", "", { options: ["Санкт-Петербург", "Москва", "Казань"], correctIndex: 0 }),
        t('quiz', "Прорубил окно в...", "", { options: ["Европу", "Азию"], correctIndex: 0 })
    ]},
    { id: 49, title: "Великая Отечественная", description: "Память о главном", category: "History", rarity: "Epic", xp: 50, coins: 30, tasks: [
        t('quiz', "Начало войны?", "", { options: ["1941", "1939", "1945"], correctIndex: 0 }),
        t('quiz', "День Победы?", "", { options: ["9 Мая", "1 Мая", "23 Февраля"], correctIndex: 0 })
    ]},
    { id: 50, title: "Древний Египет", description: "Пирамиды и фараоны", category: "History", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Гробница фараона?", "", { options: ["Пирамида", "Зиккурат"], correctIndex: 0 }),
        t('quiz', "Река в Египте?", "", { options: ["Нил", "Волга", "Амазонка"], correctIndex: 0 })
    ]},
    { id: 51, title: "Первый полет", description: "Космос наш", category: "History", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Первый космонавт?", "", { options: ["Гагарин", "Титов", "Леонов"], correctIndex: 0 }),
        t('text_input', "Год полета?", "1961", {})
    ]},
    { id: 52, title: "Война 1812", description: "Бородино", category: "History", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "С кем воевали?", "", { options: ["Франция", "Германия"], correctIndex: 0 }),
        t('quiz', "Полководец русских?", "", { options: ["Кутузов", "Суворов"], correctIndex: 0 })
    ]},
    { id: 53, title: "Изобретения", description: "Прогресс человечества", category: "History", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('matching', "Авторы", "", { pairs: [{left:'Попов', right:'Радио'}, {left:'Менделеев', right:'Таблица'}, {left:'Белл', right:'Телефон'}] })
    ]},
    { id: 54, title: "Средневековье", description: "Рыцари и замки", category: "History", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('quiz', "Жилище феодала?", "", { options: ["Замок", "Пещера", "Небоскреб"], correctIndex: 0 }),
        t('yes_no', "Рыцари носили доспехи?", "yes")
    ]},

    // --- SPORT (55-64) ---
    { id: 55, title: "Спорт: Зарядка", description: "Разминка утром", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Утро", "", { checklistItems: [{id:'1', label: '10 приседаний'}, {id:'2', label: 'Потягивания'}]}),
        t('yes_no', "Бодрость есть?", "yes")
    ]},
    { id: 56, title: "Спорт: Вода", description: "Гидратация", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Вода", "", { checklistItems: [{id:'1', label: 'Стакан утром'}, {id:'2', label: 'Стакан в школе/днем'}, {id:'3', label: 'Стакан вечером'}]})
    ]},
    { id: 57, title: "Спорт: Планка", description: "Укрепление кора", category: "Sport", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('timer_challenge', "Держи планку", "done", { timerSeconds: 45 }),
        t('yes_no', "Выстоял?", "yes")
    ]},
    { id: 58, title: "Спорт: Отжимания", description: "Сила рук", category: "Sport", rarity: "Epic", xp: 50, coins: 30, tasks: [
        t('checklist', "Подходы", "", { checklistItems: [{id:'1', label: '5 раз'}, {id:'2', label: '10 раз'}, {id:'3', label: 'Максимум'}]})
    ]},
    { id: 59, title: "Спорт: Шаги", description: "Движение - жизнь", category: "Sport", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Прогулка", "", { checklistItems: [{id:'1', label: '30 минут на улице'}, {id:'2', label: 'Подъем по лестнице'}]})
    ]},
    { id: 60, title: "Спорт: Осанка", description: "Спина ровно", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Контроль", "", { checklistItems: [{id:'1', label: 'Проверил осанку'}, {id:'2', label: 'Размял плечи'}]})
    ]},
    { id: 61, title: "Спорт: Глаза", description: "Гимнастика для глаз", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Глаза", "", { checklistItems: [{id:'1', label: 'Влево-вправо 10 раз'}, {id:'2', label: 'Вдаль-вблизи 10 раз'}, {id:'3', label: 'Поморгать'}]})
    ]},
    { id: 62, title: "Спорт: Пресс", description: "Кубики", category: "Sport", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('checklist', "Скручивания", "", { checklistItems: [{id:'1', label: '20 раз'}, {id:'2', label: 'Отдых'}, {id:'3', label: '20 раз'}]})
    ]},
    { id: 63, title: "Спорт: Растяжка", description: "Гибкость", category: "Sport", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Тянемся", "", { checklistItems: [{id:'1', label: 'Наклон к полу'}, {id:'2', label: 'Тянем руки вверх'}]})
    ]},
    { id: 64, title: "Спорт: Дыхание", description: "Успокоение", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('timer_challenge', "Глубокий вдох-выдох", "done", { timerSeconds: 60 })
    ]},

    // --- SELF (65-74) ---
    { id: 65, title: "Уборка: Рабочий стол", description: "Порядок в вещах", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Стол", "", { checklistItems: [{id:'1', label: 'Убрал мусор'}, {id:'2', label: 'Сложил ручки'}, {id:'3', label: 'Протер пыль'}]})
    ]},
    { id: 66, title: "План на день", description: "Тайм-менеджмент", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Планирование", "", { checklistItems: [{id:'1', label: 'Написал 3 задачи'}, {id:'2', label: 'Оценил время'}]})
    ]},
    { id: 67, title: "Сбор портфеля", description: "Готовность к школе", category: "Self", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Рюкзак", "", { checklistItems: [{id:'1', label: 'Учебники по расписанию'}, {id:'2', label: 'Тетради'}, {id:'3', label: 'Пенал'}]})
    ]},
    { id: 68, title: "Метод Помидора", description: "25 минут работы", category: "Self", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('timer_challenge', "Фокус (без телефона)", "done", { timerSeconds: 25 }),
        t('yes_no', "Ни на что не отвлекался?", "yes")
    ]},
    { id: 69, title: "Режим сна", description: "Ложись вовремя", category: "Self", rarity: "Rare", xp: 40, coins: 30, tasks: [
        t('checklist', "Сон", "", { checklistItems: [{id:'1', label: 'Убрал телефон за час'}, {id:'2', label: 'Проветрил комнату'}, {id:'3', label: 'Лег до 23:00'}]})
    ]},
    { id: 70, title: "Чистка почты/телефона", description: "Цифровой порядок", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Цифра", "", { checklistItems: [{id:'1', label: 'Удалил 5 ненужных фото'}, {id:'2', label: 'Отписался от спама'}]})
    ]},
    { id: 71, title: "Чтение: Саморазвитие", description: "Умная статья или книга", category: "Self", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('yes_no', "Узнал что-то новое сегодня?", "yes"),
        t('text_input', "Тема?", "*", {})
    ]},
    { id: 72, title: "Дневник успеха", description: "Фиксация побед", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('text_input', "Твое главное достижение сегодня?", "*", {})
    ]},
    { id: 73, title: "Хобби: 15 минут", description: "Время для души", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Хобби", "", { checklistItems: [{id:'1', label: 'Порисовал/Поиграл/Собрал'}, {id:'2', label: 'Получил удовольствие'}]})
    ]},
    { id: 74, title: "Внешний вид", description: "Опрятность", category: "Self", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Одежда", "", { checklistItems: [{id:'1', label: 'Почистил обувь'}, {id:'2', label: 'Приготовил одежду на завтра'}]})
    ]},

    // --- SOCIAL (75-80) ---
    { id: 75, title: "Помощь родителям", description: "Вклад в семью", category: "Social", rarity: "Rare", xp: 40, coins: 30, tasks: [
        t('checklist', "Дом", "", { checklistItems: [{id:'1', label: 'Вынес мусор/Помыл посуду'}, {id:'2', label: 'Спросил как дела'}]})
    ]},
    { id: 76, title: "Комплимент", description: "Позитив", category: "Social", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Добро", "", { checklistItems: [{id:'1', label: 'Сказал приятное другу/родным'}]})
    ]},
    { id: 77, title: "Без телефона", description: "Живое общение", category: "Social", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('yes_no', "Пообщался 30 мин без гаджетов?", "yes")
    ]},
    { id: 78, title: "Звонок бабушке", description: "Связь поколений", category: "Social", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('checklist', "Звонок", "", { checklistItems: [{id:'1', label: 'Позвонил'}, {id:'2', label: 'Рассказал новости'}, {id:'3', label: 'Узнал здоровье'}]})
    ]},
    { id: 79, title: "Благодарность", description: "Спасибо", category: "Social", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('text_input', "Кому ты благодарен сегодня?", "*", {})
    ]},
    { id: 80, title: "Командная игра", description: "Взаимодействие", category: "Social", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('yes_no', "Сыграл или поработал в команде?", "yes")
    ]},

    // --- ECOLOGY (81-86) ---
    { id: 81, title: "Эко: Свет", description: "Экономия энергии", category: "Ecology", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Свет", "", { checklistItems: [{id:'1', label: 'Выключил свет, уходя'}, {id:'2', label: 'Выключил лишние приборы'}]})
    ]},
    { id: 82, title: "Эко: Вода", description: "Береги воду", category: "Ecology", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Кран", "", { checklistItems: [{id:'1', label: 'Выключал, когда чистил зубы'}]})
    ]},
    { id: 83, title: "Эко: Мусор", description: "Чистота природы", category: "Ecology", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('checklist', "Улица", "", { checklistItems: [{id:'1', label: 'Выбросил фантик в урну'}, {id:'2', label: 'Поднял чужой мусор (герой!)'}]})
    ]},
    { id: 84, title: "Эко: Пластик", description: "Меньше пакетов", category: "Ecology", rarity: "Rare", xp: 25, coins: 15, tasks: [
        t('yes_no', "Использовал многоразовую сумку/бутылку?", "yes")
    ]},
    { id: 85, title: "Эко: Растения", description: "Забота о флоре", category: "Ecology", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Полив", "", { checklistItems: [{id:'1', label: 'Полил цветок дома'}]})
    ]},
    { id: 86, title: "Эко: Батарейки", description: "Правильная утилизация", category: "Ecology", rarity: "Epic", xp: 50, coins: 30, tasks: [
        t('yes_no', "Не выбрасывал батарейки в обычный мусор?", "yes")
    ]},

    // --- FINANCE (87-92) ---
    { id: 87, title: "Фин: Копилка", description: "Накопления", category: "Finance", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Сбережения", "", { checklistItems: [{id:'1', label: 'Отложил монетку/купюру'}, {id:'2', label: 'Не потратил на ерунду'}]})
    ]},
    { id: 88, title: "Фин: Бюджет", description: "Учет трат", category: "Finance", rarity: "Rare", xp: 30, coins: 25, tasks: [
        t('checklist', "Учет", "", { checklistItems: [{id:'1', label: 'Записал расходы за день'}]})
    ]},
    { id: 89, title: "Фин: Сдача", description: "Математика денег", category: "Finance", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('number_input', "Купил за 35, дал 100. Сдача?", "65", {})
    ]},
    { id: 90, title: "Фин: Цель", description: "На что копишь?", category: "Finance", rarity: "Rare", xp: 25, coins: 20, tasks: [
        t('text_input', "Твоя финансовая цель?", "*", {})
    ]},
    { id: 91, title: "Фин: Валюта", description: "Курсы", category: "Finance", rarity: "Epic", xp: 40, coins: 30, tasks: [
        t('yes_no', "Знаешь примерный курс доллара/евро?", "yes")
    ]},
    { id: 92, title: "Фин: Доход", description: "Карманные деньги", category: "Finance", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('yes_no', "Выполнил условие для получения карманных денег?", "yes")
    ]},

    // --- IT (93-96) ---
    { id: 93, title: "IT: Пароль", description: "Безопасность", category: "IT", rarity: "Rare", xp: 30, coins: 25, tasks: [
        t('checklist', "Security", "", { checklistItems: [{id:'1', label: 'Пароль сложный (не 1234)'}, {id:'2', label: 'Никому не сказал'}]})
    ]},
    { id: 94, title: "IT: Горячие клавиши", description: "Скорость работы", category: "IT", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('matching', "Keys", "", { pairs: [{left:'Ctrl+C', right:'Копия'}, {left:'Ctrl+V', right:'Вставка'}, {left:'Ctrl+Z', right:'Отмена'}] })
    ]},
    { id: 95, title: "IT: Порядок файлов", description: "Рабочий стол", category: "IT", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Desktop", "", { checklistItems: [{id:'1', label: 'Удалил лишние файлы'}, {id:'2', label: 'Разложил по папкам'}]})
    ]},
    { id: 96, title: "IT: Слепая печать", description: "Тренировка", category: "IT", rarity: "Rare", xp: 35, coins: 30, tasks: [
        t('timer_challenge', "Печатай быстро: Hello World", "Hello World", { timerSeconds: 10, caseSensitive: false })
    ]},

    // --- ART (97-100) ---
    { id: 97, title: "Арт: Рисунок", description: "Творчество", category: "Art", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Скетч", "", { checklistItems: [{id:'1', label: 'Нарисовал набросок 5 мин'}]})
    ]},
    { id: 98, title: "Арт: Цвета", description: "Колористика", category: "Art", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Синий + Желтый = ?", "", { options: ["Зеленый", "Фиолетовый", "Оранжевый"], correctIndex: 0 }),
        t('quiz', "Красный + Синий = ?", "", { options: ["Фиолетовый", "Зеленый", "Коричневый"], correctIndex: 0 })
    ]},
    { id: 99, title: "Арт: Музыка", description: "Слух", category: "Art", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('yes_no', "Послушал любимую песню и подпел?", "yes")
    ]},
    { id: 100, title: "Арт: Креатив", description: "Создание нового", category: "Art", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('text_input', "Придумай название для книги", "*", {})
    ]}
];

// Map raw to full Quest object
const questsDatabase: Quest[] = rawQuests.map(q => {
    // Determine if it's a "Habit" (routine task) based on category
    const isHabitCategory = ['Sport', 'Self', 'Ecology', 'Social', 'Art'].includes(q.category);
    
    return {
        ...q,
        type: q.type || 'daily',
        isHabit: isHabitCategory, 
        completed: false,
        minMinutes: getMinMinutes(q.rarity)
    };
});

export const fetchQuests = createAsyncThunk('quests/fetchQuests', async (_, { getState }) => {
  const state = getState() as RootState;
  const user = state.user.currentUser;
  
  if (!user) return [];

  const userGrade = user.grade || 7; // Default grade

  // Filter by grade
  const filteredQuests = questsDatabase.filter(q => {
      if (!q.gradeRange) return true; // No restriction
      return userGrade >= q.gradeRange[0] && userGrade <= q.gradeRange[1];
  });

  return filteredQuests.map(q => {
    let isCompleted = false;
    
    // Check completion
    if (user.questHistory) {
        const history = user.questHistory
            .filter(h => h.questId === q.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (history.length > 0) {
            const lastCompletion = new Date(history[0].date);
            const now = new Date();

            if (q.type === 'story') {
                isCompleted = true;
            } else if (q.type === 'daily') {
                const diffMs = now.getTime() - lastCompletion.getTime();
                const hoursSinceCompletion = diffMs / (1000 * 60 * 60);
                if (hoursSinceCompletion < 24) isCompleted = true; 
            }
        }
    }

    return { ...q, completed: isCompleted };
  });
});

export const markQuestCompleted = createAsyncThunk('quests/complete', async (questId: number) => {
  return questId;
});

const questsSlice = createSlice({
  name: 'quests',
  initialState: { list: [], status: 'idle', error: null } as QuestsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(markQuestCompleted.fulfilled, (state, action) => {
        const quest = state.list.find(q => q.id === action.payload);
        if (quest) quest.completed = true;
      });
  },
});

export default questsSlice.reducer;
