import React from 'react';
import { Check, CheckCircle, Flame, Plus, Loader2, Clock } from 'lucide-react';
import { Quest } from '../../types';
import LoadingOverlay from '../LoadingOverlay';

interface HabitCardProps {
    q: Quest;
    streak: number;
    isDone: boolean;
    isPendingQuest: boolean;
    isExhausted: boolean;
    onComplete: (q: Quest) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ q, streak, isDone, isPendingQuest, isExhausted, onComplete }) => {
    const progress = Math.min(100, (streak / 7) * 100);

    return (
        <LoadingOverlay isLoading={isPendingQuest && !isDone} message="" className="rounded-xl">
        <div className={`flex flex-col p-3 mb-2 bg-slate-800/40 rounded-xl border border-slate-700/50 transition-all ${isDone ? 'opacity-80 border-emerald-500/30' : 'hover:border-slate-500 hover:bg-slate-800/60'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDone ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                        {isDone ? <CheckCircle size={18} /> : <Flame size={18} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${isDone ? 'text-slate-400' : 'text-slate-200'}`}>{q.title}</h4>
                        {isDone && <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><Clock size={10}/> Доступно завтра</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {isDone ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/20">
                            <Check size={14} /> Выполнено
                        </div>
                    ) : (
                        <button 
                            disabled={isExhausted || isPendingQuest}
                            onClick={() => onComplete(q)} 
                            className={`p-2 rounded-lg transition-all bg-slate-700 text-slate-300 hover:text-white hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-lg ${isExhausted || isPendingQuest ? 'cursor-not-allowed opacity-50' : ''}`}
                            title="Отметить выполненным"
                        >
                            {isPendingQuest ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Streak Bar */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Flame size={10} className="text-orange-500" /> {streak} дн. подряд
                </span>
                <span className="text-[10px] text-slate-600 font-mono">Цель: 7</span>
            </div>
        </div>
        </LoadingOverlay>
    );
};

export default HabitCard;