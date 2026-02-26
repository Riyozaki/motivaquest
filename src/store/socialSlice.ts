import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LeaderboardUser } from '../types';
import { api } from '../services/api';
import { RootState } from './index';

interface SocialState {
  leaderboard: LeaderboardUser[];
  leaderboardType: 'weekly' | 'alltime';
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  lastFetched: number | null;
}

// Fallback data in case API is unreachable
const FALLBACK_LEADERBOARD: LeaderboardUser[] = [
  { username: "???", className: "Маг", classEmoji: "🧙‍♂️", level: 12, xp: 12500, totalQuestsCompleted: 87, streakDays: 14 },
  { username: "???", className: "Целитель", classEmoji: "💖", level: 11, xp: 11200, totalQuestsCompleted: 72, streakDays: 10 },
  { username: "???", className: "Воин", classEmoji: "⚔️", level: 10, xp: 10500, totalQuestsCompleted: 65, streakDays: 8 },
];

// --- Thunk: Fetch leaderboard from backend ---
export const fetchLeaderboard = createAsyncThunk(
  'social/fetchLeaderboard',
  async (type: 'weekly' | 'alltime' = 'alltime', { getState, rejectWithValue }) => {
    try {
      const response = await api.getLeaderboard(type);
      
      if (response.success && Array.isArray(response.data)) {
        // Map backend data to LeaderboardUser format
        const users: LeaderboardUser[] = response.data.map((item: any) => ({
          username: item.username || item.name || 'Безымянный',
          className: item.className || item.heroClassName || 'Искатель',
          classEmoji: item.classEmoji || '🗺️',
          level: Number(item.level) || 1,
          xp: Number(item.xp) || Number(item.totalXp) || 0,
          weeklyXp: Number(item.weeklyXp) || 0,
          totalQuestsCompleted: Number(item.totalQuestsCompleted) || Number(item.completedQuests) || 0,
          streakDays: Number(item.streakDays) || 0,
          avatar: item.avatar || 'warrior',
          id: item.id,
        }));

        return { data: users, type };
      }
      
      return rejectWithValue('Неверный формат данных от сервера');
    } catch (error: any) {
      // If offline or API error, return fallback
      console.warn('[Leaderboard] API error, using fallback:', error.message);
      return rejectWithValue(error.message || 'Ошибка загрузки');
    }
  }
);

const initialState: SocialState = {
  leaderboard: [],
  leaderboardType: 'alltime',
  leaderboardLoading: false,
  leaderboardError: null,
  lastFetched: null,
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    setLeaderboardType: (state, action) => {
      state.leaderboardType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
        state.leaderboardError = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboard = action.payload.data;
        state.leaderboardType = action.payload.type;
        state.lastFetched = Date.now();
        state.leaderboardError = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false;
        state.leaderboardError = action.payload as string || 'Ошибка загрузки';
        // Keep old data if we have it, use fallback only if empty
        if (state.leaderboard.length === 0) {
          state.leaderboard = FALLBACK_LEADERBOARD;
        }
      });
  },
});

export const { setLeaderboardType } = socialSlice.actions;
export default socialSlice.reducer;
