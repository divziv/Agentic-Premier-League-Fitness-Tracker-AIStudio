import { WorkoutSession } from '../data/store';

export type MomentumState = 'Dropping' | 'Stable' | 'Rising';

export const calculateConsistencyVelocity = (
  workouts: WorkoutSession[],
  currentStreak: number
): { score: number; state: MomentumState } => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // Base score heavily relies on the streak
  let score = Math.min(currentStreak * 5, 50); // Up to 50 points from streak
  
  // Recent completion rate (last 7 days)
  const recentWorkouts = workouts.filter(w => now - w.timestamp < 7 * day);
  const completionRate = recentWorkouts.length / 7;
  
  score += completionRate * 30; // Up to 30 points from recent consistency
  
  // Intensity consistency
  const difficultWorkouts = recentWorkouts.filter(w => w.difficulty === 'Difficult').length;
  const mediumWorkouts = recentWorkouts.filter(w => w.difficulty === 'Medium').length;
  
  score += (difficultWorkouts * 3) + (mediumWorkouts * 2); // Up to ~20 points
  
  // Cap at 100
  score = Math.min(Math.max(score, 0), 100);
  
  // Determine momentum state
  let state: MomentumState = 'Stable';
  if (score < 40 || (recentWorkouts.length === 0 && currentStreak === 0)) {
    state = 'Dropping';
  } else if (score > 75) {
    state = 'Rising';
  }
  
  return { score, state };
};
