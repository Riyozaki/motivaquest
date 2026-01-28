import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { purchaseItem } from '../store/userSlice';
import { Coins, ShoppingBag, Lock, Check, Zap, Target, Sparkles, Shield, Coffee, Gamepad2, Pizza } from 'lucide-react';
import { motion } from 'framer-motion';

const Rewards: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);

  if (!user) return null;

  const handleBuy = (itemId: string, cost: number) => {
    if (user.coins >= cost) {
      dispatch(purchaseItem({ itemId, cost }));
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="h-8 w-8 text-emerald-400" />;
      case 'Sparkles': return <Sparkles className="h-8 w-8 text-purple-400" />;
      case 'Shield': return <Shield className="h-8 w-8 text-blue-400" />;
      case 'Coffee': return <Coffee className="h-8 w-8 text-amber-600" />;
      case 'Gamepad2': return <Gamepad2 className="h-8 w-8 text-indigo-400" />;
      case 'Pizza': return <Pizza className="h-8 w-8 text-orange-500" />;
      default: return <ShoppingBag className="h-8 w-8 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative glass-panel rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 border-t border-white/5
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
                    onClick={() => handleBuy(item.id, item.cost)}
                    disabled={!canAfford}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                      canAfford 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {canAfford ? (
                      <ShoppingBag className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{item.cost} монет</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Rewards;