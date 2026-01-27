
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Quest } from '../types';

interface QuestsState {
  list: Quest[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastResetDate: string | null;
}

const STORAGE_KEY_QUESTS = 'motiva_quests_progress';
const STORAGE_KEY_RESET_DATE = 'motiva_quests_reset_date';

// --- Study Focused Quests ---
const initialQuests: Quest[] = [
  // --- Math ---
  {
    id: 101,
    title: "Битва с Числами",
    description: "Реши уравнения, чтобы спасти королевство от хаоса.",
    category: "Math",
    difficulty: "Medium",
    rarity: "Rare",
    xp: 150,
    coins: 40,
    completed: false,
    type: "daily",
    cooldownSeconds: 15,
    tasks: [
      { id: 1, question: "7 * 8 = ?", correctAnswer: "56" },
      { id: 2, question: "100 / 4 - 5 = ?", correctAnswer: "20" }
    ]
  },
  {
    id: 102,
    title: "Геометрический Барьер",
    description: "Найди периметр и площадь.",
    category: "Math",
    difficulty: "Hard",
    rarity: "Epic",
    xp: 300,
    coins: 100,
    completed: false,
    type: "story",
    cooldownSeconds: 30,
    tasks: [
        { id: 3, question: "Квадрат со стороной 6. Чему равна площадь?", correctAnswer: "36" }
    ]
  },

  // --- Science ---
  {
    id: 201,
    title: "Алхимия Жизни",
    description: "Вопросы по биологии и окружающему миру.",
    category: "Science",
    difficulty: "Easy",
    rarity: "Common",
    xp: 80,
    coins: 20,
    completed: false,
    type: "daily",
    cooldownSeconds: 10,
    tasks: [{ id: 4, question: "Как называется процесс создания растениями еды из света?", correctAnswer: "фотосинтез" }]
  },

  // --- History ---
  {
    id: 301,
    title: "Хроники Предков",
    description: "Вспомни великие даты.",
    category: "History",
    difficulty: "Medium",
    rarity: "Rare",
    xp: 150,
    coins: 50,
    completed: false,
    type: "daily",
    cooldownSeconds: 15,
    tasks: [{ id: 5, question: "В каком году Гагарин полетел в космос?", correctAnswer: "1961" }]
  },

  // --- Languages ---
  {
    id: 401,
    title: "Свиток Иностранца",
    description: "Переведи слова (Английский).",
    category: "Lang",
    difficulty: "Easy",
    rarity: "Common",
    xp: 100,
    coins: 25,
    completed: false,
    type: "daily",
    cooldownSeconds: 10,
    tasks: [
        { id: 6, question: "Cat (перевод)", correctAnswer: "кот" },
        { id: 7, question: "Dog (перевод)", correctAnswer: "собака" }
    ]
  },
  {
    id: 402,
    title: "Древние Руны",
    description: "Сложные фразы.",
    category: "Lang",
    difficulty: "Hard",
    rarity: "Legendary",
    xp: 500,
    coins: 200,
    completed: false,
    type: "story",
    cooldownSeconds: 45,
    tasks: [
        { id: 8, question: "London is the capital of ...", correctAnswer: "Great Britain" }
    ]
  },

  // --- Sport / Health (Daily Routine) ---
  {
    id: 501,
    title: "Телесный Храм",
    description: "Сделай разминку для глаз после учебы.",
    category: "Sport",
    difficulty: "Easy",
    rarity: "Common",
    xp: 50,
    coins: 10,
    completed: false,
    type: "daily",
    cooldownSeconds: 5,
    tasks: [{ id: 9, question: "Ты сделал зарядку? (да/нет)", correctAnswer: "да" }]
  }
];

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
