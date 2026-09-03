import { createStore } from './supabase';
import { format } from 'date-fns';

const missionsStore = createStore('missions');

export const missionsService = {
  getForDate(userId, date) {
    return missionsStore.where(userId, m => m.date === date);
  },

  getAll(userId) {
    return missionsStore.getAll(userId);
  },

  create(userId, data) {
    const xpMap = { Low: 10, Medium: 15, High: 25 };
    return missionsStore.create({
      user_id: userId,
      title: data.title,
      description: data.description || '',
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      priority: data.priority || 'Medium',
      category: data.category || 'General',
      estimated_duration: data.estimated_duration || null,
      xp_reward: xpMap[data.priority] || 15,
      status: 'pending',
    });
  },

  update(id, data) {
    return missionsStore.update(id, data);
  },

  complete(id) {
    return missionsStore.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  },

  uncomplete(id) {
    return missionsStore.update(id, {
      status: 'pending',
      completed_at: null,
    });
  },

  delete(id) {
    missionsStore.delete(id);
  },

  getCompletionRate(userId, date) {
    const missions = this.getForDate(userId, date);
    if (!missions.length) return 0;
    const completed = missions.filter(m => m.status === 'completed').length;
    return Math.round((completed / missions.length) * 100);
  },
};
