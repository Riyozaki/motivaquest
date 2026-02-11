import React, { useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Award, Zap, Coins, CheckCircle, Sword, Edit2, Shield, Heart, Target, Sparkles, Map, Package, Save, TrendingUp, Calendar, Palette, History, Share2, Download, Upload, User, Crown, AlertCircle } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { updateUserProfile, equipSkinAction, importSaveData, setThemeColor, changeHeroClass, selectIsPending } from '../store/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ThemeColor, HeroClass } from '../types';
import { toast } from 'react-toastify';
import LoadingOverlay from '../components/LoadingOverlay';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AVATAR_OPTIONS = [
  { id: 'warrior', icon: Sword, label: 'Воин', color: 'from-red-500 to-orange-600' },
  { id: 'mage', icon: Sparkles, label: 'Маг', color: 'from-purple-500 to-indigo-600' },
  { id: 'rogue', icon: Target, label: 'Лучник', color: 'from-emerald-500 to-teal-600' },
  { id: 'cleric', icon: Heart, label: 'Целитель', color: 'from-pink-500 to-rose-600' },
  { id: 'explorer', icon: Map, label: 'Искатель', color: 'from-blue-500 to-cyan-600' },
];

const HERO_CLASSES: { id: HeroClass, name: string, bonus: string, icon: any, color: string }[] = [
    { id: 'warrior', name: 'Воин', bonus: '+10% XP за Спорт', icon: Sword, color: 'text-red-400' },
    { id: 'mage', name: 'Маг', bonus: '+10% XP за Науки (Math/Sci)', icon: Sparkles, color: 'text-purple-400' },
    { id: 'ranger', name: 'Следопыт', bonus: '+10% XP за Социум/Эко', icon: Map, color: 'text-emerald-400' },
    { id: 'healer', name: 'Целитель', bonus: '+10% Монет за Саморазвитие', icon: Heart, color: 'text-pink-400' },
];

const THEMES: { id: ThemeColor, color: string, label: string }[] = [
    { id: 'purple', color: '#8b5cf6', label: 'Мистик' },
    { id: 'blue', color: '#3b82f6', label: 'Небо' },
    { id: 'green', color: '#22c55e', label: 'Лес' },
    { id: 'crimson', color: '#f43f5e', label: 'Огонь' },
    { id: 'amber', color: '#f59e0b', label: 'Золото' },
];

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.currentUser);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);
  const achievementsList = useSelector((state: RootState) => state.rewards.achievements);
  const questsList = useSelector((state: RootState) => state.quests.list);
  const isEquipping = useSelector(selectIsPending('equipSkin'));
  const dispatch = useDispatch<AppDispatch>();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'achievements' | 'data'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');
  const [showClassSelection, setShowClassSelection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Chart Data Calculation ---
  const statsData = useMemo(() => {
    if (!user) return { labels: [], quests: [], coins: [], totalQuests: 0, totalCoins: 0 };

    const labels: string[] = [];
    const questCounts: number[] = [];
    const coinCounts: number[] = [];
    let totalQuestsWeek = 0;
    let totalCoinsWeek = 0;

    // Last 7 Days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Normalize to local date string for comparison to avoid timezone mismatch
        const dateStr = d.toLocaleDateString('ru-RU'); // DD.MM.YYYY format usually or locale dependent
        
        // Format label (e.g., "Mon, 12.05")
        const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'numeric' });
        labels.push(label);

        // Find history items for this day
        // We convert both to local date string to match day-to-day
        const dayHistory = (user.questHistory || []).filter(h => {
            const hDate = new Date(h.date);
            return hDate.toLocaleDateString('ru-RU') === dateStr;
        });
        
        // Count quests
        const qCount = dayHistory.length;
        questCounts.push(qCount);
        totalQuestsWeek += qCount;

        // Sum coins (lookup quest value)
        const cCount = dayHistory.reduce((acc, item) => {
            const quest = questsList.find(q => q.id === item.questId);
            return acc + (quest ? quest.coins : 0);
        }, 0);
        coinCounts.push(cCount);
        totalCoinsWeek += cCount;
    }

    return { labels, quests: questCounts, coins: coinCounts, totalQuests: totalQuestsWeek, totalCoins: totalCoinsWeek };
  }, [user, questsList]);

  // --- Chart Options ---
  const primaryColorHex = useMemo(() => {
      const theme = THEMES.find(t => t.id === user?.themeColor);
      return theme ? theme.color : '#8b5cf6';
  }, [user?.themeColor]);

  const commonOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: '"Exo 2"' } } },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: primaryColorHex,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
        }
    },
    scales: {
        x: { 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#64748b' } 
        },
        y: { 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#64748b', precision: 0 }
        }
    }
  };

  const questsChartData: ChartData<'bar'> = {
      labels: statsData.labels,
      datasets: [{
          label: 'Выполнено квестов',
          data: statsData.quests,
          backgroundColor: primaryColorHex,
          borderColor: primaryColorHex,
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: '#ffffff'
      }]
  };

  const coinsChartData: ChartData<'line'> = {
      labels: statsData.labels,
      datasets: [{
          label: 'Заработано золота',
          data: statsData.coins,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          pointBackgroundColor: '#fbbf24',
          pointBorderColor: '#fff',
          pointRadius: 4,
          tension: 0.4,
          fill: true
      }]
  };


  if (!user) return null;

  const mySkins = shopItems.filter(item => item.type === 'skin' && user.inventory?.includes(item.id));

  const handleSave = () => {
    dispatch(updateUserProfile({ username: editName }) as any);
    setIsEditing(false);
  };

  const handleEquip = (skinValue: string) => {
      if (!isEquipping) {
          dispatch(equipSkinAction(skinValue));
      }
  };

  const handleClassSelect = async (cls: HeroClass) => {
      try {
          await dispatch(changeHeroClass(cls)).unwrap();
          setShowClassSelection(false);
      } catch (e) {
          // Toast handled in slice
      }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(user, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motiva_save_${user.username}.json`;
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) dispatch(importSaveData(content));
      };
      reader.readAsText(file);
    }
  };

  const handleShare = () => {
      const lastQuests = user.questHistory?.slice(-3).map(q => q.questTitle).join(', ');
      const text = `Я выполнил: ${lastQuests} в MotivaQuest! У меня ${user.level} уровень.`;
      navigator.clipboard.writeText(text);
      toast.success("Твои подвиги скопированы! Поделись ими.");
  };

  // Safe fallback if user.avatar maps to nothing (e.g. premium skin ID not in default list)
  // For visuals, if it's a premium skin, we might need a fallback or map it.
  // Assuming shopItems has the mapping.
  let CurrentAvatarData = AVATAR_OPTIONS.find(a => a.id === user.avatar);
  if (!CurrentAvatarData) {
      // Try to find in owned skins
      const premiumSkin = mySkins.find(s => s.value === user.avatar);
      if (premiumSkin) {
          // Map premium skin value back to a basic class for Icon/Color
          // E.g. 'rogue' -> find rogue in AVATAR_OPTIONS
          CurrentAvatarData = AVATAR_OPTIONS.find(a => a.id === premiumSkin.value);
      }
  }
  // Ultimate fallback
  if (!CurrentAvatarData) CurrentAvatarData = AVATAR_OPTIONS[0];

  const CurrentIcon = CurrentAvatarData.icon;
  const currentHeroClass = HERO_CLASSES.find(c => c.id === user.heroClass);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Hero Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden rpg-border">
        <div className="corner-accent corner-tl"></div>
        <div className="corner-accent corner-tr"></div>
        <div className="corner-accent corner-bl"></div>
        <div className="corner-accent corner-br"></div>
        
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${CurrentAvatarData.color} opacity-20 blur-[80px] rounded-full`}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            {/* Avatar */}
            <div className="relative group shrink-0">
                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${CurrentAvatarData.color} p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 relative overflow-hidden">
                        <CurrentIcon size={64} className="text-white drop-shadow-lg" />
                    </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} className="text-slate-300" />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full flex flex-col items-center md:items-start">
                {isEditing ? (
                    <div className="flex gap-2 max-w-xs mb-4 w-full justify-center md:justify-start">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white w-full" />
                        <button onClick={handleSave} className="bg-green-600 px-4 rounded text-white">OK</button>
                    </div>
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 rpg-font break-all">{user.username}</h1>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center">
                        <Shield size={12} className="mr-1" /> Уровень {user.level}
                    </span>
                    {user.streakDays > 0 && (
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center">
                            <Zap size={12} className="mr-1" /> Стрик {user.streakDays}
                        </span>
                    )}
                    {/* Class Badge */}
                    <button 
                        onClick={() => setShowClassSelection(!showClassSelection)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center border transition-all hover:scale-105 ${currentHeroClass ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                    >
                        <Crown size={12} className="mr-1" /> {currentHeroClass ? currentHeroClass.name : 'Выбрать Класс'}
                    </button>
                </div>

                {/* Class Selection Area */}
                <AnimatePresence>
                    {showClassSelection && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="w-full mb-6 overflow-hidden"
                        >
                            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                                <h4 className="text-white font-bold mb-3 flex justify-between">
                                    Выберите специализацию
                                    {user.heroClass && <span className="text-xs text-amber-400 font-normal">Смена стоит 500 монет</span>}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {HERO_CLASSES.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleClassSelect(cls.id)}
                                            className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${user.heroClass === cls.id ? 'bg-purple-900/20 border-purple-500 ring-1 ring-purple-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                                        >
                                            <div className={`p-2 rounded-full bg-slate-900 ${cls.color}`}>
                                                <cls.icon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-200 text-sm">{cls.name}</div>
                                                <div className="text-[10px] text-slate-400">{cls.bonus}</div>
                                            </div>
                                            {user.heroClass === cls.id && <CheckCircle className="ml-auto text-purple-500" size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-center md:justify-start">
                        <Coins className="text-amber-400 mr-3" />
                        <div className="text-left">
                            <div className="text-xs text-slate-500 uppercase font-bold">Золото</div>
                            <div className="text-lg md:text-xl font-bold text-white">{user.coins}</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-center md:justify-start">
                        <CheckCircle className="text-emerald-400 mr-3" />
                        <div className="text-left">
                            <div className="text-xs text-slate-500 uppercase font-bold">Квесты</div>
                            <div className="text-lg md:text-xl font-bold text-white">{user.completedQuests}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex overflow-x-auto gap-2 scrollbar-hide">
        {['stats', 'inventory', 'achievements', 'data'].map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 md:px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    activeTab === tab 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                {tab === 'stats' && <Zap size={16}/>}
                {tab === 'inventory' && <Package size={16}/>}
                {tab === 'achievements' && <Award size={16}/>}
                {tab === 'data' && <Save size={16}/>}
                <span className="capitalize">
                    {tab === 'stats' ? 'Статистика' : tab === 'inventory' ? 'Инвентарь' : tab === 'achievements' ? 'Достижения' : 'Система'}
                </span>
            </button>
        ))}
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 rounded-3xl min-h-[300px]"
      >
          {activeTab === 'inventory' && (
              <LoadingOverlay isLoading={isEquipping} message="Экипировка...">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Default Skins */}
                  {AVATAR_OPTIONS.map(skin => {
                      // It is equipped if avatar matches ID AND user doesn't own a premium skin that uses this ID value.
                      // This ensures if I own "Skin Ninja" (rogue), the "Default Rogue" card is NOT highlighted.
                      const isEquipped = user.avatar === skin.id && !mySkins.some(s => s.value === skin.id);
                      return (
                          <div key={skin.id} onClick={() => handleEquip(skin.id)} 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative overflow-hidden ${isEquipped ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                              <skin.icon size={32} className="mb-2 text-slate-200" />
                              <span className="text-xs font-bold text-slate-400">{skin.label}</span>
                              {isEquipped && <span className="text-[10px] text-primary-400 mt-1">ЭКИПИРОВАНО</span>}
                          </div>
                      )
                  })}
                  {/* Premium Skins */}
                  {mySkins.map(skin => {
                      const isEquipped = user.avatar === skin.value;
                      return (
                          <div key={skin.id} onClick={() => handleEquip(skin.value)}
                             className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative overflow-hidden ${isEquipped ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                              <User size={32} className="mb-2 text-primary-300" />
                              <span className="text-xs font-bold text-slate-400">{skin.name}</span>
                              {isEquipped && <span className="text-[10px] text-primary-400 mt-1">ЭКИПИРОВАНО</span>}
                          </div>
                      )
                  })}
                  {mySkins.length === 0 && (
                      <div className="col-span-full text-center text-slate-500 py-8 text-sm">
                          У вас пока нет купленных скинов. Загляните в лавку!
                      </div>
                  )}
              </div>
              </LoadingOverlay>
          )}

          {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievementsList.map(ach => {
                      const unlocked = user.achievements?.includes(ach.id);
                      return (
                          <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 ${unlocked ? 'border-amber-500/30 bg-amber-900/10' : 'border-slate-700 bg-slate-800/50 opacity-50'}`}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${unlocked ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-500'}`}>
                                  <Award size={24} />
                              </div>
                              <div>
                                  <h4 className={`font-bold text-sm md:text-base ${unlocked ? 'text-amber-100' : 'text-slate-500'}`}>{ach.title}</h4>
                                  <p className="text-xs text-slate-500">{ach.description}</p>
                              </div>
                          </div>
                      )
                  })}
              </div>
          )}
          
          {activeTab === 'data' && (
              <div className="flex flex-col gap-8">
                  
                  {/* Theme Selector */}
                  <div>
                      <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                          <Palette size={20} /> Цвет Интерфейса
                      </h3>
                      <div className="flex gap-4 flex-wrap">
                          {THEMES.map(theme => (
                              <button
                                  key={theme.id}
                                  onClick={() => dispatch(setThemeColor(theme.id))}
                                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                      user.themeColor === theme.id 
                                        ? 'border-white bg-white/10' 
                                        : 'border-slate-700 hover:border-slate-500 bg-slate-800'
                                  }`}
                              >
                                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color }}></div>
                                  <span className="font-bold text-sm text-slate-200">{theme.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="border-t border-slate-700/50 pt-6 flex flex-col gap-4 max-w-sm">
                      <h3 className="font-bold text-slate-300 mb-2">Управление Данными</h3>
                      <button onClick={handleExportData} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 py-3 rounded-xl text-white font-bold">
                          <Download size={18} /> Сохранить прогресс
                      </button>
                      <label className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed py-3 rounded-xl text-slate-400 hover:text-white cursor-pointer font-bold">
                          <Upload size={18} /> Загрузить файл
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                      </label>
                  </div>
              </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                      <div className="p-3 bg-primary-900/20 rounded-full text-primary-400 border border-primary-500/30">
                          <CheckCircle size={24} />
                      </div>
                      <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Квесты (7 дней)</p>
                          <p className="text-2xl font-black text-white">{statsData.totalQuests}</p>
                      </div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                      <div className="p-3 bg-amber-900/20 rounded-full text-amber-400 border border-amber-500/30">
                          <TrendingUp size={24} />
                      </div>
                      <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Заработок (7 дней)</p>
                          <p className="text-2xl font-black text-amber-400">{statsData.totalCoins}</p>
                      </div>
                  </div>
               </div>

               {/* Quest History List */}
               <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                   <div className="flex justify-between items-center mb-4">
                       <h4 className="text-slate-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                           <History size={16} className="text-blue-400"/> Лента Подвигов
                       </h4>
                       <button onClick={handleShare} className="text-xs font-bold text-primary-400 hover:text-white flex items-center gap-1">
                           <Share2 size={12} /> Поделиться
                       </button>
                   </div>
                   <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                       {[...(user.questHistory || [])].reverse().slice(0, 20).map((h, i) => (
                           <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-slate-800/50 border border-slate-700/50">
                               <span className="text-slate-300 truncate mr-2">{h.questTitle || `Квест #${h.questId}`}</span>
                               <div className="flex items-center gap-3 shrink-0">
                                   <span className="text-purple-400 font-bold">+{h.xpEarned} XP</span>
                                   <span className="text-slate-500 text-xs">{new Date(h.date).toLocaleDateString()}</span>
                               </div>
                           </div>
                       ))}
                       {(!user.questHistory || user.questHistory.length === 0) && (
                           <div className="text-center text-slate-500 py-4 text-xs">Пока тишина... Соверши подвиг!</div>
                       )}
                   </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-64 md:h-80 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                      <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Calendar size={16} className="text-primary-400"/> Активность по квестам
                      </h4>
                      <Bar data={questsChartData} options={commonOptions as any} />
                  </div>
                  <div className="h-64 md:h-80 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                      <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Coins size={16} className="text-amber-400"/> Приток Золота
                      </h4>
                      <Line data={coinsChartData} options={commonOptions as any} />
                  </div>
               </div>
            </div>
          )}
      </motion.div>
    </div>
  );
};

export default Profile;