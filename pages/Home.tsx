import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Gift, Smile, Frown, Meh, Award, Swords, ArrowRight, BookOpen, Star, Shield, Zap, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { submitDailyMood } from '../store/userSlice';
import { fetchQuests } from '../store/questsSlice';
import QuestModal from '../components/QuestModal';
import { Quest } from '../types';
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
  <div className="text-center py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
          <h1 className="text-6xl md:text-8xl font-black rpg-font mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            MOTIVA<span className="text-purple-500">QUEST</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light">
            Твоя жизнь — это RPG. Прокачивай навыки, выполняй квесты и получай легендарные награды.
          </p>
          <Link to="/login" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-purple-600 font-lg rounded-xl hover:bg-purple-700 hover:scale-105 shadow-[0_0_20px_rgba(124,58,237,0.5)]">
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

  const dailyQuest = quests.find(q => q.type === 'daily' && !q.completed) || quests[0];

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
      backgroundColor: '#a78bfa',
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

  return (
    <motion.div variants={containerVar} initial="hidden" animate="show" className="space-y-8">
      {selectedQuest && (
          <QuestModal quest={selectedQuest} isOpen={!!selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}

      {/* Hero / Character Stats Panel */}
      <motion.div variants={itemVar} className="tour-step-1 relative bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden group">
         {/* Background FX */}
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 opacity-50"></div>
         <div className="absolute -right-10 -top-10 text-white/5 rotate-12 transform scale-150 group-hover:scale-155 transition-transform duration-1000">
             <Swords size={300} />
         </div>

         <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Level Badge */}
            <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] rotate-3">
                    <span className="text-4xl font-black text-white drop-shadow-md rpg-font">{user.level}</span>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300">
                    Уровень
                </div>
            </div>

            <div className="flex-grow text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-2 rpg-font tracking-wide">
                    {user.username}
                </h1>
                
                {/* XP Bar */}
                <div className="w-full max-w-xl">
                    <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">
                        <span>Прогресс опыта</span>
                        <span className="text-purple-400">{user.currentXp} / {user.nextLevelXp} XP</span>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-400 relative"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/50 box-shadow-[0_0_10px_white]"></div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <Link to="/quests" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/50 hover:-translate-y-1 transition-all flex items-center">
                    <Target className="mr-2 h-5 w-5" /> Квесты
                </Link>
                <Link to="/rewards" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-amber-400" /> Лавка
                </Link>
            </div>
         </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Quest */}
          <motion.div variants={itemVar} className="tour-step-2 md:col-span-2">
              <h2 className="text-xl font-bold mb-4 flex items-center text-slate-200 rpg-font">
                  <Flame className="mr-2 text-orange-500" /> Приоритетная Цель
              </h2>
              {dailyQuest ? (
                <div 
                    onClick={() => setSelectedQuest(dailyQuest)}
                    className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-1 rounded-2xl cursor-pointer group hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl opacity-20 blur-md group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 text-purple-300 rounded text-xs font-bold uppercase tracking-wider">
                                {dailyQuest.category || 'Основное'}
                            </span>
                            <span className="flex items-center text-amber-400 font-bold text-sm bg-amber-900/20 px-2 py-1 rounded border border-amber-500/20">
                                <Award className="w-4 h-4 mr-1" /> {dailyQuest.coins}
                            </span>
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{dailyQuest.title}</h3>
                            <p className="text-slate-400 line-clamp-2">{dailyQuest.description}</p>
                        </div>

                        <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover:text-white transition-colors">
                            Нажми, чтобы начать <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-dashed border-slate-600 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[200px]">
                    <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Все цели достигнуты. Медитируй.</p>
                </div>
              )}
          </motion.div>

          {/* Sidebar Widgets */}
          <motion.div variants={itemVar} className="tour-step-3 space-y-6">
              {/* Mood */}
              <div className="glass-panel p-6 rounded-2xl">
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
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="font-bold text-slate-300 mb-4 flex items-center text-sm uppercase tracking-wider">
                    <TrendingUp className="mr-2 h-4 w-4 text-purple-400" /> Активность
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