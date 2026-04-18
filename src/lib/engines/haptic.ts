/**
 * Simple haptic feedback engine using the Web Vibration API.
 */
export const HapticEngine = {
  /**
   * Short, subtle pulse for positive reinforcement (e.g., ahead of ghost).
   */
  ahead: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Double pulse for warning (e.g., falling behind ghost).
   */
  behind: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Heavy pulse for milestones.
   */
  milestone: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }
};
