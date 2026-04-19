export const initialMockProfile = {
  id: 'user_1',
  displayName: 'Pilot',
  avatarId: 'zap',
  velocity: 78.5,
  streak: 12,
  use3DVisualizer: true,
  enableComputerVision: false,
};

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const initialWorkoutHistory = [
  { id: 'w1', timestamp: now - 1 * day, duration: 1800, difficulty: 'Medium', target: 'Legs', completed: true },
  { id: 'w2', timestamp: now - 2 * day, duration: 1200, difficulty: 'Easy', target: 'Core', completed: true },
  { id: 'w3', timestamp: now - 3 * day, duration: 2400, difficulty: 'Difficult', target: 'Full Body', completed: true },
  { id: 'w4', timestamp: now - 4 * day, duration: 1500, difficulty: 'Medium', target: 'Biceps', completed: true },
];

export const mockSquadMembers = [
  { id: 'sq_1', name: 'Alex M.', avatarId: 'flame', activityLevel: 92, lastActive: now - 1000 * 60 * 30 },
  { id: 'sq_2', name: 'Jordan T.', avatarId: 'target', activityLevel: 85, lastActive: now - 1000 * 60 * 120 },
  { id: 'sq_3', name: 'Casey R.', avatarId: 'activity', activityLevel: 45, lastActive: now - 1000 * 60 * 60 * 24 },
  { id: 'sq_4', name: 'Taylor S.', avatarId: 'trophy', activityLevel: 98, lastActive: now - 1000 * 60 * 5 },
];
