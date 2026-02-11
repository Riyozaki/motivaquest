import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  
  // Use refs to track session state independently of renders
  const sessionStartRef = useRef<number | null>(null);
  const userRef = useRef<UserProfile | null>(userProfile);

  // Keep userRef current for analytics callbacks
  useEffect(() => {
    userRef.current = userProfile;
  }, [userProfile]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const init = async () => {
      await dispatch(initAuth());
      setLoading(false);
    };
    init();
  }, [dispatch]);

  const trackSessionEnd = (reason: 'logout' | 'timeout') => {
      let durationMinutes = 0;
      if (sessionStartRef.current) {
          const elapsedSeconds = (Date.now() - sessionStartRef.current) / 1000;
          durationMinutes = Math.floor(elapsedSeconds / 60);
      }
      analytics.track('session_end', userRef.current, { reason, durationMinutes });
  };

  const logout = async () => {
    if (userRef.current) {
        trackSessionEnd('logout');
    }
    await dispatch(logoutLocal());
    dispatch(clearUser());
    sessionStartRef.current = null;
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
    // Perform logout cleanup
    dispatch(logoutLocal());
    dispatch(clearUser());
    sessionStartRef.current = null;
  };

  // 2. Anti-Addiction Timer
  useEffect(() => {
    const isLoggedIn = !!userProfile;

    if (!isLoggedIn) {
      sessionStartRef.current = null;
      setTimeRemaining(SESSION_DURATION);
      return;
    }

    // Set start time if it's a new session
    if (sessionStartRef.current === null) {
      sessionStartRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (!sessionStartRef.current) return;

      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartRef.current) / 1000);
      const remaining = Math.max(0, SESSION_DURATION - elapsed);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSessionExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [!!userProfile]); // Only depend on boolean existence

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