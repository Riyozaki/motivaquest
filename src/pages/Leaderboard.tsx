import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchLeaderboard, setLeaderboardType } from '../store/socialSlice';
import { Crown, Flame, Trophy, Swords, Target, RefreshCw, TrendingUp, Star, Zap, ChevronUp, Loader2, WifiOff, Shield, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'alltime' | 'weekly';

const Leaderboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const { leaderboard, leaderboardLoading, leaderboardError, leaderboardType, lastFetched } = useSelector((state: RootState) => state.social);
  const [activeTab, setActiveTab] = useState<TabType>('alltime');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch leaderboard on mount & tab change
  useEffect(() => {
    dispatch(fetchLeaderboard(activeTab));
  }, [dispatch, activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchLeaderboard(activeTab));
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    dispatch(setLeaderboardType(tab));
  };

  if (!currentUser) return null;

  // Build sorted list with current user injected
  const currentUserEntry: any = {
    username: currentUser.username,
    className: currentUser.className || 'Искатель',
    classEmoji: currentUser.classEmoji || '🗺️',
    level: currentUser.level,
    xp: activeTab === 'weekly'
      ? (currentUser.weeklyXp || 0)
      : (currentUser.currentXp || 0) + ((currentUser.level || 1) * 1000),
    weeklyXp: currentUser.weeklyXp || 0,
    totalQuestsCompleted: currentUser.totalQuestsCompleted || currentUser.completedQuests || 0,
    streakDays: currentUser.streakDays || 0,
    avatar: currentUser.avatar,
    isCurrentUser: true,
  };

  // Check if current user is already in leaderboard (by username match)
  const isUserInBoard = leaderboard.some(u =>
    u.username === currentUser.username || u.username === currentUser.email
  );

  const allUsers = isUserInBoard
    ? leaderboard.map(u => ({
        ...u,
        isCurrentUser: u.username === currentUser.username || u.username === currentUser.email,
      }))
    : [...leaderboard, currentUserEntry];

  // Sort
  const sortedUsers = [...allUsers].sort((a, b) => {
    if (activeTab === 'weekly') {
      return (b.weeklyXp || b.xp || 0) - (a.weeklyXp || a.xp || 0);
    }
    if (a.level !== b.level) return b.level - a.level;
    return (b.xp || 0) - (a.xp || 0);
  });

  // Find current user position
  const currentUserRank = sortedUsers.findIndex(u => u.isCurrentUser) + 1;

  // Top 3 podium
  const podium = sortedUsers.slice(0, 3);
  const restOfBoard = sortedUsers.slice(3, 20);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]" />;
    return <span className="text-slate-500 font-mono text-sm">{index + 1}</span>;
  };

  const getSortedXp = (user: any) => {
    if (activeTab === 'weekly') return user.weeklyXp || user.xp || 0;
    return user.xp || 0;
  };

  const podiumOrder = [1, 0, 2]; // silver, gold, bronze visual order
  const podiumHeights = ['h-28', 'h-36', 'h-24'];
  const podiumBorders = ['border-slate-400/50', 'border-amber-400/50', 'border-amber-700/50'];
  const podiumGlows = ['shadow-slate-400/20', 'shadow-amber-400/30', 'shadow-amber-700/20'];
  const podiumBgs = ['from-slate-500/10 to-slate-900/20', 'from-amber-500/10 to-amber-900/20', 'from-amber-800/10 to-amber-950/20'];
  const podiumLabels = ['🥈', '🥇', '🥉'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-3 mb-3"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-900/30 to-purple-900/30 border border-amber-500/20">
            <Trophy size={36} className="text-amber-400" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-white rpg-font mb-1">Зал Славы</h1>
        <p className="text-slate-400 text-sm">
          Лучшие герои нашей академии
        </p>
      </div>

      {/* Tabs + Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => handleTabChange('alltime')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'alltime'
                ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={14} className="inline mr-1.5 -mt-0.5" />
            Все время
          </button>
          <button
            onClick={() => handleTabChange('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'weekly'
                ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame size={14} className="inline mr-1.5 -mt-0.5" />
            Эта неделя
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={leaderboardLoading}
          className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
          title="Обновить"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Your Rank Card */}
      {currentUserRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-4 border border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-indigo-900/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-2xl">
                {currentUser.classEmoji || '🗺️'}
              </div>
              <div>
                <div className="text-white font-bold">{currentUser.username}</div>
                <div className="text-purple-300 text-xs">
                  {currentUser.className || 'Искатель'} • Уровень {currentUser.level}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-purple-400">#{currentUserRank}</div>
              <div className="text-xs text-slate-400">
                {activeTab === 'weekly' ? `${currentUser.weeklyXp || 0} XP/нед` : `${getSortedXp(currentUserEntry)} XP`}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {leaderboardLoading && leaderboard.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Загружаем таблицу героев...</p>
        </div>
      )}

      {/* Error State */}
      {leaderboardError && leaderboard.length === 0 && !leaderboardLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <WifiOff className="h-8 w-8 text-slate-500" />
          <p className="text-slate-400 text-sm text-center">
            Не удалось загрузить данные.<br />
            <span className="text-xs text-slate-500">{leaderboardError}</span>
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 rounded-lg bg-purple-600/50 text-white text-sm font-bold hover:bg-purple-600/70 transition-all"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Podium — Top 3 */}
      {!leaderboardLoading && sortedUsers.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {podiumOrder.map((originalIndex, visualIndex) => {
            const user = podium[originalIndex];
            if (!user) return null;
            return (
              <motion.div
                key={originalIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: visualIndex * 0.15 }}
                className="flex flex-col items-center"
              >
                {/* Avatar */}
                <div className={`relative mb-2 ${originalIndex === 0 ? 'scale-110' : ''}`}>
                  <div className={`w-14 h-14 rounded-2xl border-2 ${podiumBorders[visualIndex]} bg-gradient-to-br ${podiumBgs[visualIndex]} flex items-center justify-center text-2xl shadow-lg ${podiumGlows[visualIndex]}`}>
                    {user.classEmoji || '🗺️'}
                  </div>
                  {originalIndex === 0 && (
                    <div className="absolute -top-2 -right-2 text-lg">👑</div>
                  )}
                </div>

                {/* Name */}
                <div className={`text-xs font-bold truncate max-w-[90px] text-center ${
                  user.isCurrentUser ? 'text-purple-300' : 'text-slate-200'
                }`}>
                  {user.username}{user.isCurrentUser ? ' (Вы)' : ''}
                </div>

                {/* Level & XP */}
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ур. {user.level} • {getSortedXp(user)} XP
                </div>

                {/* Podium block */}
                <div className={`mt-2 w-20 sm:w-24 ${podiumHeights[visualIndex]} rounded-t-xl border border-b-0 ${podiumBorders[visualIndex]} bg-gradient-to-t ${podiumBgs[visualIndex]} flex items-center justify-center`}>
                  <span className="text-2xl">{podiumLabels[visualIndex]}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Main Table */}
      {!leaderboardLoading && sortedUsers.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50">
          {/* Table Header */}
          <div className="bg-slate-900/80 px-4 py-3 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-700/50">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Герой</div>
            <div className="col-span-2 text-center">Уровень</div>
            <div className="col-span-2 text-center">
              {activeTab === 'weekly' ? 'XP/Нед' : 'Общ. XP'}
            </div>
            <div className="col-span-2 text-right">Квестов</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/40">
            {restOfBoard.map((user, idx) => {
              const globalIndex = idx + 3; // starts after podium
              return (
                <motion.div
                  key={`${user.username}-${globalIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors duration-150 ${
                    user.isCurrentUser
                      ? 'bg-purple-900/15 border-l-2 border-purple-500'
                      : 'hover:bg-slate-800/30 border-l-2 border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {getRankBadge(globalIndex)}
                  </div>

                  {/* User Info */}
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg border ${
                      user.isCurrentUser
                        ? 'border-purple-500/40 bg-purple-900/20'
                        : 'border-slate-700/50 bg-slate-800/50'
                    }`}>
                      {user.classEmoji || '🗺️'}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold truncate ${
                        user.isCurrentUser ? 'text-purple-300' : 'text-slate-200'
                      }`}>
                        {user.username}
                        {user.isCurrentUser && <span className="text-purple-400 ml-1 text-xs">(Вы)</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        {user.className || 'Искатель'}
                        {(user.streakDays || 0) >= 3 && (
                          <span className="inline-flex items-center gap-0.5 text-amber-400">
                            <Flame size={9} /> {user.streakDays}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-bold text-slate-300">{user.level}</span>
                  </div>

                  {/* XP */}
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-mono font-bold ${
                      activeTab === 'weekly' ? 'text-emerald-400' : 'text-purple-400'
                    }`}>
                      {getSortedXp(user).toLocaleString()}
                    </span>
                  </div>

                  {/* Quests Completed */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-slate-400 font-mono">
                      {user.totalQuestsCompleted || 0}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty state */}
          {sortedUsers.length <= 3 && restOfBoard.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Пока мало данных. Выполняй квесты, чтобы подняться в рейтинге!
            </div>
          )}
        </div>
      )}

      {/* Last updated */}
      {lastFetched && (
        <p className="text-center text-xs text-slate-600">
          Обновлено: {new Date(lastFetched).toLocaleTimeString('ru-RU')}
          {leaderboardLoading && <Loader2 size={10} className="inline ml-1 animate-spin" />}
        </p>
      )}
    </div>
  );
};

export default Leaderboard;
