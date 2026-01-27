

export interface Task {
  id: number;
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export type QuestRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type QuestCategory = 'Math' | 'Science' | 'History' | 'Lang' | 'Art' | 'Sport';

export interface Quest {
  id: number;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rarity: QuestRarity;
  xp: number;
  coins: number;
  completed: boolean;
  tasks: Task[];
  type: 'daily' | 'story'; // Removed group type
  cooldownSeconds?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'skin' | 'consumable';
  value: string;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: 'quests' | 'xp' | 'coins' | 'items';
  threshold: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface QuestHistoryItem {
  questId: number;
  date: string; // ISO String
}

export interface SurveySubmission {
  id: string;
  date: string;
  motivationScore: number;
  stressScore: number;
  enjoymentScore: number;
}

export interface UserProfile {
  uid?: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  avatar: string; 
  level: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number;
  completedQuests: number;
  inventory: string[]; 
  achievements: string[]; 
  questHistory: QuestHistoryItem[];
  surveyHistory: SurveySubmission[];
  hasParentalConsent: boolean;
  lastDailyMood?: string; // Date string of last mood check
}

export interface LeaderboardUser {
  id: number;
  username: string; // Will be displayed anonymously
  avatar: string;
  level: number;
  xp: number;
  isCurrentUser?: boolean;
}

export interface AdminAnalyticsData {
  studentId: number;
  studentName: string;
  grade: number;
  appTimeMinutes: number;
  completedQuests: number;
  avgMotivation: number;
}