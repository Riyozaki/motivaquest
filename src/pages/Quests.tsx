import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Coins, Star, Loader2, Clock, ArrowRight, Filter, Trophy, Flame, Gem, Crown } from 'lucide-react';
import QuestModal from '../components/QuestModal';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { getQuestsByGrade, getCategoriesForGrade, Quest as GradeQuest, QuestRarity, RARITY_CONFIG } from '../data';

const Quests: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const gradeGroup = useSelector((state: RootState) => state.user.gradeGroup);
  const { user } = useAuth();
  const location = useLocation();
  
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeRarity, setActiveRarity] = useState<QuestRarity | 'all'>('all');

  // FIX: Close modal on ANY route change (prevents navigation freeze)
  useEffect(() => {
    setSelectedQuest(null);
  }, [location.pathname]);

  // Also close on unmount as safety net
  useEffect(() => {
    return () => setSelectedQuest(null);
  }, []);

  if (!user) return null;

  // Get quests for selected grade group
  const gradeGroupKey = (gradeGroup || 'grade67') as any;
  const allQuests = getQuestsByGrade(gradeGroupKey);
  const categories = getCategoriesForGrade(gradeGroupKey);

  // Track completed quests from user history
  const completedQuestIds = new Set(
    (user.questHistory || []).map((h: any) => String(h.questId))
  );

  // Filter quests
  let filteredQuests = allQuests;
  if (activeCategory !== 'all') {
    filteredQuests = filteredQuests.filter(q => q.category === activeCategory);
  }
  if (activeRarity !== 'all') {
    filteredQuests = filteredQuests.filter(q => q.rarity === activeRarity);
  }

  // Sort: incomplete first, then by rarity (legendary > epic > rare > common)
  const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    const aCompleted = completedQuestIds.has(a.id);
    const bCompleted = completedQuestIds.has(b.id);
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
  });

  // Map grade quest to format compatible with QuestModal
  const openQuest = (quest: GradeQuest) => {
    const mapped = {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      rarity: quest.rarity.charAt(0).toUpperCase() + quest.rarity.slice(1),
      xp: quest.xpReward,
      coins: quest.coinReward,
      completed: completedQuestIds.has(quest.id),
      type: 'quest',
      minMinutes: quest.rarity === 'legendary' ? 60 : quest.rarity === 'epic' ? 30 : quest.rarity === 'rare' ? 15 : 5,
      tasks: quest.tasks || [],
    };
    setSelectedQuest(mapped);
  };

  const getRarityStyles = (rarity: string) => {
    const config = RARITY_CONFIG[rarity as QuestRarity];
    return config || RARITY_CONFIG.common;
  };

  const rarityFilters = [
    { key: 'all' as const, label: 'Все', color: 'text-white' },
    { key: 'common' as const, label: 'Обычный', color: 'text-slate-300' },
    { key: 'rare' as const, label: 'Редкий', color: 'text-blue-400' },
    { key: 'epic' as const, label: 'Эпик', color: 'text-purple-400' },
    { key: 'legendary' as const, label: 'Легенда', color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white rpg-font mb-2">Книга Заданий</h1>
        <p className="text-slate-400">Выбери задание и получи награду</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
            activeCategory === 'all' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              activeCategory === cat ? 'bg-primary-600 border-primary-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rarity Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {rarityFilters.map((rf) => (
          <button
            key={rf.key}
            onClick={() => setActiveRarity(rf.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              activeRarity === rf.key
                ? `bg-slate-700 border-slate-500 ${rf.color}`
                : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            {rf.label}
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      {sortedQuests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
          <h3 className="text-xl text-slate-300 font-bold mb-4">Заданий не найдено</h3>
          <p className="text-slate-500">Попробуй сменить фильтр</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {sortedQuests.map((quest) => {
            const styles = getRarityStyles(quest.rarity);
            const isCompleted = completedQuestIds.has(quest.id);

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={!isCompleted ? { scale: 1.02, y: -3 } : {}}
                transition={{ duration: 0.2 }}
                key={quest.id}
                onClick={() => !isCompleted && openQuest(quest)}
                className={`
                  group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300
                  ${styles.border} ${styles.glow} ${isCompleted ? 'opacity-50 cursor-default' : ''}
                `}
              >
                <div className={`p-5 ${styles.bg}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white text-lg">{quest.title}</h3>
                    {isCompleted && <Trophy size={18} className="text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{quest.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs font-bold">
                      <span className="flex items-center text-amber-400"><Coins size={14} className="mr-1" /> {quest.coinReward}</span>
                      <span className="flex items-center text-purple-400"><Star size={14} className="mr-1" /> {quest.xpReward}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textColor || 'text-slate-400'}`}>
                      {quest.rarity}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Quest Modal */}
      {selectedQuest && (
        <QuestModal
          quest={selectedQuest}
          isOpen={!!selectedQuest}
          onClose={() => setSelectedQuest(null)}
        />
      )}
    </div>
  );
};

export default Quests;
