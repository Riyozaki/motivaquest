import { UserProfile } from '../types';
import { store } from '../store';
import { setPendingSyncCount } from '../store/userSlice';

// Updated Deployment ID v2.0
const API_URL = 'https://script.google.com/macros/s/AKfycbyibXkrpjTcaGb23jx_WosICwTx3jL8RYGYayNh3ypi6Vaz2nRUaKVTuhb1oEAFELgTJw/exec';

const TIMEOUT_MS = 25000; // Increased timeout
const OFFLINE_QUEUE_KEY = 'motiva_offline_queue';
const MAX_QUEUE_SIZE = 50;

enum Priority {
    HIGH = 0,   // Login, Critical Updates
    MEDIUM = 1, // Quests, Purchases
    LOW = 2     // Analytics
}

interface OfflineRequest {
    id: string;
    action: string;
    data: any;
    timestamp: number;
    priority: Priority;
    retryCount: number;
    hash: string; // For deduplication
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

// Helper: Calculate simple hash for deduplication
const calculateHash = (action: string, data: any): string => {
    return action + JSON.stringify(data);
};

// Helper: Get Priority
const getPriority = (action: string): Priority => {
    if (['login', 'register', 'dailyLogin', 'getAllUserData'].includes(action)) return Priority.HIGH;
    if (['analyticsBatch', 'saveWeeklyStats'].includes(action)) return Priority.LOW;
    return Priority.MEDIUM; // Quests, Purchases, Updates
};

const saveToQueue = (action: string, data: any) => {
    try {
        const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
        let queue: OfflineRequest[] = queueStr ? JSON.parse(queueStr) : [];
        
        const newHash = calculateHash(action, data);
        
        // 1. Deduplication: Check if an identical request is already pending
        // If it is, we might update it or just ignore the new one. 
        // For state updates (like profile), replacing the old one is better.
        // For events (quests), we probably want to keep unique ones, but if it's EXACTLY duplicate payload, it's likely a retry or double click.
        const existingIdx = queue.findIndex(req => req.hash === newHash);
        
        if (existingIdx !== -1) {
            // Move to end (renew timestamp) but keep retry count? Or reset?
            // Let's just update timestamp and move to appropriate position later during sort.
            queue[existingIdx].timestamp = Date.now();
            console.log(`[Offline] Deduplicated request: ${action}`);
        } else {
            const req: OfflineRequest = {
                id: Date.now().toString() + Math.random().toString(),
                action,
                data,
                timestamp: Date.now(),
                priority: getPriority(action),
                retryCount: 0,
                hash: newHash
            };
            queue.push(req);
        }

        // 2. Max Capacity & FIFO Eviction (respecting priority)
        if (queue.length > MAX_QUEUE_SIZE) {
            // Sort by Priority (Desc: Low -> High) then Timestamp (Asc: Old -> New)
            // We want to remove the Lowest priority, Oldest item.
            // Priority: High=0, Low=2. So sort Desc makes Low=2 come first.
            queue.sort((a, b) => {
                if (a.priority !== b.priority) return b.priority - a.priority; // 2 (Low) before 0 (High)
                return a.timestamp - b.timestamp; // Oldest first
            });
            
            // Remove the first element (Lowest priority, Oldest)
            queue.shift();
        }

        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        
        // Update Redux
        store.dispatch(setPendingSyncCount(queue.length));
        
        console.log(`[Offline] Queue size: ${queue.length}. Added: ${action}`);
    } catch (e) {
        console.error("Failed to save offline request", e);
    }
};

export const flushOfflineQueue = async () => {
    try {
        const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!queueStr) return;
        
        let queue: OfflineRequest[] = JSON.parse(queueStr);
        if (queue.length === 0) {
            store.dispatch(setPendingSyncCount(0));
            return;
        }

        console.log(`[Offline] Flushing ${queue.length} requests...`);
        store.dispatch(setPendingSyncCount(queue.length));
        
        // Sort for processing: Priority (High->Low), then Timestamp (Old->New)
        queue.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority; // 0 before 2
            return a.timestamp - b.timestamp;
        });

        const newQueue: OfflineRequest[] = [];
        let isOnline = true;

        for (const req of queue) {
            if (!isOnline) {
                newQueue.push(req);
                continue;
            }

            // Exponential Backoff for retries
            if (req.retryCount > 0) {
                // Delay = 1s * 2^retryCount. Max 30s.
                const backoff = Math.min(1000 * Math.pow(2, req.retryCount), 30000);
                await sleep(backoff);
            }

            try {
                await request(req.action, req.data, 'POST', 0, true); 
                // Success - do nothing (it's removed from newQueue)
            } catch (e: any) {
                const isNetworkError = e.message === 'OFFLINE_SAVED' || e.name === 'AbortError' || e.message.includes('Failed to fetch');
                
                if (isNetworkError) {
                    console.warn(`[Offline] Network failed for ${req.action}. Stopping flush.`);
                    isOnline = false; // Stop trying others
                    req.retryCount++;
                    newQueue.push(req);
                } else {
                    // Logic error (e.g., 400, 500 from script logic that isn't network). 
                    // Usually we might want to drop it to not block queue, or keep it.
                    // For now, let's drop it if it's a persistent error, or keep if unknown.
                    // Let's increment retry but keep going.
                    console.error(`[Offline] Logic error for ${req.action}:`, e);
                    // If retry count is high, maybe drop?
                    if (req.retryCount > 5) {
                        console.warn(`[Offline] Dropping ${req.action} after 5 retries.`);
                    } else {
                        req.retryCount++;
                        newQueue.push(req);
                    }
                }
            }
        }

        if (newQueue.length > 0) {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
        } else {
            localStorage.removeItem(OFFLINE_QUEUE_KEY);
        }
        
        store.dispatch(setPendingSyncCount(newQueue.length));

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
            // Fire and forget flush
            flushOfflineQueue(); 
        }

        return result as T;
    } catch (error: any) {
        clearTimeout(id);
        
        const isNetworkError = error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
        
        // Only save to queue if it's a POST (state change) and we aren't already processing the queue
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
    },

    // Expose flush for manual triggering
    flushQueue: flushOfflineQueue
};