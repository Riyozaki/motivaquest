import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Coins, Star, Loader2, Clock, ArrowRight, Filter, Trophy, Flame, Gem, Crown } from 'lucide-react';
import QuestModal from '../components/QuestModal';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getQuestsByGrade, getCategoriesForGrade, Quest as GradeQuest, QuestRarity, RARITY_CONFIG } from '../data';

const Quests: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const gradeGroup = useSelector((state: RootState) => state.user.gradeGroup);
  const { user } = useAuth();
  
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeRarity, setActiveRarity] = useState<QuestRarity | 'all'>('all');

  // Close modal on unmount (prevents navigation freeze)
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
      isHabit: false,
      categoryLabel: quest.categoryLabel,
      categoryIcon: quest.categoryIcon,
      tasks: [
        {
          id: 1,
          type: 'yes_no',
          question: quest.description,
          correctAnswer: true,
        }
      ],
    };
    setSelectedQuest(mapped);
  };

  const getRarityStyles = (rarity: QuestRarity) => {
    switch (rarity) {
      case 'legendary': return {
        border: 'border-amber-500',
        bg: 'bg-gradient-to-b from-slate-900 to-amber-900/20',
        text: 'text-amber-500',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]',
        label: 'Легенда',
        icon: <Crown className="h-3.5 w-3.5" />,
      };
      case 'epic': return {
        border: 'border-purple-500',
        bg: 'bg-gradient-to-b from-slate-900 to-purple-900/20',
        text: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]',
        label: 'Эпик',
        icon: <Gem className="h-3.5 w-3.5" />,
      };
      case 'rare': return {
        border: 'border-blue-500',
        bg: 'bg-gradient-to-b from-slate-900 to-blue-900/20',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]',
        label: 'Редкий',
        icon: <Flame className="h-3.5 w-3.5" />,
      };
      default: return {
        border: 'border-slate-600',
        bg: 'bg-slate-900',
        text: 'text-slate-400',
        glow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
        label: 'Обычный',
        icon: <Star className="h-3.5 w-3.5" />,
      };
    }
  };

  const rarityFilters: { id: QuestRarity | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'Все', color: 'text-slate-300' },
    { id: 'common', label: 'Обычные', color: 'text-slate-400' },
    { id: 'rare', label: 'Редкие', color: 'text-blue-400' },
    { id: 'epic', label: 'Эпические', color: 'text-purple-400' },
    { id: 'legendary', label: 'Легендарные', color: 'text-amber-400' },
  ];

  // Stats
  const totalQuests = allQuests.length;
  const completedCount = allQuests.filter(q => completedQuestIds.has(q.id)).length;

  return (
    <div className="space-y-6">
      {selectedQuest && (
        <QuestModal 
          quest={selectedQuest} 
          isOpen={!!selectedQuest} 
          onClose={() => setSelectedQuest(null)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white rpg-font tracking-wide">
            <span className="text-purple-500">Доска</span> Миссий
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Выполнено {completedCount} из {totalQuests} квестов
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <Trophy className="h-4 w-4 text-amber-400" />
          <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${totalQuests > 0 ? (completedCount / totalQuests) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0}%</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${
            activeCategory === 'all' 
              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Все предметы
        </button>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              activeCategory === cat.key 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Rarity Filter */}
      <div className="flex gap-2 items-center">
        <Filter className="h-4 w-4 text-slate-500" />
        {rarityFilters.map(rf => (
          <button
            key={rf.id}
            onClick={() => setActiveRarity(rf.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
              activeRarity === rf.id
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
                  ${styles.border} ${styles.glow} ${isCompleted ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className={`absolute inset-0 opacity-80 ${styles.bg}`}></div>
                
                <div className="relative z-10 p-5 h-full flex flex-col">
                  {/* Rarity & Category */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${styles.border} ${styles.text} bg-slate-950/50 flex items-center gap-1`}>
                      {styles.icon} {styles.label}
                    </span>
                    <span className="text-lg" title={quest.categoryLabel}>{quest.categoryIcon}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-white transition-colors" style={{ fontFamily: "'Cinzel', serif" }}>
                    {quest.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 group-hover:text-slate-300">
                    {quest.description}
                  </p>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500 font-medium">
                      {quest.categoryLabel}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-amber-400 font-bold bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded text-xs">
                        <Coins className="h-3 w-3 mr-1" /> {quest.coinReward}
                      </div>
                      <div className="flex items-center text-purple-400 font-bold bg-purple-950/40 border border-purple-900/50 px-2 py-0.5 rounded text-xs">
                        <Star className="h-3 w-3 mr-1" /> {quest.xpReward}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                    <div className="border-4 border-emerald-500 text-emerald-400 px-4 py-2 rounded-xl text-xl font-black uppercase tracking-widest -rotate-12 shadow-2xl bg-slate-900">
                      Завершено
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Quests;