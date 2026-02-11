
import { UserProfile } from '../types';

// Updated Deployment ID v2.0
const API_URL = 'https://script.google.com/macros/s/AKfycbyibXkrpjTcaGb23jx_WosICwTx3jL8RYGYayNh3ypi6Vaz2nRUaKVTuhb1oEAFELgTJw/exec';

const TIMEOUT_MS = 25000; // Increased timeout
const OFFLINE_QUEUE_KEY = 'motiva_offline_queue';

interface OfflineRequest {
    id: string;
    action: string;
    data: any;
    timestamp: number;
}

// --- Payload Interfaces ---

export interface CompleteQuestPayload {
    email: string;
    questId: number;
    questName: string;
    category: string;
    rarity: string;
    score: number;
    multiplier: number;
    xpEarned: number;
    coinsEarned: number;
    hpLost: number;
    questHistoryEntry: {
        questId: number;
        questTitle: string;
        date: string;
        score?: number;
        category?: string;
        xpEarned: number;
    };
    newLevel: number;
    newXp: number;
    newNextLevelXp: number;
    newCoins: number;
}

export interface BossBattlePayload {
    email: string;
    bossId: string;
    bossName: string;
    won: boolean;
    score: number;
    totalQuestions: number;
    xpEarned: number;
    coinsEarned: number;
    alliesUsed: string[];
}

export interface UpdateProfilePayload {
    email: string;
    username?: string;
    grade?: number;
    className?: string;
    classEmoji?: string;
    currentLocation?: string;
    selectedTheme?: string;
    tutorialCompleted?: boolean;
}

// Helper: Sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const saveToQueue = (action: string, data: any) => {
    try {
        const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue: OfflineRequest[] = queueStr ? JSON.parse(queueStr) : [];
        
        queue.push({
            id: Date.now().toString() + Math.random().toString(),
            action,
            data,
            timestamp: Date.now()
        });
        
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        console.log(`[Offline] Request queued: ${action}`);
    } catch (e) {
        console.error("Failed to save offline request", e);
    }
};

const flushOfflineQueue = async () => {
    try {
        const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!queueStr) return;
        
        let queue: OfflineRequest[] = JSON.parse(queueStr);
        if (queue.length === 0) return;

        console.log(`[Offline] Flushing ${queue.length} requests...`);
        
        const newQueue: OfflineRequest[] = [];
        let successCount = 0;

        for (const req of queue) {
            try {
                // Assuming fire-and-forget actions don't return data we urgently need right now
                await request(req.action, req.data, 'POST', 0, true); 
                successCount++;
            } catch (e) {
                console.warn(`[Offline] Retry failed for ${req.action}`, e);
                newQueue.push(req); // Keep in queue if still failing
            }
        }

        if (newQueue.length > 0) {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
        } else {
            localStorage.removeItem(OFFLINE_QUEUE_KEY);
        }
        
        if (successCount > 0) console.log(`[Offline] Synced ${successCount} requests.`);

    } catch (e) {
        console.error("Error flushing offline queue", e);
    }
};

const request = async <T = any>(action: string, data: any = {}, method: 'POST' | 'GET' = 'POST', retryCount = 0, skipQueue = false): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        let url = API_URL;
        
        // Normalize email on frontend too
        if (data.email) {
            data.email = data.email.trim().toLowerCase();
        }

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            signal: controller.signal,
        };

        if (method === 'GET') {
            const params = new URLSearchParams({ action, ...data });
            url = `${API_URL}?${params.toString()}`;
        } else {
            options.body = JSON.stringify({ action, ...data });
        }

        const response = await fetch(url, options);
        clearTimeout(id);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.error) {
            // Retry logic for "User not found" which might be a latency issue on sheets
            if (result.error.includes('User not found') && retryCount < 3) {
                console.warn(`[${action}] User not found, retrying in 2s... (Attempt ${retryCount + 1})`);
                await sleep(2000);
                return request<T>(action, data, method, retryCount + 1, skipQueue);
            }
            throw new Error(result.error);
        }

        // On Success: Try to flush pending offline requests in background
        if (!skipQueue) {
            flushOfflineQueue(); 
        }

        return result as T;
    } catch (error: any) {
        clearTimeout(id);
        
        const isNetworkError = error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
        
        if (isNetworkError && !skipQueue && method === 'POST') {
             saveToQueue(action, data);
             throw new Error("OFFLINE_SAVED");
        }
        
        if (error.name === 'AbortError') {
             throw new Error("Сервер долго отвечает. Google Таблицы могут спать, попробуйте еще раз.");
        }
        
        throw error;
    }
};

export const api = {
    // 1. Registration
    register: async (email: string, password: string, username: string, grade: number, className?: string, classEmoji?: string) => {
        const res = await request<{success: true, message: string}>('register', { email, password, username, grade, className, classEmoji });
        await sleep(2000); // Wait for sheet consistency
        return res;
    },

    // 2. Login
    login: async (email: string, password?: string) => {
        return await request<{success: true, user: any, progress: any, info: any}>('login', { email, password });
    },

    // 3. Daily Login (New v2.0)
    dailyLogin: async (email: string) => {
        return await request<{
            success: true, 
            alreadyLoggedIn: boolean, 
            streakDays: number, 
            hpRestored: boolean, 
            progress: any
        }>('dailyLogin', { email });
    },

    // 4. Complete Quest (New v2.0 Extended)
    completeQuest: async (payload: CompleteQuestPayload) => {
        return await request<{success: true}>('completeQuest', payload);
    },

    // 5. Boss Battle
    completeBossBattle: async (payload: BossBattlePayload) => {
        return await request<{success: true}>('completeBossBattle', payload);
    },

    // 6. Campaign Progress
    updateCampaign: async (email: string, campaignId: string, currentDay: number, completedDays: number[]) => {
        return await request<{success: true}>('updateCampaign', { email, campaignId, currentDay, completedDays });
    },

    // 7. Daily Challenges
    saveDailyChallenge: async (email: string, cycleIndex: number, questIds: number[], completedQuestIds: number[]) => {
        return await request<{success: true}>('saveDailyChallenge', { email, cycleIndex, questIds, completedQuestIds });
    },

    // 8. Leaderboard
    getLeaderboard: async (type: 'weekly' | 'alltime' = 'alltime') => {
        return await request<{success: true, data: any[]}>('getLeaderboard', { type }, 'GET');
    },

    // 9. Update Profile (Universal)
    updateProfile: async (payload: UpdateProfilePayload) => {
        return await request<{success: true}>('updateProfile', payload);
    },

    // 10. Weekly Stats
    saveWeeklyStats: async (email: string, stats: { weekStart: string, questsCompleted: number, coinsEarned: number, xpEarned: number, bestCategory: string }) => {
        return await request<{success: true}>('saveWeeklyStats', { email, ...stats });
    },

    // 11. Purchases
    addPurchase: async (email: string, item: { id: string; name: string; cost: number }) => {
        return await request<{success: true}>('addPurchase', { 
            email, 
            itemId: item.id, 
            itemName: item.name, 
            price: item.cost 
        });
    },

    // --- Legacy / Helpers ---

    getAllUserData: async (email: string) => {
        return await request<{success: true, user: any, progress: any, info: any, quests: any[]}>('getAllUserData', { email }, 'GET');
    },

    updateProgress: async (email: string, progress: Partial<UserProfile>) => {
        // Fallback to updateProfile/updateProgress specific logic
        return await request('updateProgress', { email, progress });
    },

    updateInfo: async (email: string, info: any) => {
        return await request('updateInfo', { email, info });
    },

    addAchievement: async (email: string, achievement: { id: string; title: string }) => {
        return await request('addAchievement', {
            email,
            achievementId: achievement.id,
            achievementName: achievement.title
        });
    },

    unlockAlly: async (email: string, allyId: string) => {
        return await request('unlockAlly', { email, allyId });
    },

    setMood: async (email: string, moodScore: number) => {
        const moodMap = ['awful', 'bad', 'neutral', 'good', 'excellent'];
        const moodStr = moodMap[moodScore - 1] || 'neutral';
        return await request('setMood', { email, mood: moodStr });
    },

    setDailyReport: async (email: string, report: any) => {
        return await request('setDailyReport', { email, report: report });
    },

    getQuests: async (email: string) => {
        return await request<{success: true, data: any[]}>('getQuests', { email }, 'GET');
    }
};
