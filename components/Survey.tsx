
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { submitDailyMood, selectIsPending } from '../store/userSlice';
import { Smile, Frown, Meh, Zap, Heart, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingOverlay from './LoadingOverlay';

const MOODS = [
    { score: 1, icon: Frown, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30', label: 'Ужас' },
    { score: 2, icon: Meh, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', label: 'Так себе' },
    { score: 3, icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', label: 'Норм' },
    { score: 4, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30', label: 'Бодро' },
    { score: 5, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-900/20', border: 'border-pink-500/30', label: 'Супер' },
];

const Survey: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const isSubmitting = useSelector(selectIsPending('setMood'));
  
  const [timeLeft, setTimeLeft] = useState(0);

  // Cooldown period in minutes
  const COOLDOWN_MINUTES = 15;

  useEffect(() => {
      if (!user?.lastDailyMood) return;

      const checkTime = () => {
          const lastDate = new Date(user.lastDailyMood!);
          const now = new Date();
          const diffMs = now.getTime() - lastDate.getTime();
          const diffMins = diffMs / (1000 * 60);

          if (diffMins < COOLDOWN_MINUTES) {
              setTimeLeft(Math.ceil(COOLDOWN_MINUTES - diffMins));
          } else {
              setTimeLeft(0);
          }
      };

      checkTime();
      const interval = setInterval(checkTime, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [user?.lastDailyMood]);

  if (!user) return null;

  const handleMoodSelect = async (score: number) => {
    if (isSubmitting) return;
    await dispatch(submitDailyMood({ 
        motivationScore: score, 
        stressScore: 0, 
        enjoymentScore: 0, 
        id: Date.now().toString(), 
        date: new Date().toISOString() 
    }));
    setTimeLeft(COOLDOWN_MINUTES);
  };

  if (timeLeft > 0) {
      return (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-slate-500 bg-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-700/50 rounded-full text-slate-400">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-300 text-sm uppercase tracking-wide">Дух восстанавливается</h4>
                    <p className="text-xs text-slate-500">Следующая проверка через {timeLeft} мин.</p>
                </div>
            </div>
            <div className="text-right hidden md:block">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check size={12} /> XP получен
                </span>
            </div>
        </div>
      );
  }

  return (
    <LoadingOverlay isLoading={isSubmitting} message="Запись..." className="rounded-3xl">
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-3xl border border-slate-700/50"
    >
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-base text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="text-purple-400 w-4 h-4" /> Как твой дух сегодня? <span className="text-emerald-400 text-xs normal-case ml-2">+30 XP</span>
          </h3>
      </div>

      <div className="grid grid-cols-5 gap-2 md:gap-4">
        {MOODS.map((m) => (
            <button
                key={m.score}
                onClick={() => handleMoodSelect(m.score)}
                disabled={isSubmitting}
                className={`
                    relative group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200
                    ${m.bg} ${m.border} hover:scale-105 hover:brightness-110 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                <m.icon className={`h-8 w-8 mb-2 ${m.color}`} />
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${m.color}`}>{m.label}</span>
            </button>
        ))}
      </div>
    </motion.div>
    </LoadingOverlay>
  );
};

// Simple Sparkles icon locally if not imported
const Sparkles = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 9h4"/><path d="M3 5h4"/></svg>
);

export default Survey;
