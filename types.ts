export interface Task {
  id: number;
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export type QuestRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type ThemeColor = 'purple' | 'blue' | 'green' | 'crimson' | 'amber';

// Расширенный список категорий для школьной программы
export type QuestCategory = 
  | 'Math'        // Математика, Алгебра, Геометрия
  | 'Russian'     // Русский язык
  | 'Literature'  // Литература
  | 'Lang'        // Иностранные языки
  | 'Science'     // Физика, Химия, Биология, Окр. мир
  | 'History'     // История, Обществознание
  | 'Sport'       // Физкультура, Здоровье
  | 'Social'      // Социум, Общение, Семья
  | 'Ecology'     // Экология
  | 'Self'        // Личное развитие, Тайм-менеджмент
  | 'Finance'     // Финансовая грамотность
  | 'IT'          // Информатика
  | 'Art';        // Творчество

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
  type: 'daily' | 'story'; 
  grade?: number; 
  cooldownSeconds?: number;
  minMinutes: number; // New: Minimum time required
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
  conditionType: 'quests' | 'xp' | 'coins' | 'items' | 'streak';
  threshold: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface QuestHistoryItem {
  questId: number;
  questTitle: string; // Added for easy history display
  xpEarned: number;
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
  grade?: number; 
  currentXp: number;
  nextLevelXp: number;
  coins: number;
  completedQuests: number;
  inventory: string[]; 
  achievements: string[]; 
  questHistory: QuestHistoryItem[];
  surveyHistory: SurveySubmission[];
  hasParentalConsent: boolean;
  lastDailyMood?: string; 
  themeColor?: ThemeColor;
  
  // Anti-Cheat & Mechanics
  activeQuestTimers: Record<number, number>; // questId -> timestamp (start time)
  dailyCompletionsCount: number;
  lastCompletionTime?: number;
  suspiciousFlags: number;
  penaltyUntil?: number; // timestamp until penalties apply
  streakDays: number;
  lastLoginDate?: string;
}

export interface LeaderboardUser {
  id: number;
  username: string; 
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