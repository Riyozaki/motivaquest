import { createSlice } from '@reduxjs/toolkit';
import { AdminAnalyticsData } from '../types';

interface AdminState {
  studentData: AdminAnalyticsData[];
}

// Mock data simulating a classroom
const initialState: AdminState = {
  studentData: [
    { studentId: 1, studentName: "Алекс М.", grade: 88, appTimeMinutes: 420, completedQuests: 15, avgMotivation: 4.2 },
    { studentId: 2, studentName: "Катя С.", grade: 92, appTimeMinutes: 380, completedQuests: 12, avgMotivation: 4.5 },
    { studentId: 3, studentName: "Иван П.", grade: 74, appTimeMinutes: 120, completedQuests: 4, avgMotivation: 2.8 },
    { studentId: 4, studentName: "Елена Д.", grade: 95, appTimeMinutes: 500, completedQuests: 20, avgMotivation: 4.8 },
    { studentId: 5, studentName: "Дмитрий К.", grade: 81, appTimeMinutes: 240, completedQuests: 8, avgMotivation: 3.5 },
    { studentId: 6, studentName: "София Л.", grade: 85, appTimeMinutes: 300, completedQuests: 10, avgMotivation: 3.9 },
    { studentId: 7, studentName: "Максим Г.", grade: 65, appTimeMinutes: 60, completedQuests: 2, avgMotivation: 2.1 },
    { studentId: 8, studentName: "Ольга В.", grade: 78, appTimeMinutes: 180, completedQuests: 6, avgMotivation: 3.2 },
  ]
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
});

export default adminSlice.reducer;