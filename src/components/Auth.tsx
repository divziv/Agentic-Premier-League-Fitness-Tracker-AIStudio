import React, { useState } from 'react';
import { 
  auth, 
  db 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Zap, Activity, Flame, Target, Trophy, Users, Mail, Lock, Chrome } from 'lucide-react';

const PROFILE_ICONS = [
  { id: 'zap', Icon: Zap },
  { id: 'activity', Icon: Activity },
  { id: 'flame', Icon: Flame },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
  { id: 'users', Icon: Users },
];

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('zap');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: displayName || 'Pilot',
          avatarId: selectedIcon,
          email,
          velocity: 0.92,
          streak: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if profile exists
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: result.user.displayName || 'Pilot',
          avatarId: 'zap',
          email: result.user.email,
          velocity: 0.92,
          streak: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-6 text-white font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-aura-card border border-aura-border p-10 rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-aura-accent/10 blur-[100px] -z-10" />
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-aura-accent flex items-center justify-center shadow-2xl shadow-aura-accent/30 mb-4">
            <Zap size={32} className="fill-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-2">Aura Consistency</h2>
          <p className="text-aura-text-secondary text-sm">Secure your protocol data across the network.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-2 block">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-aura-surface border border-aura-border rounded-xl px-4 py-3 text-sm focus:border-aura-accent outline-none"
                  placeholder="e.g. Maverick"
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-3 block">Profile Core Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {PROFILE_ICONS.map(({ id, Icon }) => (
                    <button 
                      key={id}
                      type="button"
                      onClick={() => setSelectedIcon(id)}
                      className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${selectedIcon === id ? 'bg-aura-accent border-aura-accent text-white shadow-lg' : 'bg-aura-surface border-aura-border text-aura-text-secondary'}`}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-text-secondary" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-aura-surface border border-aura-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-aura-accent outline-none"
                placeholder="pilot@aura.net"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-text-secondary" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-aura-surface border border-aura-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-aura-accent outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-aura-bg py-4 rounded-xl font-black text-lg tracking-tighter hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'BOOT SYSTEM' : 'INITIALIZE PROTOCOL'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-aura-border"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-aura-text-secondary uppercase">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-aura-border"></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full bg-aura-surface border border-aura-border py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/5 transition-colors"
          >
            <Chrome size={18} />
            Google Sign In
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-aura-text-secondary font-medium">
          {isLogin ? "Don't have a profile?" : "Already have a profile?"} 
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-aura-accent ml-2 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
