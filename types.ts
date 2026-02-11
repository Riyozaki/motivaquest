
export type TaskType = 
  | 'yes_no'           
  | 'quiz'             
  | 'text_input'       
  | 'number_input'     
  | 'timer_challenge'  
  | 'checklist'        
  | 'ordering'         
  | 'matching';        

export interface Task {
  id: number;
  type: TaskType;
  question: string;
  
  // Quiz
  options?: string[];
  correctIndex?: number;
  
  // Input
  correctAnswer?: string;
  acceptableAnswers?: string[];
  caseSensitive?: boolean;
  
  // Timer
  timerSeconds?: number;
  
  // Checklist
  checklistItems?: { id: string; label: string }[];
  
  // Ordering
  correctOrder?: string[];
  shuffledItems?: string[]; // For initial display
  
  // Matching
  pairs?: { left: string; right: string }[];
  
  // General
  hint?: string;
  explanation?: string;
  xpBonus?: number;
  
  // State for user answers (optional, usually handled in component state)
  userAnswer?: any; 
}

export type QuestRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type ThemeColor = 'purple' | 'blue' | 'green' | 'crimson' | 'amber';

export type QuestCategory = 
  | 'Math' | 'Russian' | 'Literature' | 'Lang' | 'Science' 
  | 'History' | 'Sport' | 'Social' | 'Ecology' | 'Self' 
  | 'Finance' | 'IT' | 'Art';

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
  gradeRange?: [number, number]; // New: [min, max]
  minMinutes: number; 
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
  questTitle: string; 
  xpEarned: number;
  date: string; 
}

export interface SurveySubmission {
  id: string;
  date: string;
  motivationScore: number;
  stressScore: number;
  enjoymentScore: number;
}

export interface StoryDay {
  day: number;
  title: string;
  locationId: 'village' | 'forest' | 'mountains' | 'castle' | 'desert' | 'throne';
  locationName: string;
  description: string;
  character: 'wizard' | 'fairy' | 'warrior' | 'king';
  dialogue: string;
  questIds: number[];
  rewardText: string;
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
  
  // Mechanics
  activeQuestTimers: Record<number, number>;
  dailyCompletionsCount: number;
  lastCompletionTime?: number;
  suspiciousFlags: number;
  penaltyUntil?: number;
  streakDays: number;
  lastLoginDate?: string;
  streakTakenToday: boolean;

  // Story Mode
  campaign: {
    currentDay: number;
    isDayComplete: boolean;
    unlockedAllies: string[];
  };
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
