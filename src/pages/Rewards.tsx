import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { purchaseItemAction, selectIsPending } from '../store/userSlice';
import { checkAchievements } from '../store/achievementsSlice';
import { 
  Coins, ShoppingBag, Lock, Check, Zap, Target, Sparkles, Shield, Coffee, 
  Gamepad2, Pizza, X, Loader2, Flame, Compass, Cpu, Film, Moon, Heart,
  Battery, ShieldCheck, Wand2, IceCream, ShieldOff, Package, Crown, Star, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import LoadingOverlay from '../components/LoadingOverlay';

type ShopCategory = 'all' | 'skin' | 'real' | 'boost';

const CATEGORIES: { key: ShopCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'Всё', icon: <Package size={14} />, color: 'text-slate-300' },
  { key: 'skin', label: 'Облики', icon: <Sparkles size={14} />, color: 'text-purple-400' },
  { key: 'real', label: 'Реальные', icon: <Gift size={14} />, color: 'text-amber-400' },
  { key: 'boost', label: 'Бустеры', icon: <Zap size={14} />, color: 'text-emerald-400' },
];

const RARITY_STYLES: Record<string, { border: string; badge: string; glow: string; text: string }> = {
  Common:    { border: 'border-slate-600/40',   badge: 'bg-slate-700 text-slate-300',    glow: '',                                              text: 'Обычный' },
  Rare:      { border: 'border-blue-500/30',     badge: 'bg-blue-900/60 text-blue-300',   glow: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]', text: 'Редкий' },
  Epic:      { border: 'border-purple-500/30',   badge: 'bg-purple-900/60 text-purple-300', glow: 'hover:shadow-[0_0_20px_rgba(147,51,234,0.2)]',  text: 'Эпический' },
  Legendary: { border: 'border-amber-500/30',    badge: 'bg-amber-900/60 text-amber-300',  glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]', text: 'Легендарный' },
};

const Rewards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);
  const isPurchasing = useSelector(selectIsPending('purchase'));
  const [purchasedItem, setPurchasedItem] = useState<{name: string, icon: string, rarity?: string} | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  if (!user) return null;

  const filteredItems = useMemo(() => {
    let items = activeCategory === 'all' 
      ? shopItems 
      : shopItems.filter(item => {
          if (activeCategory === 'skin') return item.type === 'skin';
          if (activeCategory === 'real') return item.type === 'consumable' && (item as any).category === 'real';
          if (activeCategory === 'boost') return item.type === 'consumable' && (item as any).category === 'boost';
          return true;
        });

    if (sortBy === 'price_asc') items = [...items].sort((a, b) => a.cost - b.cost);
    if (sortBy === 'price_desc') items = [...items].sort((a, b) => b.cost - a.cost);

    return items;
  }, [shopItems, activeCategory, sortBy]);

  const handleBuy = (item: any) => {
    if (isPurchasing) return;
    if (user.coins >= item.cost) {
      dispatch(purchaseItemAction(item)).unwrap().then(() => {
          setPurchasedItem({ name: item.name, icon: item.icon, rarity: (item as any).rarity });
          const rarity = (item as any).rarity || 'Common';
          const particleCount = rarity === 'Legendary' ? 250 : rarity === 'Epic' ? 180 : rarity === 'Rare' ? 120 : 80;
          confetti({ particleCount, spread: 80, origin: { y: 0.6 } });
          dispatch(checkAchievements());
      });
    }
  };

  const getIcon = (iconName: string, className = "h-8 w-8") => {
    const iconMap: Record<string, React.ReactNode> = {
      'Target':       <Target className={`${className} text-emerald-400`} />,
      'Sparkles':     <Sparkles className={`${className} text-purple-400`} />,
      'Shield':       <Shield className={`${className} text-blue-400`} />,
      'Coffee':       <Coffee className={`${className} text-amber-600`} />,
      'Gamepad2':     <Gamepad2 className={`${className} text-indigo-400`} />,
      'Pizza':        <Pizza className={`${className} text-orange-500`} />,
      'Compass':      <Compass className={`${className} text-teal-400`} />,
      'Flame':        <Flame className={`${className} text-red-400`} />,
      'Cpu':          <Cpu className={`${className} text-cyan-400`} />,
      'Film':         <Film className={`${className} text-pink-400`} />,
      'IceCream':     <IceCream className={`${className} text-sky-300`} />,
      'Moon':         <Moon className={`${className} text-indigo-300`} />,
      'ShieldOff':    <ShieldOff className={`${className} text-red-300`} />,
      'Wand2':        <Wand2 className={`${className} text-amber-300`} />,
      'Zap':          <Zap className={`${className} text-yellow-400`} />,
      'Coins':        <Coins className={`${className} text-amber-400`} />,
      'Heart':        <Heart className={`${className} text-rose-400`} />,
      'Battery':      <Battery className={`${className} text-emerald-400`} />,
      'ShieldCheck':  <ShieldCheck className={`${className} text-blue-300`} />,
    };
    return iconMap[iconName] || <ShoppingBag className={`${className} text-slate-400`} />;
  };

  const itemCounts = useMemo(() => ({
    all: shopItems.length,
    skin: shopItems.filter(i => i.type === 'skin').length,
    real: shopItems.filter(i => i.type === 'consumable' && (i as any).category === 'real').length,
    boost: shopItems.filter(i => i.type === 'consumable' && (i as any).category === 'boost').length,
  }), [shopItems]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-8">
      <LoadingOverlay isLoading={isPurchasing} message="Оплата..." className="fixed top-4 right-4 z-50 pointer-events-none">
        <></>
      </LoadingOverlay>

      {/* Purchase Success Modal */}
      <AnimatePresence>
        {purchasedItem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPurchasedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
              className="glass-panel rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-900/30 to-purple-900/30 border border-amber-500/20 flex items-center justify-center">
                  {getIcon(purchasedItem.icon, "h-10 w-10")}
                </div>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -top-2 -right-4 text-3xl"
                >
                  ✨
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Покупка совершена!</h3>
              <p className="text-amber-300 font-bold mb-1">{purchasedItem.name}</p>
              {purchasedItem.rarity && (
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded mt-1 ${RARITY_STYLES[purchasedItem.rarity]?.badge || ''}`}>
                  {RARITY_STYLES[purchasedItem.rarity]?.text}
                </span>
              )}
              <button 
                onClick={() => setPurchasedItem(null)}
                className="mt-6 w-full py-3 rounded-xl bg-amber-600/80 text-white font-bold hover:bg-amber-600 transition-all"
              >
                Отлично!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Balance */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-white rpg-font tracking-wide flex items-center gap-2">
            <ShoppingBag className="text-amber-400 h-7 w-7" />
            Лавка <span className="text-amber-400">Чудес</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Обменяй золото на легендарные артефакты и реальные награды</p>
        </div>
        <div className="bg-slate-900/60 px-5 py-3.5 rounded-2xl flex items-center border border-amber-500/20 gap-3">
          <div className="bg-amber-500/20 p-2 rounded-xl">
            <Coins className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Баланс</div>
            <div className="text-xl font-black text-amber-400">{user.coins.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
              activeCategory === cat.key
                ? 'bg-slate-800/80 border-slate-600/50 text-white shadow-lg'
                : 'bg-slate-900/40 border-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {cat.icon}
            {cat.label}
            <span className={`text-xs ml-0.5 ${activeCategory === cat.key ? 'text-slate-300' : 'text-slate-600'}`}>
              {itemCounts[cat.key]}
            </span>
          </button>
        ))}

        {/* Sort */}
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          >
            <option value="default">По умолчанию</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
          </select>
        </div>
      </div>

      {/* Category Banner (contextual) */}
      {activeCategory !== 'all' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`rounded-2xl p-4 border ${
            activeCategory === 'skin' ? 'bg-purple-900/10 border-purple-500/15' :
            activeCategory === 'real' ? 'bg-amber-900/10 border-amber-500/15' :
            'bg-emerald-900/10 border-emerald-500/15'
          }`}
        >
          <p className="text-sm text-slate-300">
            {activeCategory === 'skin' && '🎭 Облики меняют внешний вид твоего героя. Купленные облики можно переключать в профиле.'}
            {activeCategory === 'real' && '🎁 Реальные награды — покажи этот купон родителям, чтобы получить награду в реальной жизни!'}
            {activeCategory === 'boost' && '⚡ Бустеры дают временные бонусы к прогрессу. Используй их стратегически!'}
          </p>
        </motion.div>
      )}

      {/* Shop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item, idx) => {
          const isOwned = item.type === 'skin' && user.inventory?.includes(item.id);
          const canAfford = user.coins >= item.cost;
          const rarity = (item as any).rarity || 'Common';
          const rarityStyle = RARITY_STYLES[rarity] || RARITY_STYLES.Common;
          const category = (item as any).category || (item.type === 'skin' ? 'skin' : 'real');

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className={`relative glass-panel rounded-2xl p-5 flex flex-col transition-all duration-300 border ${rarityStyle.border} ${rarityStyle.glow}
                ${isOwned ? 'opacity-50 grayscale-[0.4]' : canAfford ? 'hover:-translate-y-1' : 'opacity-70'}
              `}
            >
              {/* Rarity + Category badges */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${rarityStyle.badge}`}>
                  {rarityStyle.text}
                </span>
                {category === 'real' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-900/30 text-amber-300 border border-amber-500/20">
                    IRL
                  </span>
                )}
                {category === 'boost' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-900/30 text-emerald-300 border border-emerald-500/20">
                    Буст
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className={`self-center my-3 p-4 rounded-2xl border bg-slate-900/50 ${rarityStyle.border} shadow-inner`}>
                {getIcon(item.icon, "h-9 w-9")}
              </div>
              
              {/* Item Info */}
              <h3 className="text-base font-bold text-slate-100 text-center mb-1">{item.name}</h3>
              <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed min-h-[36px]">{item.description}</p>
              
              {/* Price + Action */}
              <div className="mt-auto">
                {isOwned ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                    <Check size={16} /> В коллекции
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford || isPurchasing}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-600/80 to-amber-700/80 text-white hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] shadow-lg shadow-amber-900/20'
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    }`}
                  >
                    {isPurchasing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : !canAfford ? (
                      <Lock size={14} />
                    ) : (
                      <Coins size={14} />
                    )}
                    <span>{item.cost.toLocaleString()}</span>
                    {!canAfford && (
                      <span className="text-xs text-slate-600 ml-1">
                        (нужно ещё {(item.cost - user.coins).toLocaleString()})
                      </span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">В этой категории пока ничего нет</p>
        </div>
      )}

      {/* Tip Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-2xl p-4 border border-slate-700/30 flex items-start gap-3"
      >
        <div className="p-2 rounded-lg bg-blue-900/20 shrink-0">
          <Star size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-slate-300 font-bold mb-0.5">Совет</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Выполняй ежедневные квесты и поддерживай серию входов, чтобы копить монеты быстрее. 
            За каждый день серии ты получаешь бонусные монеты!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Rewards;
