import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserProfile, Achievement, SurveySubmission, ThemeColor, Quest } from '../types';
import { toast } from 'react-toastify';
import { RootState } from './index';

// Keys for LocalStorage
const STORAGE_KEY_USERS = 'motiva_users_db';
const STORAGE_KEY_CURRENT_SESSION = 'motiva_current_uid';

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
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
            streakDays: 0
        };
        saveLocalUsers(users);
    }
    
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, demoUid);
    return users[demoUid];
});

export const loginLocal = createAsyncThunk(
  'user/login',
  async (payload: { email: string; password: string }) => {
    const users = getLocalUsers();
    const user = Object.values(users).find(u => u.email === payload.email && u.password === payload.password);
    if (!user) throw new Error('Неверный email или пароль');
    
    // Check streaks on login
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (user.lastLoginDate !== today) {
        // New day
        user.dailyCompletionsCount = 0; // Reset daily count
        
        if (user.lastLoginDate === yesterdayStr) {
            user.streakDays += 1;
        } else {
            user.streakDays = 1; // Reset streak
        }
        user.lastLoginDate = today;
        users[user.uid!] = user;
        saveLocalUsers(users);
    }

    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, user.uid!);
    return user;
  }
);

export const registerLocal = createAsyncThunk(
  'user/register',
  async (payload: { email: string; password: string; username: string; hasConsent: boolean }) => {
    const users = getLocalUsers();
    if (Object.values(users).find(u => u.email === payload.email)) throw new Error('Email занят');

    const newUid = 'user_' + Date.now();
    const newUser: UserProfile & { password: string } = {
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
      streakDays: 1,
      lastLoginDate: new Date().toDateString()
    };

    users[newUid] = newUser;
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, newUid);
    return newUser;
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

        // Dispatch XP gain (handles saving inside addExperience)
        await dispatch(addExperience({ xp: xpGain, coins: coinGain }));

        // Return date to update state locally
        return today; 
    }
);

export const startQuestAction = createAsyncThunk(
    'user/startQuest',
    async (questId: number, { getState }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user) return;

        // If already started, do nothing
        if (user.activeQuestTimers && user.activeQuestTimers[questId]) return;

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

    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = Math.floor(nextLevelXp * 1.5); // Harder leveling
      toast.success(`Уровень повышен! Теперь ты ${currentLevel} уровня!`);
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
        
        // Apply multiplier to rewards
        let xpReward = Math.floor(quest.xp * multiplier);
        let coinsReward = Math.floor(quest.coins * multiplier);
        
        let isSuspicious = false;
        let message = "";

        // 1. Check Daily Limit
        const dailyCount = user.dailyCompletionsCount || 0;
        if (dailyCount >= 10) {
            xpReward = 0;
            coinsReward = 0;
            message = "Лимит на сегодня исчерпан (10/10). Ты молодец, но нужно отдыхать.";
        }

        // 2. Check Speed Cheating
        else if (timeDiffMinutes < quest.minMinutes * 0.9) { // 10% tolerance
            xpReward = Math.floor(xpReward * 0.5);
            message = `Подозрительная скорость! XP уполовинено. (Нужно ${quest.minMinutes} мин)`;
        }

        // 3. Check Burst Cheating (e.g. 5 quests in 5 minutes)
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
            // Update flags in background implicitly via state update below
        }

        // Process Rewards
        if (xpReward > 0) {
            await dispatch(addExperience({ xp: xpReward, coins: coinsReward }));
        }
        
        if (message) {
            toast.warning(message, { autoClose: 5000 });
        }

        // Cleanup and Save
        const historyItem = { 
            questId: quest.id, 
            questTitle: quest.title, 
            xpEarned: xpReward,
            date: new Date().toISOString() 
        };
        const newHistory = [...(user.questHistory || []), historyItem];
        const newTimers = { ...user.activeQuestTimers };
        delete newTimers[quest.id];

        const updates = {
            completedQuests: user.completedQuests + 1,
            questHistory: newHistory,
            activeQuestTimers: newTimers,
            dailyCompletionsCount: dailyCount + 1,
            lastCompletionTime: now,
            suspiciousFlags: isSuspicious ? (user.suspiciousFlags || 0) + 1 : user.suspiciousFlags
        };
        
        const users = getLocalUsers();
        if (user.uid) {
            users[user.uid] = { ...users[user.uid], ...updates };
            saveLocalUsers(users);
        }

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
    purchaseItem: (state, action: PayloadAction<{ itemId: string; cost: number }>) => {
       if (!state.currentUser) return;
       const { itemId, cost } = action.payload;
       if (state.currentUser.coins >= cost) {
         state.currentUser.coins -= cost;
         if (!state.currentUser.inventory) state.currentUser.inventory = [];
         state.currentUser.inventory.push(itemId);
         saveUser(state.currentUser);
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
       }
    },
    setThemeColor: (state, action: PayloadAction<ThemeColor>) => {
       if (state.currentUser) {
         state.currentUser.themeColor = action.payload;
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
      .addCase(registerLocal.fulfilled, (state, action) => { state.currentUser = action.payload; })
      .addCase(loginLocal.fulfilled, (state, action) => { state.currentUser = action.payload; })
      .addCase(loginDemo.fulfilled, (state, action) => { state.currentUser = action.payload; })
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

export const { setUser, clearUser, purchaseItem, equipSkin, submitSurvey, setThemeColor } = userSlice.actions;
export default userSlice.reducer;