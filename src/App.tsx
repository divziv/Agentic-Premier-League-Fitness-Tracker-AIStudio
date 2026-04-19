import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  Wind, 
  Ghost, 
  Users, 
  MapPin, 
  Trophy, 
  Flame,
  Clock,
  ArrowLeft,
  Navigation,
  Calendar,
  Target,
  MonitorPlay,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty, TargetArea, Exercise } from './lib/engines/velocity';
import { HapticEngine } from './lib/engines/haptic';
import { format } from 'date-fns';

// Offline engines & store
import { useAppStore, UserProfile } from './data/store';
import { calculateConsistencyVelocity } from './engine/consistencyVelocity';
import { getOracleRecommendation, getHypeMessage } from './engine/oracle';
import { getSimulatedTimeContext } from './engine/contextSim';
import AuthScreen from './components/Auth';
import Visualizer3D from './features/Vision/Visualizer3D';
import PoseDetector from './features/Vision/PoseDetector';

// --- Types ---
type AppMode = 'dashboard' | 'setup' | 'active_workout' | 'profile' | 'squad';

const PROFILE_ICONS = [
  { id: 'zap', Icon: Zap },
  { id: 'activity', Icon: Activity },
  { id: 'flame', Icon: Flame },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
  { id: 'users', Icon: Users },
];

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
  const { state, logout, saveWorkout, updateVelocity } = useAppStore();
  const [mode, setMode] = useState<AppMode>('dashboard');
  
  // Metrics Simulators
  const [hrv, setHrv] = useState(54);
  const [availableTime, setAvailableTime] = useState(30);
  const [location, setLocation] = useState<'Home' | 'Gym'>('Home');

  // Engine Derived State
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Setup State
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [selectedTarget, setSelectedTarget] = useState<TargetArea>('Legs');
  
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  
  // Calculate Velocity locally
  const cvData = useMemo(() => {
    return calculateConsistencyVelocity(state.workoutHistory, state.user?.streak || 0);
  }, [state.workoutHistory, state.user?.streak]);

  // Sync velocity back to user profile if it changed significantly
  useEffect(() => {
    if (state.user && Math.abs(state.user.velocity - cvData.score) > 1) {
      updateVelocity(cvData.score, state.user.streak);
    }
  }, [cvData.score, state.user, updateVelocity]);

  // Local Oracle Recommendation
  const suggestion = useMemo(() => {
    const energyLevel = hrv > 60 ? 'High' : hrv < 40 ? 'Low' : 'Medium';
    return getOracleRecommendation(energyLevel, availableTime, location, selectedTarget, cvData.score);
  }, [hrv, availableTime, location, selectedTarget, cvData.score]);

  // Local Hype Message
  const hypeMessage = useMemo(() => {
    return getHypeMessage(cvData.state, state.user?.streak || 0);
  }, [cvData.state, state.user?.streak]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartSetup = () => setMode('setup');

  const handleBeginWorkout = () => {
    const exerciseNames = EXERCISE_LIBRARY[selectedTarget];
    const pickedName = exerciseNames[Math.floor(Math.random() * exerciseNames.length)];
    
    setSessionExercises([{
      name: pickedName,
      reps: selectedDifficulty === 'Easy' ? '3x8' : selectedDifficulty === 'Medium' ? '4x12' : '5x15',
      visualDescription: `Maintaining stability and tension through the full range of motion. Focus on form over speed.`,
    }]);

    setMode('active_workout');
  };

  const handleEndWorkout = (duration: number) => {
    saveWorkout({
      duration,
      difficulty: selectedDifficulty,
      target: selectedTarget,
      completed: true
    });
    // Give a bump to streak
    updateVelocity(cvData.score, (state.user?.streak || 0) + 1);
    setMode('dashboard');
  };

  if (!state.user) return <AuthScreen />;
  
  const ProfileIcon = PROFILE_ICONS.find(i => i.id === state.user?.avatarId)?.Icon || Zap;

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
            onClick={() => setMode('squad')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mode === 'squad' ? 'bg-aura-accent text-white shadow-lg shadow-aura-accent/20' : 'bg-aura-card text-aura-text-secondary border border-aura-border hover:bg-aura-accent/10'}`}
          >
            <Users size={20} />
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
            onClick={logout} 
            className="w-10 h-10 rounded-xl bg-aura-card flex items-center justify-center text-aura-text-secondary border border-aura-border hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
          >
            <ArrowLeft className="rotate-180" size={18} />
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {mode === 'dashboard' && (
          <Dashboard 
            cvScore={cvData.score}
            cvState={cvData.state}
            suggestion={suggestion}
            hypeMessage={hypeMessage}
            currentTime={currentTime}
            onStartSession={handleStartSetup}
            userProfile={state.user}
            hrv={hrv}
            setHrv={setHrv}
            availableTime={availableTime}
            setAvailableTime={setAvailableTime}
            location={location}
            setLocation={setLocation}
          />
        )}
        {mode === 'setup' && (
          <WorkoutSetup 
            difficulty={selectedDifficulty}
            onSetDifficulty={setSelectedDifficulty}
            target={selectedTarget}
            onSetTarget={setSelectedTarget}
            onBegin={handleBeginWorkout}
            onBack={() => setMode('dashboard')}
          />
        )}
        {mode === 'active_workout' && (
          <ActiveWorkout 
            suggestion={suggestion}
            hypeMessage={hypeMessage}
            exercises={sessionExercises}
            onEndSession={handleEndWorkout}
            use3DVisualizer={state.user.use3DVisualizer}
            enableComputerVision={state.user.enableComputerVision}
          />
        )}
        {mode === 'profile' && (
          <ProfileSettings onBack={() => setMode('dashboard')} />
        )}
        {mode === 'squad' && (
          <SquadRoster onBack={() => setMode('dashboard')} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ 
  cvScore,
  cvState,
  suggestion, 
  hypeMessage, 
  currentTime,
  onStartSession,
  userProfile,
  hrv,
  setHrv,
  availableTime,
  setAvailableTime,
  location,
  setLocation
}: { 
  cvScore: number;
  cvState: string;
  suggestion: any;
  hypeMessage: string;
  currentTime: Date;
  onStartSession: () => void;
  userProfile: UserProfile;
  hrv: number;
  setHrv: (v: number) => void;
  availableTime: number;
  setAvailableTime: (v: number) => void;
  location: 'Home' | 'Gym';
  setLocation: (loc: 'Home' | 'Gym') => void;
}) {
  const ProfileIcon = PROFILE_ICONS.find(i => i.id === userProfile?.avatarId)?.Icon || Zap;
  const timeContext = getSimulatedTimeContext();

  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-10 gap-8 overflow-y-auto relative"
    >
      {/* Header with Greeting */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-aura-surface border-2 border-aura-accent flex items-center justify-center text-aura-accent shadow-2xl shadow-aura-accent/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-aura-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ProfileIcon size={40} className="relative z-10" />
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
          <div className="text-[10px] font-black tracking-[2px] text-aura-text-secondary uppercase mb-2">Offline Mode</div>
          <div className="px-4 py-2 rounded-xl bg-aura-surface border border-aura-border flex items-center gap-2 group cursor-default">
             <div className="w-2 h-2 rounded-full bg-aura-green animate-pulse shadow-[0_0_8px_var(--color-aura-green)]" />
             <span className="text-xs font-black tracking-tight text-white group-hover:text-aura-accent transition-colors">LOCAL DATA SYNCED</span>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-[320px_1fr_300px] gap-6 flex-1 min-h-[500px]">
        {/* Consistency Velocity Card */}
        <div className="bg-aura-card border border-aura-border rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-aura-text-secondary">Consistency Velocity</span>
          <div className="text-5xl font-bold flex items-baseline gap-2">
            {cvScore.toFixed(1)}
            <span className="text-lg font-normal text-aura-text-secondary">/ 100</span>
          </div>
          
          <div className="text-sm font-bold uppercase tracking-wider text-aura-accent">
            Momentum: {cvState}
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-1.5 h-32 border-b border-aura-border pb-2 mt-4">
            {[35, 48, 62, 75, cvScore, 0, 0].map((h, i) => {
              const isToday = i === 4;
              const isPrevious = i < 4;
              return (
                <div 
                  key={i} 
                  className={`w-full rounded-t-lg transition-all duration-1000 relative group overflow-hidden ${h > 0 ? (isToday ? 'bg-aura-green' : 'bg-aura-green/40') : 'bg-aura-border/20'}`}
                  style={{ 
                    height: `${h > 0 ? Math.min(100, h) : 12}%`,
                    opacity: h > 0 ? (isToday ? 1 : 0.7) : 0.2
                  }}
                >
                  {isToday && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/20 to-transparent h-1/2" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Oracle Central Container */}
        <div className="bg-aura-card border border-aura-accent rounded-[40px] p-8 flex flex-col oracle-gradient shadow-2xl shadow-aura-accent/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-aura-accent/20 rotate-12">
            <Zap size={120} />
          </div>
          <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-aura-accent mb-6 flex items-center gap-2">
            <Activity size={12} />
            Predictive AI Engine (Local)
          </span>
          <h2 className="text-4xl font-black mb-4 tracking-tighter">
            {timeContext.timeOfDay} Protocol
          </h2>
          <p className="text-aura-text-secondary mb-8 text-sm italic relative z-10">"{hypeMessage}"</p>
          
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

        {/* Right column: Simulator Constraints */}
        <div className="flex flex-col gap-6">
          <div className="bg-aura-card border border-aura-border rounded-3xl p-6 flex flex-col flex-1 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] uppercase tracking-[1.5px] font-black text-aura-text-secondary">Simulated Environment</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                   <span>Readiness (HRV)</span>
                   <span className={hrv < 40 ? 'text-aura-red' : 'text-aura-green'}>{hrv} MS</span>
                </div>
                <input 
                  type="range" min="20" max="100" value={hrv} 
                  onChange={(e) => setHrv(parseInt(e.target.value))}
                  className="w-full h-1 bg-aura-surface rounded-full appearance-none accent-aura-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                   <span>Uptime (Time)</span>
                   <span>{availableTime} MIN</span>
                </div>
                <input 
                  type="range" min="10" max="90" value={availableTime} 
                  onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                  className="w-full h-1 bg-aura-surface rounded-full appearance-none accent-aura-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => setLocation('Home')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${location === 'Home' ? 'bg-aura-accent border-aura-accent text-white shadow-lg' : 'bg-aura-surface border-aura-border text-aura-text-secondary opacity-60'}`}
                >
                  Home Fence
                </button>
                <button 
                  onClick={() => setLocation('Gym')}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${location === 'Gym' ? 'bg-aura-accent border-aura-accent text-white shadow-lg' : 'bg-aura-surface border-aura-border text-aura-text-secondary opacity-60'}`}
                >
                  Gym Fence
                </button>
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
  onBack 
}: { 
  difficulty: Difficulty;
  onSetDifficulty: (d: Difficulty) => void;
  target: TargetArea;
  onSetTarget: (t: TargetArea) => void;
  onBegin: () => void;
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
          className="w-full bg-white py-6 rounded-2xl text-aura-bg font-black text-xl tracking-tighter hover:scale-[1.01] transition-transform flex items-center justify-center gap-4"
        >
          INITIATE SESSION
          <MonitorPlay size={20} />
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
  exercises,
  use3DVisualizer,
  enableComputerVision
}: { 
  suggestion: any;
  onEndSession: (duration: number) => void;
  hypeMessage: string;
  exercises: Exercise[];
  use3DVisualizer: boolean;
  enableComputerVision: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [dist, setDist] = useState(0);
  const [isAhead, setIsAhead] = useState(true);
  const [delta, setDelta] = useState(2.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
      const randomGain = 1.8 + Math.random() * 1.5;
      setDist(d => d + randomGain);
      
      const ghostPoint = DEFAULT_GHOST_TRAIL.find(p => p.time >= elapsed + 1) || DEFAULT_GHOST_TRAIL[DEFAULT_GHOST_TRAIL.length-1];
      const newDelta = (dist + randomGain) - ghostPoint.dist;
      setDelta(Number(Math.abs(newDelta).toFixed(1)));
      setIsAhead(newDelta >= 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [elapsed, dist]);

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
          onClick={() => onEndSession(elapsed)} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-aura-card border border-aura-border hover:bg-aura-surface transition-all active:scale-95 shadow-lg"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-black uppercase tracking-widest">End Protocol</span>
        </button>

        <div className="bg-aura-accent/10 px-6 py-3 rounded-full border border-aura-accent/20 text-xs font-black text-aura-accent flex items-center gap-3">
          <Zap size={14} />
          "{hypeMessage}"
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
                        <h2 className="text-5xl font-black tracking-tighter">{ex.name}</h2>
                        <div className="flex items-center gap-4 mt-3">
                           <span className="bg-aura-surface border border-aura-border px-3 py-1 rounded-lg text-xs font-black text-white">{ex.reps}</span>
                           <span className="text-aura-text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Heart size={10} className="text-aura-red" /> 142 BPM</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="aspect-video w-full rounded-3xl bg-aura-surface flex items-center justify-center border border-white/10 overflow-hidden ring-4 ring-white/[0.03] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                        {enableComputerVision ? (
                          <PoseDetector />
                        ) : use3DVisualizer ? (
                          <Visualizer3D activeExercise={ex.name} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-aura-border">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}><Zap size={48} /></motion.div>
                            <span className="font-black text-sm tracking-widest uppercase opacity-40">Rasterizing Local Guide...</span>
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
              <div className="flex gap-16">
                <div>
                    <p className="text-aura-text-secondary font-black uppercase tracking-[3px] text-[10px] mb-3">Uptime</p>
                    <p className="text-4xl font-black font-mono text-white tabular-nums tracking-tighter">{formatTime(elapsed)}</p>
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
                    LOCAL GHOST SYNCHRONANT
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
        </div>
      </div>
    </motion.div>
  );
}

// --- Squad Component (Local Mock) ---
function SquadRoster({ onBack }: { onBack: () => void }) {
  const { state } = useAppStore();
  
  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-10 overflow-y-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-aura-text-secondary hover:text-white transition-colors mb-8">
        <ArrowLeft size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Overview</span>
      </button>

      <h1 className="text-4xl font-black tracking-tighter mb-10">Simulated Squad Vector</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {state.squad.map((member) => {
          const Icon = PROFILE_ICONS.find(i => i.id === member.avatarId)?.Icon || Users;
          return (
            <div key={member.id} className="bg-aura-card border border-aura-border rounded-3xl p-6 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-aura-surface flex items-center justify-center text-aura-accent">
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl">{member.name}</h3>
                <p className="text-aura-text-secondary text-sm">Activity Level: {member.activityLevel}%</p>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 rounded-full bg-aura-green animate-pulse inline-block mb-1" />
                <p className="text-[10px] font-black uppercase tracking-widest text-aura-text-secondary">Simulated Sync</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.main>
  );
}
