import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Quest, QuestRarity } from '../types';

interface QuestsState {
  list: Quest[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastResetDate: string | null;
}

const STORAGE_KEY_QUESTS = 'motiva_quests_progress';
const STORAGE_KEY_RESET_DATE = 'motiva_quests_reset_date';

// Helper to create task
const t = (q: string = "Выполнено?", a: string = "да") => [{ id: 1, question: q, correctAnswer: a }];

const getMinMinutes = (rarity: QuestRarity): number => {
    switch(rarity) {
        case 'Common': return 1; // 1 min
        case 'Rare': return 5; // 5 min
        case 'Epic': return 15; // 15 min
        case 'Legendary': return 30; // 30 min
        default: return 1;
    }
};

// Raw Quest Data
const rawQuests: Omit<Quest, 'minMinutes'>[] = [
    // --- COMMON (1-55) ---
    { id: 1, title: "English Recall", description: "Повторить 5–10 слов по английскому из прошлых уроков", category: "Lang", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 2, title: "Сбор Героя", description: "Собрать портфель на завтра (все учебники, тетради, ручки)", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 3, title: "Разведка ДЗ", description: "Проверить, есть ли домашка по всем предметам на завтра", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 4, title: "План Битвы", description: "Записать расписание уроков на завтра в тетрадь/телефон", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 5, title: "Чистый Алтарь", description: "Убрать рабочее место (стол, полки)", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 6, title: "Стопка Знаний", description: "Сложить все тетради и учебники в аккуратную стопку", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 7, title: "Устранение Хаоса", description: "Выкинуть/убрать мусор со стола", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 8, title: "Борьба с Пылью", description: "Протереть стол от пыли", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 9, title: "Лагерь Сна", description: "Заправить кровать", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 10, title: "Склад Доспехов", description: "Сложить одежду на стул или в шкаф", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 11, title: "Вынос Мусора", description: "Вынести мусор из своей комнаты", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 12, title: "Разбор Добычи", description: "Разобрать рюкзак сразу после школы", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 13, title: "Заряд Энергии", description: "Поставить на зарядку телефон/ноутбук", category: "IT", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 14, title: "Порядок в Проводах", description: "Положить зарядное устройство на место", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 15, title: "Стиль Завтрашнего Дня", description: "Выбрать одежду на завтра", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 16, title: "Вторая Обувь", description: "Подготовить сменную обувь/спортивную форму", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 17, title: "Припасы", description: "Проверить, чтобы завтра был обед/перекус в портфеле", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 18, title: "Стратег", description: "Записать в планёр, что нужно сделать завтра", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 19, title: "Режим Тьмы", description: "Выключить свет/компьютер вовремя перед сном", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 20, title: "Аккуратность", description: "Сложить вещи в шкаф после переодевания", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 21, title: "Чистая Тарелка", description: "Убрать посуду после еды", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 22, title: "Живая Вода", description: "Выпить стакан воды сразу после пробуждения", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 23, title: "Дыхание Дракона", description: "Сделать 5–10 глубоких вдохов-выдохов", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 24, title: "Витаминный Удар", description: "Съесть фрукт или овощ", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 25, title: "Сияющая Улыбка", description: "Почистить зубы два раза в день (утром и вечером)", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 26, title: "Водные Процедуры", description: "Принять душ", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 27, title: "Осанка Короля", description: "Посидеть с прямой спиной 30 мин за уроками", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 28, title: "Разминка", description: "Встать и пройтись каждые 45 мин учёбы", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 29, title: "Благодарность", description: "Сказать спасибо кому-то (родителям, другу, учителю)", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 30, title: "Приветствие", description: "Улыбнуться и поздороваться с кем-то", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 31, title: "English Prepositions", description: "Выучить 5 предлогов/глаголов по английскому", category: "Lang", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t("In, on, at...?", "да") },
    { id: 32, title: "Синонимы", description: "Написать 5 синонимов/антонимов к словам", category: "Russian", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t("Добро - ...?", "зло") },
    { id: 33, title: "Математика Памяти", description: "Повторить таблицу умножения (или часть)", category: "Math", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t("7x8?", "56") },
    { id: 34, title: "Географ", description: "Назвать и показать на карте 5 стран/городов", category: "History", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 35, title: "Терминология", description: "Выучить определение одного понятия", category: "Science", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 36, title: "Присед", description: "Сделать 10–20 приседаний", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 37, title: "Отжимания", description: "Сделать 10–20 отжиманий (от пола или стены)", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 38, title: "Прогулка", description: "Пройти 1000–2000 шагов (прогулка 10–15 мин)", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 39, title: "Полезный Завтрак", description: "Съесть кашу, яйца или йогурт утром", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 40, title: "Воля", description: "Не есть сладкое/чипсы до обеда", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 41, title: "Без 'Еще 5 минут'", description: "Проснуться сразу по будильнику", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 42, title: "Гибкость", description: "Сделать растяжку 5–10 мин", category: "Sport", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 43, title: "Комплимент", description: "Написать или сказать комплимент другу", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 44, title: "Связь с Базой", description: "Позвонить/написать родителям 'я дома'", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 45, title: "Чистая Речь", description: "Не ругаться плохими словами весь день", category: "Social", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 46, title: "Позитив", description: "Сказать 'я постараюсь' вместо 'не могу'", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 47, title: "Био-Блиц", description: "Повторить 5 терминов по биологии", category: "Science", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 48, title: "Законы Природы", description: "Повторить 3–5 законов физики/химии", category: "Science", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 49, title: "Грамотей", description: "Повторить 5 правил орфографии/пунктуации", category: "Russian", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 50, title: "Гео-Термины", description: "Выучить 3–5 географических терминов", category: "History", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 51, title: "Спидран", description: "Сделать 5–10 примеров на скорость", category: "Math", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 52, title: "Логика", description: "Решить 3–5 логических задач или загадок", category: "Math", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 53, title: "Каллиграфия", description: "Переписать конспект урока красиво", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 54, title: "Любопытство", description: "Подготовить 5 вопросов к учителю по теме", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },
    { id: 55, title: "Микро-Цель", description: "Записать одну маленькую цель на завтра", category: "Self", difficulty: "Easy", rarity: "Common", xp: 15, coins: 10, completed: false, type: "daily", tasks: t() },

    // --- RARE (56-80) ---
    { id: 56, title: "ДЗ: Математика", description: "Сделать домашнее задание по математике", category: "Math", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 57, title: "ДЗ: Русский", description: "Сделать домашнее задание по русскому языку", category: "Russian", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 58, title: "ДЗ: Физика", description: "Сделать домашнее задание по физике", category: "Science", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 59, title: "ДЗ: Химия", description: "Сделать домашнее задание по химии", category: "Science", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 60, title: "ДЗ: Биология", description: "Сделать домашнее задание по биологии", category: "Science", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 61, title: "ДЗ: История", description: "Сделать домашнее задание по истории", category: "History", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 62, title: "ДЗ: Общество", description: "Сделать домашнее задание по обществознанию", category: "History", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 63, title: "Чтение", description: "Прочитать параграф по литературе", category: "Literature", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 64, title: "Конспект", description: "Сделать конспект одного параграфа из любого предмета", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 65, title: "Повторение", description: "Повторить материал вчерашнего урока по любому предмету", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 66, title: "Ответ у Доски", description: "Подготовить ответ на возможный вопрос учителя", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 67, title: "ДЗ: Информатика", description: "Сделать домашнее задание по информатике/технологии", category: "IT", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 68, title: "Рабочая Тетрадь", description: "Сделать 5–10 заданий из рабочей тетради", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 69, title: "Зарядка", description: "Сделать зарядку утром (5–10 мин)", category: "Sport", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 70, title: "Свежий Воздух", description: "Сделать 10–15 минут перерыва на прогулку", category: "Sport", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 71, title: "Помощник", description: "Помочь по дому (помыть посуду, вынести мусор)", category: "Social", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 72, title: "Благодарность X3", description: "Записать 3 вещи, за которых благодарен сегодня", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 73, title: "Книжный Червь", description: "Прочитать 10 страниц учебника по любому предмету", category: "Self", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 74, title: "Теорема", description: "Выучить одну теорему или правило по математике", category: "Math", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 75, title: "Практика", description: "Решить 5–10 примеров по математике", category: "Math", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 76, title: "New Words", description: "Выучить 5–10 новых слов по английскому", category: "Lang", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 77, title: "Translator", description: "Перевести 5–10 предложений с русского на английский", category: "Lang", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 78, title: "Элементы", description: "Выучить 5 химических элементов или реакций", category: "Science", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 79, title: "Даты", description: "Выучить 3–5 дат и событий по истории", category: "History", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },
    { id: 80, title: "Синтаксис", description: "Сделать разбор одного предложения", category: "Russian", difficulty: "Medium", rarity: "Rare", xp: 30, coins: 20, completed: false, type: "daily", tasks: t() },

    // --- EPIC (81-95) ---
    { id: 81, title: "Формулы", description: "Повторить 5–10 формул по алгебре/геометрии", category: "Math", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 82, title: "Физик-Практик", description: "Решить 3–5 задач по физике", category: "Science", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 83, title: "Схема Жизни", description: "Нарисовать схему или рисунок по биологии/химии", category: "Science", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 84, title: "Пересказ", description: "Пересказать своими словами один эпизод из произведения", category: "Literature", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 85, title: "Поэзия", description: "Выучить 5–10 строк стихотворения", category: "Literature", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 86, title: "Литература", description: "Прочитать 1–2 страницы художественной книги", category: "Literature", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 87, title: "Режим Сна", description: "Лечь спать до 23:00", category: "Self", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 88, title: "Доброе Дело", description: "Сделать одно доброе дело (поделиться, помочь)", category: "Social", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 89, title: "Гидратация", description: "Выпить 1,5–2 литра воды за день", category: "Sport", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 90, title: "Здоровый Обед", description: "Съесть нормальный обед (не фастфуд)", category: "Sport", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 91, title: "Анализ Текста", description: "Прочитать и выделить главное в параграфе", category: "Self", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 92, title: "Сложная Задача", description: "Решить одну задачу повышенной сложности", category: "Math", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 93, title: "Генеральная Уборка", description: "Полный убор комнаты (стол + полки + пол)", category: "Self", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 94, title: "Двойной Удар", description: "Сделать домашку по 2 предметам", category: "Self", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },
    { id: 95, title: "Полное Погружение", description: "Повторить урок целиком по одному предмету", category: "Self", difficulty: "Hard", rarity: "Epic", xp: 70, coins: 50, completed: false, type: "daily", tasks: t() },

    // --- LEGENDARY (96-100) ---
    { id: 96, title: "Магистр Домашки", description: "Сделать домашнее задание по всем предметам на завтра", category: "Self", difficulty: "Hard", rarity: "Legendary", xp: 200, coins: 150, completed: false, type: "story", tasks: t() },
    { id: 97, title: "Книжный Герой", description: "Прочитать 50 страниц учебника или книги", category: "Literature", difficulty: "Hard", rarity: "Legendary", xp: 200, coins: 150, completed: false, type: "story", tasks: t() },
    { id: 98, title: "Атлет", description: "Сделать зарядку + прогулка + растяжка (полный спорт-день)", category: "Sport", difficulty: "Hard", rarity: "Legendary", xp: 200, coins: 150, completed: false, type: "story", tasks: t() },
    { id: 99, title: "Властелин Времени", description: "Организовать весь день: портфель + уборка + план + домашка", category: "Self", difficulty: "Hard", rarity: "Legendary", xp: 200, coins: 150, completed: false, type: "story", tasks: t() },
    { id: 100, title: "Закрытие Долгов", description: "Сделать всю отложенную домашку за неделю", category: "Self", difficulty: "Hard", rarity: "Legendary", xp: 200, coins: 150, completed: false, type: "story", tasks: t() },
];

const initialQuests: Quest[] = rawQuests.map(q => ({
    ...q,
    minMinutes: getMinMinutes(q.rarity)
}));

export const fetchQuests = createAsyncThunk('quests/fetchQuests', async () => {
  const now = new Date();
  const todayDateString = now.toDateString(); 
  
  const storedProgress = localStorage.getItem(STORAGE_KEY_QUESTS);
  const lastResetDate = localStorage.getItem(STORAGE_KEY_RESET_DATE);
  
  let parsedProgress: Record<number, boolean> = {};
  if (storedProgress) {
      parsedProgress = JSON.parse(storedProgress);
  }

  let needsReset = false;
  if (lastResetDate !== todayDateString) {
    needsReset = true;
    localStorage.setItem(STORAGE_KEY_RESET_DATE, todayDateString);
  }

  const quests = initialQuests.map(q => {
    let isCompleted = !!parsedProgress[q.id];
    
    if (q.type === 'daily' && needsReset) {
      isCompleted = false;
      if (parsedProgress[q.id]) {
        delete parsedProgress[q.id];
      }
    }

    return {
      ...q,
      completed: isCompleted
    };
  });

  if (needsReset) {
    localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(parsedProgress));
  }

  return quests;
});

export const markQuestCompleted = createAsyncThunk('quests/complete', async (questId: number) => {
  const storedProgress = localStorage.getItem(STORAGE_KEY_QUESTS);
  let parsedProgress: Record<number, boolean> = {};
  if (storedProgress) parsedProgress = JSON.parse(storedProgress);
  
  parsedProgress[questId] = true;
  localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(parsedProgress));

  return questId;
});

const questsSlice = createSlice({
  name: 'quests',
  initialState: { list: [], status: 'idle', error: null, lastResetDate: null } as QuestsState,
  reducers: {
    resetDailyQuests: (state) => {
      state.list.forEach(q => {
        if (q.type === 'daily') q.completed = false;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(markQuestCompleted.fulfilled, (state, action) => {
        const quest = state.list.find(q => q.id === action.payload);
        if (quest) {
          quest.completed = true;
        }
      });
  },
});

export const { resetDailyQuests } = questsSlice.actions;
export default questsSlice.reducer;