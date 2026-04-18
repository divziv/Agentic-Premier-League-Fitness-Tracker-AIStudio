/**
 * Fitness Types and Invariants
 */

export type WorkoutType = 'RECOVERY' | 'BURST' | 'STANDARD' | 'PERFORMANCE' | 'CHALLENGE';
export type Difficulty = 'Easy' | 'Medium' | 'Difficult';
export type TargetArea = 'Legs' | 'Biceps' | 'Core' | 'Full Body' | 'Back' | 'Chest';

export interface Exercise {
  name: string;
  reps: string;
  visualDescription: string;
  imageUrl?: string;
}

export interface Workout {
  id: string;
  title: string;
  type: WorkoutType;
  difficulty: Difficulty;
  target: TargetArea;
  duration: number; // minutes
  intensity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  description: string;
  status: 'planned' | 'completed' | 'skipped';
  timestamp: string;
  exercises: Exercise[];
}

export interface UserHistoryItem {
  date: string;
  completed: boolean;
  intensityScore: number; // 0 to 1
  durationRatio: number; // actual / planned
}

export interface AdaptiveSuggestion {
  type: WorkoutType;
  title: string;
  reason: string;
  duration: number;
  intensity: Workout['intensity'];
  icon: string;
}

/**
 * VelocityEngine: Calculates Consistency Velocity and Adaptive Suggestions
 */
export const VelocityEngine = {
  /**
   * Vc = Σ(Actual Intensity × Duration) / Σ(Planned Intensity × Planned Duration)
   * For MVP, we simplify to a 7-day trailing average of completion quality.
   */
  calculateVelocity: (history: UserHistoryItem[]): number => {
    if (history.length === 0) return 1.0;
    const recent = history.slice(-7);
    const sum = recent.reduce((acc, curr) => {
      return acc + (curr.completed ? (curr.intensityScore * curr.durationRatio) : 0);
    }, 0);
    return Math.min(sum / (recent.length || 7), 2.0); // Cap at 2.0 for "On Fire"
  },

  getAdaptiveSuggestion: (
    velocity: number,
    hrv: number,
    availableTime: number,
    isRaining: boolean
  ): AdaptiveSuggestion => {
    // 1. Check for physical burnout
    if (hrv < 40) {
      return {
        type: 'RECOVERY',
        title: 'Active Recovery Flow',
        reason: 'HRV is suppressed (Below 40). Priority is nervous system reset.',
        duration: 15,
        intensity: 'Low',
        icon: 'Wind'
      };
    }

    // 2. Adjust for context: Rain + Home
    if (isRaining) {
      return {
        type: 'BURST',
        title: 'Indoor Power Burst',
        reason: 'Rain detected. Pivoting to an indoor HIIT sequence to maintain streak.',
        duration: 20,
        intensity: 'High',
        icon: 'Zap'
      };
    }

    // 3. Stalling Velocity or Time Constraint
    if (velocity < 0.6 || availableTime < 25) {
      return {
        type: 'BURST',
        title: '10-Minute Momentum',
        reason: 'Velocity is dip-trending. A micro-session is better than zero.',
        duration: 10,
        intensity: 'High',
        icon: 'Zap'
      };
    }

    // 4. On Fire / High Velocity
    if (velocity > 0.95) {
      return {
        type: 'PERFORMANCE',
        title: 'Ghost Challenge',
        reason: 'You are outperforming your baseline. Ready to race your past self.',
        duration: 45,
        intensity: 'Extreme',
        icon: 'Ghost'
      };
    }

    // Default
    return {
      type: 'STANDARD',
      title: 'Solid Baseline Session',
      reason: 'Steady velocity. Maintain standard volume.',
      duration: 30,
      intensity: 'Moderate',
      icon: 'Activity'
    };
  }
};
