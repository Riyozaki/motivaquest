import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lock, Check, CheckCircle, Skull, Swords } from 'lucide-react';
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

const CampaignView: React.FC<CampaignViewProps> = ({ 
    currentDayNum, currentStory, storyQuests, completedCount, totalCount, 
    onQuestSelect, onBossOpen, onAdvanceDay, isDayComplete 
}) => {
    
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
                            <h2 className="text-2xl font-bold text-white rpg-font flex items-center gap-2">
                                <MapPin className="text-amber-400" /> Карта Королевства
                            </h2>
                            <div className="px-4 py-1 bg-slate-800 rounded-full border border-slate-600 text-xs font-bold text-slate-300">
                                День {currentDayNum} / 14
                            </div>
                        </div>
                        <div className="flex justify-between items-center relative px-2 md:px-10 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
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

                        <motion.div variants={itemVar}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Swords className="text-red-400" /> Сюжетные Задания
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
                                        onClick={() => !quest.completed && onQuestSelect(quest)}
                                        className={`
                                            relative p-4 rounded-xl cursor-pointer transition-all border-l-4 bg-slate-800/80 backdrop-blur-sm border-purple-500
                                            ${quest.completed ? 'opacity-50 grayscale' : 'hover:translate-x-2 hover:bg-slate-800'}
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-200">{quest.title}</h4>
                                                <p className="text-xs text-slate-400 mt-1">{quest.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text--[10px] uppercase font-bold bg-black/30 px-2 py-0.5 rounded text-white/70">{quest.rarity}</span>
                                                {quest.completed && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-xl">Задания загружаются магией...</div>
                                )}
                            </div>

                            {isDayComplete && (
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
                                            onClick={onBossOpen}
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
                                            onClick={onAdvanceDay}
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
                    
                    <div className="space-y-6">
                        <motion.div variants={itemVar} className="glass-panel p-6 rounded-2xl bg-slate-900/80 shadow-lg">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Союзники</h4>
                            <div className="flex gap-2">
                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-blue-500/20 border-blue-500 text-lg`} title="Мудрый Волшебник">🧙‍♂️</div>
                                {currentDayNum >= 3 && <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-pink-500/20 border-pink-500 text-lg`} title="Дух Мотивации">🧚‍♀️</div>}
                                {currentDayNum >= 7 && <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-red-500/20 border-red-500 text-lg`} title="Воин Дисциплины">🛡️</div>}
                                {currentDayNum < 3 && <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">?</div>}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CampaignView;