import { createSlice } from '@reduxjs/toolkit';
import { ShopItem, Achievement } from '../types';

export interface DailyRewardConfig {
    day: number;
    xp: number;
    coins: number;
    item?: string; // ID of item from shop
    isMilestone?: boolean;
}

// 28-Day Cycle Configuration
export const CALENDAR_CONFIG: DailyRewardConfig[] = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    
    // Day 28: LEGENDARY FINISH
    if (day === 28) return { day, xp: 2000, coins: 1000, item: 'skin_paladin', isMilestone: true };
    
    // Weekly Milestones (7, 14, 21)
    if (day === 21) return { day, xp: 800, coins: 500, item: 'item_pizza', isMilestone: true };
    if (day === 14) return { day, xp: 500, coins: 300, item: 'item_game_hour', isMilestone: true };
    if (day === 7)  return { day, xp: 300, coins: 150, item: 'item_coffee', isMilestone: true };

    // Standard Days
    return { day, xp: 50 + (day * 5), coins: 20 + (day * 2) };
});

interface RewardsState {
  shopItems: ShopItem[];
  achievements: Achievement[];
}

const initialState: RewardsState = {
  shopItems: [
    // ===== ОБЛИКИ / SKINS =====
    { 
      id: 'skin_ninja', 
      name: 'Тень Знаний', 
      description: 'Скрытный и быстрый в вычислениях. Облик ниндзя-ассасина.', 
      cost: 150, 
      type: 'skin', 
      value: 'rogue', 
      icon: 'Target',
      category: 'skin',
      rarity: 'Rare',
    },
    { 
      id: 'skin_wizard', 
      name: 'Архимаг Наук', 
      description: 'Повелитель формул и заклинаний знаний.', 
      cost: 200, 
      type: 'skin', 
      value: 'mage', 
      icon: 'Sparkles',
      category: 'skin',
      rarity: 'Rare',
    },
    { 
      id: 'skin_paladin', 
      name: 'Рыцарь Пера', 
      description: 'Защитник грамотности и чести. Легендарный облик.', 
      cost: 250, 
      type: 'skin', 
      value: 'cleric', 
      icon: 'Shield',
      category: 'skin',
      rarity: 'Epic',
    },
    { 
      id: 'skin_ranger', 
      name: 'Следопыт Времён', 
      description: 'Странник, изучающий историю всех эпох.', 
      cost: 180, 
      type: 'skin', 
      value: 'explorer', 
      icon: 'Compass',
      category: 'skin',
      rarity: 'Rare',
    },
    { 
      id: 'skin_dragon', 
      name: 'Повелитель Драконов', 
      description: 'Легендарный облик — укротитель древних знаний.', 
      cost: 500, 
      type: 'skin', 
      value: 'dragon', 
      icon: 'Flame',
      category: 'skin',
      rarity: 'Legendary',
    },
    { 
      id: 'skin_cyber', 
      name: 'Кибер-Учёный', 
      description: 'Футуристический облик из мира технологий.', 
      cost: 350, 
      type: 'skin', 
      value: 'cyber', 
      icon: 'Cpu',
      category: 'skin',
      rarity: 'Epic',
    },

    // ===== РЕАЛЬНЫЕ НАГРАДЫ =====
    { 
      id: 'item_coffee', 
      name: 'Зелье Бодрости', 
      description: '☕ Реальная награда: выпей любимый кофе или горячий шоколад!', 
      cost: 50, 
      type: 'consumable', 
      value: 'coffee', 
      icon: 'Coffee',
      category: 'real',
      rarity: 'Common',
    },
    { 
      id: 'item_game_hour', 
      name: 'Свиток Досуга (1 Час)', 
      description: '🎮 Разрешение на 1 час свободной игры без вопросов.', 
      cost: 300, 
      type: 'consumable', 
      value: 'game', 
      icon: 'Gamepad2',
      category: 'real',
      rarity: 'Rare',
    },
    { 
      id: 'item_pizza', 
      name: 'Пир Героев', 
      description: '🍕 Закажи пиццу на ужин — ты заслужил!', 
      cost: 1000, 
      type: 'consumable', 
      value: 'pizza', 
      icon: 'Pizza',
      category: 'real',
      rarity: 'Epic',
    },
    { 
      id: 'item_movie', 
      name: 'Билет в Кино', 
      description: '🎬 Поход в кинотеатр на любой фильм в выходные.', 
      cost: 800, 
      type: 'consumable', 
      value: 'movie', 
      icon: 'Film',
      category: 'real',
      rarity: 'Epic',
    },
    { 
      id: 'item_icecream', 
      name: 'Морозное Лакомство', 
      description: '🍦 Мороженое любого вкуса — твой сладкий трофей.', 
      cost: 80, 
      type: 'consumable', 
      value: 'icecream', 
      icon: 'IceCream',
      category: 'real',
      rarity: 'Common',
    },
    { 
      id: 'item_sleep_late', 
      name: 'Свиток Сна', 
      description: '😴 Разрешение поспать на 1 час дольше в выходные.', 
      cost: 200, 
      type: 'consumable', 
      value: 'sleep', 
      icon: 'Moon',
      category: 'real',
      rarity: 'Rare',
    },
    { 
      id: 'item_no_chores', 
      name: 'Щит от Рутины', 
      description: '🛡️ Один день без обязательных домашних дел.', 
      cost: 500, 
      type: 'consumable', 
      value: 'nochores', 
      icon: 'ShieldOff',
      category: 'real',
      rarity: 'Rare',
    },
    { 
      id: 'item_wish', 
      name: 'Свиток Желания', 
      description: '⭐ Загадай одно разумное желание — родители исполнят!', 
      cost: 2000, 
      type: 'consumable', 
      value: 'wish', 
      icon: 'Wand2',
      category: 'real',
      rarity: 'Legendary',
    },

    // ===== БУСТЕРЫ =====
    { 
      id: 'boost_xp2x', 
      name: 'Зелье Опыта x2', 
      description: 'Двойной опыт за квесты на 1 час. Пей и побеждай!', 
      cost: 120, 
      type: 'consumable', 
      value: 'xp_boost', 
      icon: 'Zap',
      category: 'boost',
      rarity: 'Rare',
    },
    { 
      id: 'boost_coins2x', 
      name: 'Монетный Фонтан x2', 
      description: 'Двойные монеты за квесты на 1 час.', 
      cost: 120, 
      type: 'consumable', 
      value: 'coin_boost', 
      icon: 'Coins',
      category: 'boost',
      rarity: 'Rare',
    },
    { 
      id: 'boost_hp_restore', 
      name: 'Великое Исцеление', 
      description: 'Мгновенно восстанавливает HP до максимума.', 
      cost: 60, 
      type: 'consumable', 
      value: 'hp_restore', 
      icon: 'Heart',
      category: 'boost',
      rarity: 'Common',
    },
    { 
      id: 'boost_mp_restore', 
      name: 'Кристалл Маны', 
      description: 'Сбрасывает счётчик энергии — бери ещё квесты!', 
      cost: 100, 
      type: 'consumable', 
      value: 'mp_restore', 
      icon: 'Battery',
      category: 'boost',
      rarity: 'Common',
    },
    { 
      id: 'boost_streak_shield', 
      name: 'Амулет Серии', 
      description: 'Защищает серию дней от пропуска (1 раз).', 
      cost: 250, 
      type: 'consumable', 
      value: 'streak_shield', 
      icon: 'ShieldCheck',
      category: 'boost',
      rarity: 'Epic',
    },
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
    { id: 'ach_calendar_master', title: 'Повелитель Времени', description: 'Пройди полный цикл календаря (28 дней)', icon: 'Calendar', conditionType: 'streak', threshold: 28, rewardXp: 5000, rewardCoins: 1000 },
  ]
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {},
});

export default rewardsSlice.reducer;
