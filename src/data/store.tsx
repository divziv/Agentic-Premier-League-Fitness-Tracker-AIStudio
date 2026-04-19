import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initialMockProfile, initialWorkoutHistory, mockSquadMembers } from './mockData';

export type UserProfile = {
  id: string;
  displayName: string;
  avatarId: string;
  velocity: number;
  streak: number;
  use3DVisualizer: boolean;
  enableComputerVision: boolean;
};

export type WorkoutSession = {
  id: string;
  timestamp: number;
  duration: number; // in seconds
  difficulty: 'Easy' | 'Medium' | 'Difficult';
  target: string;
  completed: boolean;
};

export type SquadMember = {
  id: string;
  name: string;
  avatarId: string;
  activityLevel: number; // 0-100
  lastActive: number;
};

type AppState = {
  user: UserProfile | null;
  workoutHistory: WorkoutSession[];
  squad: SquadMember[];
};

type AppContextType = {
  state: AppState;
  login: (name: string, avatarId: string) => void;
  logout: () => void;
  saveWorkout: (session: Omit<WorkoutSession, 'id' | 'timestamp'>) => void;
  updateVelocity: (newVelocity: number, newStreak: number) => void;
  updatePreferences: (use3D: boolean, useCV: boolean) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORE_KEY = 'apl_fitness_data';

const loadState = (): AppState => {
  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  }
  return {
    user: null,
    workoutHistory: initialWorkoutHistory,
    squad: mockSquadMembers,
  };
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(loadState());

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  const login = (name: string, avatarId: string) => {
    setState(s => ({
      ...s,
      user: { 
        ...initialMockProfile, 
        displayName: name, 
        avatarId,
        use3DVisualizer: true,
        enableComputerVision: false
      }
    }));
  };

  const logout = () => {
    setState(s => ({ ...s, user: null }));
  };

  const saveWorkout = (sessionData: Omit<WorkoutSession, 'id' | 'timestamp'>) => {
    const newSession: WorkoutSession = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setState(s => ({
      ...s,
      workoutHistory: [newSession, ...s.workoutHistory],
    }));
  };

  const updateVelocity = (newVelocity: number, newStreak: number) => {
    setState(s => {
      if (!s.user) return s;
      return {
        ...s,
        user: { ...s.user, velocity: newVelocity, streak: newStreak }
      };
    });
  };

  const updatePreferences = (use3D: boolean, useCV: boolean) => {
    setState(s => {
      if (!s.user) return s;
      return {
        ...s,
        user: { ...s.user, use3DVisualizer: use3D, enableComputerVision: useCV }
      };
    });
  };

  return (
    <AppContext.Provider value={{ state, login, logout, saveWorkout, updateVelocity, updatePreferences }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
