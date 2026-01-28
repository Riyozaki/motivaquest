
import { createSlice } from '@reduxjs/toolkit';
import { ShopItem, Achievement } from '../types';

interface RewardsState {
  shopItems: ShopItem[];
  achievements: Achievement[];
}

const initialState: RewardsState = {
  shopItems: [
    { 
      id: 'skin_ninja', 
      name: 'Тень Знаний', 
      description: 'Скрытный и быстрый в вычислениях.', 
      cost: 150, 
      type: 'skin', 
      value: 'rogue', 
      icon: 'Target' 
    },
    { 
      id: 'skin_wizard', 
      name: 'Архимаг Наук', 
      description: 'Повелитель формул.', 
      cost: 200, 
      type: 'skin', 
      value: 'mage', 
      icon: 'Sparkles' 
    },
    { 
      id: 'skin_paladin', 
      name: 'Рыцарь Пера', 
      description: 'Защитник грамотности.', 
      cost: 250, 
      type: 'skin', 
      value: 'cleric', 
      icon: 'Shield' 
    },
    { 
      id: 'item_coffee', 
      name: 'Зелье Бодрости (Кофе)', 
      description: 'Реальная награда: выпей кофе!', 
      cost: 50, 
      type: 'consumable', 
      value: 'coffee', 
      icon: 'Coffee' 
    },
    { 
      id: 'item_game_hour', 
      name: 'Свиток Досуга (1 Час Игр)', 
      description: 'Разрешение на игры.', 
      cost: 300, 
      type: 'consumable', 
      value: 'game', 
      icon: 'Gamepad2' 
    },
    { 
      id: 'item_pizza', 
      name: 'Пир Героев (Пицца)', 
      description: 'Закажи пиццу на ужин.', 
      cost: 1000, 
      type: 'consumable', 
      value: 'pizza', 
      icon: 'Pizza' 
    }
  ],
  achievements: [
    { id: 'ach_q1', title: 'Первый Шаг', description: 'Выполни 1 квест', icon: 'Award', conditionType: 'quests', threshold: 1, rewardXp: 50, rewardCoins: 10 },
    { id: 'ach_q5', title: 'Ученик', description: 'Выполни 5 квестов', icon: 'BookOpen', conditionType: 'quests', threshold: 5, rewardXp: 150, rewardCoins: 50 },
    { id: 'ach_q10', title: 'Адепт', description: 'Выполни 10 квестов', icon: 'BookOpen', conditionType: 'quests', threshold: 10, rewardXp: 300, rewardCoins: 100 },
    { id: 'ach_q50', title: 'Магистр', description: 'Выполни 50 квестов', icon: 'Crown', conditionType: 'quests', threshold: 50, rewardXp: 1000, rewardCoins: 500 },
    
    { id: 'ach_c100', title: 'Копилка', description: 'Накопи 100 монет', icon: 'Coins', conditionType: 'coins', threshold: 100, rewardXp: 50, rewardCoins: 0 },
    { id: 'ach_c500', title: 'Казначей', description: 'Накопи 500 монет', icon: 'Coins', conditionType: 'coins', threshold: 500, rewardXp: 200, rewardCoins: 0 },
    { id: 'ach_c1000', title: 'Золотой Дракон', description: 'Накопи 1000 монет', icon: 'Coins', conditionType: 'coins', threshold: 1000, rewardXp: 500, rewardCoins: 0 },
    
    { id: 'ach_lvl2', title: 'Пробуждение Силы', description: 'Достигни 2 уровня', icon: 'Zap', conditionType: 'xp', threshold: 200, rewardXp: 0, rewardCoins: 50 },
    { id: 'ach_lvl5', title: 'Ветеран Класса', description: 'Достигни 5 уровня', icon: 'Zap', conditionType: 'xp', threshold: 2000, rewardXp: 0, rewardCoins: 150 },
    
    { id: 'ach_streak7', title: 'Чистюля', description: '7 дней подряд в игре', icon: 'Sparkles', conditionType: 'streak', threshold: 7, rewardXp: 500, rewardCoins: 200 },
  ]
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {},
});

export default rewardsSlice.reducer;