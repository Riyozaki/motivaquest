
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, Achievement, SurveySubmission, ThemeColor, Quest, QuestHistoryItem } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';
import { CAMPAIGN_DATA } from './questsSlice';
import { analytics } from '../services/analytics';
import { api } from '../services/api';

const STORAGE_KEY_EMAIL = 'motiva_user_email';
const STORAGE_KEY_LAST_REWARD = 'motiva_last_reward_claim'; // Local lock to prevent refresh exploit

interface DailyRewardData {
    xp: number;
    coins: number;
    streak: number;
    bonusMultiplier: number;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  dailyRewardPopup: DailyRewardData | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  dailyRewardPopup: null,
};

// --- DEFAULT USER STATE ---
const DEFAULT_USER_DATA: Partial<UserProfile> = {
    role: 'student',
    avatar: 'warrior',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    coins: 0,
    completedQuests: 0,
    inventory: [],
    achievements: [],
    questHistory: [],
    surveyHistory: [],
    hasParentalConsent: false,
    themeColor: 'purple',
    activeQuestTimers: {},
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

// --- Helper: Map Google Sheet Data to UserProfile ---
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
        avatar: progress.visitorAvatar || 'warrior',
        streakDays: Number(info.dailyStreak) || 0,
        streakTakenToday: Boolean(info.streakTakenToday), // Backend flag
        themeColor: info.interfaceColor || 'purple',
        lastDailyMood: info.moodDate || info.mood !== 'neutral' ? (info.moodDate || new Date().toISOString()) : undefined, // Use info.moodDate if available
        inventory: inventory,
        achievements: achievements,
        questHistory: mappedHistory,
        campaign: campaignData,
        completedQuests: mappedHistory.length,
        hasParentalConsent: true,
        lastLoginDate: new Date().toDateString() // We set this client-side for "session" tracking, but rely on LS/Flag for rewards
    } as UserProfile;
};

// --- Helper: Smart Daily Login Logic ---
const processDailyLogin = (user: UserProfile): { user: UserProfile, reward: DailyRewardData | null } => {
    const today = new Date().toDateString();
    const lastClaimedLocal = localStorage.getItem(STORAGE_KEY_LAST_REWARD);

    // 1. Check LocalStorage Lock (Prevents infinite refresh reward)
    if (lastClaimedLocal === today) {
        // Already claimed on this browser today
        return { user, reward: null };
    }

    // 2. Check Backend Flag (Prevents cross-device double claim if synced)
    if (user.streakTakenToday) {
        // Already claimed on backend
        localStorage.setItem(STORAGE_KEY_LAST_REWARD, today); // Sync local
        return { user, reward: null };
    }

    // --- GRANT REWARD ---
    
    // Check if streak is consecutive (mock logic: if last reward was yesterday)
    // For simplicity, we trust the sheet's dailyStreak count, and just increment it.
    // If user missed a day, backend script *should* ideally reset it, but here we just increment.
    
    const newStreak = (user.streakDays || 0) + 1;
    const bonusMultiplier = 1 + (newStreak * 0.1);
    const coinsEarned = Math.floor(50 * bonusMultiplier);
    const xpEarned = Math.floor(100 * bonusMultiplier);

    let newUser = { ...user };
    newUser.streakDays = newStreak;
    newUser.streakTakenToday = true;
    newUser.coins = (newUser.coins || 0) + coinsEarned;
    newUser.currentXp = (newUser.currentXp || 0) + xpEarned;

    // Level Up Logic
    if (!newUser.nextLevelXp) newUser.nextLevelXp = 100 * Math.pow(1.5, newUser.level - 1);
    while (newUser.currentXp >= newUser.nextLevelXp) {
        newUser.currentXp -= newUser.nextLevelXp;
        newUser.level++;
        newUser.nextLevelXp = Math.floor(100 * Math.pow(1.5, newUser.level - 1));
    }

    // Set Local Lock
    localStorage.setItem(STORAGE_KEY_LAST_REWARD, today);

    return { 
        user: newUser, 
        reward: { coins: coinsEarned, xp: xpEarned, streak: newStreak, bonusMultiplier } 
    };
};

// --- Thunks ---

export const initAuth = createAsyncThunk('user/initAuth', async () => {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (!email) return null;

    try {
        const response = await api.getAllUserData(email);
        
        if (!response.success) {
            console.warn("User has email in LS but not found in DB or API error");
            return null;
        }

        const normalizedUser = mapSheetToUser(response);
        
        // Execute Smart Reward Logic
        const { user: updatedUser, reward } = processDailyLogin(normalizedUser);
        
        if (reward) {
            // Sync Reward to Backend
            api.updateProgress(updatedUser.email, {
                coins: updatedUser.coins,
                currentXp: updatedUser.currentXp,
                level: updatedUser.level
            });
            api.updateInfo(updatedUser.email, {
                dailyStreak: updatedUser.streakDays,
                streakTakenToday: true // Lock backend
            });
        }

        return { user: updatedUser, reward };
    } catch (e) {
        console.error("Auth Init Failed:", e);
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
    
    if(reward) {
        api.updateProgress(updatedUser.email, { coins: updatedUser.coins, currentXp: updatedUser.currentXp });
        api.updateInfo(updatedUser.email, { dailyStreak: updatedUser.streakDays, streakTakenToday: true });
    }
    
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

    const infoUpdates: any = {};
    if (updates.themeColor) infoUpdates.interfaceColor = updates.themeColor;
    if (updates.streakDays !== undefined) infoUpdates.dailyStreak = updates.streakDays;
    
    if (updates.campaign) {
        if (updates.campaign.currentDay) infoUpdates.currentLevel = updates.campaign.currentDay;
        if (updates.campaign.unlockedAllies) infoUpdates.unlockedAllies = updates.campaign.unlockedAllies;
    }

    if (Object.keys(progressUpdates).length > 0) {
        api.updateProgress(currentUser.email, progressUpdates).catch(e => console.warn("Progress sync fail", e));
    }
    if (Object.keys(infoUpdates).length > 0) {
        api.updateInfo(currentUser.email, infoUpdates).catch(e => console.warn("Info sync fail", e));
    }
    
    return updates;
  }
);

export const submitDailyMood = createAsyncThunk(
    'user/submitMood',
    async (payload: { motivationScore: number, stressScore: number, enjoymentScore: number, id: string, date: string }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        const moodScore = payload.motivationScore; 
        
        // 1. Send simple string to 'mood' column
        await api.setMood(user.email, moodScore);
        
        // 2. Keep history in 'dailyReport' column as JSON (for stats/admin)
        await api.setDailyReport(user.email, {
            date: payload.date,
            score: moodScore
        }); 
        
        await dispatch(addExperience({ xp: 30, coins: 15 }));
        toast.success("Настроение учтено! +30 XP");

        return { ...payload, date: new Date().toISOString() }; // Ensure ISO string returned
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
      toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
    }

    if (didLevelUp) analytics.track('level_up', user, { oldLevel: user.level, newLevel: currentLevel });

    const updates = { currentXp: newXp, level: currentLevel, nextLevelXp, coins: newCoins };
    api.updateProgress(user.email, updates).catch(console.warn);

    setTimeout(() => { dispatch(checkAchievements()); }, 500);
    return updates;
  }
);

export const completeQuestAction = createAsyncThunk(
    'user/completeQuestAction',
    async (payload: { quest: Quest, multiplier?: number }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        const { quest, multiplier = 1 } = payload;
        
        let xpReward = Math.floor(quest.xp * multiplier);
        let coinsReward = Math.floor(quest.coins * multiplier);
        
        if ((user.dailyCompletionsCount || 0) >= 10) {
            xpReward = 0; coinsReward = 0;
            toast.warning("Лимит на сегодня исчерпан.");
        }

        if (xpReward > 0) {
            await dispatch(addExperience({ xp: xpReward, coins: coinsReward }));
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

        if (user.campaign) {
            const currentStoryDay = CAMPAIGN_DATA.find(d => d.day === user.campaign.currentDay);
            if (currentStoryDay) {
                const requiredIds = currentStoryDay.questIds;
                const completedIds = new Set(newHistory.map(h => h.questId));
                const allDone = requiredIds.every(id => completedIds.has(id));
                if (allDone && !user.campaign.isDayComplete) {
                    updates = { ...updates, campaign: { ...user.campaign, isDayComplete: true } };
                    toast.success("Все задания дня выполнены!", { autoClose: false });
                }
            }
        }
        
        await api.completeQuest(user.email, quest.id, quest.title);
        
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
        
        api.addAchievement(user.email, { id: 'legend_of_productivity', title: 'Legend of Productivity' });
        
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
                api.addAchievement(user.email, ach);
                toast.info(`🏆 Получено достижение: ${ach.title}!`, { theme: 'dark' });
            }
        });

        if (newUnlocked.length > 0) {
            const updates = { 
                currentXp: user.currentXp + totalRewardXp, 
                coins: user.coins + totalRewardCoins, 
                achievements: [...user.achievements, ...newUnlocked] 
            };
            api.updateProgress(user.email, { currentXp: updates.currentXp, coins: updates.coins });
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
    purchaseItem: (state, action: PayloadAction<{ item: {id: string, name: string, cost: number} }>) => {
       if (!state.currentUser || !state.currentUser.email) return;
       const { item } = action.payload;
       if (state.currentUser.coins >= item.cost) {
         state.currentUser.coins -= item.cost;
         if (!state.currentUser.inventory) state.currentUser.inventory = [];
         state.currentUser.inventory.push(item.id);
         
         api.updateProgress(state.currentUser.email, { coins: state.currentUser.coins });
         api.addPurchase(state.currentUser.email, item);
       }
    },
    equipSkin: (state, action) => {
       if (state.currentUser && state.currentUser.email) {
         state.currentUser.avatar = action.payload;
         api.updateProgress(state.currentUser.email, { avatar: action.payload });
       }
    },
    submitSurvey: (state, action: PayloadAction<SurveySubmission>) => { },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
       if (state.currentUser && state.currentUser.email) {
         state.currentUser.themeColor = action.payload;
         api.updateInfo(state.currentUser.email, { interfaceColor: action.payload });
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
              // Simplified history tracking in local state for UI update
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

export const { setUser, clearUser, purchaseItem, equipSkin, submitSurvey, setThemeColor, adminSetDay, adminCompleteDay, adminResetCampaign, closeDailyRewardModal } = userSlice.actions;
export default userSlice.reducer;
