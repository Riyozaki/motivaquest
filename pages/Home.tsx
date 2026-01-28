import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Gift, Smile, Frown, Meh, Award, Swords, ArrowRight, BookOpen, Star, Shield, Zap, Flame, Calendar, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { submitDailyMood } from '../store/userSlice';
import { fetchQuests } from '../store/questsSlice';
import QuestModal from '../components/QuestModal';
import { Quest, QuestRarity } from '../types';
import { motion } from 'framer-motion';

// --- Animation Variants ---
const containerVar = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVar = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } }
};

const LandingPage: React.FC = () => (
  <div className="text-center py-20 md:py-32 relative px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary-600/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black rpg-font mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-tight">
            MOTIVA<span className="text-primary-500">QUEST</span>
          </h1>
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light px-2">
            Твоя жизнь — это RPG. Прокачивай навыки, выполняй квесты и получай легендарные награды.
          </p>
          <Link to="/login" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary-600 text-base md:text-lg rounded-xl hover:bg-primary-700 hover:scale-105 shadow-[0_0_20px_rgba(var(--color-primary-600),0.5)]">
             <span className="mr-2">НАЧАТЬ ИГРУ</span> <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
      </motion.div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { list: quests, status } = useSelector((state: RootState) => state.quests);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchQuests());
    }
  }, [status, dispatch]);

  // --- Board Generation Logic ---
  // Memoize the board selection so it doesn't change on every render, only when quests/user changes
  const missionBoard = useMemo(() => {
      if (!user) return [];

      // No grade filtering - quests are universal
      const availableQuests = [...quests];
      
      const shuffle = (array: Quest[]) => [...array].sort(() => 0.5 - Math.random());

      // Get required counts
      const legendary = shuffle(availableQuests.filter(q => q.rarity === 'Legendary')).slice(0, 1);
      const epic = shuffle(availableQuests.filter(q => q.rarity === 'Epic')).slice(0, 2);
      const rare = shuffle(availableQuests.filter(q => q.rarity === 'Rare')).slice(0, 3);
      const common = shuffle(availableQuests.filter(q => q.rarity === 'Common')).slice(0, 5);

      // Combine (sort by rarity descending for display: L -> E -> R -> C)
      const combined = [...legendary, ...epic, ...rare, ...common];
      
      return combined;
  }, [quests, user?.uid]); 

  if (!user) return null;

  // XP Calculations
  const xpProgress = Math.min(100, (user.currentXp / user.nextLevelXp) * 100);

  // Chart Data
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const historyCounts = last7Days.map(date => {
     return user.questHistory?.filter(h => h.date.startsWith(date)).length || 0;
  });

  const weeklyChartData = {
    labels: last7Days.map(d => d.slice(5)), 
    datasets: [{
      label: 'Опыт',
      data: historyCounts.map(c => c * 100), // Visual fake scale
      backgroundColor: 'rgba(var(--color-primary-400), 0.5)',
      borderRadius: 4,
      hoverBackgroundColor: '#f59e0b'
    }]
  };

  const handleMood = async (rating: number) => {
     setMoodLoading(true);
     try {
         await dispatch(submitDailyMood(rating)).unwrap();
     } catch (e) { } finally { setMoodLoading(false); }
  };

  const isMoodDone = user.lastDailyMood === new Date().toDateString();

  const getRarityColor = (r: QuestRarity) => {
      switch(r) {
          case 'Legendary': return 'border-amber-500 bg-amber-950/30 text-amber-400';
          case 'Epic': return 'border-purple-500 bg-purple-950/30 text-purple-400';
          case 'Rare': return 'border-blue-500 bg-blue-950/30 text-blue-400';
          default: return 'border-slate-600 bg-slate-800/50 text-slate-400';
      }
  };

  return (
    <motion.div variants={containerVar} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
      
      {selectedQuest && (
          <QuestModal quest={selectedQuest} isOpen={!!selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}

      {/* Hero / Character Stats Panel */}
      <motion.div variants={itemVar} className="tour-step-1 relative bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl rpg-border shadow-2xl overflow-hidden group">
         
         <div className="corner-accent corner-tl"></div>
         <div className="corner-accent corner-tr"></div>
         <div className="corner-accent corner-bl"></div>
         <div className="corner-accent corner-br"></div>

         {/* Background FX */}
         <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-blue-900/20 opacity-50"></div>
         <div className="hidden md:block absolute -right-10 -top-10 text-white/5 rotate-12 transform scale-150 group-hover:scale-155 transition-transform duration-1000">
             <Swords size={300} />
         </div>

         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Level Badge */}
            <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] rotate-3">
                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md rpg-font">{user.level}</span>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-slate-600 px-2 py-1 md:px-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-300">
                    Уровень
                </div>
            </div>

            <div className="flex-grow text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white rpg-font tracking-wide">
                        {user.username}
                    </h1>
                </div>
                
                {/* XP Bar */}
                <div className="w-full max-w-xl mx-auto md:mx-0">
                    <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">
                        <span>Прогресс опыта</span>
                        <span className="text-primary-400">{user.currentXp} / {user.nextLevelXp} XP</span>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-400 relative"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/50 box-shadow-[0_0_10px_white]"></div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
                <Link to="/quests" className="flex-1 md:flex-none justify-center bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-900/50 hover:-translate-y-1 transition-all flex items-center">
                    <Target className="mr-2 h-5 w-5" /> Квесты
                </Link>
                <Link to="/rewards" className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-amber-400" /> Лавка
                </Link>
            </div>
         </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mission Board (Daily Deck) */}
          <motion.div variants={itemVar} className="tour-step-2 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center text-slate-200 rpg-font">
                      <Flame className="mr-2 text-orange-500" /> Доска Миссий
                  </h2>
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <Calendar size={14} /> Сегодня
                  </div>
              </div>

              {missionBoard.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Legendary Quest (Takes full width on mobile, 2 cols if specific layout needed, but grid usually handles it) */}
                    {missionBoard.map((quest, idx) => {
                        const isLegendary = quest.rarity === 'Legendary';
                        
                        return (
                            <motion.div
                                key={quest.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => !quest.completed && setSelectedQuest(quest)}
                                className={`
                                    relative p-4 rounded-2xl cursor-pointer group transition-all duration-300 border-2
                                    ${getRarityColor(quest.rarity)}
                                    ${isLegendary ? 'md:col-span-2 bg-gradient-to-r from-amber-950/40 to-slate-900' : ''}
                                    ${quest.completed ? 'opacity-50 grayscale' : 'hover:-translate-y-1 hover:shadow-lg'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
                                            {quest.rarity === 'Common' ? 'Обычный' : 
                                             quest.rarity === 'Rare' ? 'Редкий' : 
                                             quest.rarity === 'Epic' ? 'Эпик' : 'Легенда'}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                            {quest.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center text-amber-400 text-xs font-bold"><Award className="w-3 h-3 mr-1"/>{quest.coins}</div>
                                        <div className="flex items-center text-primary-400 text-xs font-bold"><Star className="w-3 h-3 mr-1"/>{quest.xp}</div>
                                    </div>
                                </div>

                                <h3 className={`font-bold leading-tight mb-1 ${isLegendary ? 'text-xl text-white' : 'text-base text-slate-200'}`}>
                                    {quest.title}
                                </h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{quest.description}</p>
                                
                                {quest.completed && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl backdrop-blur-[1px]">
                                        <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-6 border border-emerald-400">
                                            ВЫПОЛНЕНО
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
              ) : (
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-dashed border-slate-600 text-center text-slate-500 flex flex-col items-center justify-center h-64">
                    <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">
                        Миссии загружаются...
                    </p>
                </div>
              )}
          </motion.div>

          {/* Sidebar Widgets */}
          <motion.div variants={itemVar} className="tour-step-3 space-y-6">
              {/* Mood */}
              <div className="glass-panel p-6 rounded-2xl rpg-border relative">
                <div className="corner-accent corner-tl"></div>
                <div className="corner-accent corner-tr"></div>
                <div className="corner-accent corner-bl"></div>
                <div className="corner-accent corner-br"></div>
                <h3 className="font-bold text-slate-300 mb-4 flex items-center text-sm uppercase tracking-wider">
                    <Smile className="mr-2 h-4 w-4 text-emerald-400" /> Боевой дух
                </h3>
                {!isMoodDone ? (
                    <div className="flex justify-between gap-2">
                        {[
                            { r: 1, i: Frown, c: 'text-red-400 bg-red-900/20 hover:bg-red-900/40 border-red-900/50' },
                            { r: 3, i: Meh, c: 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border-amber-900/50' },
                            { r: 5, i: Smile, c: 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-900/50' }
                        ].map(opt => (
                            <button 
                                key={opt.r}
                                disabled={moodLoading}
                                onClick={() => handleMood(opt.r)}
                                className={`flex-1 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 flex justify-center ${opt.c}`}
                            >
                                <opt.i size={28} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm">
                        Настрой зафиксирован! +XP
                    </div>
                )}
              </div>

              {/* Chart */}
              <div className="glass-panel p-6 rounded-2xl rpg-border relative">
                <div className="corner-accent corner-tl"></div>
                <div className="corner-accent corner-tr"></div>
                <div className="corner-accent corner-bl"></div>
                <div className="corner-accent corner-br"></div>
                <h3 className="font-bold text-slate-300 mb-4 flex items-center text-sm uppercase tracking-wider">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary-400" /> Активность
                </h3>
                <div className="h-32">
                      <Bar 
                        data={weeklyChartData} 
                        options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: { display: false }
                            },
                            maintainAspectRatio: false
                        }} 
                      />
                </div>
              </div>
          </motion.div>
      </div>
    </motion.div>
  );
};

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LandingPage />;
};

export default Home;