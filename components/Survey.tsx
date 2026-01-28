import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { submitSurvey } from '../store/userSlice';
import { ClipboardList, Check, Scroll, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Survey: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  
  const [isOpen, setIsOpen] = useState(false);
  const [scores, setScores] = useState({
    motivation: 3,
    stress: 3,
    enjoyment: 3
  });

  if (!user) return null;

  // Check if survey taken TODAY
  const hasTakenSurveyToday = user.surveyHistory?.some(
    s => new Date(s.date).toDateString() === new Date().toDateString()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(submitSurvey({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      motivationScore: scores.motivation,
      stressScore: scores.stress,
      enjoymentScore: scores.enjoyment
    }));
    setIsOpen(false);
  };

  if (hasTakenSurveyToday) {
    return (
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-emerald-900/30 rounded-full text-emerald-400 border border-emerald-500/30">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 rpg-font text-sm">Дневник Заполнен</h4>
            <p className="text-xs text-slate-400">Твои мысли записаны в хроники.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500 group hover:bg-slate-800/80 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-purple-900/30 rounded-full text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
            <Scroll className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 rpg-font text-sm">Ежедневный Отчет</h4>
            <p className="text-xs text-slate-400">Оцени свое состояние, герой.</p>
          </div>
        </div>
        <button 
          className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-900/50"
        >
          Написать
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-panel p-6 rounded-2xl border border-purple-500/30 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-white rpg-font flex items-center gap-2">
            <Scroll className="text-purple-400 h-5 w-5" />
            Хроники Героя
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
             <span>Уровень Мотивации</span>
             <span className="text-purple-400">{scores.motivation}/5</span>
          </div>
          <input 
            type="range" min="1" max="5" 
            value={scores.motivation} 
            onChange={(e) => setScores({...scores, motivation: parseInt(e.target.value)})}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Апатия</span>
            <span>Готов к бою</span>
          </div>
        </div>

        <div>
           <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
             <span>Уровень Стресса</span>
             <span className="text-red-400">{scores.stress}/5</span>
          </div>
          <input 
            type="range" min="1" max="5" 
            value={scores.stress} 
            onChange={(e) => setScores({...scores, stress: parseInt(e.target.value)})}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500" 
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
             <span>Спокоен</span>
             <span>Перегруз</span>
          </div>
        </div>

        <div>
           <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
             <span>Удовольствие от квестов</span>
             <span className="text-amber-400">{scores.enjoyment}/5</span>
          </div>
          <input 
            type="range" min="1" max="5" 
            value={scores.enjoyment} 
            onChange={(e) => setScores({...scores, enjoyment: parseInt(e.target.value)})}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" 
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
             <span>Скука</span>
             <span>Восторг</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            Отмена
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all font-bold text-xs uppercase tracking-wider"
          >
            Записать
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Survey;