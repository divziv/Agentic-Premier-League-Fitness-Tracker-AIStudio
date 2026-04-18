/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  Wind, 
  Ghost, 
  Users, 
  ChevronRight, 
  MapPin, 
  Trophy, 
  Flame,
  Clock,
  ArrowLeft,
  Navigation,
  Calendar,
  Target,
  ChevronDown,
  MonitorPlay,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VelocityEngine, AdaptiveSuggestion, Difficulty, TargetArea, Exercise } from './lib/engines/velocity';
import { HapticEngine } from './lib/engines/haptic';
import { getGeminiOracleAdvice, getHypeMessage, generateExerciseVisual } from './services/geminiOracle';
import { format } from 'date-fns';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import AuthScreen from './components/Auth';

// --- Types ---
type AppMode = 'dashboard' | 'setup' | 'active_workout' | 'profile';

interface UserProfile {
  displayName: string;
  avatarId: string;
  velocity: number;
  streak: number;
}

const PROFILE_ICONS = [
  { id: 'zap', Icon: Zap },
  { id: 'activity', Icon: Activity },
  { id: 'flame', Icon: Flame },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
  { id: 'users', Icon: Users },
];

// --- Mock Defaults ---
const DEFAULT_GHOST_TRAIL = Array.from({ length: 120 }, (_, i) => ({
  time: i * 1,
  dist: i * 2.5 + Math.random() * 2
}));

const EXERCISE_LIBRARY: Record<TargetArea, string[]> = {
  'Legs': ['Goblet Squats', 'Lunges', 'Bulgarian Split Squats'],
  'Biceps': ['Hammer Curls', 'Barbell Curls', 'Preacher Curls'],
  'Core': ['Planks', 'Russian Twists', 'Hanging Leg Raises'],
  'Full Body': ['Burpees', 'Mountain Climbers', 'Deadlifts'],
  'Back': ['Pull Ups', 'Lat Pulldowns', 'Bent Over Rows'],
  'Chest': ['Push Ups', 'Bench Press', 'Chest Flys'],
};

// --- Main Application ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>('dashboard');
  
  // Metrics
  const [velocity, setVelocity] = useState(0.924);
  const [hrv, setHrv] = useState(54);
  const [availableTime, setAvailableTime] = useState(30);
  const [isRaining] = useState(false);
  
  // Setup State
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [selectedTarget, setSelectedTarget] = useState<TargetArea>('Legs');
  
  // Oracle & Hype State
  const [oracleAdvice, setOracleAdvice] = useState<string>('Analyzing your consistency vectors...');
  const [hypeMessage, setHypeMessage] = useState<string>('');
  const [loadingOracle, setLoadingOracle] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  const suggestion = useMemo(() => 
    VelocityEngine.getAdaptiveSuggestion(velocity, hrv, availableTime, isRaining),
    [velocity, hrv, availableTime, isRaining]
  );

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setUserProfile(null);
      }
    });
    return unsub;
  }, []);

  // Profile Listener
  useEffect(() => {
    if (currentUser) {
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          setVelocity(data.velocity || 0.92);
        }
      });
      return unsub;
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchOracle = async () => {
      setLoadingOracle(true);
      const advice = await getGeminiOracleAdvice({
        velocity,
        hrv,
        lastWorkoutType: 'HIIT',
        weather: 'Cloudy',
        timeAvailable: availableTime,
        squadProgress: 0.78
      });
      setOracleAdvice(advice);
      setLoadingOracle(false);
    };
    fetchOracle();
  }, [velocity, hrv, availableTime]);

  const handleStartSetup = () => setMode('setup');

  const handleBeginWorkout = async () => {
    setLoadingExercises(true);
    const hype = await getHypeMessage(userProfile?.displayName || 'Pilot', selectedTarget, selectedDifficulty);
    setHypeMessage(hype);

    const exerciseNames = EXERCISE_LIBRARY[selectedTarget];
    const pickedName = exerciseNames[Math.floor(Math.random() * exerciseNames.length)];
    const imageUrl = await generateExerciseVisual(pickedName);

    setSessionExercises([{
      name: pickedName,
      reps: selectedDifficulty === 'Easy' ? '3x8' : selectedDifficulty === 'Medium' ? '4x12' : '5x15',
      visualDescription: `Maintaining stability and tension through the full range of motion.`,
      imageUrl
    }]);

    setLoadingExercises(false);
    setMode('active_workout');
  };

  if (authLoading) return <div className="min-h-screen bg-aura-bg flex items-center justify-center"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="w-12 h-12 rounded-xl bg-aura-accent" /></div>;
  if (!currentUser) return <AuthScreen />;
  
  const ProfileIcon = PROFILE_ICONS.find(i => i.id === userProfile?.avatarId)?.Icon || Zap;

  return (
    <div className="min-h-screen bg-aura-bg flex text-white font-sans selection:bg-aura-accent selection:text-white">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-aura-surface border-r border-aura-border flex flex-col items-center py-6 gap-6 shrink-0 relative z-20">
        <div 
          className="w-12 h-12 rounded-2xl bg-aura-accent flex items-center justify-center font-black text-2xl shadow-xl shadow-aura-accent/30 cursor-pointer transition-transform active:scale-95" 
          onClick={() => setMode('dashboard')}
        >
          V
        </div>
        
        <div className="flex flex-col gap-4 mt-8">
          <button 
            onClick={() => setMode('dashboard')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mode === 'dashboard' ? 'bg-aura-accent text-white shadow-lg shadow-aura-accent/20' : 'bg-aura-card text-aura-text-secondary border border-aura-border hover:bg-aura-accent/10'}`}
          >
            <Activity size={20} />
          </button>
          
          <button 
            onClick={() => setMode('profile')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 ${mode === 'profile' ? 'border-aura-accent bg-aura-accent/10 text-aura-accent' : 'border-aura-border bg-aura-card text-aura-text-secondary hover:border-aura-accent/30'}`}
          >
            <ProfileIcon size={20} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-aura-card flex items-center justify-center text-aura-text-secondary border border-aura-border hover:bg-aura-accent/10 transition-colors cursor-pointer">
            <Trophy size={18} />
          </div>
          <button 
            onClick={() => auth.signOut()} 
            className="w-10 h-10 rounded-xl bg-aura-card flex items-center justify-center text-aura-text-secondary border border-aura-border hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
          >
            <ArrowLeft className="rotate-180" size={18} />
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {mode === 'dashboard' && (
          <Dashboard 
            velocity={velocity} 
            suggestion={suggestion}
            oracleAdvice={oracleAdvice}
            loadingOracle={loadingOracle}
            currentTime={currentTime}
            onStartSession={handleStartSetup}
            userProfile={userProfile}
          />
        )}
        {mode === 'setup' && (
          <WorkoutSetup 
            difficulty={selectedDifficulty}
            onSetDifficulty={setSelectedDifficulty}
            target={selectedTarget}
            onSetTarget={setSelectedTarget}
            onBegin={handleBeginWorkout}
            loading={loadingExercises}
            onBack={() => setMode('dashboard')}
          />
        )}
        {mode === 'active_workout' && (
          <ActiveWorkout 
            suggestion={suggestion}
            hypeMessage={hypeMessage}
            exercises={sessionExercises}
            onEndSession={() => setMode('dashboard')}
          />
        )}
        {mode === 'profile' && userProfile && (
          <ProfileSettings 
            userProfile={userProfile} 
            uid={currentUser.uid}
            onBack={() => setMode('dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ 
  velocity, 
  suggestion, 
  oracleAdvice, 
  loadingOracle,
  currentTime,
  onStartSession,
  userProfile
}: { 
  velocity: number;
  suggestion: AdaptiveSuggestion;
  oracleAdvice: string;
  loadingOracle: boolean;
  currentTime: Date;
  onStartSession: () => void;
  userProfile: UserProfile | null;
}) {
  const ProfileIcon = PROFILE_ICONS.find(i => i.id === userProfile?.avatarId)?.Icon || Zap;
  const [showMilestone, setShowMilestone] = useState(false);

  // Trigger milestone animation mock
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMilestone(true);
      HapticEngine.milestone();
      setTimeout(() => setShowMilestone(false), 5000);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-10 gap-8 overflow-y-auto relative"
    >
      <AnimatePresence>
        {showMilestone && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-aura-accent text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Squad Milestone Reached!</p>
              <p className="text-sm font-bold">500km Seasonal Goal Completed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Greeting */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-aura-surface border-2 border-aura-accent flex items-center justify-center text-aura-accent shadow-2xl shadow-aura-accent/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-aura-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ProfileIcon size={40} className="relative z-10" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-aura-green rounded-lg border-2 border-aura-card flex items-center justify-center">
               <Zap size={10} className="text-white fill-current" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">
              Welcome back, <span className="text-aura-accent">{userProfile?.displayName}</span>
            </h1>
            <div className="flex items-center gap-3 text-aura-text-secondary text-sm font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><Clock size={14} /> {format(currentTime, 'HH:mm')}</span>
              <span className="w-1 h-1 bg-aura-border rounded-full" />
              <span className="flex items-center gap-1 text-aura-green"><Flame size={14} /> {userProfile?.streak} Day Streak</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-black tracking-[2px] text-aura-text-secondary uppercase mb-2">System Status</div>
          <div className="px-4 py-2 rounded-xl bg-aura-surface border border-aura-border flex items-center gap-2 group cursor-default">
             <div className="w-2 h-2 rounded-full bg-aura-green animate-pulse shadow-[0_0_8px_var(--color-aura-green)]" />
             <span className="text-xs font-black tracking-tight text-white group-hover:text-aura-accent transition-colors">VANGUARD-7 SYNCED</span>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-[320px_1fr_300px] gap-6 flex-1 min-h-[500px]">
        {/* Consistency Velocity Card */}
        <div className="bg-aura-card border border-aura-border rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-aura-text-secondary">Consistency Velocity</span>
          <div className="text-5xl font-bold flex items-baseline gap-2">
            {(velocity * 100).toFixed(1)}
            <span className="text-lg font-normal text-aura-text-secondary">%</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-1.5 h-32 border-b border-aura-border pb-2">
            {[35, 48, 62, 75, 88, 95, 0].map((h, i) => {
              const isToday = i === 5;
              const isPrevious = i < 5;
              return (
                <div 
                  key={i} 
                  className={`w-full rounded-t-lg transition-all duration-1000 relative group overflow-hidden ${h > 0 ? (isToday ? 'bg-aura-green' : 'bg-aura-green/40') : 'bg-aura-border/20'}`}
                  style={{ 
                    height: `${h > 0 ? h : 12}%`,
                    opacity: h > 0 ? (isToday ? 1 : 0.7) : 0.2
                  }}
                >
                  {isToday && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/20 to-transparent h-1/2" />}
                  {isToday && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-aura-green blur-md -z-10" 
                    />
                  )}
                  {isPrevious && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-aura-green/30 to-transparent h-full opacity-50" />
                  )}
                  {isToday && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-aura-green whitespace-nowrap">NOW</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-aura-green opacity-80 border border-aura-bg" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-aura-green uppercase tracking-wider">Active Streak</span>
          </div>
        </div>

        {/* Oracle Central Container */}
        <div className="bg-aura-card border border-aura-accent rounded-[40px] p-8 flex flex-col oracle-gradient shadow-2xl shadow-aura-accent/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-aura-accent/20 rotate-12">
            <Zap size={120} />
          </div>
          <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-aura-accent mb-6 flex items-center gap-2">
            <Activity size={12} />
            Predictive AI Engine
          </span>
          <h2 className="text-4xl font-black mb-4 tracking-tighter">
            System Protocol
          </h2>
          <p className="text-aura-text-secondary mb-8 text-sm italic relative z-10">"{loadingOracle ? "Processing neural vectors..." : oracleAdvice}"</p>
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] text-aura-accent font-black tracking-[2px] uppercase mb-4">Optimal Vector</p>
            <h3 className="text-4xl font-black text-white mb-2 tracking-tighter">{suggestion.title}</h3>
            <p className="text-aura-text-secondary text-sm max-w-sm mx-auto mb-10 leading-relaxed font-medium">{suggestion.reason}</p>
            <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                <span className="text-[9px] font-black text-aura-text-secondary uppercase mb-1">Duration</span>
                <span className="text-lg font-black text-white">{suggestion.duration}m</span>
              </div>
              <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                <span className="text-[9px] font-black text-aura-text-secondary uppercase mb-1">Intensity</span>
                <span className="text-lg font-black text-aura-accent">{suggestion.intensity}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onStartSession}
            className="mt-8 bg-aura-accent hover:bg-aura-accent/90 transition-colors py-6 rounded-2xl font-black text-base tracking-tighter shadow-xl shadow-aura-accent/25 ring-2 ring-white/10"
          >
            INITIALIZE SESSION
          </button>
        </div>

        {/* Right column: Social Ghost & Squad */}
        <div className="flex flex-col gap-6">
          <div className="bg-aura-card border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] uppercase tracking-[2px] font-black text-aura-text-secondary">Rival Delta</span>
              <Ghost size={16} className="text-aura-orange" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-aura-orange tracking-tighter">+0:02.4</span>
              <span className="text-xs font-bold text-aura-text-secondary opacity-60 uppercase">Ahead</span>
            </div>
            <div className="h-2 bg-aura-surface rounded-full mt-2 relative overflow-hidden border border-white/5">
              <motion.div 
                animate={{ x: ['-100%', '0%'] }}
                className="absolute inset-y-0 left-0 bg-aura-orange w-[65%] rounded-full shadow-[0_0_12px_var(--color-aura-orange)]" 
              />
            </div>
            <p className="text-[10px] text-aura-text-secondary font-medium tracking-tight">Your consistency is outpacing last Monday's session by 4.2%.</p>
          </div>

          <div className="bg-aura-card border border-aura-border rounded-3xl p-6 flex flex-col flex-1 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] uppercase tracking-[1.5px] font-black text-aura-text-secondary">Squad Vanguard</span>
              <div className="flex -space-x-2">
                {[12, 45, 89, 23, 67].map(i => (
                  <div key={i} className="w-7 h-7 rounded-lg bg-aura-surface border-2 border-aura-card overflow-hidden ring-1 ring-white/10">
                    <img src={`https://picsum.photos/seed/${i}/40/40`} referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-aura-accent/10 p-4 rounded-2xl border border-aura-accent/20 mb-6 flex items-start gap-3">
              <Zap size={14} className="text-aura-accent shrink-0 mt-1" />
              <div>
                <p className="text-[9px] text-aura-accent font-black tracking-widest uppercase mb-0.5">Active Boost</p>
                <p className="text-white text-[11px] font-bold leading-tight">Shared XP multiplier active for the next 45 minutes.</p>
              </div>
            </div>

            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative">
              <div className="bg-aura-surface px-4 py-3 text-[10px] font-black border-b border-white/5 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Navigation size={10} className="text-aura-accent" />
                  SQUAD COLLECTIVE: NEOM COAST
                </span>
                <span className="text-aura-green tracking-widest uppercase text-[9px]">84.2% GOAL</span>
              </div>
              
              <div className="flex-1 relative p-4 group overflow-hidden">
                 {/* Better Squad Map visualization */}
                 <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/400/300?blur=10')] opacity-10" />
                 <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full p-6">
                    <defs>
                      <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--color-aura-accent)" stopOpacity="0.2" />
                        <stop offset="84%" stopColor="var(--color-aura-accent)" stopOpacity="1" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 10 80 Q 30 10, 60 50 T 130 30 T 190 70" 
                      stroke="url(#pathGrad)" 
                      fill="none" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                    />
                    <motion.circle 
                      cx="145" cy="40" r="4" 
                      fill="white" 
                      className="shadow-[0_0_12px_white]"
                      animate={{ r: [4, 6, 4] }}
                      transition={{ repeat: Infinity }}
                    />
                    <circle cx="10" cy="80" r="3" fill="var(--color-aura-accent)" />
                    <circle cx="190" cy="70" r="3" fill="rgba(255,255,255,0.2)" />
                 </svg>
                 
                 <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold">
                    DESTINATION: VIRTUAL GOA
                 </div>
                 
                 <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-aura-text-secondary uppercase">Progress</span>
                      <span className="text-xs font-black">1,842.5 KM</span>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-aura-text-secondary uppercase font-bold">Milestones</span>
                    <span className="text-xs font-black">12/15 Completed</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] text-aura-text-secondary uppercase font-bold">Squad Rank</span>
                    <span className="text-xs font-black text-aura-accent">Top 12%</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

// --- Workout Setup Component ---
function WorkoutSetup({ 
  difficulty, 
  onSetDifficulty, 
  target, 
  onSetTarget, 
  onBegin,
  loading,
  onBack 
}: { 
  difficulty: Difficulty;
  onSetDifficulty: (d: Difficulty) => void;
  target: TargetArea;
  onSetTarget: (t: TargetArea) => void;
  onBegin: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <motion.main 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col p-10 max-w-3xl mx-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-aura-text-secondary hover:text-white transition-colors mb-8">
        <ArrowLeft size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Overview</span>
      </button>

      <h1 className="text-4xl font-black mb-10 tracking-tighter">Configure Next Protocol</h1>

      <div className="space-y-12">
        {/* Difficulty Select */}
        <section>
          <p className="text-xs font-black text-aura-accent uppercase tracking-[2px] mb-6">Select Intensity Level</p>
          <div className="grid grid-cols-3 gap-4">
            {(['Easy', 'Medium', 'Difficult'] as Difficulty[]).map(d => (
              <button 
                key={d}
                onClick={() => onSetDifficulty(d)}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center ${difficulty === d ? 'bg-aura-accent border-aura-accent shadow-xl shadow-aura-accent/20' : 'bg-aura-card border-aura-border opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-3 h-3 rounded-full mb-4 ${d === 'Easy' ? 'bg-green-400' : d === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="font-bold text-sm tracking-tight">{d}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Target Area Select */}
        <section>
          <p className="text-xs font-black text-aura-accent uppercase tracking-[2px] mb-6">Select Target Vector</p>
          <div className="grid grid-cols-3 gap-4">
            {(['Legs', 'Biceps', 'Core', 'Full Body', 'Back', 'Chest'] as TargetArea[]).map(t => (
              <button 
                key={t}
                onClick={() => onSetTarget(t)}
                className={`p-5 rounded-xl border transition-all duration-300 text-left ${target === t ? 'bg-aura-surface border-aura-accent ring-1 ring-aura-accent' : 'bg-aura-card border-aura-border opacity-60 hover:opacity-100'}`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">{t}</span>
              </button>
            ))}
          </div>
        </section>

        <button 
          onClick={onBegin}
          disabled={loading}
          className="w-full bg-white py-6 rounded-2xl text-aura-bg font-black text-xl tracking-tighter hover:scale-[1.01] transition-transform flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? "Generating Visuals..." : "INITIATE SESSION"}
          {!loading && <MonitorPlay size={20} />}
        </button>
      </div>
    </motion.main>
  );
}

// --- Active Workout Screen ---
function ActiveWorkout({ 
  suggestion, 
  onEndSession,
  hypeMessage,
  exercises
}: { 
  suggestion: AdaptiveSuggestion;
  onEndSession: () => void;
  hypeMessage: string;
  exercises: Exercise[];
}) {
  const [elapsed, setElapsed] = useState(0);
  const [dist, setDist] = useState(0);
  const [isAhead, setIsAhead] = useState(true);
  const [delta, setDelta] = useState(2.4);
  const [lastHapticState, setLastHapticState] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
      const randomGain = 1.8 + Math.random() * 1.5;
      setDist(d => d + randomGain);
      
      const ghostPoint = DEFAULT_GHOST_TRAIL.find(p => p.time >= elapsed + 1) || DEFAULT_GHOST_TRAIL[DEFAULT_GHOST_TRAIL.length-1];
      const newDelta = (dist + randomGain) - ghostPoint.dist;
      setDelta(Number(Math.abs(newDelta).toFixed(1)));
      const nowAhead = newDelta >= 0;
      
      // Haptic Feedback Logic
      if (nowAhead !== lastHapticState) {
        if (nowAhead) {
          HapticEngine.ahead();
        } else {
          HapticEngine.behind();
        }
        setLastHapticState(nowAhead);
      }
      
      setIsAhead(nowAhead);
    }, 1000);

    return () => clearInterval(timer);
  }, [elapsed, dist, lastHapticState]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex-1 flex flex-col p-12 transition-colors duration-700 ${isAhead ? 'bg-aura-surface' : 'bg-aura-bg'}`}
    >
      <div className="flex justify-between items-center mb-10">
        <button 
          onClick={onEndSession} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-aura-card border border-aura-border hover:bg-aura-surface transition-all active:scale-95 shadow-lg"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-black uppercase tracking-widest">Abort Protocol</span>
        </button>

        <div className="bg-aura-accent/10 px-6 py-3 rounded-full border border-aura-accent/20 text-xs font-black text-aura-accent flex items-center gap-3">
          <Zap size={14} />
          "{hypeMessage}"
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-aura-text-secondary uppercase tracking-[2px]">Competition Status</p>
            <p className={`text-xs font-black uppercase ${isAhead ? 'text-aura-green' : 'text-aura-orange'}`}>
              {isAhead ? 'Velocity Advantage' : 'Recovering Deficit'}
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full ${isAhead ? 'bg-aura-green shadow-[0_0_15px_var(--color-aura-green)]' : 'bg-aura-orange shadow-[0_0_15px_var(--color-aura-orange)]'} animate-pulse`} />
        </div>
      </div>

      <div className="flex-1 flex gap-12">
        <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
               {exercises.map((ex, i) => (
                 <motion.div 
                   initial={{ y: 40, opacity: 0 }} 
                   animate={{ y: 0, opacity: 1 }} 
                   key={i} 
                   className="bg-aura-card border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden"
                 >
                    <div className="absolute top-0 left-0 w-1 h-full bg-aura-accent opacity-50" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-aura-accent font-black text-[11px] tracking-[3px] uppercase mb-3">Core Engagement Sequence</p>
                        <h2 className="text-5xl font-black tracking-tighter">{ex.name}</h2>
                        <div className="flex items-center gap-4 mt-3">
                           <span className="bg-aura-surface border border-aura-border px-3 py-1 rounded-lg text-xs font-black text-white">{ex.reps}</span>
                           <span className="text-aura-text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Heart size={10} className="text-aura-red" /> 142 BPM</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <MonitorPlay size={32} className="text-aura-text-secondary" />
                      </div>
                    </div>
                    
                    <div className="aspect-video w-full rounded-3xl bg-black overflow-hidden ring-4 ring-white/[0.03] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                      {ex.imageUrl ? (
                        <img src={ex.imageUrl} className="w-full h-full object-cover" alt={ex.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-aura-border">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}><Zap size={48} /></motion.div>
                          <span className="font-black text-sm tracking-widest uppercase opacity-40">Rasterizing Engine...</span>
                        </div>
                      )}
                    </div>

                    <p className="text-aura-text-secondary text-sm leading-relaxed font-medium italic border-l-4 border-aura-accent/30 pl-6 py-2">
                       {ex.visualDescription}
                    </p>
                 </motion.div>
               ))}
            </div>

            <div className="flex gap-20 pb-8 mt-12 bg-aura-surface/50 p-10 rounded-[32px] border border-white/5">
              <div>
                <p className="text-aura-text-secondary font-black uppercase tracking-[3px] text-[10px] mb-3">Network Traversal</p>
                <h4 className="text-8xl font-black text-white leading-none tracking-tighter tabular-nums flex items-baseline gap-4">
                    {(dist / 1000).toFixed(2)}
                    <span className="text-2xl text-aura-text-secondary font-black opacity-30 italic">KM</span>
                </h4>
              </div>
              <div className="flex gap-16">
                <div>
                    <p className="text-aura-text-secondary font-black uppercase tracking-[3px] text-[10px] mb-3">Uptime</p>
                    <p className="text-4xl font-black font-mono text-white tabular-nums tracking-tighter">{formatTime(elapsed)}</p>
                </div>
                <div>
                    <p className="text-aura-text-secondary font-black uppercase tracking-[3px] text-[10px] mb-3">Sync Power</p>
                    <p className={`text-4xl font-black tracking-tighter ${isAhead ? 'text-aura-green' : 'text-aura-orange'}`}>
                    {isAhead ? '100%' : '82.4%'}
                    </p>
                </div>
              </div>
            </div>
        </div>

        <div className="w-[420px] space-y-6 flex flex-col pt-10">
           {/* Ghost Card Pod */}
            <div className={`bg-aura-card border-2 transition-colors duration-500 rounded-[60px] p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ${isAhead ? 'border-aura-green/20' : 'border-aura-orange/20'}`}>
                <div className={`absolute inset-0 opacity-10 ${isAhead ? 'bg-aura-green' : 'bg-aura-orange'}`} />
                <motion.div
                  animate={{ scale: isAhead ? [1, 1.1, 1] : 1, y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Ghost size={80} className={`${isAhead ? 'text-aura-green' : 'text-aura-orange'} mb-8 drop-shadow-[0_0_20px_currentColor]`} strokeWidth={2.5} />
                </motion.div>
                <p className="text-aura-text-secondary font-black uppercase tracking-[4px] text-[10px] mb-2">
                    GHOST SYNCHRONANT
                </p>
                <div className="flex items-center justify-center gap-2">
                    <h3 className={`text-8xl font-black ${isAhead ? 'text-aura-green' : 'text-aura-orange'} tabular-nums tracking-tighter`}>
                        {isAhead ? '+' : '-'}{delta}
                    </h3>
                    <span className="text-2xl text-aura-text-secondary font-black self-end mb-4 italic opacity-40">M</span>
                </div>
                <div className={`mt-6 px-6 py-2 rounded-full font-black text-[10px] tracking-[2px] uppercase ${isAhead ? 'bg-aura-green/10 text-aura-green' : 'bg-aura-orange/10 text-aura-orange'}`}>
                    {isAhead ? 'Protocol Dominance' : 'Reacquisition Mode'}
                </div>
            </div>

            {/* Live Squad Status */}
            <div className="bg-aura-card border border-white/5 rounded-[48px] p-10 flex flex-col flex-1 shadow-2xl">
                <span className="text-[11px] uppercase tracking-[3px] font-black text-aura-text-secondary mb-8">Squad Live Vectors</span>
                <div className="space-y-6">
                   {[
                     { name: 'VALKYRIE', stat: '1.2km', active: true, color: '#4D96FF' },
                     { name: 'ORION', stat: '0.4km', active: true, color: '#00F5A0' },
                     { name: 'ECHO', stat: 'Standby', active: false, color: '#8F9BB3' },
                   ].map(m => (
                     <div key={m.name} className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                               <Users size={16} style={{ color: m.color }} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black tracking-tight">{m.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1 h-1 rounded-full ${m.active ? 'bg-aura-green' : 'bg-aura-text-secondary opacity-30'}`} />
                                  <span className="text-[9px] font-bold text-aura-text-secondary uppercase">{m.active ? 'Sync Online' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-black font-mono text-aura-text-secondary bg-white/5 px-2 py-1 rounded select-none">{m.stat}</span>
                     </div>
                   ))}
                </div>
                
                <div className="mt-auto pt-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[3px] mb-4">
                        <span className="text-aura-text-secondary">Collective Progress</span>
                        <span className="text-aura-accent">4.8km Delta</span>
                    </div>
                    <div className="h-1.5 bg-aura-surface rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <motion.div 
                          animate={{ x: ['-100%', '0%'] }}
                          transition={{ duration: 1.5 }}
                          className="h-full bg-aura-accent rounded-full shadow-[0_0_15px_var(--color-aura-accent)]" 
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <button 
        onClick={onEndSession}
        className="mt-10 w-full max-w-md mx-auto bg-white hover:bg-aura-green hover:text-aura-bg transition-all py-7 rounded-3xl text-aura-bg font-black text-xl tracking-tighter shadow-2xl hover:scale-[1.02] active:scale-95"
      >
        SYNC PROTOCOL DATA
      </button>
    </motion.div>
  );
}

// --- Profile Settings Component ---
function ProfileSettings({ 
  userProfile, 
  uid, 
  onBack 
}: { 
  userProfile: UserProfile;
  uid: string;
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [avatarId, setAvatarId] = useState(userProfile.avatarId);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName,
        avatarId,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col p-12 max-w-4xl mx-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-aura-text-secondary hover:text-white transition-all mb-12 self-start bg-aura-card px-4 py-2 rounded-xl border border-aura-border shadow-lg active:scale-95">
        <ArrowLeft size={16} />
        <span className="text-xs font-black uppercase tracking-[2px]">Return to Engine</span>
      </button>

      <div className="bg-aura-card border border-aura-border rounded-[48px] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-aura-accent/10 blur-[120px] -z-10" />
        
        <header className="mb-12">
          <h2 className="text-5xl font-black tracking-tighter mb-2">Protocol Customization</h2>
          <p className="text-aura-text-secondary font-medium italic">Adjust your pilot identity and core visual signature.</p>
        </header>

        <section className="grid grid-cols-2 gap-16">
          <div className="space-y-10">
            <div>
              <label className="text-[11px] font-black uppercase tracking-[4px] text-aura-accent mb-4 block">Pilot Designation</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-aura-surface border-2 border-aura-border rounded-2xl px-6 py-4 text-lg font-bold focus:border-aura-accent outline-none transition-all shadow-inner"
                  placeholder="Designate yourself..."
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-aura-accent transition-all">
                   <Target size={24} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-[4px] text-aura-accent mb-6 block">Core Visual Identity</label>
              <div className="grid grid-cols-3 gap-4">
                {PROFILE_ICONS.map(({ id, Icon }) => (
                  <button 
                    key={id}
                    onClick={() => setAvatarId(id)}
                    className={`aspect-square rounded-[32px] border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-90 ${avatarId === id ? 'bg-aura-accent border-aura-accent text-white shadow-2xl shadow-aura-accent/30' : 'bg-aura-surface border-aura-border text-aura-text-secondary hover:border-aura-accent/30'}`}
                  >
                    <Icon size={32} strokeWidth={avatarId === id ? 2.5 : 2} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-black/20 rounded-[40px] border border-white/5 p-10 flex-1 flex flex-col items-center justify-center text-center">
               <div className="w-32 h-32 rounded-[40px] bg-aura-surface border-4 border-aura-accent/20 flex items-center justify-center text-aura-accent shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-8 relative">
                  {React.createElement(PROFILE_ICONS.find(i => i.id === avatarId)?.Icon || Zap, { size: 64 })}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-[-10px] border border-aura-accent/10 rounded-[50px] border-dashed" 
                  />
               </div>
               <h3 className="text-2xl font-black mb-2">{displayName}</h3>
               <p className="text-xs text-aura-text-secondary font-black tracking-widest uppercase opacity-40">Pilot Preview</p>
               
               <div className="mt-12 w-full grid grid-cols-2 gap-4">
                 <div className="bg-aura-surface p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-aura-accent uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold">READY</p>
                 </div>
                 <div className="bg-aura-surface p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-aura-accent uppercase tracking-widest mb-1">Assigned</p>
                    <p className="text-sm font-bold">VANGUARD-7</p>
                 </div>
               </div>
            </div>

            <button 
              onClick={handleUpdate}
              disabled={loading}
              className={`mt-10 py-6 rounded-3xl font-black text-xl tracking-tighter transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl ${success ? 'bg-aura-green text-aura-bg' : 'bg-white text-aura-bg hover:bg-aura-accent hover:text-white'}`}
            >
              {loading ? 'SYNCING...' : success ? 'PROTOCOL UPDATED' : 'COMMIT CHANGES'}
              {success ? <Zap size={20} className="fill-current" /> : <ChevronRight size={20} />}
            </button>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
