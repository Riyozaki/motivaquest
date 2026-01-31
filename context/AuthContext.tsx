
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserProfile } from '../types';
import { clearUser, initAuth, logoutLocal } from '../store/userSlice';
import { RootState, AppDispatch } from '../store';
import { toast } from 'react-toastify';
import { analytics } from '../services/analytics';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  timeRemaining: number; // Seconds
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Anti-addiction: 1 Hour Session Limit
const SESSION_DURATION = 60 * 60; 

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const userProfile = useSelector((state: RootState) => state.user.currentUser);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const init = async () => {
      await dispatch(initAuth());
      setLoading(false);
    };
    init();
  }, [dispatch]);

  // 2. Anti-Addiction Timer
  useEffect(() => {
    if (!userProfile) {
      setTimeRemaining(SESSION_DURATION);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSessionExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userProfile]);

  const trackSessionEnd = (reason: 'logout' | 'timeout') => {
      const timeSpentSeconds = SESSION_DURATION - timeRemaining;
      const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);
      analytics.track('session_end', userProfile, { reason, durationMinutes: timeSpentMinutes });
  };

  const handleSessionExpiry = () => {
    trackSessionEnd('timeout');
    toast.error("Игровое время истекло! Сделай перерыв.", {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      theme: "colored"
    });
    logout();
  };

  const logout = async () => {
    if (userProfile) {
        trackSessionEnd('logout');
    }
    await dispatch(logoutLocal());
    dispatch(clearUser());
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user: userProfile, 
        loading, 
        logout, 
        isAuthenticated: !!userProfile,
        timeRemaining
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
