import { createStore } from './supabase';

const habitsStore = createStore('habits');
const habitLogsStore = createStore('habit_logs');

export const habitsService = {
  getAll(userId) {
    return habitsStore.getAll(userId).filter(h => h.is_active !== false);
  },

  create(userId, data) {
    return habitsStore.create({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      category: data.category || 'General',
      frequency: data.frequency || 'Daily',
      target_value: data.target_value || 1,
      difficulty: data.difficulty || 'Medium',
      xp_reward: data.difficulty === 'Easy' ? 5 : data.difficulty === 'Hard' ? 20 : 10,
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
  },

  update(id, data) {
    return habitsStore.update(id, data);
  },

  delete(id) {
    habitsStore.update(id, { is_active: false });
  },

  // Log completion for a habit on a given date
  logHabit(userId, habitId, date, status, value = 1) {
    const existing = habitLogsStore.where(userId, l => l.habit_id === habitId && l.date === date);
    if (existing.length > 0) {
      return habitLogsStore.update(existing[0].id, {
        status,
        value,
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      });
    }
    return habitLogsStore.create({
      user_id: userId,
      habit_id: habitId,
      date,
      status,
      value,
      completed_at: status === 'Completed' ? new Date().toISOString() : null,
    });
  },

  getLogsForDate(userId, date) {
    return habitLogsStore.where(userId, l => l.date === date);
  },

  getLogsForHabit(userId, habitId, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    return habitLogsStore.where(userId, l =>
      l.habit_id === habitId && new Date(l.date) >= from
    );
  },

  getCompletionRate(userId, days = 7) {
    const habits = this.getAll(userId);
    if (!habits.length) return 0;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const logs = habitLogsStore.where(userId, l => new Date(l.date) >= from);
    const completed = logs.filter(l => l.status === 'Completed').length;
    const total = habits.length * days;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  },
};
