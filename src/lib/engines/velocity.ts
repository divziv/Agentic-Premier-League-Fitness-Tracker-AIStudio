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
    isRaining: boolean,
    location: 'Home' | 'Gym'
  ): AdaptiveSuggestion => {
    // 1. Check Readiness: Is HRV low?
    if (hrv < 40) {
      return {
        type: 'RECOVERY',
        title: 'Active Recovery Protocol',
        reason: 'Critical: HRV is suppressed. Suggesting Yoga or Light Walking for nervous system reset.',
        duration: 20,
        intensity: 'Low',
        icon: 'Wind'
      };
    }

    // 2. Check Time: Does the user have <30 mins?
    if (availableTime < 30) {
      return {
        type: 'BURST',
        title: 'High-Intensity Tactical HIIT',
        reason: 'Time window under 30m detected. Initiating maximum efficiency anaerobic protocol.',
        duration: availableTime,
        intensity: 'High',
        icon: 'Zap'
      };
    }

    // 3. Check Environment: Gym vs Home (Geofencing)
    if (location === 'Gym') {
      return {
        type: 'PERFORMANCE',
        title: 'Heavy Lift Protocol',
        reason: 'Gym geofence handshake established. Accessing compound loading sequence.',
        duration: 45,
        intensity: 'Extreme',
        icon: 'Ghost'
      };
    }

    // Default: Bodyweight Circuit for Home/Generic
    return {
      type: 'STANDARD',
      title: 'Bodyweight Force Circuit',
      reason: 'Home deployment detected. Optimizing for functional resistance and high-volume bodyweight.',
      duration: 35,
      intensity: 'Moderate',
      icon: 'Activity'
    };
  }
};
