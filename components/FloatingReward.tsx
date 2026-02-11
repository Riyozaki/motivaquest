
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { popRewardAnimation } from '../store/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star } from 'lucide-react';

const FloatingReward: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const pendingRewards = useSelector((state: RootState) => state.user.pendingRewardAnimations);
    const reward = pendingRewards[0]; // Process one at a time

    useEffect(() => {
        if (reward) {
            const timer = setTimeout(() => {
                dispatch(popRewardAnimation());
            }, 3000); // 3 seconds duration
            return () => clearTimeout(timer);
        }
    }, [reward, dispatch]);

    return (
        <div className="fixed bottom-20 right-4 z-50 pointer-events-none flex flex-col items-end space-y-2">
            <AnimatePresence>
                {reward && (
                    <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="bg-slate-900/90 border border-amber-500/50 p-4 rounded-2xl shadow-xl flex flex-col items-end backdrop-blur-md"
                    >
                        {reward.coins > 0 && (
                            <div className="flex items-center gap-2 text-2xl font-black text-amber-400 drop-shadow-md">
                                +{reward.coins} <Coins className="fill-current" />
                            </div>
                        )}
                        {reward.xp > 0 && (
                            <div className="flex items-center gap-2 text-2xl font-black text-purple-400 drop-shadow-md">
                                +{reward.xp} <Star className="fill-current" />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FloatingReward;
