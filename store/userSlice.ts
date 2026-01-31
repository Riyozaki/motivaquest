import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, Achievement, SurveySubmission, ThemeColor, Quest } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';
import { CAMPAIGN_DATA } from './questsSlice';
import { analytics } from '../services/analytics';

// Keys for LocalStorage
const STORAGE_KEY_USERS = 'motiva_users_db';
const STORAGE_KEY_CURRENT_SESSION = 'motiva_current_uid';

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
  dailyRewardPopup: DailyRewardData | null; // Data for the UI modal
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
  dailyRewardPopup: null,
};

// --- Helpers ---
const getLocalUsers = (): Record<string, UserProfile & { password?: string }> => {
  const data = localStorage.getItem(STORAGE_KEY_USERS);
  return data ? JSON.parse(data) : {};
};

const saveLocalUsers = (users: Record<string, UserProfile & { password?: string }>) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

const saveUser = (user: UserProfile) => {
    if(!user.uid) return;
    const users = getLocalUsers();
    users[user.uid] = user;
    saveLocalUsers(users);
}

// Helper to calculate daily reward
const processDailyLogin = (user: UserProfile): { user: UserProfile, reward: DailyRewardData | null } => {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // If already logged in today, no reward
    if (user.lastLoginDate === today) {
        return { user, reward: null };
    }

    // Logic for streak
    let newStreak = 1;
    if (user.lastLoginDate === yesterdayStr) {
        newStreak = (user.streakDays || 0) + 1;
    } 
    // If missed a day (lastLogin < yesterday), streak resets to 1 (default)

    // Calculate Reward
    const BASE_COINS = 50;
    const BASE_XP = 100;
    const bonusMultiplier = 1 + (newStreak - 1) * 0.1; // +10% per day

    const coinsEarned = Math.floor(BASE_COINS * bonusMultiplier);
    const xpEarned = Math.floor(BASE_XP * bonusMultiplier);

    // Update User
    let newUser = { ...user };
    newUser.streakDays = newStreak;
    newUser.lastLoginDate = today;
    newUser.coins += coinsEarned;
    newUser.currentXp += xpEarned;
    newUser.dailyCompletionsCount = 0; // Reset daily limit

    // Simple Level Up Check inside login (to prevent lost levels)
    while (newUser.currentXp >= newUser.nextLevelXp) {
        newUser.currentXp -= newUser.nextLevelXp;
        newUser.level++;
        newUser.nextLevelXp = Math.floor(newUser.nextLevelXp * 1.5);
    }

    return { 
        user: newUser, 
        reward: { 
            coins: coinsEarned, 
            xp: xpEarned, 
            streak: newStreak, 
            bonusMultiplier 
        } 
    };
};

// --- Thunks ---

export const initAuth = createAsyncThunk('user/initAuth', async () => {
    const currentUid = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
    if (currentUid) {
      const users = getLocalUsers();
      if (users[currentUid]) return users[currentUid];
    }
    return null;
});

export const loginDemo = createAsyncThunk('user/loginDemo', async () => {
    const demoUid = 'demo_hero_id';
    const users = getLocalUsers();
    
    if (!users[demoUid]) {
        users[demoUid] = {
            uid: demoUid,
            username: 'Искатель Приключений',
            email: 'demo@motivaquest.local',
            password: '',
            role: 'student', 
            avatar: 'warrior',
            level: 1,
            currentXp: 0,
            nextLevelXp: 100,
            coins: 50,
            completedQuests: 0,
            inventory: [],
            achievements: [],
            surveyHistory: [],
            questHistory: [],
            hasParentalConsent: true,
            themeColor: 'purple',
            activeQuestTimers: {},
            dailyCompletionsCount: 0,
            suspiciousFlags: 0,
            streakDays: 0,
            lastLoginDate: '', // Force reward on first demo login
            campaign: {
                currentDay: 1,
                isDayComplete: false,
                unlockedAllies: []
            }
        };
    }
    
    const { user: updatedUser, reward } = processDailyLogin(users[demoUid]);
    users[demoUid] = updatedUser;
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, demoUid);

    analytics.track('login', updatedUser, { type: 'demo', streak: updatedUser.streakDays });
    
    return { user: updatedUser, reward };
});

export const loginLocal = createAsyncThunk(
  'user/login',
  async (payload: { email: string; password: string }) => {
    const users = getLocalUsers();
    const foundUser = Object.values(users).find(u => u.email === payload.email && u.password === payload.password);
    if (!foundUser) throw new Error('Неверный email или пароль');
    
    const { user: updatedUser, reward } = processDailyLogin(foundUser);
    
    users[updatedUser.uid!] = updatedUser;
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, updatedUser.uid!);

    analytics.track('login', updatedUser, { streak: updatedUser.streakDays });
    
    return { user: updatedUser, reward };
  }
);

export const registerLocal = createAsyncThunk(
  'user/register',
  async (payload: { email: string; password: string; username: string; hasConsent: boolean }) => {
    const users = getLocalUsers();
    if (Object.values(users).find(u => u.email === payload.email)) throw new Error('Email занят');

    const newUid = 'user_' + Date.now();
    const newUserTemplate: UserProfile & { password: string } = {
      uid: newUid,
      username: payload.username,
      email: payload.email,
      password: payload.password,
      role: payload.email.includes('admin') ? 'admin' : 'student',
      avatar: 'warrior',
      level: 1,
      currentXp: 0,
      nextLevelXp: 100,
      coins: 0,
      completedQuests: 0,
      inventory: [],
      achievements: [],
      surveyHistory: [],
      questHistory: [],
      hasParentalConsent: payload.hasConsent,
      themeColor: 'purple',
      activeQuestTimers: {},
      dailyCompletionsCount: 0,
      suspiciousFlags: 0,
      streakDays: 0, // Will be set to 1 by processDailyLogin
      lastLoginDate: '', // Empty to trigger first reward
      campaign: {
          currentDay: 1,
          isDayComplete: false,
          unlockedAllies: []
      }
    };

    const { user: updatedUser, reward } = processDailyLogin(newUserTemplate);

    users[newUid] = updatedUser;
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, newUid);

    analytics.track('register', updatedUser, { email: payload.email });
    
    return { user: updatedUser, reward };
  }
);

export const logoutLocal = createAsyncThunk('user/logout', async () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
    return null;
});

export const updateUserProfile = createAsyncThunk(
  'user/update',
  async (updates: Partial<UserProfile>, { getState }) => {
    const state = getState() as RootState;
    const currentUser = state.user.currentUser;
    if (!currentUser || !currentUser.uid) throw new Error("No user");
    
    const updatedUser = { ...currentUser, ...updates };
    saveUser(updatedUser);
    return updates;
  }
);

export const submitDailyMood = createAsyncThunk(
    'user/submitMood',
    async (mood: number, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.uid) return;

        const today = new Date().toDateString();
        
        if (user.lastDailyMood === today) {
            throw new Error("Сегодня ты уже отмечал настроение!");
        }

        const xpGain = 20;
        const coinGain = 5;

        await dispatch(addExperience({ xp: xpGain, coins: coinGain }));
        return today; 
    }
);

export const startQuestAction = createAsyncThunk(
    'user/startQuest',
    async (questId: number, { getState }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user) return;

        if (user.activeQuestTimers && user.activeQuestTimers[questId]) return;

        analytics.track('quest_start', user, { questId });

        const timers = { ...user.activeQuestTimers, [questId]: Date.now() };
        const updates = { activeQuestTimers: timers };
        
        const users = getLocalUsers();
        if (user.uid) {
            users[user.uid] = { ...users[user.uid], ...updates };
            saveLocalUsers(users);
        }
        return updates;
    }
);

export const addExperience = createAsyncThunk(
  'user/addExperience',
  async (payload: { xp: number; coins: number }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const user = state.user.currentUser;
    if (!user || !user.uid) return null;

    let newXp = user.currentXp + payload.xp;
    let currentLevel = user.level;
    let nextLevelXp = user.nextLevelXp;
    let newCoins = user.coins + payload.coins;

    let didLevelUp = false;

    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = Math.floor(nextLevelXp * 1.5);
      didLevelUp = true;
      toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
    }

    if (didLevelUp) {
        analytics.track('level_up', user, { oldLevel: user.level, newLevel: currentLevel });
    }

    const updates = {
      currentXp: newXp,
      level: currentLevel,
      nextLevelXp: nextLevelXp,
      coins: newCoins,
    };
    
    setTimeout(() => {
        dispatch(checkAchievements());
    }, 500);

    return updates;
  }
);

export const completeQuestAction = createAsyncThunk(
    'user/completeQuestAction',
    async (payload: { quest: Quest, multiplier?: number }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user) return;

        const { quest, multiplier = 1 } = payload;

        const now = Date.now();
        const startTime = user.activeQuestTimers?.[quest.id] || now;
        const timeDiffMinutes = (now - startTime) / 60000;
        
        let xpReward = Math.floor(quest.xp * multiplier);
        let coinsReward = Math.floor(quest.coins * multiplier);
        
        let isSuspicious = false;
        let message = "";

        const dailyCount = user.dailyCompletionsCount || 0;
        if (dailyCount >= 10) {
            xpReward = 0;
            coinsReward = 0;
            message = "Лимит на сегодня исчерпан (10/10). Ты молодец, но нужно отдыхать.";
        }
        else if (timeDiffMinutes < quest.minMinutes * 0.9) {
            xpReward = Math.floor(xpReward * 0.5);
            message = `Подозрительная скорость! XP уполовинено. (Нужно ${quest.minMinutes} мин)`;
        }

        if (user.lastCompletionTime) {
            const timeSinceLast = (now - user.lastCompletionTime) / 60000;
            if (timeSinceLast < 1 && dailyCount > 0) {
                 isSuspicious = true;
            }
        }

        if (isSuspicious) {
            const newFlags = (user.suspiciousFlags || 0) + 1;
            if (newFlags >= 3) {
                xpReward = 0;
                message = "Ты робот? Награды заблокированы из-за подозрительной активности.";
            } else {
                message += " Слишком быстро! Система следит за тобой.";
            }
        }

        analytics.track('quest_complete', user, { 
            questId: quest.id, 
            questTitle: quest.title,
            xpEarned: xpReward,
            coinsEarned: coinsReward,
            durationMin: timeDiffMinutes.toFixed(2),
            multiplier
        });

        if (xpReward > 0) {
            await dispatch(addExperience({ xp: xpReward, coins: coinsReward }));
        }
        
        if (message) {
            toast.warning(message, { autoClose: 5000 });
        }

        const historyItem = { 
            questId: quest.id, 
            questTitle: quest.title, 
            xpEarned: xpReward,
            date: new Date().toISOString() 
        };
        const newHistory = [...(user.questHistory || []), historyItem];
        const newTimers = { ...user.activeQuestTimers };
        delete newTimers[quest.id];

        let updates: Partial<UserProfile> = {
            completedQuests: user.completedQuests + 1,
            questHistory: newHistory,
            activeQuestTimers: newTimers,
            dailyCompletionsCount: dailyCount + 1,
            lastCompletionTime: now,
            suspiciousFlags: isSuspicious ? (user.suspiciousFlags || 0) + 1 : user.suspiciousFlags
        };

        if (user.campaign) {
            const currentStoryDay = CAMPAIGN_DATA.find(d => d.day === user.campaign.currentDay);
            if (currentStoryDay) {
                const requiredIds = currentStoryDay.questIds;
                const completedIds = new Set(newHistory.map(h => h.questId));
                const allDone = requiredIds.every(id => completedIds.has(id));
                
                if (allDone && !user.campaign.isDayComplete) {
                    updates = { ...updates, campaign: { ...user.campaign, isDayComplete: true } };
                    toast.success("Все задания дня выполнены! Заверши день в штабе.", { autoClose: false });
                    analytics.track('day_complete', user, { day: user.campaign.currentDay });
                }
            }
        }
        
        const users = getLocalUsers();
        if (user.uid) {
            users[user.uid] = { ...users[user.uid], ...updates };
            saveLocalUsers(users);
        }

        return updates;
    }
);

export const advanceCampaignDay = createAsyncThunk(
    'user/advanceCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.uid || !user.campaign.isDayComplete) return;

        const nextDay = user.campaign.currentDay + 1;
        
        const newAllies = [...user.campaign.unlockedAllies];
        if (nextDay === 3) newAllies.push('fairy');
        if (nextDay === 7) newAllies.push('warrior');

        await dispatch(addExperience({ xp: 100, coins: 50 }));

        analytics.track('story_advance', user, { toDay: nextDay });

        const updates = {
            campaign: {
                currentDay: nextDay > 14 ? 14 : nextDay, 
                isDayComplete: false,
                unlockedAllies: newAllies
            }
        };

        const users = getLocalUsers();
        users[user.uid] = { ...users[user.uid], ...updates };
        saveLocalUsers(users);

        toast.info("День завершен! Сюжет продолжается...", { icon: "📜" });
        return updates;
    }
);

export const finishCampaign = createAsyncThunk(
    'user/finishCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.uid) return;

        await dispatch(addExperience({ xp: 5000, coins: 2000 }));
        await dispatch(updateUserProfile({
            achievements: [...user.achievements, 'legend_of_productivity']
        }));

        analytics.track('game_complete', user, {});

        toast.success("ТЫ ПРОШЕЛ ИГРУ! ЛЕГЕНДА!", { icon: "👑", autoClose: false });
        
        // Mark Day 14 Complete but stay on it for now (End Game State)
        const updates = {
             campaign: {
                ...user.campaign,
                isDayComplete: true
            }
        };
        const users = getLocalUsers();
        users[user.uid] = { ...users[user.uid], ...updates };
        saveLocalUsers(users);

        return updates;
    }
);

export const checkAchievements = createAsyncThunk(
    'user/checkAchievements',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        const allAchievements = state.rewards.achievements;
        
        if (!user) return;

        const newUnlocked: string[] = [];
        let totalRewardXp = 0;
        let totalRewardCoins = 0;

        allAchievements.forEach(ach => {
            if (user.achievements.includes(ach.id)) return;

            let unlocked = false;
            switch (ach.conditionType) {
                case 'quests':
                    if (user.completedQuests >= ach.threshold) unlocked = true;
                    break;
                case 'coins':
                    if (user.coins >= ach.threshold) unlocked = true;
                    break;
                case 'xp':
                     if (ach.id === 'ach_lvl2' && user.level >= 2) unlocked = true;
                     if (ach.id === 'ach_lvl5' && user.level >= 5) unlocked = true;
                     break;
                case 'streak':
                     if (ach.id === 'ach_streak7' && user.streakDays >= 7) unlocked = true;
                     break;
            }

            if (unlocked) {
                newUnlocked.push(ach.id);
                totalRewardXp += ach.rewardXp;
                totalRewardCoins += ach.rewardCoins;
                toast.info(`🏆 Получено достижение: ${ach.title}!`, { theme: 'dark' });
                analytics.track('achievement_unlocked', user, { achievementId: ach.id });
            }
        });

        if (newUnlocked.length > 0) {
            const finalXp = user.currentXp + totalRewardXp;
            const finalCoins = user.coins + totalRewardCoins;
            const finalAchList = [...user.achievements, ...newUnlocked];
            
            const users = getLocalUsers();
            if (user.uid && users[user.uid]) {
                 users[user.uid] = { 
                     ...users[user.uid], 
                     currentXp: finalXp, 
                     coins: finalCoins, 
                     achievements: finalAchList 
                 };
                 saveLocalUsers(users);
            }

            return { 
                achievements: finalAchList, 
                currentXp: finalXp, 
                coins: finalCoins 
            };
        }
        return null;
    }
);

export const importSaveData = createAsyncThunk('user/import', async (json: string) => {
    const data = JSON.parse(json);
    const users = getLocalUsers();
    users[data.uid] = data;
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, data.uid);
    return data;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => { state.currentUser = action.payload; },
    clearUser: (state) => { state.currentUser = null; },
    closeDailyRewardModal: (state) => { state.dailyRewardPopup = null; },
    purchaseItem: (state, action: PayloadAction<{ itemId: string; cost: number }>) => {
       if (!state.currentUser) return;
       const { itemId, cost } = action.payload;
       if (state.currentUser.coins >= cost) {
         state.currentUser.coins -= cost;
         if (!state.currentUser.inventory) state.currentUser.inventory = [];
         state.currentUser.inventory.push(itemId);
         saveUser(state.currentUser);
         analytics.track('purchase', state.currentUser, { itemId, cost });
       }
    },
    equipSkin: (state, action) => {
       if (state.currentUser) {
         state.currentUser.avatar = action.payload;
         saveUser(state.currentUser);
       }
    },
    submitSurvey: (state, action: PayloadAction<SurveySubmission>) => {
       if (state.currentUser) {
         if (!state.currentUser.surveyHistory) state.currentUser.surveyHistory = [];
         state.currentUser.surveyHistory.push(action.payload);
         saveUser(state.currentUser);
         analytics.track('survey', state.currentUser, action.payload);
       }
    },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
       if (state.currentUser) {
         state.currentUser.themeColor = action.payload;
         saveUser(state.currentUser);
       }
    },
    // ADMIN ACTIONS
    adminSetDay: (state, action: PayloadAction<number>) => {
        if (state.currentUser && state.currentUser.campaign) {
            state.currentUser.campaign.currentDay = action.payload;
            state.currentUser.campaign.isDayComplete = false;
            saveUser(state.currentUser);
        }
    },
    adminCompleteDay: (state) => {
        if (state.currentUser && state.currentUser.campaign) {
            state.currentUser.campaign.isDayComplete = true;
            saveUser(state.currentUser);
        }
    },
    adminResetCampaign: (state) => {
        if (state.currentUser) {
            state.currentUser.campaign = {
                currentDay: 1,
                isDayComplete: false,
                unlockedAllies: []
            };
            state.currentUser.completedQuests = 0;
            state.currentUser.questHistory = [];
            saveUser(state.currentUser);
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action) => {
        state.currentUser = action.payload;
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
             saveUser(state.currentUser);
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
              state.currentUser.lastDailyMood = action.payload;
              saveUser(state.currentUser);
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
