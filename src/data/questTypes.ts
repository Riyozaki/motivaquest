// Типы для системы квестов MotivaQuest

export type GradeGroup = 'grade5' | 'grade67' | 'grade89' | 'grade1011';

export type QuestRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  rarity: QuestRarity;
  xpReward: number;
  coinReward: number;
  gradeGroup: GradeGroup;
}

export interface GradeGroupInfo {
  id: GradeGroup;
  label: string;
  description: string;
  grades: number[];
  icon: string;
  color: string;
}

export const GRADE_GROUPS: GradeGroupInfo[] = [
  {
    id: 'grade5',
    label: '5 класс',
    description: 'Основы: математика, природа, история древнего мира',
    grades: [5],
    icon: '🌱',
    color: '#22c55e',
  },
  {
    id: 'grade67',
    label: '6-7 класс',
    description: 'Физика, алгебра, начала программирования',
    grades: [6, 7],
    icon: '⚡',
    color: '#3b82f6',
  },
  {
    id: 'grade89',
    label: '8-9 класс',
    description: 'Химия, ОГЭ, углублённые науки',
    grades: [8, 9],
    icon: '🔥',
    color: '#f59e0b',
  },
  {
    id: 'grade1011',
    label: '10-11 класс',
    description: 'ЕГЭ, профильные предметы, проекты',
    grades: [10, 11],
    icon: '🎓',
    color: '#a855f7',
  },
];

export const RARITY_CONFIG: Record<QuestRarity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  common: {
    label: 'Обычный',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  rare: {
    label: 'Редкий',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  epic: {
    label: 'Эпический',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  legendary: {
    label: 'Легендарный',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
};
