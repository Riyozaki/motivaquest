import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Award, Zap, Coins, CheckCircle, Sword, Edit2, Shield, Heart, Target, Sparkles, Map, Package, Crown, BookOpen, User, Download, Upload, Save } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { updateUserProfile, equipSkin, importSaveData } from '../store/userSlice';
import Survey from '../components/Survey';
import { motion } from 'framer-motion';

const AVATAR_OPTIONS = [
  { id: 'warrior', icon: Sword, label: 'Воин', color: 'from-red-500 to-orange-600' },
  { id: 'mage', icon: Sparkles, label: 'Маг', color: 'from-purple-500 to-indigo-600' },
  { id: 'rogue', icon: Target, label: 'Лучник', color: 'from-emerald-500 to-teal-600' },
  { id: 'cleric', icon: Heart, label: 'Целитель', color: 'from-pink-500 to-rose-600' },
  { id: 'explorer', icon: Map, label: 'Искатель', color: 'from-blue-500 to-cyan-600' },
];

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.currentUser);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);
  const achievementsList = useSelector((state: RootState) => state.rewards.achievements);
  const dispatch = useDispatch<AppDispatch>();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'achievements' | 'data'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const xpPercentage = Math.min(100, (user.currentXp / user.nextLevelXp) * 100);

  const handleSave = () => {
    dispatch(updateUserProfile({ username: editName }) as any);
    setIsEditing(false);
  };

  const handleEquip = (skinValue: string) => dispatch(equipSkin(skinValue));

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

  const CurrentAvatarData = AVATAR_OPTIONS.find(a => a.id === user.avatar) || AVATAR_OPTIONS[0];
  const CurrentIcon = CurrentAvatarData.icon;

  const mySkins = shopItems.filter(item => item.type === 'skin' && user.inventory?.includes(item.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Hero Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${CurrentAvatarData.color} opacity-20 blur-[80px] rounded-full`}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Avatar */}
            <div className="relative group">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${CurrentAvatarData.color} p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 relative overflow-hidden">
                        <CurrentIcon size={64} className="text-white drop-shadow-lg" />
                    </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-full border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} className="text-slate-300" />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full">
                {isEditing ? (
                    <div className="flex gap-2 max-w-xs mb-4">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white w-full" />
                        <button onClick={handleSave} className="bg-green-600 px-4 rounded text-white">OK</button>
                    </div>
                ) : (
                    <h1 className="text-4xl font-bold text-white mb-2 rpg-font">{user.username}</h1>
                )}
                
                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center">
                        <Shield size={12} className="mr-1" /> Уровень {user.level}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold uppercase tracking-widest">
                        {CurrentAvatarData.label}
                    </span>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center">
                        <Coins className="text-amber-400 mr-3" />
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Золото</div>
                            <div className="text-xl font-bold text-white">{user.coins}</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center">
                        <CheckCircle className="text-emerald-400 mr-3" />
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Квесты</div>
                            <div className="text-xl font-bold text-white">{user.completedQuests}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Survey />

      {/* Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex overflow-x-auto gap-2">
        {['stats', 'inventory', 'achievements', 'data'].map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab 
                    ? 'bg-purple-600 text-white shadow-lg' 
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {AVATAR_OPTIONS.map(skin => (
                      <div key={skin.id} onClick={() => handleEquip(skin.id)} 
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center ${user.avatar === skin.id ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                          <skin.icon size={32} className="mb-2 text-slate-200" />
                          <span className="text-xs font-bold text-slate-400">{skin.label}</span>
                          {user.avatar === skin.id && <span className="text-[10px] text-purple-400 mt-1">EQUIPPED</span>}
                      </div>
                  ))}
                  {mySkins.map(skin => (
                      <div key={skin.id} onClick={() => handleEquip(skin.value)}
                         className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center ${user.avatar === skin.value ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                          <User size={32} className="mb-2 text-purple-300" />
                          <span className="text-xs font-bold text-slate-400">{skin.name}</span>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievementsList.map(ach => {
                      const unlocked = user.achievements?.includes(ach.id);
                      return (
                          <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 ${unlocked ? 'border-amber-500/30 bg-amber-900/10' : 'border-slate-700 bg-slate-800/50 opacity-50'}`}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unlocked ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-500'}`}>
                                  <Award size={24} />
                              </div>
                              <div>
                                  <h4 className={`font-bold ${unlocked ? 'text-amber-100' : 'text-slate-500'}`}>{ach.title}</h4>
                                  <p className="text-xs text-slate-500">{ach.description}</p>
                              </div>
                          </div>
                      )
                  })}
              </div>
          )}
          
          {activeTab === 'data' && (
              <div className="flex flex-col gap-4 max-w-sm">
                  <button onClick={handleExportData} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 py-3 rounded-xl text-white font-bold">
                      <Download size={18} /> Сохранить прогресс
                  </button>
                  <label className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed py-3 rounded-xl text-slate-400 hover:text-white cursor-pointer font-bold">
                      <Upload size={18} /> Загрузить файл
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                  </label>
              </div>
          )}

          {activeTab === 'stats' && (
              <div className="text-center text-slate-400 py-10">
                  <p>Статистика сражений будет доступна на уровне 5.</p>
              </div>
          )}
      </motion.div>
    </div>
  );
};

export default Profile;