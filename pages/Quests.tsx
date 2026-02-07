import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Quest, QuestCategory, QuestRarity } from '../types';
import { fetchQuests } from '../store/questsSlice';
import { Coins, Star, Brain, BookOpen, Dumbbell, Sparkles, Hourglass, Users, Loader2, Sword, Scroll, Shield, Leaf, Heart, Globe, DollarSign, Laptop, Clock, ArrowRight } from 'lucide-react';
import QuestModal from '../components/QuestModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Quests: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: quests, status } = useSelector((state: RootState) => state.quests);
  const { user } = useAuth();
  
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [activeCategory, setActiveCategory] = useState<QuestCategory | 'All'>('All');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchQuests());
    }
  }, [status, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  // Active Quests
  const activeQuestIds = Object.keys(user.activeQuestTimers || {}).map(Number);
  const activeQuests = quests.filter(q => activeQuestIds.includes(q.id) && !q.completed);
  const activeCount = activeQuests.length;

  const getRarityStyles = (rarity: QuestRarity) => {
    switch (rarity) {
      case 'Legendary': return {
        border: 'border-amber-500',
        bg: 'bg-gradient-to-b from-slate-900 to-amber-900/20',
        text: 'text-amber-500',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
      };
      case 'Epic': return {
        border: 'border-purple-500',
        bg: 'bg-gradient-to-b from-slate-900 to-purple-900/20',
        text: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]'
      };
      case 'Rare': return {
        border: 'border-blue-500',
        bg: 'bg-gradient-to-b from-slate-900 to-blue-900/20',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
      };
      default: return {
        border: 'border-slate-600',
        bg: 'bg-slate-900',
        text: 'text-slate-400',
        glow: 'group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
      };
    }
  };

  const getCategoryIcon = (category: QuestCategory) => {
    switch (category) {
      case 'Sport': return <Dumbbell className="h-4 w-4" />;
      case 'Math': return <Brain className="h-4 w-4" />;
      case 'Lang': return <Globe className="h-4 w-4" />;
      case 'Russian': return <Scroll className="h-4 w-4" />;
      case 'Literature': return <BookOpen className="h-4 w-4" />;
      case 'History': return <Hourglass className="h-4 w-4" />;
      case 'Science': return <Sparkles className="h-4 w-4" />;
      case 'Ecology': return <Leaf className="h-4 w-4" />;
      case 'Social': return <Users className="h-4 w-4" />;
      case 'Self': return <Heart className="h-4 w-4" />;
      case 'Finance': return <DollarSign className="h-4 w-4" />;
      case 'IT': return <Laptop className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const categories: {id: QuestCategory | 'All', label: string}[] = [
    { id: 'All', label: 'Все' },
    { id: 'Math', label: 'Математика' },
    { id: 'Russian', label: 'Русский' },
    { id: 'Literature', label: 'Литература' },
    { id: 'Lang', label: 'Языки' },
    { id: 'Science', label: 'Наука' },
    { id: 'History', label: 'История' },
    { id: 'Sport', label: 'Здоровье' },
    { id: 'Social', label: 'Социум' },
    { id: 'Ecology', label: 'Экология' },
    { id: 'Self', label: 'Развитие' },
  ];

  const filteredQuests = (activeCategory === 'All' 
    ? quests 
    : quests.filter(q => q.category === activeCategory)).filter(q => !activeQuestIds.includes(q.id));

  const sortedQuests = [...filteredQuests].sort((a, b) => {
    if (a.completed === b.completed) {
      const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    }
    return a.completed ? 1 : -1;
  });

  const getTimeLeft = (q: Quest) => {
      const start = user.activeQuestTimers[q.id];
      const end = start + q.minMinutes * 60000;
      const left = end - now;
      if (left <= 0) return "Ready";
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {selectedQuest && (
          <QuestModal 
            quest={selectedQuest} 
            isOpen={!!selectedQuest} 
            onClose={() => setSelectedQuest(null)} 
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-slate-700/50 pb-4">
        <div>
            <h1 className="text-3xl font-bold text-white rpg-font tracking-wide">
                <span className="text-purple-500">Доска</span> Миссий
            </h1>
            <p className="text-slate-400 text-sm mt-1">
                Все доступные задания
            </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${
                        activeCategory === cat.id 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>
      </div>
      
      {/* Active Quests Section */}
      {activeQuests.length > 0 && (
          <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold uppercase tracking-wider text-sm">
                  <Clock size={16} className="text-amber-400" />
                  В процессе ({activeCount}/3)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeQuests.map(quest => (
                       <motion.div
                          key={quest.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedQuest(quest)}
                          className="bg-slate-800/80 border border-amber-500/50 rounded-xl p-4 cursor-pointer relative overflow-hidden group hover:bg-slate-800 transition-colors"
                       >
                           <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="font-bold text-white truncate pr-2">{quest.title}</h4>
                               <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded">
                                   {getTimeLeft(quest)}
                               </span>
                           </div>
                           <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                               <span>Награда: {quest.coins} 💰</span>
                               <span className="flex items-center gap-1 text-emerald-400 group-hover:underline">Продолжить <ArrowRight size={12}/></span>
                           </div>
                       </motion.div>
                  ))}
              </div>
          </div>
      )}

      {status === 'loading' ? (
         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500 h-12 w-12" /></div>
      ) : sortedQuests.length === 0 && activeQuests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
             <h3 className="text-xl text-slate-300 font-bold mb-4">Заданий пока нет</h3>
             <p className="text-slate-500">Попробуй сменить фильтр или загляни позже.</p>
        </div>
      ) : (
        <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedQuests.map((quest) => {
             const styles = getRarityStyles(quest.rarity);
             const canStart = activeCount < 3;
             return (
               <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={!quest.completed ? { scale: 1.03, y: -5 } : {}}
                  transition={{ duration: 0.2 }}
                  key={quest.id}
                  onClick={() => {
                      if (quest.completed) return;
                      if (!canStart) {
                          alert("Максимум 3 активных задания. Заверши текущие!");
                          return;
                      }
                      setSelectedQuest(quest);
                  }}
                  className={`
                    group relative overflow-hidden rounded-xl border-2 p-1 cursor-pointer transition-all duration-300
                    ${styles.border} ${styles.glow} ${quest.completed ? 'opacity-50 grayscale' : canStart ? '' : 'opacity-70'}
                  `}
               >
                  <div className={`absolute inset-0 opacity-80 backdrop-blur-md ${styles.bg}`}></div>
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-5 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${styles.border} ${styles.text} bg-slate-950/50`}>
                              {quest.rarity === 'Rare' ? 'Редкий' : quest.rarity === 'Epic' ? 'Эпик' : quest.rarity === 'Legendary' ? 'Легенда' : 'Обычный'}
                          </span>
                          {quest.type === 'daily' && <Hourglass className="h-4 w-4 text-slate-500" />}
                      </div>

                      <h3 className="text-xl font-bold text-slate-100 mb-2 font-serif leading-tight group-hover:text-white transition-colors">
                          {quest.title}
                      </h3>
                      
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4 group-hover:text-slate-300">
                          {quest.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700/50">
                          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase">
                              {getCategoryIcon(quest.category)}
                              <span>{quest.category}</span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                             <div className="flex items-center text-amber-400 font-bold bg-amber-950/40 border border-amber-900/50 px-2 py-1 rounded">
                                <Coins className="h-3 w-3 mr-1" /> {quest.coins}
                             </div>
                             <div className="flex items-center text-purple-400 font-bold bg-purple-950/40 border border-purple-900/50 px-2 py-1 rounded">
                                <Star className="h-3 w-3 mr-1" /> {quest.xp}
                             </div>
                          </div>
                      </div>
                  </div>

                  {/* Completed Overlay */}
                  {quest.completed && (
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