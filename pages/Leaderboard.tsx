import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Crown, Ghost, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const leaderboardData = useSelector((state: RootState) => state.social.leaderboard);

  if (!currentUser) return null;

  const anonymize = (id: number) => {
      const adjectives = ["Тайный", "Молчаливый", "Мудрый", "Быстрый", "Ночной", "Светлый"];
      const classes = ["Маг", "Воин", "Страж", "Искатель", "Путник", "Герой"];
      const adj = adjectives[id % adjectives.length];
      const cls = classes[id % classes.length];
      return `${adj} ${cls} #${id}`;
  };

  const allUsers = [...leaderboardData, {
    id: 999, 
    username: currentUser.username, 
    level: currentUser.level, 
    xp: currentUser.currentXp + (currentUser.level * 1000), 
    avatar: currentUser.avatar,
    isCurrentUser: true
  }].sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block p-4 rounded-full bg-purple-900/20 mb-4 border border-purple-500/30">
             <Crown size={48} className="text-purple-400" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white rpg-font mb-2">Зал Легенд</h1>
        <p className="text-slate-400 flex items-center justify-center gap-2">
          <Ghost size={14} /> Имена скрыты туманом войны. Важны лишь деяния.
        </p>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50">
        <div className="bg-slate-900/80 p-4 grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-700">
          <div className="col-span-2 text-center">Ранг</div>
          <div className="col-span-6">Герой</div>
          <div className="col-span-2 text-center">Уровень</div>
          <div className="col-span-2 text-right">Слава</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {allUsers.slice(0, 15).map((user, index) => {
             const isTop3 = index < 3;
             return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={user.id} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                    user.isCurrentUser 
                      ? 'bg-purple-900/20 border-l-4 border-purple-500' 
                      : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="col-span-2 flex justify-center font-black text-lg">
                    {index === 0 && <Crown className="text-amber-400 h-6 w-6" />}
                    {index === 1 && <span className="text-slate-300 text-xl">II</span>}
                    {index === 2 && <span className="text-amber-700 text-xl">III</span>}
                    {index > 2 && <span className="text-slate-600">{index + 1}</span>}
                  </div>
                  
                  <div className="col-span-6 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isTop3 ? 'border-amber-500/50 bg-amber-900/20' : 'border-slate-700 bg-slate-800'
                    }`}>
                      <Shield size={16} className={isTop3 ? 'text-amber-400' : 'text-slate-500'} />
                    </div>
                    <div>
                      <div className={`font-bold ${user.isCurrentUser ? 'text-purple-300' : 'text-slate-200'}`}>
                        {user.isCurrentUser ? user.username : anonymize(user.id)}
                        {user.isCurrentUser && ' (Вы)'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center font-bold text-slate-500">
                    {user.level}
                  </div>
                  
                  <div className="col-span-2 text-right font-mono font-bold text-purple-400">
                    {user.xp}
                  </div>
                </motion.div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;