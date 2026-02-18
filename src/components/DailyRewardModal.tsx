import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { closeDailyRewardModal } from '../store/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star, Flame, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const DailyRewardModal: React.FC = () => {
    const dispatch = useDispatch();
    const reward = useSelector((state: RootState) => state.user.dailyRewardPopup);

    useEffect(() => {
        if (reward) {
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                zIndex: 2500 // Higher than modal
            };

            function fire(particleRatio: number, opts: any) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }
    }, [reward]);

    if (!reward) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             
             {/* Modal Content */}
             <motion.div 
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative bg-[#1a1625] border-2 border-amber-500/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden"
             >
                {/* Glow Effects */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/20 blur-[50px] rounded-full"></div>

                <div className="relative z-10">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl border-4 border-amber-300"
                    >
                        <Flame size={48} className="text-white drop-shadow-md animate-pulse" />
                    </motion.div>

                    <h2 className="text-3xl font-black text-white rpg-font mb-2 uppercase tracking-wide">
                        Ежедневный <span className="text-amber-400">Дар</span>
                    </h2>
                    
                    <p className="text-slate-400 mb-6 text-sm">
                        Твое постоянство вознаграждается, герой!
                    </p>

                    <div className="flex justify-center gap-4 mb-8">
                        <div className="bg-slate-800/80 border border-amber-500/30 p-4 rounded-xl min-w-[100px] flex flex-col items-center">
                            <Coins size={24} className="text-amber-400 mb-2" />
                            <span className="text-2xl font-bold text-white">+{reward.coins}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Золота</span>
                        </div>
                        <div className="bg-slate-800/80 border border-purple-500/30 p-4 rounded-xl min-w-[100px] flex flex-col items-center">
                            <Star size={24} className="text-purple-400 mb-2" />
                            <span className="text-2xl font-bold text-white">+{reward.xp}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Опыта</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 p-3 rounded-lg border border-orange-500/20 mb-6 flex items-center justify-center gap-2">
                        <Flame size={16} className="text-orange-500" />
                        <span className="text-orange-300 font-bold text-sm">
                            Стрик: {reward.streak} дн. <span className="text-slate-500 mx-1">|</span> Бонус: x{reward.bonusMultiplier.toFixed(1)}
                        </span>
                    </div>

                    <button 
                        onClick={() => dispatch(closeDailyRewardModal())}
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Принять Награду
                    </button>
                </div>
             </motion.div>
        </div>
    );
};

export default DailyRewardModal;