
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sword, User, ShoppingBag, Home, LogIn, LogOut, BarChart2, Clock, ShieldAlert, Zap, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, timeRemaining } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navLinks = [
    { path: '/', label: 'Штаб', icon: Home, public: true },
    { path: '/quests', label: 'Миссии', icon: Sword, public: false },
    { path: '/calendar', label: 'Календарь', icon: CalendarDays, public: false },
    { path: '/rewards', label: 'Лавка', icon: ShoppingBag, public: false },
    { path: '/leaderboard', label: 'Зал Славы', icon: BarChart2, public: false },
    { path: '/profile', label: 'Герой', icon: User, public: false },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Магистр', icon: ShieldAlert, public: false });
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="sticky top-4 z-50 px-4 mb-8"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="glass-panel rounded-2xl px-6 py-3 flex justify-between items-center relative overflow-hidden rpg-border">
          
          {/* Decorative Corners */}
          <div className="corner-accent corner-tl"></div>
          <div className="corner-accent corner-tr"></div>
          <div className="corner-accent corner-bl"></div>
          <div className="corner-accent corner-br"></div>

          {/* Glow Effect */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50 blur-sm"></div>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group relative z-10">
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2 rounded-lg shadow-lg group-hover:shadow-primary-500/50 transition-all duration-300">
                <Sword className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl rpg-font tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-primary-300 transition-all">
                MotivaQuest
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2 relative z-10">
            {navLinks.map((link) => (
              (link.public || isAuthenticated) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative group px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-primary-600/20 border border-primary-500/30 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative flex items-center gap-2 ${isActive(link.path) ? 'text-primary-300 shadow-primary-500' : 'text-slate-400 group-hover:text-white'}`}>
                    <link.icon className={`h-4 w-4 ${isActive(link.path) ? 'text-primary-400' : ''}`} />
                    {link.label}
                  </span>
                </Link>
              )
            ))}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-slate-700">
                {/* Timer */}
                <div className={`flex items-center text-xs font-mono font-bold px-3 py-1.5 rounded-full border bg-slate-800 ${timeRemaining < 300 ? 'text-red-400 border-red-900 animate-pulse' : 'text-emerald-400 border-emerald-900/30'}`}>
                  <Clock className="h-3 w-3 mr-2" />
                  {formatTime(timeRemaining)}
                </div>

                <div className="flex flex-col items-end leading-tight">
                    <span className="text-sm font-bold text-white">{user?.username}</span>
                    <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest flex items-center">
                        <Zap size={10} className="mr-1" /> LVL {user?.level}
                    </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors"
                  title="Покинуть мир"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="ml-4">
                 <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-primary-500/30 flex items-center gap-2"
                 >
                    <LogIn size={16} /> Войти
                 </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4 relative z-10">
             {isAuthenticated && (
                <div className={`text-xs font-mono font-bold ${timeRemaining < 300 ? 'text-red-400' : 'text-emerald-400'}`}>
                   {formatTime(timeRemaining)}
                </div>
             )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-slate-900/90 backdrop-blur-xl border-b border-slate-700 absolute w-full left-0 top-full rounded-b-2xl"
      >
        <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              (link.public || isAuthenticated) && (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive(link.path) ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="font-bold">{link.label}</span>
                </Link>
              )
            ))}
            {isAuthenticated && (
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-bold">Выйти</span>
                </button>
            )}
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
