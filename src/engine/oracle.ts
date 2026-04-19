export type WorkoutRecommendation = {
  title: string;
  reason: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  mode: 'recovery' | 'maintenance' | 'progression';
};

export const getOracleRecommendation = (
  energyLevel: 'Low' | 'Medium' | 'High',
  timeAvailable: number, // in minutes
  location: 'Home' | 'Gym',
  target: string,
  cvScore: number
): WorkoutRecommendation => {
  // 1. DDA Logic based on CV
  if (cvScore < 40) {
    return {
      title: 'Micro-Burst ' + target,
      reason: 'Momentum is dropping. Let’s do a quick, low-friction session to save your streak.',
      duration: Math.min(15, timeAvailable),
      intensity: 'Low',
      mode: 'recovery'
    };
  }

  // 2. Rule-based checks
  if (energyLevel === 'Low') {
    return {
      title: 'Active Recovery Flow',
      reason: 'Energy is low today. Let’s focus on mobility and active recovery.',
      duration: Math.min(20, timeAvailable),
      intensity: 'Low',
      mode: 'recovery'
    };
  }

  if (timeAvailable < 30) {
    return {
      title: `Express ${target} HIIT`,
      reason: 'Short on time, so we’re maximizing intensity.',
      duration: timeAvailable,
      intensity: 'High',
      mode: 'maintenance'
    };
  }

  if (location === 'Gym') {
    return {
      title: `Heavy ${target} Hypertrophy`,
      reason: 'You’re at the gym. Let’s utilize the equipment for strength progression.',
      duration: Math.min(60, timeAvailable),
      intensity: 'High',
      mode: 'progression'
    };
  }

  // Default Home + High/Med Energy + > 30m
  return {
    title: `Dynamic Bodyweight ${target}`,
    reason: 'Perfect conditions for a solid home circuit.',
    duration: Math.min(45, timeAvailable),
    intensity: 'Medium',
    mode: 'maintenance'
  };
};

export const getHypeMessage = (cvState: string, streak: number): string => {
  if (streak === 0) return "Today is day one. Let's build momentum.";
  if (cvState === 'Dropping') return `Your ${streak}-day streak is alive — protect it today 🔥`;
  if (cvState === 'Rising') return `You're on fire! Keep pushing the limits.`;
  return `Even 10 minutes today keeps momentum going 💪`;
};
