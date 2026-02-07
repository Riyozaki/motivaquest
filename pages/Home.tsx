
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, ArrowRight, Lock, MapPin, Check, CheckCircle, Clock, Flame, Skull } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { advanceCampaignDay } from '../store/userSlice';
import { fetchQuests } from '../store/questsSlice';
import { CAMPAIGN_DATA } from '../store/questsSlice';
import QuestModal from '../components/QuestModal';
import BossBattleModal from '../components/BossBattleModal';
import Survey from '../components/Survey';
import { Quest, QuestRarity } from '../types';
import { motion } from 'framer-motion';
import LocationEffects from '../components/LocationEffects';

// --- Animation Variants ---
const containerVar = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVar = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 50 } }
};

const LOCATIONS = [
    { id: 'village', name: 'Деревня', color: 'bg-emerald-500', icon: '🏠' },
    { id: 'forest', name: 'Лес', color: 'bg-green-700', icon: '🌲' },
    { id: 'mountains', name: 'Горы', color: 'bg-slate-500', icon: '🏔️' },
    { id: 'castle', name: 'Замок', color: 'bg-indigo-600', icon: '🏰' },
    { id: 'desert', name: 'Пустыня', color: 'bg-amber-500', icon: '☀️' },
    { id: 'throne', name: 'Трон', color: 'bg-purple-700', icon: '👑' },
];

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
            Твоя жизнь — это RPG. Спаси мир знаний, победив Тень Лени.
          </p>
          <Link to="/login" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary-600 text-base md:text-lg rounded-xl hover:bg-primary-700 hover:scale-105 shadow-[0_0_20px_rgba(var(--color-primary-600),0.5)]">
             <span className="mr-2">НАЧАТЬ ПУТЬ</span> <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
      </motion.div>
  </div>
);

const StoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { list: quests, status } = useSelector((state: RootState) => state.quests);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [timeToReset, setTimeToReset] = useState<string>('');
  const [isBossModalOpen, setIsBossModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchQuests());
    }
  }, [status, dispatch]);

  // --- Timer Logic (Next 6:00 AM MSK) ---
  useEffect(() => {
    const calculateTime = () => {
        const now = new Date();
        const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
        const mskOffset = 3 * 3600000;
        const mskNow = new Date(utcNow + mskOffset);

        const target = new Date(mskNow);
        target.setHours(6, 0, 0, 0);

        // If we passed 6 AM today, target is tomorrow 6 AM
        if (mskNow > target) {
            target.setDate(target.getDate() + 1);
        }

        const diff = target.getTime() - mskNow.getTime();
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        setTimeToReset(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const currentDayNum = user.campaign?.currentDay || 1;
  const currentStory = CAMPAIGN_DATA.find(d => d.day === currentDayNum) || CAMPAIGN_DATA[0];
  
  // Get story quests
  const storyQuests = quests.filter(q => currentStory.questIds.includes(q.id));
  
  // Calculate Progress
  const completedCount = storyQuests.filter(q => q.completed).length;
  const totalCount = storyQuests.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const handleAdvanceDay = () => {
      dispatch(advanceCampaignDay());
  };

  const getRarityColor = (r: QuestRarity) => {
      switch(r) {
          case 'Legendary': return 'border-amber-500 bg-amber-950/30 text-amber-400';
          case 'Epic': return 'border-purple-500 bg-purple-950/30 text-purple-400';
          case 'Rare': return 'border-blue-500 bg-blue-950/30 text-blue-400';
          default: return 'border-slate-600 bg-slate-800/50 text-slate-400';
      }
  };

  const getCharacterImage = (char: string) => {
      switch(char) {
          case 'wizard': return <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white">🧙‍♂️</div>;
          case 'fairy': return <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white">🧚‍♀️</div>;
          case 'warrior': return <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white">🛡️</div>;
          case 'king': return <div className="w-16 h-16 bg-purple-900 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white">👹</div>;
          default: return <div className="w-16 h-16 bg-slate-500 rounded-full flex items-center justify-center text-3xl">👤</div>;
      }
  };

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <LocationEffects locationId={currentStory.locationId} />
      </div>

      <motion.div variants={containerVar} initial="hidden" animate="show" className="space-y-8 relative z-10">
        {selectedQuest && (
            <QuestModal quest={selectedQuest} isOpen={!!selectedQuest} onClose={() => setSelectedQuest(null)} />
        )}
        
        <BossBattleModal 
            isOpen={isBossModalOpen} 
            onClose={() => setIsBossModalOpen(false)} 
            allies={user.campaign.unlockedAllies || []} 
        />

        {/* World Map Header */}
        <motion.div variants={itemVar} className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white rpg-font flex items-center gap-2">
                        <MapPin className="text-amber-400" /> Карта Королевства
                    </h2>
                    <div className="px-4 py-1 bg-slate-800 rounded-full border border-slate-600 text-xs font-bold text-slate-300">
                        День {currentDayNum} / 14
                    </div>
                </div>

                {/* Map Nodes */}
                <div className="flex justify-between items-center relative px-2 md:px-10 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-700 -z-10 hidden md:block transform -translate-y-1/2"></div>
                    
                    {LOCATIONS.map((loc, idx) => {
                        const isActive = loc.id === currentStory.locationId;
                        const isPast = idx < LOCATIONS.findIndex(l => l.id === currentStory.locationId);
                        
                        return (
                            <div key={loc.id} className="flex flex-col items-center gap-2 relative min-w-[80px]">
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 transition-all z-10 shadow-xl
                                    ${isActive ? `${loc.color} border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]` : 
                                      isPast ? 'bg-slate-700 border-emerald-500' : 'bg-slate-800 border-slate-600 opacity-50'}
                                `}>
                                    {isPast ? <Check className="text-emerald-400" /> : 
                                     isActive ? <span className="text-2xl animate-bounce">{loc.icon}</span> : 
                                     <Lock size={16} className="text-slate-500" />}
                                </div>
                                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                    {loc.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>

        {/* --- DAY INFO & TIMER --- */}
        <motion.div variants={itemVar} className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-900/30 rounded-full text-blue-400 border border-blue-500/30 animate-pulse">
                    <Clock size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">До начала нового дня</div>
                    <div className="text-xl font-mono font-bold text-white">{timeToReset}</div>
                </div>
            </div>
            
            <div className="flex-1 text-center md:text-left md:px-6">
                 <div className="text-sm text-slate-300 font-medium">
                     <span className="text-amber-400 font-bold">Правило Дня:</span> Новый день начинается в <span className="text-white font-bold">06:00 МСК</span>.
                 </div>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Story Panel */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Dialogue Box */}
                <motion.div variants={itemVar} className="bg-gradient-to-r from-slate-900/90 to-indigo-950/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0">
                            {getCharacterImage(currentStory.character)}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1">{currentStory.title}</h3>
                            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 text-slate-300 italic text-sm md:text-base leading-relaxed relative">
                                <span className="text-4xl text-white/10 absolute -top-2 -left-2">“</span>
                                {currentStory.dialogue}
                                <span className="text-4xl text-white/10 absolute -bottom-4 -right-2">”</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Today's Quests */}
                <motion.div variants={itemVar}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Swords className="text-red-400" /> Задания Дня
                        </h3>
                        <div className="text-sm font-bold text-slate-400">
                            {completedCount} / {totalCount} Выполнено
                        </div>
                    </div>

                    <div className="space-y-4">
                        {storyQuests.length > 0 ? storyQuests.map((quest, idx) => (
                            <motion.div
                                key={quest.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => !quest.completed && setSelectedQuest(quest)}
                                className={`
                                    relative p-4 rounded-xl cursor-pointer transition-all border-l-4 bg-slate-800/80 backdrop-blur-sm
                                    ${getRarityColor(quest.rarity)}
                                    ${quest.completed ? 'opacity-50 grayscale' : 'hover:translate-x-2 hover:bg-slate-800'}
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-200">{quest.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{quest.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] uppercase font-bold bg-black/30 px-2 py-0.5 rounded text-white/70">{quest.rarity}</span>
                                        {quest.completed && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-xl">Задания загружаются магией...</div>
                        )}
                    </div>

                    {/* Complete Day / Boss Fight Button */}
                    {user.campaign?.isDayComplete && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-8 p-6 bg-gradient-to-r from-emerald-900/60 to-teal-900/60 backdrop-blur-sm rounded-2xl border border-emerald-500/50 text-center shadow-lg"
                        >
                            {currentDayNum === 14 ? (
                                <>
                                  <h3 className="text-xl font-bold text-white mb-2 text-red-500">ФИНАЛЬНАЯ БИТВА!</h3>
                                  <p className="text-red-200 text-sm mb-4">Тень Лени ослабла. Нанеси решающий удар!</p>
                                  <button 
                                      onClick={() => setIsBossModalOpen(true)}
                                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center mx-auto gap-2 animate-pulse"
                                  >
                                      <Skull size={20} /> БРОСИТЬ ВЫЗОВ БОССУ
                                  </button>
                                </>
                            ) : (
                                <>
                                  <h3 className="text-xl font-bold text-white mb-2">День Завершен!</h3>
                                  <p className="text-emerald-200 text-sm mb-4">Ты справился с испытаниями. Награда ждет.</p>
                                  <button 
                                      onClick={handleAdvanceDay}
                                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center mx-auto gap-2"
                                  >
                                      <CheckCircle size={20} /> Получить Награду и Отдохнуть
                                  </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                {/* Hero Status */}
                <motion.div variants={itemVar} className="glass-panel p-6 rounded-2xl relative overflow-hidden shadow-lg bg-slate-900/80">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-black text-white">{user.level}</span>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Герой</div>
                            <div className="text-xl font-bold text-white">{user.username}</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                <span>XP</span>
                                <span>{user.currentXp} / {user.nextLevelXp}</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500" style={{ width: `${Math.min(100, (user.currentXp / user.nextLevelXp) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Allies */}
                <motion.div variants={itemVar} className="glass-panel p-6 rounded-2xl bg-slate-900/80 shadow-lg">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Союзники</h4>
                    <div className="flex gap-2">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-blue-500/20 border-blue-500 text-lg`} title="Мудрый Волшебник">🧙‍♂️</div>
                        {currentDayNum >= 3 && <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-pink-500/20 border-pink-500 text-lg`} title="Дух Мотивации">🧚‍♀️</div>}
                        {currentDayNum >= 7 && <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-red-500/20 border-red-500 text-lg`} title="Воин Дисциплины">🛡️</div>}
                        {currentDayNum < 3 && <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">?</div>}
                    </div>
                </motion.div>
                
                {/* Daily Survey Widget (Moved from Profile) */}
                <motion.div variants={itemVar}>
                    <Survey />
                </motion.div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <StoryDashboard /> : <LandingPage />;
};

export default Home;
