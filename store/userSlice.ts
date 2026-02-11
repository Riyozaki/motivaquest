
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, Achievement, SurveySubmission, ThemeColor, Quest, QuestHistoryItem, HeroClass } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';
import { CAMPAIGN_DATA } from './questsSlice';
import { analytics } from '../services/analytics';
import { api } from '../services/api';
import { audio } from '../services/audio'; // Direct audio service usage

const STORAGE_KEY_EMAIL = 'motiva_user_email';
const STORAGE_KEY_LAST_REWARD = 'motiva_last_reward_claim'; 

interface DailyRewardData {
    xp: number;
    coins: number;
    streak: number;
    bonusMultiplier: number;
}

// Visual Reward Queue Item
export interface RewardAnimation {
    id: string;
    xp: number;
    coins: number;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  dailyRewardPopup: DailyRewardData | null;
  pendingRewardAnimations: RewardAnimation[]; // Queue for FloatingReward.tsx
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  dailyRewardPopup: null,
  pendingRewardAnimations: [],
};

// --- DEFAULT USER STATE ---
const DEFAULT_USER_DATA: Partial<UserProfile> = {
    role: 'student',
    avatar: 'warrior',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    coins: 0,
    currentHp: 50, 
    completedQuests: 0,
    inventory: [],
    achievements: [],
    questHistory: [],
    surveyHistory: [],
    hasParentalConsent: false,
    themeColor: 'purple',
    activeQuestTimers: {},
    habitStreaks: {}, 
    dailyCompletionsCount: 0,
    suspiciousFlags: 0,
    streakDays: 0,
    streakTakenToday: false,
    campaign: {
        currentDay: 1,
        isDayComplete: false,
        unlockedAllies: []
    }
};

const mapSheetToUser = (rawData: any): UserProfile => {
    if (!rawData) throw new Error("Empty data");

    const progress = rawData.progress || {};
    const info = rawData.info || {};
    const user = rawData.user || {};
    const questsLog = rawData.quests || [];

    const email = (user.email || progress.email || info.email || rawData.email || '').toLowerCase().trim();
    const username = user.username || rawData.username || 'Hero';

    const mappedHistory: QuestHistoryItem[] = Array.isArray(questsLog) ? questsLog.map((q: any) => ({
        questId: Number(q.visitorId || q[1]),
        questTitle: q.visitorName || q[2] || 'Unknown Quest',
        date: q.timestamp || q[5] || new Date().toISOString(),
        xpEarned: 0
    })) : [];

    const rawPurchases = info.purchases || [];
    const inventory: string[] = Array.isArray(rawPurchases) ? rawPurchases.map((p: any) => p.itemId) : [];

    const rawAchievements = info.achievements || [];
    const achievements: string[] = Array.isArray(rawAchievements) ? rawAchievements.map((a: any) => a.id) : [];

    const campaignData = {
        currentDay: Number(info.currentLevel) || 1, 
        isDayComplete: false, 
        unlockedAllies: Array.isArray(info.unlockedAllies) ? info.unlockedAllies : []
    };

    return {
        ...DEFAULT_USER_DATA,
        email: email,
        username: username,
        level: Number(progress.level) || 1,
        currentXp: Number(progress.xp) || 0,
        coins: Number(progress.gold) || 0,
        currentHp: Number(progress.hp) || 50,
        avatar: progress.visitorAvatar || 'warrior',
        streakDays: Number(info.dailyStreak) || 0,
        streakTakenToday: Boolean(info.streakTakenToday), 
        themeColor: info.interfaceColor || 'purple',
        heroClass: info.heroClass || undefined, // Map class
        lastDailyMood: info.moodDate || info.mood !== 'neutral' ? (info.moodDate || new Date().toISOString()) : undefined, 
        inventory: inventory,
        achievements: achievements,
        questHistory: mappedHistory,
        campaign: campaignData,
        completedQuests: mappedHistory.length,
        hasParentalConsent: true,
        lastLoginDate: info.lastLoginDate || new Date().toDateString() 
    } as UserProfile;
};

const processDailyLogin = (user: UserProfile): { user: UserProfile, reward: DailyRewardData | null } => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    let newUser = { ...user };
    let reward: DailyRewardData | null = null;

    if (user.lastLoginDate) {
        const lastLogin = new Date(user.lastLoginDate);
        const diffTime = Math.abs(today.setHours(0,0,0,0) - lastLogin.setHours(0,0,0,0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays >= 1) {
            newUser.dailyCompletionsCount = 0;
            newUser.streakTakenToday = false; 
            localStorage.removeItem(STORAGE_KEY_LAST_REWARD);

            if (diffDays > 1) {
                const penalty = (diffDays - 1) * 10;
                newUser.currentHp = Math.max(0, (newUser.currentHp || 50) - penalty);
                newUser.streakDays = 0; 
            }
        }
    }
    
    newUser.lastLoginDate = todayStr;

    const lastClaimedLocal = localStorage.getItem(STORAGE_KEY_LAST_REWARD);

    if (lastClaimedLocal !== todayStr && !newUser.streakTakenToday) {
        const newStreak = (newUser.streakDays || 0) + 1;
        const bonusMultiplier = 1 + (newStreak * 0.1);
        const coinsEarned = Math.floor(50 * bonusMultiplier);
        const xpEarned = Math.floor(100 * bonusMultiplier);

        newUser.streakDays = newStreak;
        newUser.streakTakenToday = true;
        newUser.coins = (newUser.coins || 0) + coinsEarned;
        newUser.currentXp = (newUser.currentXp || 0) + xpEarned;

        if (!newUser.nextLevelXp) newUser.nextLevelXp = 100 * Math.pow(1.5, newUser.level - 1);
        while (newUser.currentXp >= newUser.nextLevelXp) {
            newUser.currentXp -= newUser.nextLevelXp;
            newUser.level++;
            newUser.nextLevelXp = Math.floor(100 * Math.pow(1.5, newUser.level - 1));
        }

        reward = { coins: coinsEarned, xp: xpEarned, streak: newStreak, bonusMultiplier };
        localStorage.setItem(STORAGE_KEY_LAST_REWARD, todayStr);
    }

    return { user: newUser, reward };
};

// Helper for offline toast
const handleApiError = (e: any) => {
    if (e.message === 'OFFLINE_SAVED') {
        toast.warning("Нет сети. Данные сохранятся позже.", { autoClose: 3000 });
    } else {
        console.warn("API Error:", e);
    }
};

// --- Thunks ---

export const initAuth = createAsyncThunk('user/initAuth', async () => {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (!email) return null;

    try {
        const response = await api.getAllUserData(email);
        if (!response.success) return null;

        const normalizedUser = mapSheetToUser(response);
        const { user: updatedUser, reward } = processDailyLogin(normalizedUser);
        
        if (updatedUser.currentHp !== normalizedUser.currentHp || updatedUser.dailyCompletionsCount !== normalizedUser.dailyCompletionsCount) {
             try {
                 await api.updateProgress(updatedUser.email, {
                    coins: updatedUser.coins,
                    currentXp: updatedUser.currentXp,
                    level: updatedUser.level,
                    currentHp: updatedUser.currentHp 
                });
                await api.updateInfo(updatedUser.email, {
                    dailyStreak: updatedUser.streakDays,
                    streakTakenToday: updatedUser.streakTakenToday,
                    lastLoginDate: updatedUser.lastLoginDate
                });
             } catch (e) { handleApiError(e); }
        }

        return { user: updatedUser, reward };
    } catch (e) {
        console.error("Auth Init Failed:", e);
        // If offline, we might want to load from local storage cache if implemented, 
        // but for now return null or previous state is hard without persistence beyond auth token.
        return null;
    }
});

export const loginDemo = createAsyncThunk('user/loginDemo', async () => {
    const demoEmail = 'demo@motivaquest.local';
    const user = { ...DEFAULT_USER_DATA, email: demoEmail, username: "Demo Hero", uid: 'demo_hero_id', role: 'admin' } as UserProfile;
    return { user, reward: null };
});

export const loginLocal = createAsyncThunk(
  'user/login',
  async (payload: { email: string; password: string }) => {
    const response = await api.login(payload.email, payload.password);
    const normalizedUser = mapSheetToUser(response);
    const { user: updatedUser, reward } = processDailyLogin(normalizedUser);
    
    localStorage.setItem(STORAGE_KEY_EMAIL, updatedUser.email);
    
    try {
        await api.updateProgress(updatedUser.email, { coins: updatedUser.coins, currentXp: updatedUser.currentXp, currentHp: updatedUser.currentHp });
        await api.updateInfo(updatedUser.email, { dailyStreak: updatedUser.streakDays, streakTakenToday: updatedUser.streakTakenToday, lastLoginDate: updatedUser.lastLoginDate });
    } catch (e) { handleApiError(e); }
    
    return { user: updatedUser, reward };
  }
);

export const registerLocal = createAsyncThunk(
  'user/register',
  async (payload: { email: string; password: string; username: string; hasConsent: boolean }) => {
    await api.register(payload.email, payload.password, payload.username);
    
    const newUserState: UserProfile = {
        ...DEFAULT_USER_DATA,
        email: payload.email.toLowerCase().trim(),
        username: payload.username,
        hasParentalConsent: payload.hasConsent,
        lastLoginDate: new Date().toDateString()
    } as UserProfile;

    localStorage.setItem(STORAGE_KEY_EMAIL, newUserState.email);
    analytics.track('register', newUserState, { email: payload.email });
    return { user: newUserState, reward: null };
  }
);

export const logoutLocal = createAsyncThunk('user/logout', async () => {
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    return null;
});

export const updateUserProfile = createAsyncThunk(
  'user/update',
  async (updates: Partial<UserProfile>, { getState }) => {
    const state = getState() as RootState;
    const currentUser = state.user.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("No user");
    
    const progressUpdates: any = {};
    if (updates.coins !== undefined) progressUpdates.coins = updates.coins;
    if (updates.currentXp !== undefined) progressUpdates.currentXp = updates.currentXp;
    if (updates.level !== undefined) progressUpdates.level = updates.level;
    if (updates.avatar !== undefined) progressUpdates.avatar = updates.avatar;
    if (updates.currentHp !== undefined) progressUpdates.currentHp = updates.currentHp;

    const infoUpdates: any = {};
    if (updates.themeColor) infoUpdates.interfaceColor = updates.themeColor;
    if (updates.streakDays !== undefined) infoUpdates.dailyStreak = updates.streakDays;
    
    // Sync class
    if (updates.heroClass) infoUpdates.heroClass = updates.heroClass;

    if (updates.campaign) {
        if (updates.campaign.currentDay) infoUpdates.currentLevel = updates.campaign.currentDay;
        if (updates.campaign.unlockedAllies) infoUpdates.unlockedAllies = updates.campaign.unlockedAllies;
    }

    try {
        if (Object.keys(progressUpdates).length > 0) {
            await api.updateProgress(currentUser.email, progressUpdates);
        }
        if (Object.keys(infoUpdates).length > 0) {
            await api.updateInfo(currentUser.email, infoUpdates);
        }
    } catch(e) { handleApiError(e); }
    
    return updates;
  }
);

export const changeHeroClass = createAsyncThunk(
    'user/changeHeroClass',
    async (heroClass: HeroClass, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) throw new Error("No user");

        // Cost logic: Free if undefined, 500 if changing
        const cost = user.heroClass ? 500 : 0;

        if (user.coins < cost) {
            toast.error(`Не хватает золота! Нужно ${cost} 💰`);
            throw new Error("Insufficient funds");
        }

        if (cost > 0) {
            audio.playCoins(); // Spend sound
        }

        const newCoins = user.coins - cost;
        
        // Optimistic update
        await dispatch(updateUserProfile({ 
            heroClass, 
            coins: newCoins 
        }));

        toast.success(`Класс выбран: ${heroClass.toUpperCase()}!`);
        return { heroClass, coins: newCoins };
    }
);

export const submitDailyMood = createAsyncThunk(
    'user/submitMood',
    async (payload: { motivationScore: number, stressScore: number, enjoymentScore: number, id: string, date: string }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        const moodScore = payload.motivationScore; 
        
        try {
            await api.setMood(user.email, moodScore);
            await api.setDailyReport(user.email, {
                date: payload.date,
                score: moodScore
            }); 
        } catch(e) { handleApiError(e); }
        
        await dispatch(addExperience({ xp: 30, coins: 15 }));
        toast.success("Настроение учтено! +30 XP");

        return { ...payload, date: new Date().toISOString() };
    }
);

export const startQuestAction = createAsyncThunk(
    'user/startQuest',
    async (questId: number, { getState }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        const activeCount = Object.keys(user.activeQuestTimers || {}).length;
        if (activeCount >= 3) {
            throw new Error("Слишком много активных миссий! Сдай текущие.");
        }
        
        const timers = { ...user.activeQuestTimers, [questId]: Date.now() };
        return { activeQuestTimers: timers };
    }
);

export const addExperience = createAsyncThunk(
  'user/addExperience',
  async (payload: { xp: number; coins: number }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const user = state.user.currentUser;
    if (!user || !user.email) return null;

    let newXp = (user.currentXp || 0) + payload.xp;
    let currentLevel = user.level || 1;
    let nextLevelXp = user.nextLevelXp || 100 * Math.pow(1.5, currentLevel - 1);
    let newCoins = (user.coins || 0) + payload.coins;

    let didLevelUp = false;
    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
      didLevelUp = true;
      audio.playLevelUp(); // Sound Effect
      toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
    }

    if (didLevelUp) analytics.track('level_up', user, { oldLevel: user.level, newLevel: currentLevel });

    const updates = { currentXp: newXp, level: currentLevel, nextLevelXp, coins: newCoins };
    try {
        await api.updateProgress(user.email, updates);
    } catch (e) { handleApiError(e); }

    setTimeout(() => { dispatch(checkAchievements()); }, 500);
    return { ...updates, rewardDelta: payload };
  }
);

export const completeQuestAction = createAsyncThunk(
    'user/completeQuestAction',
    async (payload: { quest: Quest, multiplier?: number }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        const { quest, multiplier = 1 } = payload;
        
        const dailyLimit = 10;
        if ((user.dailyCompletionsCount || 0) >= dailyLimit) {
            throw new Error("Энергия иссякла! (Лимит квестов на сегодня исчерпан)");
        }

        // --- HERO CLASS BONUSES ---
        let classMultiplierXp = 1;
        let classMultiplierCoins = 1;
        let bonusName = '';

        if (user.heroClass) {
            if (user.heroClass === 'warrior' && quest.category === 'Sport') {
                classMultiplierXp = 1.1;
                bonusName = 'Воин';
            } else if (user.heroClass === 'mage' && (quest.category === 'Math' || quest.category === 'Science')) {
                classMultiplierXp = 1.1;
                bonusName = 'Маг';
            } else if (user.heroClass === 'ranger' && (quest.category === 'Social' || quest.category === 'Ecology')) {
                classMultiplierXp = 1.1;
                bonusName = 'Следопыт';
            } else if (user.heroClass === 'healer' && quest.category === 'Self') {
                classMultiplierCoins = 1.1;
                bonusName = 'Целитель';
            }
        }

        let xpReward = Math.floor(quest.xp * multiplier * classMultiplierXp);
        let coinsReward = Math.floor(quest.coins * multiplier * classMultiplierCoins);
        
        if (xpReward > 0) {
            await dispatch(addExperience({ xp: xpReward, coins: coinsReward }));
            if (bonusName) {
                toast.success(`Бонус класса (${bonusName}): +10%`);
            }
        }

        const historyItem: QuestHistoryItem = { 
            questId: quest.id, 
            questTitle: quest.title, 
            xpEarned: xpReward,
            date: new Date().toISOString() 
        };
        const newHistory = [...(user.questHistory || []), historyItem];
        const newTimers = { ...user.activeQuestTimers };
        delete newTimers[quest.id]; 

        let updates: Partial<UserProfile> = {
            completedQuests: (user.completedQuests || 0) + 1,
            questHistory: newHistory,
            activeQuestTimers: newTimers,
            dailyCompletionsCount: (user.dailyCompletionsCount || 0) + 1
        };

        if (quest.isHabit) {
            const currentStreak = (user.habitStreaks?.[quest.id] || 0) + 1;
            updates.habitStreaks = { ...(user.habitStreaks || {}), [quest.id]: currentStreak };
        }

        if (user.campaign) {
            const currentStoryDay = CAMPAIGN_DATA.find(d => d.day === user.campaign.currentDay);
            if (currentStoryDay) {
                const requiredIds = currentStoryDay.questIds;
                const completedIds = new Set(newHistory.map(h => h.questId));
                const allDone = requiredIds.every(id => completedIds.has(id));
                if (allDone && !user.campaign.isDayComplete) {
                    updates = { ...updates, campaign: { ...user.campaign, isDayComplete: true } };
                    audio.playQuestComplete(); // Fanfare
                    toast.success("Все задания дня выполнены!", { autoClose: false });
                }
            }
        }
        
        try {
            await api.completeQuest(user.email, quest.id, quest.title);
        } catch (e) { handleApiError(e); }
        
        return updates;
    }
);

export const advanceCampaignDay = createAsyncThunk(
    'user/advanceCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email || !user.campaign.isDayComplete) return;

        const nextDay = user.campaign.currentDay + 1;
        const newAllies = [...user.campaign.unlockedAllies];
        
        let allyUnlocked = null;
        if (nextDay === 3) allyUnlocked = 'fairy';
        if (nextDay === 7) allyUnlocked = 'warrior';
        
        if (allyUnlocked && !newAllies.includes(allyUnlocked)) {
            newAllies.push(allyUnlocked);
        }

        await dispatch(addExperience({ xp: 100, coins: 50 }));

        const updates = {
            campaign: {
                currentDay: nextDay > 14 ? 14 : nextDay, 
                isDayComplete: false,
                unlockedAllies: newAllies
            }
        };

        await dispatch(updateUserProfile(updates));
        toast.info("День завершен! Сюжет продолжается...", { icon: () => "📜" });
        return updates;
    }
);

export const finishCampaign = createAsyncThunk(
    'user/finishCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        await dispatch(addExperience({ xp: 5000, coins: 2000 }));
        
        try {
            await api.addAchievement(user.email, { id: 'legend_of_productivity', title: 'Legend of Productivity' });
        } catch (e) { handleApiError(e); }
        
        const updates = {
            achievements: [...user.achievements, 'legend_of_productivity'],
            campaign: { ...user.campaign, isDayComplete: true }
        };
        
        return updates;
    }
);

export const checkAchievements = createAsyncThunk(
    'user/checkAchievements',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        const allAchievements = state.rewards.achievements;
        
        if (!user || !user.email) return;

        const newUnlocked: string[] = [];
        let totalRewardXp = 0;
        let totalRewardCoins = 0;

        allAchievements.forEach(ach => {
            if (user.achievements.includes(ach.id)) return;
            let unlocked = false;
            switch (ach.conditionType) {
                case 'quests': if (user.completedQuests >= ach.threshold) unlocked = true; break;
                case 'coins': if (user.coins >= ach.threshold) unlocked = true; break;
                case 'xp':
                     if (ach.id === 'ach_lvl2' && user.level >= 2) unlocked = true;
                     if (ach.id === 'ach_lvl5' && user.level >= 5) unlocked = true;
                     break;
                case 'streak': if (ach.id === 'ach_streak7' && user.streakDays >= 7) unlocked = true; break;
            }

            if (unlocked) {
                newUnlocked.push(ach.id);
                totalRewardXp += ach.rewardXp;
                totalRewardCoins += ach.rewardCoins;
                // Fire and forget, but catch errors to prevent console spam
                api.addAchievement(user.email, ach).catch(e => console.warn("Achievement sync delay"));
                audio.playQuestComplete(); // Achievement sound
                toast.info(`🏆 Получено достижение: ${ach.title}!`, { theme: 'dark' });
            }
        });

        if (newUnlocked.length > 0) {
            const updates = { 
                currentXp: user.currentXp + totalRewardXp, 
                coins: user.coins + totalRewardCoins, 
                achievements: [...user.achievements, ...newUnlocked] 
            };
            try {
                await api.updateProgress(user.email, { currentXp: updates.currentXp, coins: updates.coins });
            } catch (e) { handleApiError(e); }
            return updates;
        }
        return null;
    }
);

export const importSaveData = createAsyncThunk('user/import', async (json: string) => {
    const data = JSON.parse(json);
    if (data.email) {
        await api.updateProgress(data.email, data);
        localStorage.setItem(STORAGE_KEY_EMAIL, data.email);
        return data;
    }
    throw new Error("Invalid save file: missing email");
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => { state.currentUser = action.payload; },
    clearUser: (state) => { state.currentUser = null; },
    closeDailyRewardModal: (state) => { state.dailyRewardPopup = null; },
    popRewardAnimation: (state) => {
        state.pendingRewardAnimations.shift(); // Remove first item
    },
    purchaseItem: (state, action: PayloadAction<{ item: {id: string, name: string, cost: number} }>) => {
       if (!state.currentUser || !state.currentUser.email) return;
       const { item } = action.payload;
       if (state.currentUser.coins >= item.cost) {
         state.currentUser.coins -= item.cost;
         if (!state.currentUser.inventory) state.currentUser.inventory = [];
         state.currentUser.inventory.push(item.id);
         
         audio.playCoins(); // Purchase sound
         // Async
         api.updateProgress(state.currentUser.email, { coins: state.currentUser.coins }).catch(console.warn);
         api.addPurchase(state.currentUser.email, item).catch(console.warn);
       }
    },
    equipSkin: (state, action) => {
       if (state.currentUser && state.currentUser.email) {
         state.currentUser.avatar = action.payload;
         api.updateProgress(state.currentUser.email, { avatar: action.payload }).catch(console.warn);
       }
    },
    submitSurvey: (state, action: PayloadAction<SurveySubmission>) => { },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
       if (state.currentUser && state.currentUser.email) {
         state.currentUser.themeColor = action.payload;
         api.updateInfo(state.currentUser.email, { interfaceColor: action.payload }).catch(console.warn);
       }
    },
    adminSetDay: (state, action: PayloadAction<number>) => {
        if (state.currentUser && state.currentUser.campaign) {
            state.currentUser.campaign.currentDay = action.payload;
            state.currentUser.campaign.isDayComplete = false;
        }
    },
    adminCompleteDay: (state) => {
        if (state.currentUser && state.currentUser.campaign) {
            state.currentUser.campaign.isDayComplete = true;
        }
    },
    adminResetCampaign: (state) => {
        if (state.currentUser) {
            state.currentUser.campaign = { currentDay: 1, isDayComplete: false, unlockedAllies: [] };
            state.currentUser.completedQuests = 0;
            state.currentUser.questHistory = [];
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action) => {
        if (action.payload) {
            state.currentUser = action.payload.user;
            state.dailyRewardPopup = action.payload.reward;
        }
        state.loading = false;
      })
      .addCase(registerLocal.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(loginLocal.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user; 
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(loginDemo.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(logoutLocal.fulfilled, (state) => { state.currentUser = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.currentUser) state.currentUser = { ...state.currentUser, ...action.payload };
      })
      .addCase(addExperience.fulfilled, (state, action) => {
         if (state.currentUser && action.payload) {
             state.currentUser = { ...state.currentUser, ...action.payload as any };
             // Add reward animation to queue
             const { xp, coins } = action.payload.rewardDelta;
             if (xp > 0 || coins > 0) {
                 state.pendingRewardAnimations.push({ 
                     id: Date.now().toString(), 
                     xp, 
                     coins 
                 });
             }
         }
      })
      .addCase(startQuestAction.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
      .addCase(completeQuestAction.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
      .addCase(advanceCampaignDay.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
      .addCase(finishCampaign.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload as any };
          }
      })
      .addCase(submitDailyMood.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser.lastDailyMood = action.payload.date;
              if(!state.currentUser.surveyHistory) state.currentUser.surveyHistory = [];
              state.currentUser.surveyHistory.push({
                  id: action.payload.id,
                  date: action.payload.date,
                  motivationScore: action.payload.motivationScore,
                  stressScore: 0,
                  enjoymentScore: 0
              });
          }
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload as any };
          }
      })
      .addCase(importSaveData.fulfilled, (state, action) => {
          state.currentUser = action.payload;
          toast.success("Данные загружены!");
      });
  }
});

export const { 
    setUser, clearUser, purchaseItem, equipSkin, submitSurvey, setThemeColor, 
    adminSetDay, adminCompleteDay, adminResetCampaign, closeDailyRewardModal,
    popRewardAnimation 
} = userSlice.actions;
export default userSlice.reducer;
