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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-purple-400">Загрузка магии...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-purple-400">Загрузка магии...</div>;

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

  // Start tour
  useEffect(() => {
    if (user && location.pathname === '/' && !localStorage.getItem('motiva_tour_completed')) {
      setRunTour(true);
    }
  }, [user, location.pathname]);

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
            primaryColor: '#7c3aed',
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