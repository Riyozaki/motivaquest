
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { CALENDAR_CONFIG } from '../store/rewardsSlice';
import { Check, Lock, Gift, Calendar as CalendarIcon, Star, Coins, Crown, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const Calendar: React.FC = () => {
    const user = useSelector((state: RootState) => state.user.currentUser);
    
    if (!user) return null;

    const streak = user.streakDays || 0;
    
    // Helper to get item name/icon (simplified)
    const getItemLabel = (itemId: string) => {
        if (itemId.includes('coffee')) return { label: 'Кофе', icon: '☕' };
        if (itemId.includes('game')) return { label: 'Игры', icon: '🎮' };
        if (itemId.includes('pizza')) return { label: 'Пицца', icon: '🍕' };
        if (itemId.includes('skin')) return { label: 'Скин', icon: '🎭' };
        return { label: 'Сюрприз', icon: '🎁' };
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="text-center mb-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full shadow-lg mb-4 border-4 border-indigo-400">
                    <CalendarIcon size={48} className="text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold text-white rpg-font mb-2">Календарь Наград</h1>
                <p className="text-slate-400">
                    Твой путь дисциплины. Каждый день — шаг к величию.
                    <br/>
                    Текущий стрик: <span className="text-amber-400 font-bold text-xl">{streak} дней</span>
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {CALENDAR_CONFIG.map((dayConfig, idx) => {
                    const dayNum = dayConfig.day;
                    const isMilestone = dayConfig.isMilestone;
                    
                    // Logic:
                    // Completed: Day index < streak
                    // Current (Today/Next): Day index === streak
                    // Locked: Day index > streak
                    
                    // Note: streak is 0-based count of completed days. 
                    // If streak is 0, we are on Day 1.
                    // If streak is 5, we have completed 5 days, next is Day 6.
                    
                    const isCompleted = dayNum <= streak;
                    const isCurrent = dayNum === streak + 1;
                    const isLocked = dayNum > streak + 1;

                    return (
                        <motion.div
                            key={dayConfig.day}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`
                                relative p-4 rounded-2xl border-2 flex flex-col items-center justify-between min-h-[140px] transition-all overflow-hidden group
                                ${isCompleted 
                                    ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                    : isCurrent 
                                        ? 'bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105 z-10'
                                        : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-80'
                                }
                                ${isMilestone ? 'row-span-1 md:col-span-1' : ''}
                            `}
                        >
                            {/* Day Badge */}
                            <div className={`absolute top-2 left-2 text-xs font-black uppercase px-2 py-0.5 rounded ${isCompleted ? 'bg-emerald-500 text-slate-900' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                День {dayNum}
                            </div>

                            {/* Status Icon Top Right */}
                            <div className="absolute top-2 right-2">
                                {isCompleted && <Check size={16} className="text-emerald-400" />}
                                {isLocked && <Lock size={16} className="text-slate-600" />}
                                {isCurrent && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>}
                            </div>

                            {/* Main Icon */}
                            <div className="flex-1 flex items-center justify-center mt-6 mb-2">
                                {isMilestone ? (
                                    <div className={`relative ${isCompleted ? 'grayscale' : isCurrent ? 'animate-bounce' : ''}`}>
                                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full"></div>
                                        {dayNum === 28 ? (
                                            <Crown size={48} className="text-amber-400 drop-shadow-lg" />
                                        ) : (
                                            <Gift size={40} className="text-purple-400 drop-shadow-lg" />
                                        )}
                                    </div>
                                ) : (
                                    <div className={`${isCompleted ? 'text-emerald-500/50' : 'text-slate-500'}`}>
                                        <Package size={28} />
                                    </div>
                                )}
                            </div>

                            {/* Rewards List */}
                            <div className="w-full space-y-1">
                                {dayConfig.xp > 0 && (
                                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-purple-300 bg-purple-900/30 rounded py-0.5">
                                        <Star size={10} /> +{dayConfig.xp}
                                    </div>
                                )}
                                {dayConfig.coins > 0 && (
                                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-300 bg-amber-900/30 rounded py-0.5">
                                        <Coins size={10} /> +{dayConfig.coins}
                                    </div>
                                )}
                                {dayConfig.item && (
                                    <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-white bg-indigo-600 rounded py-1 mt-1 shadow-lg">
                                        {getItemLabel(dayConfig.item).icon} {getItemLabel(dayConfig.item).label}
                                    </div>
                                )}
                            </div>

                            {/* Milestone Effect */}
                            {isMilestone && isCurrent && (
                                <div className="absolute inset-0 border-4 border-amber-400/50 rounded-2xl animate-pulse pointer-events-none"></div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
            
            {/* Completion Banner */}
            {streak >= 28 && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-3xl text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] border-t border-white/30"
                >
                    <h2 className="text-3xl font-black text-white uppercase mb-2">Цикл Завершен!</h2>
                    <p className="text-amber-100 mb-6">Ты доказал свою силу. Начни новый цикл для новых наград!</p>
                    <div className="inline-flex items-center gap-2 bg-black/30 px-6 py-3 rounded-xl text-amber-400 font-bold border border-amber-400/30">
                        <Crown size={24} /> Достижение "Повелитель Времени" получено
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Calendar;
