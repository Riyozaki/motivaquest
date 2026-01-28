import React, { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './store';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import ErrorBoundary from './components/ErrorBoundary';
import 'chart.js/auto'; 
import { AnimatePresence } from 'framer-motion';
import { ThemeColor } from './types';

// Theme Colors Config
const THEME_COLORS: Record<ThemeColor, Record<number, string>> = {
  purple: {
     50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
     500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  blue: {
     50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
     500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
  },
  green: {
     50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
     500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16'
  },
  crimson: {
     50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
     500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
  },
  amber: {
     50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
     500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
  }
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-primary-400">Загрузка магии...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-primary-400">Загрузка магии...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/quests" element={<ProtectedRoute><Quests /></ProtectedRoute>} />
                <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            </Routes>
        </AnimatePresence>
    );
};

const AppContent: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.currentUser);
  const prevLevelRef = useRef<number | undefined>(undefined);
  const location = useLocation();
  const [runTour, setRunTour] = useState(false);

  // Apply Theme
  useEffect(() => {
    const theme = user?.themeColor || 'purple';
    const colors = THEME_COLORS[theme];
    const root = document.documentElement;
    
    Object.keys(colors).forEach(shade => {
        root.style.setProperty(`--color-primary-${shade}`, colors[parseInt(shade)]);
    });
  }, [user?.themeColor]);

  // Monitor Level Up
  useEffect(() => {
    if (user) {
      if (prevLevelRef.current !== undefined && user.level > prevLevelRef.current) {
        toast.success(`🎉 НОВЫЙ УРОВЕНЬ: ${user.level}!`, {
          position: "top-center",
          theme: "dark",
          icon: "⚡"
        });
      }
      prevLevelRef.current = user.level;
    }
  }, [user?.level]);

  // Start tour ONLY if user has a grade (Modal closed)
  useEffect(() => {
    if (user && user.grade && location.pathname === '/' && !localStorage.getItem('motiva_tour_completed')) {
      setRunTour(true);
    }
  }, [user, user?.grade, location.pathname]);

  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem('motiva_tour_completed', 'true');
    }
  };

  const tourSteps: Step[] = [
    { target: 'body', content: 'Добро пожаловать, Герой! Твой путь начинается.', placement: 'center' },
    { target: '.tour-step-1', content: 'Это твой статус. Следи за XP и здоровьем.' },
    { target: '.tour-step-2', content: 'Текущая миссия. Выполни её сегодня!' },
    { target: '.tour-step-3', content: 'Твоя история подвигов.' },
    { target: '.tour-step-nav', content: 'Карта мира (меню).' }
  ];

  const primaryColor = THEME_COLORS[user?.themeColor || 'purple'][600];

  return (
    <div className="flex flex-col min-h-screen relative z-10">
      <Navbar />
      
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: primaryColor,
            textColor: '#1e293b',
            zIndex: 10000,
            backgroundColor: '#f8fafc',
          }
        }}
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <AnimatedRoutes />
      </main>
      
      <footer className="py-8 text-center text-sm text-slate-500 border-t border-slate-800/50 backdrop-blur-sm">
        <p className="rpg-font text-slate-400">MotivaQuest &copy; {new Date().getFullYear()}</p>
        <p className="text-xs mt-2">Forged with magic & code</p>
      </footer>
      <ToastContainer position="bottom-right" theme="dark" toastClassName="glass-panel" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <HashRouter>
              <AppContent />
            </HashRouter>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;