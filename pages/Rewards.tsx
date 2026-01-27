import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { purchaseItem } from '../store/userSlice';
import { Coins, ShoppingBag, Lock, Check, Zap, Target, Sparkles, Shield, Coffee, Gamepad2, Pizza } from 'lucide-react';

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
      case 'Target': return <Target className="h-10 w-10 text-gray-700" />;
      case 'Sparkles': return <Sparkles className="h-10 w-10 text-purple-600" />;
      case 'Shield': return <Shield className="h-10 w-10 text-blue-600" />;
      case 'Coffee': return <Coffee className="h-10 w-10 text-amber-700" />;
      case 'Gamepad2': return <Gamepad2 className="h-10 w-10 text-indigo-600" />;
      case 'Pizza': return <Pizza className="h-10 w-10 text-orange-500" />;
      default: return <ShoppingBag className="h-10 w-10 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Wallet Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold">Магазин Наград</h2>
          <p className="text-indigo-200 mt-1">Инвестируй в свои достижения</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white/10 px-6 py-3 rounded-xl flex items-center backdrop-blur-sm border border-white/20">
          <Coins className="h-6 w-6 text-yellow-400 mr-3" />
          <div>
            <div className="text-xs text-indigo-200">Твой баланс</div>
            <div className="text-2xl font-bold text-white">{user.coins} <span className="text-sm font-normal">монет</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => {
          const isOwned = item.type === 'skin' && user.inventory?.includes(item.id);
          const canAfford = user.coins >= item.cost;
          
          return (
            <div 
              key={item.id} 
              className={`relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all ${
                isOwned ? 'opacity-80' : canAfford ? 'hover:shadow-md hover:-translate-y-1' : 'opacity-70'
              }`}
            >
              {item.type === 'skin' && (
                <div className="absolute top-3 right-3 bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Скин
                </div>
              )}
              
              <div className="my-4 bg-gray-50 p-4 rounded-full">
                {getIcon(item.icon)}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-4 h-10">{item.description}</p>
              
              <div className="mt-auto pt-4 w-full">
                {isOwned ? (
                   <button 
                   disabled
                   className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 bg-green-100 text-green-700 cursor-default"
                 >
                   <Check className="h-4 w-4" />
                   <span>Куплено</span>
                 </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(item.id, item.cost)}
                    disabled={!canAfford}
                    className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                      canAfford 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rewards;