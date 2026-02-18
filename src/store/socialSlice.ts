import { createSlice } from '@reduxjs/toolkit';
import { LeaderboardUser } from '../types';

interface SocialState {
  leaderboard: LeaderboardUser[];
}

const initialState: SocialState = {
  leaderboard: [
    { id: 1, username: "Алекс_Мастер", avatar: "mage", level: 12, xp: 12500, className: "Маг", classEmoji: "🧙‍♂️" },
    { id: 2, username: "Катя_Свет", avatar: "cleric", level: 11, xp: 11200, className: "Целитель", classEmoji: "💖" },
    { id: 3, username: "Никита_Про", avatar: "warrior", level: 10, xp: 10500, className: "Воин", classEmoji: "⚔️" },
    { id: 4, username: "Елена_Мудрая", avatar: "rogue", level: 9, xp: 9800, className: "Лучник", classEmoji: "🏹" },
    { id: 5, username: "Димка_Геймер", avatar: "explorer", level: 8, xp: 8200, className: "Искатель", classEmoji: "🗺️" },
    { id: 6, username: "Ольга_Звезда", avatar: "mage", level: 7, xp: 7500, className: "Маг", classEmoji: "🧙‍♂️" },
    { id: 7, username: "Макс_Танк", avatar: "warrior", level: 6, xp: 6000, className: "Воин", classEmoji: "⚔️" },
    { id: 8, username: "София_Лис", avatar: "rogue", level: 5, xp: 4500, className: "Лучник", classEmoji: "🏹" },
    { id: 9, username: "Иван_Сила", avatar: "explorer", level: 4, xp: 3200, className: "Искатель", classEmoji: "🗺️" },
  ]
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {},
});

export default socialSlice.reducer;