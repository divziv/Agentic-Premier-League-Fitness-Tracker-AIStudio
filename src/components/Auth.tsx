import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, Flame, Target, Trophy, Users, User, ArrowRight } from 'lucide-react';
import { useAppStore } from '../data/store';

const PROFILE_ICONS = [
  { id: 'zap', Icon: Zap },
  { id: 'activity', Icon: Activity },
  { id: 'flame', Icon: Flame },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
  { id: 'users', Icon: Users },
];

export default function AuthScreen() {
  const { login } = useAppStore();
  const [displayName, setDisplayName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('zap');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    login(displayName, selectedIcon);
  };

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-6 text-white font-sans selection:bg-aura-accent selection:text-white">
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
          <h2 className="text-3xl font-black tracking-tighter mb-2">Offline Protocol</h2>
          <p className="text-aura-text-secondary text-sm">Self-contained adaptive fitness tracker.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-2 block">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-text-secondary" size={16} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-aura-surface border border-aura-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-aura-accent outline-none"
                  placeholder="e.g. Maverick"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-aura-accent mb-3 block">Profile Core Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {PROFILE_ICONS.map(({ id, Icon }) => (
                  <button 
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${selectedIcon === id ? 'bg-aura-accent border-aura-accent text-white shadow-lg' : 'bg-aura-surface border-aura-border text-aura-text-secondary hover:bg-aura-surface/80'}`}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-aura-bg py-4 rounded-xl font-black text-lg tracking-tighter hover:scale-[1.01] transition-transform flex items-center justify-center gap-3"
          >
            BOOT SYSTEM <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
