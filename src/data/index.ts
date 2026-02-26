// Центральный экспорт квестов

export * from './questTypes';
export { grade5Quests } from './grade5Quests';
export { grade67Quests } from './grade67Quests';
export { grade89Quests } from './grade89Quests';
export { grade1011Quests } from './grade1011Quests';
export { grade5QuestTasksMap } from './grade5QuestTasks';
export { grade67QuestTasksMap } from './grade67QuestTasks';
export { grade89QuestTasksMap } from './grade89QuestTasks';
export { grade1011QuestTasksMap } from './grade1011QuestTasks';
import { Quest, GradeGroup } from './questTypes';
import { grade5Quests } from './grade5Quests';
import { grade67Quests } from './grade67Quests';
import { grade89Quests } from './grade89Quests';
import { grade1011Quests } from './grade1011Quests';

// Import interactive task maps for each grade group
import { grade89QuestTasksMap } from './grade89QuestTasks';
import { grade1011QuestTasksMap } from './grade1011QuestTasks';

const questMap: Record<GradeGroup, Quest[]> = {
  grade5: grade5Quests,
  grade67: grade67Quests,
  grade89: grade89Quests,
  grade1011: grade1011Quests,
};

// Combined task maps for all grade groups
const allTaskMaps: Record<string, any[]> = {
  ...grade89QuestTasksMap,
  ...grade1011QuestTasksMap,
};

/** Получить квесты по группе классов */
export function getQuestsByGrade(gradeGroup: GradeGroup): Quest[] {
  return questMap[gradeGroup] || [];
}

/** Получить квесты по категории внутри группы */
export function getQuestsByCategory(gradeGroup: GradeGroup, category: string): Quest[] {
  return getQuestsByGrade(gradeGroup).filter(q => q.category === category);
}

/** Получить уникальные категории для группы */
export function getCategoriesForGrade(gradeGroup: GradeGroup): { key: string; label: string; icon: string }[] {
  const quests = getQuestsByGrade(gradeGroup);
  const seen = new Set<string>();
  const categories: { key: string; label: string; icon: string }[] = [];

  for (const q of quests) {
    if (!seen.has(q.category)) {
      seen.add(q.category);
      categories.push({ key: q.category, label: q.categoryLabel, icon: q.categoryIcon });
    }
  }
  return categories;
}

/** Определить GradeGroup по номеру класса */
export function gradeToGroup(grade: number): GradeGroup {
  if (grade === 5) return 'grade5';
  if (grade <= 7) return 'grade67';
  if (grade <= 9) return 'grade89';
  return 'grade1011';
}

/** Получить интерактивные задания для квеста по его id */
export function getTasksForQuest(questId: string): any[] | null {
  return allTaskMaps[questId] || null;
}