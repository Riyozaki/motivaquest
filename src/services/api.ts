import { UserProfile } from '../types';
import { store } from '../store';
import { setPendingSyncCount } from '../store/userSlice';

// ═══════════════════════════════════════════════════════════
// ВАЖНО: После деплоя нового скрипта v3 — вставь сюда новый URL
// Deploy → New deployment → скопировать URL
// ═══════════════════════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycbyibXkrpjTcaGb23jx_WosICwTx3jL8RYGYayNh3ypi6Vaz2nRUaKVTuhb1oEAFELgTJw/exec';

const TIMEOUT_MS = 25000;
const OFFLINE_QUEUE_KEY = 'motiva_offline_queue';
const MAX_QUEUE_SIZE = 50;

// ── v3: Токен сессии ──
const TOKEN_KEY = 'motiva_session_token';

function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ── Приоритеты для offline queue ──

enum Priority {
    HIGH = 0,
    MEDIUM = 1,
    LOW = 2
}

interface OfflineRequest {
    id: string;
    action: string;
    data: any;
    timestamp: number;
    priority: Priority;
    retryCount: number;
    hash: string;
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
        coinsEarned?: number;
    };
    newLevel: number;
    newXp: number;
    newNextLevelXp: number;
    newCoins: number;
    habitStreaks?: Record<number, number>; // v3: передаём стрики привычек
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

// v3: Результат с кодом ошибки
interface ApiResult {
    success: boolean;
    error?: string;
    errorCode?: string;
    [key: string]: any;
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
    return Priority.MEDIUM;
};

const saveToQueue = (action: string, data: any) => {
    try {
        const queueStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
        let queue: OfflineRequest[] = queueStr ? JSON.parse(queueStr) : [];
        
        const newHash = calculateHash(action, data);
        
        // Deduplication: replace if same action+email exists
        const existingIdx = queue.findIndex(r => r.hash === newHash);
        if (existingIdx >= 0) {
            queue[existingIdx].timestamp = Date.now();
            queue[existingIdx].data = data;
        } else {
            queue.push({
                id: Date.now().toString() + Math.random().toString(36).slice(2),
                action,
                data,
                timestamp: Date.now(),
                priority: getPriority(action),
                retryCount: 0,
                hash: newHash
            });
        }

        // Enforce max size
        if (queue.length > MAX_QUEUE_SIZE) {
            queue.sort((a, b) => {
                if (a.priority !== b.priority) return b.priority - a.priority;
                return a.timestamp - b.timestamp;
            });
            queue.shift();
        }

        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
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
        
        queue.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.timestamp - b.timestamp;
        });

        const newQueue: OfflineRequest[] = [];
        let isOnline = true;

        for (const req of queue) {
            if (!isOnline) {
                newQueue.push(req);
                continue;
            }

            if (req.retryCount > 0) {
                const backoff = Math.min(1000 * Math.pow(2, req.retryCount), 30000);
                await sleep(backoff);
            }

            try {
                await request(req.action, req.data, 'POST', 0, true); 
            } catch (e: any) {
                const isNetworkError = e.message === 'OFFLINE_SAVED' || e.name === 'AbortError' || e.message.includes('Failed to fetch') || e.message.includes('NetworkError');
                
                if (isNetworkError) {
                    console.warn(`[Offline] Network failed for ${req.action}. Stopping flush.`);
                    isOnline = false;
                    req.retryCount++;
                    newQueue.push(req);
                } else {
                    console.error(`[Offline] Logic error for ${req.action}:`, e);
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

        // v3: Добавляем токен к запросам
        const token = getToken();

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            signal: controller.signal,
        };

        if (method === 'GET') {
            const params = new URLSearchParams({ action, ...data });
            // v3: добавляем token к GET-запросам (для admin endpoints)
            if (token) params.set('token', token);
            url = `${API_URL}?${params.toString()}`;
        } else {
            // v3: добавляем token в тело POST
            if (token) data.token = token;
            options.body = JSON.stringify({ action, ...data });
        }

        const response = await fetch(url, options);
        clearTimeout(id);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result: ApiResult = await response.json();
        
        if (result.error) {
            // v3: Более информативная обработка ошибок
            if (result.errorCode === 'AUTH_FAILED') {
                throw new Error(result.error);
            }
            if (result.errorCode === 'INSUFFICIENT_FUNDS') {
                throw new Error('Недостаточно монет!');
            }
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
    // ── 1. Регистрация ──
    register: async (email: string, password: string, username: string, grade: number, className?: string, classEmoji?: string) => {
        const res = await request<{success: true, message: string, token: string}>('register', { 
            email, password, username, grade, className, classEmoji 
        });
        // v3: Сохраняем токен сессии
        if (res.token) setToken(res.token);
        await sleep(2000); // Wait for sheet consistency
        return res;
    },

    // ── 2. Вход ──
    login: async (email: string, password?: string) => {
        const res = await request<{success: true, token: string, user: any, progress: any, info: any}>('login', { 
            email, password 
        });
        // v3: Сохраняем токен сессии
        if (res.token) setToken(res.token);
        return res;
    },

    // ── 3. Ежедневный логин ──
    dailyLogin: async (email: string) => {
        return await request<{
            success: true, 
            alreadyLoggedIn: boolean, 
            streakDays: number, 
            hpRestored: boolean, 
            progress: any
        }>('dailyLogin', { email });
    },

    // ── 4. Завершение квеста (v3: + habitStreaks) ──
    completeQuest: async (payload: CompleteQuestPayload) => {
        return await request<{success: true}>('completeQuest', payload);
    },

    // ── 5. Босс-битва ──
    completeBossBattle: async (payload: BossBattlePayload) => {
        return await request<{success: true}>('completeBossBattle', payload);
    },

    // ── 6. Кампания ──
    updateCampaign: async (email: string, campaignId: string, currentDay: number, completedDays: number[]) => {
        return await request<{success: true}>('updateCampaign', { email, campaignId, currentDay, completedDays });
    },

    // ── 7. Ежедневные челленджи ──
    saveDailyChallenge: async (email: string, cycleIndex: number, questIds: number[], completedQuestIds: number[]) => {
        return await request<{success: true}>('saveDailyChallenge', { email, cycleIndex, questIds, completedQuestIds });
    },

    // ── 8. Лидерборд ──
    getLeaderboard: async (type: 'weekly' | 'alltime' = 'alltime') => {
        return await request<{success: true, data: any[]}>('getLeaderboard', { type }, 'GET');
    },

    // ── 9. Обновление профиля ──
    updateProfile: async (payload: UpdateProfilePayload) => {
        return await request<{success: true}>('updateProfile', payload);
    },

    // ── 10. Недельная статистика ──
    saveWeeklyStats: async (email: string, stats: { weekStart: string, questsCompleted: number, coinsEarned: number, xpEarned: number, bestCategory: string }) => {
        return await request<{success: true}>('saveWeeklyStats', { email, ...stats });
    },

    // ── 11. Покупка (v3: возвращает newBalance) ──
    addPurchase: async (email: string, item: { id: string; name: string; cost: number }) => {
        return await request<{success: true, newBalance?: number}>('addPurchase', { 
            email, 
            itemId: item.id, 
            itemName: item.name, 
            price: item.cost 
        });
    },

    // ── 12. Опрос/Настроение (v3: новый endpoint) ──
    saveSurvey: async (email: string, survey: { motivationScore: number; stressScore: number; enjoymentScore: number }) => {
        return await request<{success: true}>('saveSurvey', { email, survey });
    },

    // ── 13. Смена пароля (v3: новый endpoint) ──
    changePassword: async (email: string, oldPassword: string, newPassword: string) => {
        return await request<{success: true}>('changePassword', { email, oldPassword, newPassword });
    },

    // ── 14. HP регенерация (v3: новый endpoint) ──
    regenHp: async (email: string, amount: number) => {
        return await request<{success: true, currentHp: number, maxHp: number}>('regenHp', { email, amount });
    },

    // ── 15. Админ-данные (v3: новый endpoint) ──
    getAdminData: async () => {
        return await request<{success: true, data: any[]}>('getAdminData', {}, 'GET');
    },

    // --- Legacy / Helpers ---

    getAllUserData: async (email: string) => {
        return await request<{success: true, user: any, progress: any, info: any, quests: any[]}>('getAllUserData', { email }, 'GET');
    },

    updateProgress: async (email: string, progress: Partial<UserProfile>) => {
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

    // v3: Выход — очищаем токен
    logout: () => {
        clearToken();
    },

    // Expose flush for manual triggering
    flushQueue: flushOfflineQueue
};