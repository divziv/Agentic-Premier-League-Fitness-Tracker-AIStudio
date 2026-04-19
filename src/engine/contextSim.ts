export const getSimulatedTimeContext = (): { timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night', suggestion: string } => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { timeOfDay: 'Morning', suggestion: 'energizing workouts' };
  } else if (hour >= 12 && hour < 17) {
    return { timeOfDay: 'Afternoon', suggestion: 'moderate workouts' };
  } else if (hour >= 17 && hour < 21) {
    return { timeOfDay: 'Evening', suggestion: 'strength or recovery' };
  } else {
    return { timeOfDay: 'Night', suggestion: 'light / recovery sessions' };
  }
};
