
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, Achievement, SurveySubmission, ThemeColor, Quest, QuestHistoryItem, HeroClass } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';
import { CAMPAIGN_DATA } from './questsSlice';
import { analytics } from '../services/analytics';
import { api, CompleteQuestPayload, BossBattlePayload } from '../services/api';
import { audio } from '../services/audio';

const STORAGE_KEY_EMAIL = 'motiva_user_email';

interface DailyRewardData {
    xp: number;
    coins: number;
    streak: number;
    bonusMultiplier: number;
}

export interface RewardAnimation {
    id: string;
    xp: number;
    coins: number;
}

interface PendingActions {
    completeQuest: boolean;
    purchase: boolean;
    bossBattle: boolean;
    setMood: boolean;
    updateProfile: boolean;
    auth: boolean;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  dailyRewardPopup: DailyRewardData | null;
  pendingRewardAnimations: RewardAnimation[];
  pendingActions: PendingActions;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  dailyRewardPopup: null,
  pendingRewardAnimations: [],
  pendingActions: {
      completeQuest: false,
      purchase: false,
      bossBattle: false,
      setMood: false,
      updateProfile: false,
      auth: false
  }
};

// --- DEFAULT USER STATE ---
const DEFAULT_USER_DATA: Partial<UserProfile> = {
    role: 'student',
    avatar: 'warrior',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    coins: 0,
    currentHp: 100, 
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

// V2.0 Map function - expects cleaner object structure from backend
const mapSheetToUser = (rawData: any): UserProfile => {
    if (!rawData || !rawData.user) throw new Error("Empty data");

    const { user } = rawData;
    // Fallback to empty objects if progress/info are missing/null to prevent crashes
    const progress = rawData.progress || {};
    const info = rawData.info || {};
    const quests = rawData.quests || [];

    // Map Quest History
    const mappedHistory: QuestHistoryItem[] = Array.isArray(quests) ? quests.map((q: any) => ({
        questId: Number(q.questId || q.visitorId),
        questTitle: q.questName || q.visitorName || 'Unknown',
        date: q.completedAt || q.timestamp || new Date().toISOString(),
        xpEarned: Number(q.xpEarned) || 0,
        score: Number(q.score) || 0,
        category: q.category
    })) : [];

    // Map Campaign
    const campaignProg = info.campaignProgress && Array.isArray(info.campaignProgress) && info.campaignProgress.length > 0 
        ? info.campaignProgress[0] 
        : null;

    const campaignData = {
        currentDay: campaignProg ? Number(campaignProg.currentDay) : (Number(info.currentLevel) || 1), 
        isDayComplete: false, 
        unlockedAllies: Array.isArray(info.unlockedAllies) ? info.unlockedAllies : []
    };

    return {
        ...DEFAULT_USER_DATA,
        email: user.email,
        username: user.username,
        grade: Number(user.grade) || 7,
        
        // Progress
        level: Number(progress.level) || 1,
        currentXp: Number(progress.xp) || 0,
        nextLevelXp: Number(progress.nextLevelXp) || 100,
        coins: Number(progress.coins || progress.gold) || 0,
        currentHp: Number(progress.currentHp) || 100,
        streakDays: Number(progress.streakDays || info.dailyStreak) || 0,
        lastLoginDate: progress.lastLoginDate,
        totalQuestsCompleted: Number(progress.totalQuestsCompleted) || 0,
        weeklyXp: Number(progress.weeklyXp) || 0,
        
        // Profile
        avatar: progress.visitorAvatar || 'warrior', // Legacy field name mapping
        heroClass: info.heroClass || undefined,
        className: progress.className,
        classEmoji: progress.classEmoji,
        currentLocation: progress.currentLocation || 'forest',
        themeColor: info.selectedTheme || info.interfaceColor || 'purple',
        
        // Lists
        inventory: Array.isArray(info.purchases) ? info.purchases.map((p: any) => p.itemId) : [],
        achievements: Array.isArray(info.achievements) ? info.achievements.map((a: any) => a.id) : [],
        questHistory: mappedHistory,
        campaign: campaignData,
        
        // Misc
        lastDailyMood: info.mood !== 'neutral' ? new Date().toISOString() : undefined, 
        completedQuests: mappedHistory.length,
        hasParentalConsent: true,
    } as UserProfile;
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

export const initAuth = createAsyncThunk('user/initAuth', async (_, { dispatch }) => {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (!email) return null;

    try {
        const response = await api.getAllUserData(email);
        if (!response.success) return null;

        const normalizedUser = mapSheetToUser(response);
        
        // TRIGGER SERVER-SIDE DAILY LOGIN
        const loginRes = await api.dailyLogin(email);
        
        let reward: DailyRewardData | null = null;
        
        if (loginRes.success) {
            // Update local state with server data
            normalizedUser.streakDays = loginRes.streakDays;
            if (loginRes.progress && loginRes.progress.currentHp !== undefined) {
                normalizedUser.currentHp = loginRes.progress.currentHp;
            }
            normalizedUser.lastLoginDate = new Date().toISOString().split('T')[0];

            // If not logged in yet today (server flag), show reward locally
            if (!loginRes.alreadyLoggedIn) {
                // Calculate visual reward only
                const bonusMultiplier = 1 + (normalizedUser.streakDays * 0.1);
                const coinsEarned = Math.floor(50 * bonusMultiplier);
                const xpEarned = Math.floor(100 * bonusMultiplier);
                
                reward = { coins: coinsEarned, xp: xpEarned, streak: normalizedUser.streakDays, bonusMultiplier };
                
                dispatch(addExperience({ xp: xpEarned, coins: coinsEarned }));
            }
        }

        return { user: normalizedUser, reward };
    } catch (e) {
        console.error("Auth Init Failed:", e);
        return null;
    }
});

export const loginDemo = createAsyncThunk('user/loginDemo', async (_, { dispatch }) => {
    const demoEmail = 'demo@motivaquest.local';
    const demoPass = 'demo123';
    const demoUsername = "Demo Hero";

    const demoUserStruct = {
        ...DEFAULT_USER_DATA,
        email: demoEmail,
        username: demoUsername,
        uid: 'demo_hero_id',
        role: 'admin',
        grade: 10,
        heroClass: 'warrior',
        className: 'Warrior',
        classEmoji: '⚔️',
        lastLoginDate: new Date().toDateString(),
        hasParentalConsent: true,
        currentHp: 100,
        coins: 0,
        level: 1
    } as UserProfile;

    try {
        const response = await api.login(demoEmail, demoPass);
        const normalizedUser = mapSheetToUser(response);
        normalizedUser.role = 'admin';
        normalizedUser.uid = 'demo_hero_id';
        
        localStorage.setItem(STORAGE_KEY_EMAIL, normalizedUser.email);
        return { user: normalizedUser, reward: null };
    } catch (e: any) {
        console.warn("Demo user login failed (likely not found). Registering...");
        try {
            await api.register(demoEmail, demoPass, demoUsername, 10, "Warrior", "⚔️");
        } catch (regError: any) {
            if (regError.message && regError.message.includes("Email already exists")) {
                console.log("Demo user exists but login failed. Forcing entry.");
            } else {
                throw regError;
            }
        }
        localStorage.setItem(STORAGE_KEY_EMAIL, demoUserStruct.email);
        return { user: demoUserStruct, reward: null };
    }
});

export const loginLocal = createAsyncThunk(
  'user/login',
  async (payload: { email: string; password: string }, { dispatch }) => {
    const response = await api.login(payload.email, payload.password);
    const normalizedUser = mapSheetToUser(response);
    
    localStorage.setItem(STORAGE_KEY_EMAIL, normalizedUser.email);
    
    const loginRes = await api.dailyLogin(normalizedUser.email);
    let reward = null;
    if (loginRes.success && !loginRes.alreadyLoggedIn) {
         const bonusMultiplier = 1 + (loginRes.streakDays * 0.1);
         reward = { coins: 50 * bonusMultiplier, xp: 100 * bonusMultiplier, streak: loginRes.streakDays, bonusMultiplier };
         dispatch(addExperience({ xp: reward.xp, coins: reward.coins }));
         normalizedUser.streakDays = loginRes.streakDays;
    }

    return { user: normalizedUser, reward };
  }
);

export const registerLocal = createAsyncThunk(
  'user/register',
  async (payload: { email: string; password: string; username: string; hasConsent: boolean, grade?: number }) => {
    await api.register(payload.email, payload.password, payload.username, payload.grade || 7);
    
    const newUserState: UserProfile = {
        ...DEFAULT_USER_DATA,
        email: payload.email.toLowerCase().trim(),
        username: payload.username,
        grade: payload.grade || 7,
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
    
    try {
        await api.updateProfile({
            email: currentUser.email,
            username: updates.username,
            grade: updates.grade,
            className: updates.className || (updates.heroClass ? updates.heroClass.toUpperCase() : undefined),
            classEmoji: updates.classEmoji,
            currentLocation: updates.currentLocation,
            selectedTheme: updates.themeColor,
            tutorialCompleted: updates.tutorialCompleted
        });
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

        const cost = user.heroClass ? 500 : 0;

        if (user.coins < cost) {
            toast.error(`Не хватает золота! Нужно ${cost} 💰`);
            throw new Error("Insufficient funds");
        }

        if (cost > 0) {
            audio.playCoins(); 
        }

        const newCoins = user.coins - cost;
        
        await dispatch(updateUserProfile({ 
            heroClass, 
            className: heroClass.charAt(0).toUpperCase() + heroClass.slice(1),
            coins: newCoins 
        }));
        
        api.updateProgress(user.email, { coins: newCoins }).catch(console.warn);

        toast.success(`Класс выбран: ${heroClass.toUpperCase()}!`);
        return { heroClass, coins: newCoins };
    }
);

export const purchaseItemAction = createAsyncThunk(
    'user/purchaseItem',
    async (item: { id: string, name: string, cost: number }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return rejectWithValue("No user");

        if (user.coins < item.cost) {
            toast.error("Не хватает золота!");
            return rejectWithValue("Insufficient funds");
        }

        try {
            audio.playCoins();
            // Fire API call, wait for it to complete to prevent spam
            await api.addPurchase(user.email, item);
            return item;
        } catch (e: any) {
            handleApiError(e);
            return rejectWithValue(e.message);
        }
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState;
            if (state.user.pendingActions.purchase) {
                return false;
            }
        }
    }
);

export const submitDailyMood = createAsyncThunk(
    'user/submitMood',
    async (payload: { motivationScore: number, stressScore: number, enjoymentScore: number, id: string, date: string }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        try {
            await api.setMood(user.email, payload.motivationScore);
            await api.setDailyReport(user.email, {
                date: payload.date,
                score: payload.motivationScore
            }); 
        } catch(e) { handleApiError(e); }
        
        await dispatch(addExperience({ xp: 30, coins: 15 }));
        toast.success("Настроение учтено! +30 XP");

        return { ...payload, date: new Date().toISOString() };
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState;
            if (state.user.pendingActions.setMood) {
                return false;
            }
        }
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
    
    return { ...updates, rewardDelta: payload };
  }
);

export const completeQuestAction = createAsyncThunk(
    'user/completeQuestAction',
    async (payload: { quest: Quest, multiplier?: number }, { getState, dispatch, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return rejectWithValue("No user");
        
        // NOTE: pending check removed from body, used in condition instead to prevent self-lock

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

        // 1. Update Redux State (Optimistic)
        const expResult = await dispatch(addExperience({ xp: xpReward, coins: coinsReward })).unwrap();
        
        if (bonusName) toast.success(`Бонус класса (${bonusName}): +10%`);
        if (hpLost > 0) toast.error(`Потеряно ${hpLost} HP из-за низкого качества!`);

        const historyItem: QuestHistoryItem = { 
            questId: quest.id, 
            questTitle: quest.title, 
            xpEarned: xpReward,
            date: new Date().toISOString(),
            score: multiplier,
            category: quest.category
        };
        
        const newHistory = [...(user.questHistory || []), historyItem];
        const newTimers = { ...user.activeQuestTimers };
        delete newTimers[quest.id]; 

        let updates: Partial<UserProfile> = {
            completedQuests: (user.completedQuests || 0) + 1,
            questHistory: newHistory,
            activeQuestTimers: newTimers,
            dailyCompletionsCount: (user.dailyCompletionsCount || 0) + 1,
            currentHp: Math.max(0, user.currentHp - hpLost)
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
                    audio.playQuestComplete(); 
                    toast.success("Все задания дня выполнены!", { autoClose: false });
                }
            }
        }
        
        // 2. Call Extended API v2.0
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
                newLevel: expResult?.level || user.level,
                newXp: expResult?.currentXp || user.currentXp,
                newNextLevelXp: expResult?.nextLevelXp || user.nextLevelXp,
                newCoins: expResult?.coins || user.coins
            };
            await api.completeQuest(apiPayload);
        } catch (e) { handleApiError(e); }
        
        return updates;
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState;
            if (state.user.pendingActions.completeQuest) {
                return false;
            }
        }
    }
);

export const completeBossBattleAction = createAsyncThunk(
    'user/completeBossBattle',
    async (payload: BossBattlePayload, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        // Optimistic
        if (payload.won) {
            await dispatch(addExperience({ xp: payload.xpEarned, coins: payload.coinsEarned }));
        }

        try {
            await api.completeBossBattle(payload);
        } catch (e) { handleApiError(e); }
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState;
            if (state.user.pendingActions.bossBattle) {
                return false;
            }
        }
    }
);

export const updateCampaignAction = createAsyncThunk(
    'user/updateCampaignAction',
    async (payload: { campaignId: string, currentDay: number, completedDays: number[] }, { getState }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;
        try {
            await api.updateCampaign(user.email, payload.campaignId, payload.currentDay, payload.completedDays);
        } catch (e) { handleApiError(e); }
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
            api.unlockAlly(user.email, allyUnlocked).catch(console.warn);
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
        // Sync Campaign
        await dispatch(updateCampaignAction({ 
            campaignId: 'main', 
            currentDay: nextDay > 14 ? 14 : nextDay, 
            completedDays: [] 
        }));

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
                // Fire and forget
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
            // Sync progress for achievement rewards
            api.updateProgress(user.email, { currentXp: updates.currentXp, coins: updates.coins }).catch(console.warn);
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
    // purchaseItem Removed - replaced by Thunk
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
         api.updateProfile({ email: state.currentUser.email, selectedTheme: action.payload }).catch(console.warn);
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
      // Init Auth
      .addCase(initAuth.pending, (state) => { state.pendingActions.auth = true; })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.pendingActions.auth = false;
        if (action.payload) {
            state.currentUser = action.payload.user;
            state.dailyRewardPopup = action.payload.reward;
        }
        state.loading = false;
      })
      .addCase(initAuth.rejected, (state) => { state.pendingActions.auth = false; })

      // Register/Login
      .addCase(registerLocal.pending, (state) => { state.pendingActions.auth = true; })
      .addCase(registerLocal.fulfilled, (state, action) => { 
          state.pendingActions.auth = false;
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(registerLocal.rejected, (state) => { state.pendingActions.auth = false; })

      .addCase(loginLocal.pending, (state) => { state.pendingActions.auth = true; })
      .addCase(loginLocal.fulfilled, (state, action) => { 
          state.pendingActions.auth = false;
          state.currentUser = action.payload.user; 
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(loginLocal.rejected, (state) => { state.pendingActions.auth = false; })

      .addCase(loginDemo.pending, (state) => { state.pendingActions.auth = true; })
      .addCase(loginDemo.fulfilled, (state, action) => { 
          state.pendingActions.auth = false;
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
      })
      .addCase(loginDemo.rejected, (state) => { state.pendingActions.auth = false; })

      .addCase(logoutLocal.fulfilled, (state) => { state.currentUser = null; })

      // Updates
      .addCase(updateUserProfile.pending, (state) => { state.pendingActions.updateProfile = true; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.pendingActions.updateProfile = false;
        if (state.currentUser) state.currentUser = { ...state.currentUser, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state) => { state.pendingActions.updateProfile = false; })

      // Experience
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

      // Quest Flow
      .addCase(startQuestAction.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
      .addCase(completeQuestAction.pending, (state) => { state.pendingActions.completeQuest = true; })
      .addCase(completeQuestAction.fulfilled, (state, action) => {
          state.pendingActions.completeQuest = false;
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
      .addCase(completeQuestAction.rejected, (state) => { state.pendingActions.completeQuest = false; })

      // Purchase
      .addCase(purchaseItemAction.pending, (state) => { state.pendingActions.purchase = true; })
      .addCase(purchaseItemAction.fulfilled, (state, action) => {
          state.pendingActions.purchase = false;
          if (state.currentUser && action.payload) {
              state.currentUser.coins -= action.payload.cost;
              if (!state.currentUser.inventory) state.currentUser.inventory = [];
              state.currentUser.inventory.push(action.payload.id);
          }
      })
      .addCase(purchaseItemAction.rejected, (state) => { state.pendingActions.purchase = false; })

      // Campaign
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

      // Boss Battle
      .addCase(completeBossBattleAction.pending, (state) => { state.pendingActions.bossBattle = true; })
      .addCase(completeBossBattleAction.fulfilled, (state) => { state.pendingActions.bossBattle = false; })
      .addCase(completeBossBattleAction.rejected, (state) => { state.pendingActions.bossBattle = false; })

      // Mood
      .addCase(submitDailyMood.pending, (state) => { state.pendingActions.setMood = true; })
      .addCase(submitDailyMood.fulfilled, (state, action) => {
          state.pendingActions.setMood = false;
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
      .addCase(submitDailyMood.rejected, (state) => { state.pendingActions.setMood = false; })

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

// Selectors
export const selectIsPending = (key: keyof PendingActions) => (state: RootState) => state.user.pendingActions[key];

export const { 
    setUser, clearUser, equipSkin, submitSurvey, setThemeColor, 
    adminSetDay, adminCompleteDay, adminResetCampaign, closeDailyRewardModal,
    popRewardAnimation 
} = userSlice.actions;
export default userSlice.reducer;
