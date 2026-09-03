import { createStore } from './supabase';

const workoutPlansStore = createStore('workout_plans');
const exercisesStore = createStore('exercises');
const sessionsStore = createStore('workout_sessions');
const logsStore = createStore('workout_exercise_logs');

// Default exercise library
const DEFAULT_EXERCISES = [
  { id: 'e1', name: 'Push-up', muscle_group: 'Chest', equipment: 'None', exercise_type: 'Reps', is_custom: false },
  { id: 'e2', name: 'Pull-up', muscle_group: 'Back', equipment: 'Bar', exercise_type: 'Reps', is_custom: false },
  { id: 'e3', name: 'Squat', muscle_group: 'Legs', equipment: 'None', exercise_type: 'Reps', is_custom: false },
  { id: 'e4', name: 'Plank', muscle_group: 'Core', equipment: 'None', exercise_type: 'Duration', is_custom: false },
  { id: 'e5', name: 'Running', muscle_group: 'Full Body', equipment: 'None', exercise_type: 'Duration', is_custom: false },
  { id: 'e6', name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', exercise_type: 'Reps', is_custom: false },
  { id: 'e7', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', exercise_type: 'Reps', is_custom: false },
  { id: 'e8', name: 'Dumbbell Row', muscle_group: 'Back', equipment: 'Dumbbell', exercise_type: 'Reps', is_custom: false },
  { id: 'e9', name: 'Lunges', muscle_group: 'Legs', equipment: 'None', exercise_type: 'Reps', is_custom: false },
  { id: 'e10', name: 'Cycling', muscle_group: 'Legs', equipment: 'Bike', exercise_type: 'Duration', is_custom: false },
  { id: 'e11', name: 'Jump Rope', muscle_group: 'Full Body', equipment: 'Rope', exercise_type: 'Duration', is_custom: false },
  { id: 'e12', name: 'Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Reps', is_custom: false },
];

export const workoutService = {
  getExercises(userId) {
    const custom = exercisesStore.getAll(userId);
    return [...DEFAULT_EXERCISES, ...custom];
  },

  createExercise(userId, data) {
    return exercisesStore.create({ user_id: userId, ...data, is_custom: true });
  },

  getPlans(userId) {
    return workoutPlansStore.where(userId, p => p.is_active !== false);
  },

  createPlan(userId, data) {
    return workoutPlansStore.create({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      frequency: data.frequency || '3x/week',
      is_active: true,
    });
  },

  updatePlan(id, data) { return workoutPlansStore.update(id, data); },
  deletePlan(id) { workoutPlansStore.update(id, { is_active: false }); },

  // Sessions
  getSessions(userId) {
    return sessionsStore.getAll(userId).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
  },

  startSession(userId, planId, title) {
    return sessionsStore.create({
      user_id: userId,
      plan_id: planId,
      title,
      started_at: new Date().toISOString(),
      status: 'In Progress',
    });
  },

  finishSession(id, notes = '') {
    const session = sessionsStore.getById(id);
    const duration = session
      ? Math.round((new Date() - new Date(session.started_at)) / 60000)
      : 0;
    return sessionsStore.update(id, {
      ended_at: new Date().toISOString(),
      duration,
      status: 'Completed',
      notes,
    });
  },

  // Exercise logs
  logExercise(userId, sessionId, exerciseId, data) {
    return logsStore.create({
      user_id: userId,
      session_id: sessionId,
      exercise_id: exerciseId,
      ...data,
    });
  },

  getSessionLogs(sessionId) {
    const all = JSON.parse(localStorage.getItem('disciplina_workout_exercise_logs') || '[]');
    return all.filter(l => l.session_id === sessionId);
  },

  getWeeklyStats(userId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessions = sessionsStore.where(userId, s =>
      s.status === 'Completed' && new Date(s.started_at) >= weekAgo
    );
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return {
      sessions: sessions.length,
      totalMinutes,
      consistency: Math.min(100, Math.round((sessions.length / 4) * 100)),
    };
  },
};
