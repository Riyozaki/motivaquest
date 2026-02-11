import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, SurveySubmission, ThemeColor, QuestHistoryItem, HeroClass } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';
import { analytics } from '../services/analytics';
import { api } from '../services/api';
import { audio } from '../services/audio';

// Import actions from other slices for extraReducers
import { completeQuestAction } from './questsSlice';
import { advanceCampaignDay, finishCampaign, completeBossBattleAction } from './campaignSlice';
import { checkAchievements } from './achievementsSlice';
import { CAMPAIGN_DATA } from './questsSlice';

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
    equipSkin: boolean;
    regen: boolean;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  dailyRewardPopup: DailyRewardData | null;
  pendingRewardAnimations: RewardAnimation[];
  pendingActions: PendingActions;
  nextRegenTime: number;
  pendingSyncCount: number; // New field for offline queue visual
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
      auth: false,
      equipSkin: false,
      regen: false
  },
  nextRegenTime: Date.now() + 60 * 1000, // Reduced to 1 minute
  pendingSyncCount: 0
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
    lastCampaignAdvanceDate: undefined,
    campaign: {
        currentDay: 1,
        isDayComplete: false,
        unlockedAllies: []
    }
};

const mapSheetToUser = (rawData: any): UserProfile => {
    if (!rawData || !rawData.user) throw new Error("Empty data");

    const { user } = rawData;
    const progress = rawData.progress || {};
    const info = rawData.info || {};
    const quests = rawData.quests || [];

    const mappedHistory: QuestHistoryItem[] = Array.isArray(quests) ? quests.map((q: any) => ({
        questId: Number(q.questId || q.visitorId),
        questTitle: q.questName || q.visitorName || 'Unknown',
        date: q.completedAt || q.timestamp || new Date().toISOString(),
        xpEarned: Number(q.xpEarned) || 0,
        coinsEarned: Number(q.coinsEarned) || 0,
        score: Number(q.score) || 0,
        category: q.category
    })) : [];

    const campaignProg = info.campaignProgress && Array.isArray(info.campaignProgress) && info.campaignProgress.length > 0 
        ? info.campaignProgress[0] 
        : null;

    const campaignData = {
        currentDay: campaignProg ? Number(campaignProg.currentDay) : (Number(info.currentLevel) || 1), 
        // We do NOT trust the sheet for isDayComplete unless explicitly saved, logic below handles recalculation
        isDayComplete: false, 
        unlockedAllies: Array.isArray(info.unlockedAllies) ? info.unlockedAllies : []
    };

    // Calculate Last Mood Timestamp
    const userEmail = user.email.toLowerCase().trim();
    const localMoodTs = localStorage.getItem(`motiva_mood_ts_${userEmail}`);
    let mappedMoodDate: string | undefined = undefined;

    if (info.mood && info.mood !== 'neutral') {
        if (localMoodTs) {
             mappedMoodDate = localMoodTs;
        } else {
             mappedMoodDate = new Date(Date.now() - 20 * 60 * 1000).toISOString();
        }
    }

    // Re-verify campaign completion on load (2/3 rule)
    const currentStoryDay = CAMPAIGN_DATA.find(d => d.day === campaignData.currentDay);
    if (currentStoryDay) {
        const requiredIds = currentStoryDay.questIds;
        const completedIds = new Set(mappedHistory.map(h => h.questId));
        const completedCount = requiredIds.filter(id => completedIds.has(id)).length;
        const threshold = Math.ceil(requiredIds.length * (2/3)); // 2/3 Rule
        
        if (completedCount >= threshold) {
            campaignData.isDayComplete = true;
        }
    }

    return {
        ...DEFAULT_USER_DATA,
        email: user.email,
        username: user.username,
        grade: Number(user.grade) || 7,
        
        level: Number(progress.level) || 1,
        currentXp: Number(progress.xp) || 0,
        nextLevelXp: Number(progress.nextLevelXp) || 100,
        coins: Number(progress.coins || progress.gold) || 0,
        currentHp: Number(progress.currentHp) || 100,
        streakDays: Number(progress.streakDays || info.dailyStreak) || 0,
        lastLoginDate: progress.lastLoginDate,
        totalQuestsCompleted: Number(progress.totalQuestsCompleted) || 0,
        weeklyXp: Number(progress.weeklyXp) || 0,
        weeklyXpResetDate: progress.weeklyXpResetDate,
        tutorialCompleted: progress.tutorialCompleted === true || progress.tutorialCompleted === 'true',
        
        avatar: progress.visitorAvatar || 'warrior',
        heroClass: info.heroClass || undefined,
        className: progress.className,
        classEmoji: progress.classEmoji,
        currentLocation: progress.currentLocation || 'forest',
        themeColor: info.selectedTheme || info.interfaceColor || 'purple',
        
        inventory: Array.isArray(info.purchases) ? info.purchases.map((p: any) => p.itemId) : [],
        achievements: Array.isArray(info.achievements) ? info.achievements.map((a: any) => a.id) : [],
        questHistory: mappedHistory,
        habitStreaks: info.habitStreaks || {}, // Important: Map streaks from DB
        campaign: campaignData,
        lastCampaignAdvanceDate: info.lastCampaignAdvanceDate,
        
        lastDailyMood: mappedMoodDate,
        completedQuests: mappedHistory.length,
        hasParentalConsent: true,
    } as UserProfile;
};

// Export for other slices
export const handleApiError = (e: any) => {
    if (e.message === 'OFFLINE_SAVED') {
        toast.warning("Нет сети. Данные сохранятся позже.", { autoClose: 3000 });
    } else {
        console.warn("API Error:", e);
    }
};

// --- Thunks ---

export const regenerateStats = createAsyncThunk(
    'user/regenerateStats',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        let newHp = user.currentHp;
        let newDailyCompletions = user.dailyCompletionsCount;
        let updated = false;

        // Regenerate MP (Max 10). MP = 10 - dailyCompletionsCount.
        if (user.dailyCompletionsCount > 0) {
            newDailyCompletions = Math.max(0, user.dailyCompletionsCount - 1);
            updated = true;
        }
        
        // Regenerate HP (Max 100)
        if (user.currentHp < 100) {
            newHp = Math.min(100, user.currentHp + 1);
            updated = true;
        }

        if (updated) {
            try {
                api.updateProgress(user.email, { 
                    currentHp: newHp, 
                }).catch(console.warn);
            } catch (e) {
                console.warn("Regen sync failed");
            }
            return { newHp, newDailyCompletions };
        }
        return null;
    }
);

export const initAuth = createAsyncThunk('user/initAuth', async (_, { dispatch }) => {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (!email) return null;

    try {
        const response = await api.getAllUserData(email);
        if (!response.success) return null;

        const normalizedUser = mapSheetToUser(response);
        const loginRes = await api.dailyLogin(email);
        
        let reward: DailyRewardData | null = null;
        
        if (loginRes.success) {
            normalizedUser.streakDays = loginRes.streakDays;
            if (loginRes.progress && loginRes.progress.currentHp !== undefined) {
                normalizedUser.currentHp = loginRes.progress.currentHp;
            }
            normalizedUser.lastLoginDate = new Date().toISOString().split('T')[0];

            if (!loginRes.alreadyLoggedIn) {
                const bonusMultiplier = 1 + (normalizedUser.streakDays * 0.1);
                // Math.floor to ensure integers
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
        console.warn("Demo user login failed. Registering...");
        try { await api.register(demoEmail, demoPass, demoUsername, 10, "Warrior", "⚔️"); } catch (regError) {}
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
         // Math.floor for integers
         reward = { coins: Math.floor(50 * bonusMultiplier), xp: Math.floor(100 * bonusMultiplier), streak: loginRes.streakDays, bonusMultiplier };
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
        
        // If lastCampaignAdvanceDate is updated, we might want to sync it specifically via updateInfo if updateProfile doesn't handle it
        if (updates.lastCampaignAdvanceDate) {
            api.updateInfo(currentUser.email, { lastCampaignAdvanceDate: updates.lastCampaignAdvanceDate }).catch(console.warn);
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

        const cost = user.heroClass ? 500 : 0;
        if (user.coins < cost) {
            toast.error(`Не хватает золота! Нужно ${cost} 💰`);
            throw new Error("Insufficient funds");
        }

        if (cost > 0) audio.playCoins(); 
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

export const equipSkinAction = createAsyncThunk(
    'user/equipSkin',
    async (avatarId: string, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return rejectWithValue("No user");
        
        try {
            await api.updateProgress(user.email, { avatar: avatarId });
            return avatarId;
        } catch (e: any) {
            handleApiError(e);
            return rejectWithValue(e.message);
        }
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState;
            return !state.user.pendingActions.equipSkin;
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
            // Persist local timestamp to prevent reset on reload
            const userEmail = user.email.toLowerCase().trim();
            localStorage.setItem(`motiva_mood_ts_${userEmail}`, payload.date);
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
      audio.playLevelUp();
      toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
    }

    if (didLevelUp) analytics.track('level_up', user, { oldLevel: user.level, newLevel: currentLevel });
    const updates = { currentXp: newXp, level: currentLevel, nextLevelXp, coins: newCoins };
    return { ...updates, rewardDelta: payload };
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
    popRewardAnimation: (state) => { state.pendingRewardAnimations.shift(); },
    submitSurvey: (state, action: PayloadAction<SurveySubmission>) => { },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
       if (state.currentUser && state.currentUser.email) {
         state.currentUser.themeColor = action.payload;
         api.updateProfile({ email: state.currentUser.email, selectedTheme: action.payload }).catch(console.warn);
       }
    },
    setPendingSyncCount: (state, action: PayloadAction<number>) => {
        state.pendingSyncCount = action.payload;
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
            state.currentUser.lastCampaignAdvanceDate = undefined;
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => { state.pendingActions.auth = true; })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.pendingActions.auth = false;
        if (action.payload) {
            state.currentUser = action.payload.user;
            state.dailyRewardPopup = action.payload.reward;
        }
        state.loading = false;
        state.nextRegenTime = Date.now() + 60 * 1000; // Reset regen timer (1 min)
      })
      .addCase(initAuth.rejected, (state) => { state.pendingActions.auth = false; })
      
      // Login/Register
      .addCase(registerLocal.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
          state.nextRegenTime = Date.now() + 60 * 1000;
      })
      .addCase(loginLocal.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user; 
          state.dailyRewardPopup = action.payload.reward;
          state.nextRegenTime = Date.now() + 60 * 1000;
      })
      .addCase(loginDemo.fulfilled, (state, action) => { 
          state.currentUser = action.payload.user;
          state.dailyRewardPopup = action.payload.reward;
          state.nextRegenTime = Date.now() + 60 * 1000;
      })
      .addCase(logoutLocal.fulfilled, (state) => { state.currentUser = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.currentUser) state.currentUser = { ...state.currentUser, ...action.payload };
      })
      .addCase(equipSkinAction.pending, (state) => { state.pendingActions.equipSkin = true; })
      .addCase(equipSkinAction.fulfilled, (state, action) => {
          state.pendingActions.equipSkin = false;
          if (state.currentUser) state.currentUser.avatar = action.payload;
          toast.success("Скин успешно экипирован!");
      })
      .addCase(equipSkinAction.rejected, (state) => { state.pendingActions.equipSkin = false; })
      
      .addCase(regenerateStats.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser.currentHp = action.payload.newHp;
              state.currentUser.dailyCompletionsCount = action.payload.newDailyCompletions;
          }
          state.nextRegenTime = Date.now() + 60 * 1000; // Reset timer (1 min)
      })

      .addCase(addExperience.fulfilled, (state, action) => {
         if (state.currentUser && action.payload) {
             state.currentUser = { ...state.currentUser, ...action.payload as any };
             const { xp, coins } = action.payload.rewardDelta;
             if (xp > 0 || coins > 0) {
                 state.pendingRewardAnimations.push({ 
                     id: Date.now().toString(), xp, coins 
                 });
             }
         }
      })
      .addCase(startQuestAction.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload };
          }
      })
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

      .addCase(importSaveData.fulfilled, (state, action) => {
          state.currentUser = action.payload;
          toast.success("Данные загружены!");
      })

      // === Cross-Slice Listeners ===
      
      // 1. Quests Slice Listener
      .addCase(completeQuestAction.pending, (state) => { state.pendingActions.completeQuest = true; })
      .addCase(completeQuestAction.fulfilled, (state, action) => {
          state.pendingActions.completeQuest = false;
          if (!state.currentUser || !action.payload) return;

          const { quest, historyItem, xpReward, coinsReward, hpLost } = action.payload;

          // Update lists
          state.currentUser.completedQuests = (state.currentUser.completedQuests || 0) + 1;
          state.currentUser.questHistory = [...(state.currentUser.questHistory || []), historyItem];
          
          const newTimers = { ...state.currentUser.activeQuestTimers };
          delete newTimers[quest.id];
          state.currentUser.activeQuestTimers = newTimers;
          
          state.currentUser.dailyCompletionsCount = (state.currentUser.dailyCompletionsCount || 0) + 1;
          state.currentUser.currentHp = Math.max(0, state.currentUser.currentHp - hpLost);

          // IMPORTANT: Update local streaks immediately for UI
          if (quest.isHabit) {
              const currentStreak = (state.currentUser.habitStreaks?.[quest.id] || 0) + 1;
              state.currentUser.habitStreaks = { 
                  ...(state.currentUser.habitStreaks || {}), 
                  [quest.id]: currentStreak 
              };
              // Persist streaks to backend
              api.updateInfo(state.currentUser.email, { habitStreaks: state.currentUser.habitStreaks }).catch(console.warn);
          }
          
          // Check campaign progression via quests (2/3 Rule)
          if (state.currentUser.campaign) {
            const currentStoryDay = CAMPAIGN_DATA.find(d => d.day === state.currentUser!.campaign.currentDay);
            if (currentStoryDay) {
                const requiredIds = currentStoryDay.questIds;
                const completedIds = new Set(state.currentUser.questHistory.map(h => h.questId));
                
                // Count how many required quests are done
                const completedCount = requiredIds.filter(id => completedIds.has(id)).length;
                const threshold = Math.ceil(requiredIds.length * (2/3)); // 2/3 Rule

                if (completedCount >= threshold && !state.currentUser.campaign.isDayComplete) {
                    state.currentUser.campaign.isDayComplete = true;
                    toast.success("День пройден! (2/3 заданий)", { autoClose: false });
                }
            }
          }
          
          // Re-adding XP logic here since we moved the thunk
          let newXp = (state.currentUser.currentXp || 0) + xpReward;
          let currentLevel = state.currentUser.level || 1;
          let nextLevelXp = state.currentUser.nextLevelXp || 100 * Math.pow(1.5, currentLevel - 1);
          let newCoins = (state.currentUser.coins || 0) + coinsReward;
          
          while (newXp >= nextLevelXp) {
              newXp -= nextLevelXp;
              currentLevel++;
              nextLevelXp = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
              toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
          }

          state.currentUser.currentXp = newXp;
          state.currentUser.level = currentLevel;
          state.currentUser.nextLevelXp = nextLevelXp;
          state.currentUser.coins = newCoins;
      })
      .addCase(completeQuestAction.rejected, (state) => { state.pendingActions.completeQuest = false; })

      // 2. Campaign Slice Listener
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
      .addCase(completeBossBattleAction.pending, (state) => { state.pendingActions.bossBattle = true; })
      .addCase(completeBossBattleAction.fulfilled, (state) => { state.pendingActions.bossBattle = false; })
      .addCase(completeBossBattleAction.rejected, (state) => { state.pendingActions.bossBattle = false; })

      // 3. Achievements Slice Listener
      .addCase(checkAchievements.fulfilled, (state, action) => {
          if (state.currentUser && action.payload) {
              state.currentUser = { ...state.currentUser, ...action.payload as any };
          }
      });
  }
});

export const selectIsPending = (key: keyof PendingActions) => (state: RootState) => state.user.pendingActions[key];

export const { 
    setUser, clearUser, submitSurvey, setThemeColor, 
    adminSetDay, adminCompleteDay, adminResetCampaign, closeDailyRewardModal,
    popRewardAnimation, setPendingSyncCount
} = userSlice.actions;
export default userSlice.reducer;