import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lock, Check, CheckCircle, Skull, Swords, Clock, AlertTriangle } from 'lucide-react';
import { Quest } from '../../types';
import LocationEffects from '../LocationEffects';

interface CampaignViewProps { 
    currentDayNum: number;
    currentStory: any;
    storyQuests: Quest[];
    completedCount: number;
    totalCount: number;
    onQuestSelect: (q: Quest) => void;
    onBossOpen: () => void;
    onAdvanceDay: () => void;
    isDayComplete: boolean;
    user: any;
}

const LOCATIONS = [
    { id: 'village', name: 'Деревня', color: 'bg-emerald-500', icon: '🏠' },
    { id: 'forest', name: 'Лес', color: 'bg-green-700', icon: '🌲' },
    { id: 'mountains', name: 'Горы', color: 'bg-slate-500', icon: '🏔️' },
    { id: 'castle', name: 'Замок', color: 'bg-indigo-600', icon: '🏰' },
    { id: 'desert', name: 'Пустыня', color: 'bg-amber-500', icon: '☀️' },
    { id: 'throne', name: 'Трон', color: 'bg-purple-700', icon: '👑' },
];

const containerVar = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVar = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 50 } }
};

// ==========================================
// FIX: Robust gaming day calculation
// Uses UTC + 3 offset (Moscow) instead of unreliable toLocaleString.
// Gaming day starts at 06:00 MSK.
// Returns YYYY-MM-DD string for reliable comparison.
// ==========================================
const MSK_OFFSET_HOURS = 3;
const GAMING_DAY_START_HOUR = 6; // 06:00 MSK

const getGamingDayId = (dateObj: Date): string => {
    // Convert UTC to Moscow time using fixed offset (+3)
    const utcMs = dateObj.getTime();
    const mskMs = utcMs + (MSK_OFFSET_HOURS * 60 * 60 * 1000);
    const mskDate = new Date(mskMs);
    
    // Get MSK hours (from the shifted UTC date)
    const mskHours = mskDate.getUTCHours();
    
    // If before gaming day start (06:00), count as previous day
    if (mskHours < GAMING_DAY_START_HOUR) {
        mskDate.setUTCDate(mskDate.getUTCDate() - 1);
    }
    
    // Return stable YYYY-MM-DD format
    const y = mskDate.getUTCFullYear();
    const m = String(mskDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(mskDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Calculate time remaining until next gaming day (06:00 MSK)
const getTimeUntilNextGamingDay = (): { hours: number; minutes: number } => {
    const now = new Date();
    const utcMs = now.getTime();
    const mskMs = utcMs + (MSK_OFFSET_HOURS * 60 * 60 * 1000);
    const mskDate = new Date(mskMs);
    
    const mskHours = mskDate.getUTCHours();
    const mskMinutes = mskDate.getUTCMinutes();
    
    let hoursLeft: number;
    let minutesLeft: number;
    
    if (mskHours >= GAMING_DAY_START_HOUR) {
        // After 06:00 today — next gaming day is tomorrow 06:00
        hoursLeft = 24 - mskHours + GAMING_DAY_START_HOUR - 1;
        minutesLeft = 60 - mskMinutes;
        if (minutesLeft === 60) { minutesLeft = 0; hoursLeft++; }
    } else {
        // Before 06:00 today — gaming day starts at 06:00 today
        hoursLeft = GAMING_DAY_START_HOUR - mskHours - 1;
        minutesLeft = 60 - mskMinutes;
        if (minutesLeft === 60) { minutesLeft = 0; hoursLeft++; }
    }
    
    return { hours: hoursLeft, minutes: minutesLeft };
};

const CampaignView: React.FC<CampaignViewProps> = ({ 
    currentDayNum, currentStory, storyQuests, completedCount, totalCount, 
    onQuestSelect, onBossOpen, onAdvanceDay, isDayComplete, user
}) => {
    
    const now = new Date();
    const currentGamingDay = getGamingDayId(now);
    
    let lastAdvanceGamingDay: string | null = null;
    if (user.lastCampaignAdvanceDate) {
        lastAdvanceGamingDay = getGamingDayId(new Date(user.lastCampaignAdvanceDate));
    }

    // Can advance if: Day is complete AND (Never advanced OR advanced on a previous gaming day)
    const isLockedByTime = lastAdvanceGamingDay === currentGamingDay;
    const canAdvance = isDayComplete && !isLockedByTime;
    
    // Show countdown when locked
    const timeUntilNext = isLockedByTime ? getTimeUntilNextGamingDay() : null;

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
                {/* World Map Header */}
                <motion.div variants={itemVar} className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="p-6 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white rpg-font">Карта Мира</h2>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">День</div>
                                <div className="text-3xl font-black text-primary-400">{currentDayNum}<span className="text-lg text-slate-500">/14</span></div>
                            </div>
                        </div>

                        {/* Location Strip */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {LOCATIONS.map((loc, idx) => {
                                const dayRange = [1, 3, 5, 8, 11, 13]; // approximate day ranges for locations
                                const isActive = currentStory.locationId === loc.id;
                                const isPast = dayRange[idx] < currentDayNum && !isActive;
                                return (
                                    <div key={loc.id} className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all
                                        ${isActive ? `${loc.color} text-white border-white/30 shadow-lg scale-105` : isPast ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-900 text-slate-600 border-slate-800'}
                                    `}>
                                        <span>{loc.icon}</span>
                                        <span className="hidden md:inline">{loc.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Story Card */}
                <motion.div variants={itemVar} className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-6 shadow-2xl">
                    <div className="flex items-start gap-4 mb-6">
                        {getCharacterImage(currentStory.character)}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{currentStory.title}</h3>
                            <p className="text-slate-400 text-sm">{currentStory.description}</p>
                        </div>
                    </div>
                    
                    {/* Dialogue */}
                    <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700/50">
                        <p className="text-slate-300 italic">"{currentStory.dialogue}"</p>
                    </div>

                    {/* Quest Progress */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Прогресс дня</span>
                            <span className="text-white font-bold">{completedCount}/{totalCount}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Quest List */}
                    <div className="space-y-3">
                        {storyQuests.map(quest => (
                            <motion.div
                                key={quest.id}
                                whileHover={!quest.completed ? { scale: 1.01 } : {}}
                                onClick={() => !quest.completed && onQuestSelect(quest)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    quest.completed 
                                        ? 'bg-emerald-900/20 border-emerald-500/30 opacity-60' 
                                        : 'bg-slate-800/50 border-slate-700 hover:border-primary-500/50 hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {quest.completed ? (
                                            <Check size={20} className="text-emerald-400" />
                                        ) : (
                                            <Swords size={20} className="text-slate-400" />
                                        )}
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{quest.title}</h4>
                                            <p className="text-slate-500 text-xs">{quest.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-xs font-bold">
                                        <span className="text-amber-400">{quest.coins}💰</span>
                                        <span className="text-purple-400">{quest.xp}⭐</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Advance / Boss Section */}
                {isDayComplete && (
                    <motion.div variants={itemVar} className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-6 text-center shadow-2xl">
                        {currentDayNum === 14 ? (
                            <>
                            <h3 className="text-xl font-bold text-white mb-2 text-red-500">ФИНАЛЬНАЯ БИТВА!</h3>
                            <p className="text-red-200 text-sm mb-4">Тень Лени ослабла. Нанеси решающий удар!</p>
                            <button 
                                onClick={onBossOpen}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center mx-auto gap-2 animate-pulse"
                            >
                                <Skull size={20} /> БРОСИТЬ ВЫЗОВ БОССУ
                            </button>
                            </>
                        ) : (
                            <>
                            <h3 className="text-xl font-bold text-white mb-2">День Пройден!</h3>
                            {canAdvance ? (
                                <>
                                <p className="text-emerald-200 text-sm mb-4">Путь свободен. Отправляйся дальше.</p>
                                <button 
                                    onClick={onAdvanceDay}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center mx-auto gap-2"
                                >
                                    <CheckCircle size={20} /> Начать Следующий День
                                </button>
                                </>
                            ) : (
                                <div className="bg-black/30 p-4 rounded-xl border border-amber-500/20 inline-block">
                                    <div className="flex items-center justify-center gap-2 mb-2 text-amber-400 font-bold">
                                        <Lock size={18} /> Привал до рассвета
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Герои отдыхают. Следующий поход доступен завтра после 06:00 МСК.
                                    </p>
                                    {timeUntilNext && (
                                        <p className="text-amber-400/80 text-xs mt-2 font-mono">
                                            ⏳ ~{timeUntilNext.hours}ч {timeUntilNext.minutes}мин
                                        </p>
                                    )}
                                </div>
                            )}
                            </>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default CampaignView;
