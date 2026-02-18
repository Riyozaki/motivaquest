import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Quest, QuestRarity, StoryDay, Task, TaskType, QuestHistoryItem } from '../types';
import { RootState } from './index';
import { api, CompleteQuestPayload } from '../services/api';
import { toast } from 'react-toastify';
import { handleApiError } from './userSlice'; 
import { audio } from '../services/audio';

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

// --- CAMPAIGN DATA ---
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

// Fisher-Yates shuffle
const shuffle = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// Helper for task creation
const t = (type: TaskType, q: string, correct: string, opts?: any): Task => {
    const task: any = {
        id: Math.random(),
        type,
        question: q,
        correctAnswer: correct,
        ...opts
    };

    // Auto-generate shuffled items for ordering tasks if not provided
    if (type === 'ordering' && task.correctOrder && !task.shuffledItems) {
        task.shuffledItems = shuffle(task.correctOrder);
    }

    return task;
};

// --- QUEST DATABASE ---
const rawQuests: any[] = [
    // --- DAY 1: MATH ---
    { id: 1, title: "Быстрый счет: Таблица x7", description: "Вспомни таблицу умножения", category: "Math", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('timer_challenge', "7 × 6 = ?", "42", { timerSeconds: 15 }),
        t('timer_challenge', "7 × 8 = ?", "56", { timerSeconds: 15 }),
        t('timer_challenge', "7 × 9 = ?", "63", { timerSeconds: 15 })
    ]},
    { id: 55, title: "Спорт: Зарядка", description: "Разминка утром", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Утро", "", { checklistItems: [{id:'1', label: '10 приседаний'}, {id:'2', label: 'Потягивания'}]}),
        t('yes_no', "Бодрость есть?", "yes")
    ]},
    { id: 65, title: "Уборка: Рабочий стол", description: "Порядок в вещах", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Стол", "", { checklistItems: [{id:'1', label: 'Убрал мусор'}, {id:'2', label: 'Сложил ручки'}, {id:'3', label: 'Протер пыль'}]})
    ]},

    // --- DAY 2: DISCIPLINE ---
    { id: 66, title: "Режим дня", description: "Построй свой график", category: "Self", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "План", "", { checklistItems: [{id:'1', label: 'Собрал рюкзак с вечера'}, {id:'2', label: 'Одежда на завтра готова'}, {id:'3', label: 'Завел будильник'}] })
    ]},
    { id: 75, title: "Дневник благодарности", description: "Позитивное мышление", category: "Self", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('text_input', "Напиши одну вещь, за которую ты благодарен сегодня", "*", {})
    ]},
    { id: 56, title: "Спорт: Вода", description: "Гидратация", category: "Sport", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('checklist', "Вода", "", { checklistItems: [{id:'1', label: 'Стакан утром'}, {id:'2', label: 'Стакан в школе/днем'}, {id:'3', label: 'Стакан вечером'}]})
    ]},

    // --- DAY 3: MATH & ECO ---
    { id: 2, title: "Дроби: Сложение", description: "Сложи простые дроби", category: "Math", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "1/2 + 1/4 = ?", "", { options: ["3/4", "2/6", "1/6", "2/4"], correctIndex: 0 }),
        t('number_input', "Числитель 3/5 + 1/5?", "4", {})
    ]},
    { id: 3, title: "Проценты: Скидки", description: "Посчитай выгоду", category: "Math", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('timer_challenge', "Цена 100, скидка 20%. Итог?", "80", { timerSeconds: 20 }),
        t('timer_challenge', "50% от 400?", "200", { timerSeconds: 15 })
    ]},
    { id: 57, title: "Лесная Экология", description: "Раздельный сбор", category: "Ecology", rarity: "Common", xp: 25, coins: 15, tasks: [
        t('matching', "Сортировка", "", { pairs: [{left: 'Батарейки', right: 'Опасные отходы'}, {left: 'Бумага', right: 'Макулатура'}, {left: 'Яблоко', right: 'Компост'}] }),
        t('quiz', "Сколько разлагается пластик?", "", { options: ["50 лет", "100 лет", "400+ лет", "1 год"], correctIndex: 2 })
    ]},

    // --- DAY 4: RUSSIAN ---
    { id: 11, title: "Жи/Ши", description: "Основы правописания", category: "Russian", rarity: "Common", xp: 15, coins: 10, tasks: [
        t('quiz', "Какое слово верное?", "", { options: ["Шина", "Шына"], correctIndex: 0 }),
        t('quiz', "Какое слово верное?", "", { options: ["Жизнь", "Жызнь"], correctIndex: 0 })
    ]},
    { id: 21, title: "Ударения", description: "Говори правильно", category: "Russian", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "Правильное ударение?", "", { options: ["звонИт", "звОнит"], correctIndex: 0 }),
        t('quiz', "Правильное ударение?", "", { options: ["тОрты", "тортЫ"], correctIndex: 0 }),
        t('quiz', "Правильное ударение?", "", { options: ["красИвее", "красивЕе"], correctIndex: 0 })
    ]},
    { id: 67, title: "Скорочтение", description: "Работа с текстом", category: "Literature", rarity: "Epic", xp: 40, coins: 30, tasks: [
        t('timer_challenge', "Прочитай стр. книги за 2 мин", "готово", { timerSeconds: 120, acceptableAnswers: ["готово", "да", "сделал"] }),
        t('text_input', "О чем была страница (кратко)?", "*", {})
    ]},

    // --- DAY 5: SCIENCE ---
    { id: 37, title: "Фотосинтез", description: "Как дышат растения", category: "Science", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('ordering', "Процесс", "", { shuffledItems: ["Солнце светит", "Лист поглощает свет", "Выделяется кислород"], correctOrder: ["Солнце светит", "Лист поглощает свет", "Выделяется кислород"] }),
        t('quiz', "Что поглощают растения?", "", { options: ["Кислород", "Углекислый газ", "Азот"], correctIndex: 1 })
    ]},
    { id: 81, title: "Агрегатные состояния", description: "Физика воды", category: "Science", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('matching', "Состояния", "", { pairs: [{left: 'Лёд', right: 'Твердое'}, {left: 'Пар', right: 'Газообразное'}, {left: 'Вода', right: 'Жидкое'}] }),
        t('number_input', "Температура кипения воды (С)?", "100", {})
    ]},
    { id: 4, title: "Геометрия: Площадь", description: "Найди площадь фигур", category: "Math", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('number_input', "Прямоугольник 5x8. Площадь?", "40", {}),
        t('number_input', "Квадрат со стороной 6. Площадь?", "36", {})
    ]},

    // --- DAY 6: PHYSICS & SPORT ---
    { id: 38, title: "Сила и Движение", description: "Законы Ньютона", category: "Science", rarity: "Epic", xp: 45, coins: 35, tasks: [
        t('quiz', "Формула силы?", "", { options: ["F = m*a", "F = m/a", "F = m+a"], correctIndex: 0 }),
        t('quiz', "Сила притяжения Земли - это...", "", { options: ["Трение", "Гравитация", "Инерция"], correctIndex: 1 }),
        t('yes_no', "Тяжелее ли 1кг ваты чем 1кг железа?", "no")
    ]},
    { id: 58, title: "Выносливость: Планка", description: "Укрепи кор", category: "Sport", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('timer_challenge', "Стой в планке!", "да", { timerSeconds: 45, acceptableAnswers: ["да", "сделал", "готово"] })
    ]},
    { id: 5, title: "Уравнения: Найти X", description: "Реши линейные уравнения", category: "Math", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('timer_challenge', "2x + 10 = 20. x=?", "5", { timerSeconds: 30 }),
        t('timer_challenge', "3x - 5 = 10. x=?", "5", { timerSeconds: 30 })
    ]},

    // --- DAY 7: ENGLISH & LOGIC ---
    { id: 29, title: "Irregular Verbs", description: "Неправильные глаголы", category: "Lang", rarity: "Rare", xp: 30, coins: 25, tasks: [
        t('matching', "Forms", "", { pairs: [{left: 'Go', right: 'Went'}, {left: 'See', right: 'Saw'}, {left: 'Buy', right: 'Bought'}] }),
        t('text_input', "Past simple of 'Do'?", "did", {})
    ]},
    { id: 93, title: "Загадки Мудреца", description: "Тренировка ума", category: "Math", rarity: "Epic", xp: 40, coins: 30, tasks: [
        t('text_input', "Что идет, не двигаясь с места?", "время", { acceptableAnswers: ["часы", "время", "жизнь"] }),
        t('quiz', "У отца Мэри 5 дочерей: Чача, Чече, Чичи, Чочо. Как зовут пятую?", "", { options: ["Чучу", "Мэри", "Чича"], correctIndex: 1 })
    ]},
    { id: 6, title: "Логика: Ряды чисел", description: "Продолжи последовательность", category: "Math", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('quiz', "2, 4, 8, 16...?", "", { options: ["32", "24", "30"], correctIndex: 0 }),
        t('quiz', "1, 1, 2, 3, 5...?", "", { options: ["8", "7", "6"], correctIndex: 0 })
    ]},

    // --- DAY 8: MULTITASKING ---
    { id: 59, title: "Координация: Берпи", description: "Сложное упражнение", category: "Sport", rarity: "Epic", xp: 45, coins: 30, tasks: [
        t('timer_challenge', "Сделай 5 берпи", "да", { timerSeconds: 40, acceptableAnswers: ["да", "готово"] }),
        t('yes_no', "Пульс участился?", "yes")
    ]},
    { id: 12, title: "Тся/Ться", description: "Мягкий знак в глаголах", category: "Russian", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('quiz', "Он (что делает?)", "", { options: ["Учится", "Учиться"], correctIndex: 0 }),
        t('quiz', "Надо (что делать?)", "", { options: ["Учиться", "Учится"], correctIndex: 0 })
    ]},
    { id: 68, title: "Планирование", description: "Матрица Эйзенхауэра", category: "Self", rarity: "Epic", xp: 40, coins: 35, tasks: [
        t('quiz', "Срочное и Важное - это...", "", { options: ["Сделать сейчас", "Делегировать", "Отложить"], correctIndex: 0 }),
        t('quiz', "Не срочное, но Важное - это...", "", { options: ["Запланировать", "Удалить", "Сделать сейчас"], correctIndex: 0 })
    ]},

    // --- DAY 9: HISTORY ---
    { id: 47, title: "Правители Руси", description: "Хронология", category: "History", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('ordering', "Порядок правления", "", { shuffledItems: ["Петр I", "Иван Грозный", "Николай II", "Екатерина II"], correctOrder: ["Иван Грозный", "Петр I", "Екатерина II", "Николай II"] })
    ]},
    { id: 48, title: "Великие Открытия", description: "Кто что открыл?", category: "History", rarity: "Epic", xp: 40, coins: 30, tasks: [
        t('matching', "Открытия", "", { pairs: [{left: 'Колумб', right: 'Америка'}, {left: 'Гагарин', right: 'Космос'}, {left: 'Менделеев', right: 'Таблица элементов'}] }),
        t('number_input', "В каком году Гагарин полетел в космос?", "1961", {})
    ]},
    { id: 69, title: "Режим сна", description: "Ложись вовремя", category: "Self", rarity: "Rare", xp: 40, coins: 30, tasks: [
        t('checklist', "Сон", "", { checklistItems: [{id:'1', label: 'Убрал телефон за час'}, {id:'2', label: 'Проветрил комнату'}, {id:'3', label: 'Лег до 23:00'}]})
    ]},

    // --- DAY 10: LITERATURE ---
    { id: 22, title: "Герои Книг", description: "Кто написал?", category: "Literature", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('matching', "Автор - Герой", "", { pairs: [{left: 'Пушкин', right: 'Онегин'}, {left: 'Лермонтов', right: 'Печорин'}, {left: 'Толстой', right: 'Пьер Безухов'}] })
    ]},
    { id: 23, title: "Стихотворные размеры", description: "Ритм поэзии", category: "Literature", rarity: "Legendary", xp: 60, coins: 50, tasks: [
        t('quiz', "Ударный, Безударный (2 слога)", "", { options: ["Хорей", "Ямб"], correctIndex: 0 }),
        t('quiz', "Безударный, Ударный (2 слога)", "", { options: ["Ямб", "Хорей"], correctIndex: 0 }),
        t('quiz', "Мой дЯдя сАмых чЕстных прАвил...", "", { options: ["Ямб", "Дактиль", "Хорей"], correctIndex: 0 })
    ]},
    { id: 76, title: "Ораторское искусство", description: "Речь и дикция", category: "Literature", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('timer_challenge', "Скажи скороговорку: 'Шла Саша по шоссе' 3 раза", "да", { timerSeconds: 15, acceptableAnswers: ["да", "готово"] }),
        t('yes_no', "Получилось без запинки?", "yes")
    ]},

    // --- DAY 11: FINANCE ---
    { id: 87, title: "Бюджет Героя", description: "Доходы и расходы", category: "Finance", rarity: "Rare", xp: 35, coins: 25, tasks: [
        t('quiz', "Карманные деньги - это...", "", { options: ["Доход", "Расход"], correctIndex: 0 }),
        t('quiz', "Покупка игры - это...", "", { options: ["Расход", "Инвестиция", "Доход"], correctIndex: 0 }),
        t('number_input', "Было 500, потратил 150. Остаток?", "350", {})
    ]},
    { id: 88, title: "Копилка", description: "Финансовая цель", category: "Finance", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Цель", "", { checklistItems: [{id:'1', label: 'Придумай цель накопления'}, {id:'2', label: 'Отложи 10% от имеющихся денег'}] })
    ]},
    { id: 70, title: "SMART Цели", description: "Умное планирование", category: "Self", rarity: "Epic", xp: 45, coins: 35, tasks: [
        t('ordering', "Расшифруй SMART", "", { shuffledItems: ["Measurable (Измеримая)", "Specific (Конкретная)", "Achievable (Достижимая)"], correctOrder: ["Specific (Конкретная)", "Measurable (Измеримая)", "Achievable (Достижимая)"] }),
        t('quiz', "Какая цель SMART?", "", { options: ["Хочу быть богатым", "Накопить 1000р к пятнице"], correctIndex: 1 })
    ]},

    // --- DAY 12: BIO & ECO ---
    { id: 39, title: "Анатомия Человека", description: "Твое тело", category: "Science", rarity: "Epic", xp: 40, coins: 30, tasks: [
        t('matching', "Орган - Функция", "", { pairs: [{left: 'Сердце', right: 'Качает кровь'}, {left: 'Легкие', right: 'Дыхание'}, {left: 'Желудок', right: 'Переваривание'}] }),
        t('number_input', "Сколько камер в сердце человека?", "4", {})
    ]},
    { id: 82, title: "Пищевые Цепочки", description: "Экосистема", category: "Ecology", rarity: "Rare", xp: 30, coins: 20, tasks: [
        t('ordering', "Цепочка", "", { shuffledItems: ["Волк", "Трава", "Заяц"], correctOrder: ["Трава", "Заяц", "Волк"] }),
        t('quiz', "Кто здесь продуцент (производитель)?", "", { options: ["Трава", "Волк", "Гриб"], correctIndex: 0 })
    ]},
    { id: 60, title: "Спорт: Растяжка", description: "Гибкость", category: "Sport", rarity: "Common", xp: 20, coins: 15, tasks: [
        t('checklist', "Комплекс", "", { checklistItems: [{id:'1', label: 'Наклоны к полу (10 раз)'}, {id:'2', label: 'Тянем руки вверх'}] })
    ]},

    // --- DAY 13: IT & LOGIC ---
    { id: 94, title: "Алгоритмы", description: "Порядок действий", category: "IT", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('ordering', "Алгоритм: Чай", "", { shuffledItems: ["Налить кипяток", "Вскипятить воду", "Положить пакетик"], correctOrder: ["Вскипятить воду", "Положить пакетик", "Налить кипяток"] }),
        t('quiz', "Что такое цикл?", "", { options: ["Повторение действий", "Остановка программы", "Ошибка"], correctIndex: 0 })
    ]},
    { id: 95, title: "Двоичный Код", description: "Язык машин", category: "IT", rarity: "Legendary", xp: 60, coins: 50, tasks: [
        t('quiz', "101 в десятичной системе?", "", { options: ["5", "3", "4", "6"], correctIndex: 0 }),
        t('quiz', "1 байт = ? бит", "", { options: ["8", "10", "16", "4"], correctIndex: 0 }),
        t('matching', "Бит", "", { pairs: [{left: '0', right: 'Выкл'}, {left: '1', right: 'Вкл'}] })
    ]},
    { id: 7, title: "Степени двойки", description: "Информатика и математика", category: "Math", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('matching', "Степени", "", { pairs: [{left:'2^3', right:'8'}, {left:'2^5', right:'32'}, {left:'2^10', right:'1024'}] })
    ]},

    // --- DAY 14: BOSS & FINAL ---
    { id: 74, title: "Рефлексия", description: "Оглянись назад", category: "Self", rarity: "Rare", xp: 40, coins: 30, tasks: [
        t('text_input', "Чему главному ты научился за 2 недели?", "*", {}),
        t('yes_no', "Гордишься собой?", "yes")
    ]},
    { id: 100, title: "Арт: Креатив", description: "Создание нового", category: "Art", rarity: "Epic", xp: 50, coins: 40, tasks: [
        t('text_input', "Придумай девиз своего героя", "*", {})
    ]},
    { id: 71, title: "План Будущего", description: "Что дальше?", category: "Self", rarity: "Legendary", xp: 100, coins: 100, tasks: [
        t('checklist', "План", "", { checklistItems: [{id:'1', label: 'Выбрать новую цель'}, {id:'2', label: 'Не бросать привычки'}, {id:'3', label: 'Победить Босса'}] })
    ]},
    
    // --- Additional Pool Quests ---
    { id: 8, title: "Отрицательные числа", description: "Сложение и вычитание", category: "Math", rarity: "Common", xp: 20, coins: 15, tasks: [
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
];

// Map raw to full Quest object
const questsDatabase: Quest[] = rawQuests.map(q => {
    // Only specific IDs are treated as recurring Habits
    // 55: Зарядка, 65: Уборка, 69: Режим сна
    const HABIT_IDS = [55, 65, 69];
    const isHabit = HABIT_IDS.includes(q.id);
    
    // Auto-assign difficulty based on rarity
    let difficulty = q.difficulty;
    if (!difficulty) {
        if (q.rarity === 'Common') difficulty = 'Easy';
        else if (q.rarity === 'Rare') difficulty = 'Medium';
        else difficulty = 'Hard';
    }

    // Map legacy 'grades' to 'gradeRange'
    let gradeRange = q.gradeRange;
    if (q.grades) {
        gradeRange = q.grades;
    }

    return {
        ...q,
        type: q.type || 'daily',
        isHabit, 
        completed: false,
        minMinutes: getMinMinutes(q.rarity),
        difficulty,
        gradeRange
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

export const completeQuestAction = createAsyncThunk(
    'quests/completeQuestAction',
    async (payload: { quest: Quest, multiplier?: number }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return rejectWithValue("No user");
        
        const { quest, multiplier = 1 } = payload;
        
        const dailyLimit = 15;
        if ((user.dailyCompletionsCount || 0) >= dailyLimit) {
            throw new Error("Энергия иссякла! (Лимит квестов на сегодня исчерпан)");
        }

        // --- HERO CLASS BONUSES ---
        let classMultiplierXp = 1;
        let classMultiplierCoins = 1;
        let bonusName = '';

        if (user.heroClass) {
            if (user.heroClass === 'warrior' && quest.category === 'Sport') { classMultiplierXp = 1.1; bonusName = 'Воин'; } 
            else if (user.heroClass === 'mage' && (quest.category === 'Math' || quest.category === 'Science')) { classMultiplierXp = 1.1; bonusName = 'Маг'; } 
            else if (user.heroClass === 'ranger' && (quest.category === 'Social' || quest.category === 'Ecology')) { classMultiplierXp = 1.1; bonusName = 'Следопыт'; } 
            else if (user.heroClass === 'healer' && quest.category === 'Self') { classMultiplierCoins = 1.1; bonusName = 'Целитель'; }
        }

        let xpReward = Math.floor(quest.xp * multiplier * classMultiplierXp);
        let coinsReward = Math.floor(quest.coins * multiplier * classMultiplierCoins);
        const hpLost = multiplier < 0.5 ? 5 : 0; // Penalty for bad performance

        // Calculate potential new levels
        let currentLevel = user.level || 1;
        let currentXp = user.currentXp || 0;
        let nextLevelXp = user.nextLevelXp || 100 * Math.pow(1.5, currentLevel - 1);
        let newXpTotal = currentXp + xpReward;
        
        // This calculation is purely for API payload; reducer does its own for state
        while (newXpTotal >= nextLevelXp) {
            newXpTotal -= nextLevelXp;
            currentLevel++;
            nextLevelXp = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
        }

        if (bonusName) toast.success(`Бонус класса (${bonusName}): +10%`);
        if (hpLost > 0) toast.error(`Потеряно ${hpLost} HP из-за низкого качества!`);

        const historyItem: QuestHistoryItem = { 
            questId: quest.id, 
            questTitle: quest.title, 
            xpEarned: xpReward,
            coinsEarned: coinsReward, // Add this
            date: new Date().toISOString(),
            score: multiplier,
            category: quest.category
        };
        
        // Call Extended API
        try {
            const apiPayload: CompleteQuestPayload = {
                email: user.email,
                questId: quest.id,
                questName: quest.title,
                category: quest.category,
                rarity: quest.rarity,
                score: multiplier, 
                multiplier: multiplier,
                xpEarned: xpReward,
                coinsEarned: coinsReward,
                hpLost: hpLost,
                questHistoryEntry: historyItem,
                newLevel: currentLevel,
                newXp: newXpTotal,
                newNextLevelXp: nextLevelXp,
                newCoins: (user.coins || 0) + coinsReward
            };
            await api.completeQuest(apiPayload);
            audio.playQuestComplete();
        } catch (e) { handleApiError(e); }
        
        return { 
            quest, 
            historyItem, 
            xpReward, 
            coinsReward, 
            hpLost 
        };
    }
);

export const markQuestCompleted = createAsyncThunk('quests/markCompleted', async (questId: number) => {
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