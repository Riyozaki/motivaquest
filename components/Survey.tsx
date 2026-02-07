
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { submitDailyMood } from '../store/userSlice';
import { Smile, Frown, Meh, Zap, Heart, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
    { score: 1, icon: Frown, color: 'text-red-400', label: 'Ужасно' },
    { score: 2, icon: Meh, color: 'text-orange-400', label: 'Так себе' },
    { score: 3, icon: Smile, color: 'text-yellow-400', label: 'Норм' },
    { score: 4, icon: Zap, color: 'text-blue-400', label: 'Бодро' },
    { score: 5, icon: Heart, color: 'text-pink-500', label: 'Супер' },
];

const Survey: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  // Check if mood tracked TODAY
  const lastMoodDate = user.lastDailyMood ? new Date(user.lastDailyMood).toDateString() : null;
  const today = new Date().toDateString();
  const hasTaken = lastMoodDate === today;

  const handleMoodSelect = async (score: number) => {
    setLoading(true);
    await dispatch(submitDailyMood({ 
        motivationScore: score, 
        stressScore: 0, 
        enjoymentScore: 0, 
        id: Date.now().toString(), 
        date: new Date().toISOString() 
    }));
    setLoading(false);
    setIsOpen(false);
  };

  if (hasTaken) {
    return (
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500 bg-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-900/30 rounded-full text-emerald-400 border border-emerald-500/30">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 rpg-font text-xs uppercase tracking-wide">Настроение</h4>
            <p className="text-[10px] text-slate-400">Записано в хроники</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div 
        className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500 group hover:bg-slate-800/80 transition-colors cursor-pointer" 
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-900/30 rounded-full text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
            <Smile className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 rpg-font text-xs uppercase tracking-wide">Как твой дух?</h4>
            <p className="text-[10px] text-slate-400">Получи +30 XP</p>
          </div>
        </div>
        <button 
          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-[10px] font-bold uppercase tracking-wider shadow-lg"
        >
          Выбрать
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 rounded-2xl border border-purple-500/30 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm text-white uppercase tracking-wide">Твое настроение</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
      </div>

      <div className="flex justify-between gap-2">
        {MOODS.map((m) => (
            <button
                key={m.score}
                onClick={() => handleMoodSelect(m.score)}
                disabled={loading}
                className="flex flex-col items-center gap-1 group w-full"
            >
                <div className={`p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-white transition-all hover:scale-110 ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                    <m.icon className={`h-6 w-6 ${m.color}`} />
                </div>
                <span className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-white transition-colors">{m.label}</span>
            </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Survey;
