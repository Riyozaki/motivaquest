
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Check, X, Gift, Lock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginCalendar: React.FC = () => {
    const user = useSelector((state: RootState) => state.user.currentUser);
    
    if (!user) return null;

    const streak = user.streakDays || 0;
    const TOTAL_DAYS = 28;
    
    // Determine which day in the cycle we are on (1-28)
    // If streak is 0, we are on day 1 (pending).
    // If streak is 5, we have finished 5 days. Next is 6.
    // NOTE: This logic assumes streaks reset to 0 on failure.
    // We visualize "Streak Progress".
    
    return (
        <div className="glass-panel p-4 md:p-6 rounded-3xl border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400 border border-blue-500/30">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Календарь Наград</h3>
                    <p className="text-xs text-slate-400">Заходи каждый день, чтобы увеличить стрик!</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-2xl font-black text-amber-400">{streak}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Дней подряд</div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3">
                {Array.from({ length: TOTAL_DAYS }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isBigReward = dayNum % 7 === 0;
                    
                    // Logic:
                    // If dayNum <= streak: Completed (Green Check)
                    // If dayNum == streak + 1: Current/Next (Pending)
                    // If dayNum > streak + 1: Locked (Gray)
                    
                    const isCompleted = dayNum <= streak;
                    const isCurrent = dayNum === streak + 1;
                    const isLocked = dayNum > streak + 1;

                    return (
                        <div 
                            key={idx} 
                            className={`
                                relative aspect-square rounded-xl flex items-center justify-center border-2 transition-all
                                ${isCompleted 
                                    ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                    : isCurrent 
                                        ? 'bg-slate-800 border-blue-500 text-blue-200 animate-pulse border-dashed'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-600'
                                }
                            `}
                        >
                            <span className={`absolute top-1 left-1.5 text-[10px] font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>{dayNum}</span>
                            
                            {isCompleted && <Check size={20} strokeWidth={3} />}
                            
                            {isCurrent && !isBigReward && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                            
                            {isLocked && !isBigReward && <Lock size={14} />}

                            {isBigReward && (
                                <div className={`relative ${isCompleted ? 'text-amber-400' : isCurrent ? 'text-amber-200' : 'text-slate-700'}`}>
                                    <Gift size={isCurrent ? 24 : 20} className={isCurrent ? 'animate-bounce' : ''} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LoginCalendar;
