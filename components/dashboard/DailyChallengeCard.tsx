import React from 'react';
import { Swords, Check, Zap, PlusCircle } from 'lucide-react';
import { Quest } from '../../types';

interface DailyChallengeCardProps {
    q: Quest;
    isDone: boolean;
    isExhausted: boolean;
    isPendingQuest: boolean;
    onSelect: (q: Quest, isBoosted: boolean) => void;
}

const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ q, isDone, isExhausted, isPendingQuest, onSelect }) => {
    return (
        <div 
            onClick={() => !isDone && !isExhausted && !isPendingQuest && onSelect(q, true)} 
            className={`group relative flex items-center p-4 mb-3 bg-gradient-to-r from-purple-900/40 to-slate-900/60 hover:from-purple-900/60 border-l-4 ${isDone ? 'border-emerald-500 opacity-60' : 'border-amber-400'} rounded-r-xl transition-all
            ${!isDone && !isExhausted ? 'cursor-pointer hover:translate-x-1' : 'cursor-not-allowed opacity-50'}
            `}
        >
            {!isDone && (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> x1.5 BOOST
                </div>
            )}
            
            <div className={`p-3 rounded-full mr-4 ${isDone ? 'bg-emerald-900/30 text-emerald-400' : 'bg-purple-500/20 text-purple-300'}`}>
                {isDone ? <Check size={20} /> : <Swords size={20} />}
            </div>
            <div className="flex-1">
                <h4 className={`text-sm font-bold ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>{q.title}</h4>
                <div className="flex items-center text-xs text-slate-400 mt-1">
                    <span className="text-amber-400 font-bold mr-3 flex items-center gap-1">
                        <PlusCircle size={10} /> {Math.floor(q.coins * 1.5)} 💰
                    </span>
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                        <PlusCircle size={10} /> {Math.floor(q.xp * 1.5)} XP
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DailyChallengeCard;