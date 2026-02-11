
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { purchaseItemAction, selectIsPending } from '../store/userSlice';
import { Coins, ShoppingBag, Lock, Check, Zap, Target, Sparkles, Shield, Coffee, Gamepad2, Pizza, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import LoadingOverlay from '../components/LoadingOverlay';

const Rewards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);
  const isPurchasing = useSelector(selectIsPending('purchase'));
  const [purchasedItem, setPurchasedItem] = useState<{name: string, icon: string} | null>(null);

  if (!user) return null;

  const handleBuy = (item: any) => {
    if (isPurchasing) return;
    if (user.coins >= item.cost) {
      dispatch(purchaseItemAction(item)).unwrap().then(() => {
          setPurchasedItem({ name: item.name, icon: item.icon });
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      });
    }
  };

  const getIcon = (iconName: string, className = "h-8 w-8") => {
    switch (iconName) {
      case 'Target': return <Target className={`${className} text-emerald-400`} />;
      case 'Sparkles': return <Sparkles className={`${className} text-purple-400`} />;
      case 'Shield': return <Shield className={`${className} text-blue-400`} />;
      case 'Coffee': return <Coffee className={`${className} text-amber-600`} />;
      case 'Gamepad2': return <Gamepad2 className={`${className} text-indigo-400`} />;
      case 'Pizza': return <Pizza className={`${className} text-orange-500`} />;
      default: return <ShoppingBag className={`${className} text-slate-400`} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <LoadingOverlay isLoading={isPurchasing} message="Оплата..." className="fixed top-4 right-4 z-50 pointer-events-none">
          <></>
      </LoadingOverlay>

      {/* Purchase Modal */}
      <AnimatePresence>
          {purchasedItem && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                  <motion.div 
                    initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(245,158,11,0.3)]"
                  >
                      <button onClick={() => setPurchasedItem(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                      <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 border-4 border-slate-700">
                          {getIcon(purchasedItem.icon, "h-12 w-12")}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Успешная покупка!</h3>
                      <p className="text-slate-400 mb-6">Вы приобрели <span className="text-amber-400 font-bold">{purchasedItem.name}</span></p>
                      <button onClick={() => setPurchasedItem(null)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl w-full">Отлично</button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Wallet Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-indigo-900/80 to-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
      >
        <div>
          <h2 className="text-3xl font-bold text-white rpg-font tracking-wide">Лавка <span className="text-amber-400">Чудес</span></h2>
          <p className="text-indigo-200 mt-1 font-light">Обменяй золото на легендарные артефакты.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-slate-950/50 px-6 py-4 rounded-2xl flex items-center border border-amber-500/30 shadow-inner">
          <div className="bg-amber-500/20 p-2 rounded-lg mr-4">
            <Coins className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Баланс</div>
            <div className="text-2xl font-black text-amber-400 drop-shadow-sm">{user.coins}</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item, idx) => {
          const isOwned = item.type === 'skin' && user.inventory?.includes(item.id);
          const canAfford = user.coins >= item.cost;
          
          return (
            <LoadingOverlay key={item.id} isLoading={isPurchasing && canAfford && !isOwned} className="rounded-2xl h-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative glass-panel rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 border-t border-white/5 h-full
                ${isOwned ? 'opacity-60 grayscale-[0.5]' : canAfford ? 'hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:-translate-y-2' : 'opacity-75'}
              `}
            >
              {item.type === 'skin' && (
                <div className="absolute top-3 right-3 bg-purple-900/40 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  Облик
                </div>
              )}
              
              <div className="my-4 bg-slate-900/50 p-5 rounded-full border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                {getIcon(item.icon)}
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mb-1 font-serif tracking-wide">{item.name}</h3>
              <p className="text-xs text-slate-400 mb-6 min-h-[40px] leading-relaxed">{item.description}</p>
              
              <div className="mt-auto w-full">
                {isOwned ? (
                   <button 
                   disabled
                   className="w-full py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                 >
                   <Check className="h-4 w-4" />
                   <span>Получено</span>
                 </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || isPurchasing}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                      canAfford 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg disabled:opacity-50' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isPurchasing && canAfford ? <Loader2 className="animate-spin h-4 w-4" /> : canAfford ? (
                      <ShoppingBag className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{item.cost} монет</span>
                  </button>
                )}
              </div>
            </motion.div>
            </LoadingOverlay>
          );
        })}
      </div>
    </div>
  );
};

export default Rewards;
