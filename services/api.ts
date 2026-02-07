
import { UserProfile, Quest } from '../types';

// New Deployment ID from prompt
const API_URL = 'https://script.google.com/macros/s/AKfycbyibXkrpjTcaGb23jx_WosICwTx3jL8RYGYayNh3ypi6Vaz2nRUaKVTuhb1oEAFELgTJw/exec';

// Increased timeout for Google Sheets latency
const TIMEOUT_MS = 20000;

// Helper: Sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async (action: string, data: any = {}, method: 'POST' | 'GET' = 'POST', retryCount = 0): Promise<any> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        let url = API_URL;
        
        // Normalize email on frontend too, just in case
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
        
        // ERROR HANDLING & RETRY LOGIC
        if (result.error) {
            // If user not found, and we haven't retried too many times, wait and try again.
            // This fixes the race condition where registration happens but the sheet isn't indexed yet.
            if (result.error.includes('User not found') && retryCount < 3) {
                console.warn(`[${action}] User not found, retrying in 2s... (Attempt ${retryCount + 1})`);
                await sleep(2000);
                return request(action, data, method, retryCount + 1);
            }
            
            throw new Error(result.error);
        }

        return result;
    } catch (error: any) {
        clearTimeout(id);
        
        if (error.name === 'AbortError') {
             throw new Error("Сервер долго отвечает. Google Таблицы могут спать, попробуйте еще раз.");
        }
        
        // Rethrow explicitly
        throw error;
    }
};

export const api = {
    register: async (email: string, password: string, username: string) => {
        const res = await request('register', { email, password, username });
        // Explicit delay after registration to allow Google Sheets to propagate the new row
        // before the app tries to read/update it immediately after login.
        await sleep(3000); 
        return res;
    },

    login: async (email: string, password?: string) => {
        return await request('login', { email, password });
    },

    getAllUserData: async (email: string) => {
        return await request('getAllUserData', { email }, 'GET');
    },

    // Updates 'progress' sheet
    updateProgress: async (email: string, progress: Partial<UserProfile>) => {
        const sheetData: any = {};
        
        if (progress.coins !== undefined) sheetData.gold = progress.coins;
        if (progress.currentXp !== undefined) sheetData.xp = progress.currentXp;
        if (progress.level !== undefined) sheetData.level = progress.level;
        if (progress.avatar !== undefined) sheetData.visitorAvatar = progress.avatar;
        
        if (Object.keys(sheetData).length > 0) {
            return await request('updateProgress', { email, progress: sheetData });
        }
    },

    // Updates 'info' sheet
    // Columns: email, dailyReport, mood, cheating, currentLevel, unlockedAllies, questsTaken, dailyStreak, streakTakenToday, purchases, achievements, interfaceColor
    updateInfo: async (email: string, infoData: any) => {
        const allowedKeys = [
            'dailyReport', 'mood', 'cheating', 'currentLevel', 'unlockedAllies', 
            'questsTaken', 'dailyStreak', 'streakTakenToday', 'purchases', 
            'achievements', 'interfaceColor'
        ];
        
        const filteredData: any = {};
        for (const key of allowedKeys) {
            if (infoData[key] !== undefined) {
                filteredData[key] = infoData[key];
            }
        }

        if (Object.keys(filteredData).length > 0) {
            return await request('updateInfo', { email, info: filteredData });
        }
    },

    addPurchase: async (email: string, item: { id: string; name: string; cost: number }) => {
        return await request('addPurchase', { 
            email, 
            itemId: item.id, 
            itemName: item.name, 
            price: item.cost 
        });
    },

    addAchievement: async (email: string, achievement: { id: string; title: string }) => {
        return await request('addAchievement', {
            email,
            achievementId: achievement.id,
            achievementName: achievement.title
        });
    },

    setMood: async (email: string, moodScore: number) => {
        const moodMap = ['awful', 'bad', 'neutral', 'good', 'excellent'];
        const moodStr = moodMap[moodScore - 1] || 'neutral';
        return await request('setMood', { email, mood: moodStr });
    },

    setDailyReport: async (email: string, report: any) => {
        return await request('setDailyReport', { email, report: report });
    },

    completeQuest: async (email: string, questId: number, questTitle: string) => {
        return await request('completeQuest', { 
            email, 
            visitorId: questId, 
            visitorName: questTitle 
        });
    },

    getQuests: async (email: string) => {
        return await request('getQuests', { email }, 'GET');
    }
};
