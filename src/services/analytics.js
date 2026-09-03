import { createStore } from './supabase';
import { habitsService } from './habits';
import { missionsService } from './missions';
import { format, subDays } from 'date-fns';

const dailyScoresStore = createStore('daily_scores');
const xpLedgerStore = createStore('xp_ledger');
const focusSessionsStore = createStore('focus_sessions');
const reflectionsStore = createStore('reflections');
const routinesStore = createStore('routines');
const routineLogsStore = createStore('routine_logs');

export const analyticsService = {
  // Calculate discipline score for a date
  calculateDailyScore(userId, date) {
    const missions = missionsService.getForDate(userId, date);
    const habits = habitsService.getAll(userId);
    const habitLogs = habitsService.getLogsForDate(userId, date);
    const focusSessions = focusSessionsStore.where(userId, s => {
      const d = s.started_at ? s.started_at.split('T')[0] : null;
      return d === date;
    });
    const reflection = reflectionsStore.where(userId, r => r.date === date);
    const routineLogs = routineLogsStore.where(userId, l => l.date === date);

    // Mission score (30%)
    let missionScore = 0;
    if (missions.length > 0) {
      const completed = missions.filter(m => m.status === 'completed').length;
      missionScore = Math.round((completed / missions.length) * 100);
    }

    // Habit score (25%)
    let habitScore = 0;
    if (habits.length > 0) {
      const completedHabits = habitLogs.filter(l => l.status === 'Completed').length;
      habitScore = Math.round((completedHabits / habits.length) * 100);
    }

    // Routine score (20%)
    let routineScore = 0;
    const routines = routinesStore.getAll(userId).filter(r => r.is_active);
    if (routines.length > 0 && routineLogs.length > 0) {
      const completed = routineLogs.filter(l => l.status === 'completed').length;
      routineScore = Math.round((completed / routines.length) * 100);
    } else if (routines.length === 0) {
      routineScore = 100;
    }

    // Focus score (15%)
    let focusScore = 0;
    if (focusSessions.filter(s => s.completed).length > 0) {
      focusScore = Math.min(100, focusSessions.filter(s => s.completed).length * 33);
    }

    // Reflection score (10%)
    const reflectionScore = reflection.length > 0 ? 100 : 0;

    const total = Math.round(
      missionScore * 0.3 +
      habitScore * 0.25 +
      routineScore * 0.2 +
      focusScore * 0.15 +
      reflectionScore * 0.1
    );

    return {
      mission_score: missionScore,
      habit_score: habitScore,
      routine_score: routineScore,
      focus_score: focusScore,
      reflection_score: reflectionScore,
      total_score: total,
    };
  },

  saveDailyScore(userId, date, scores) {
    const existing = dailyScoresStore.where(userId, s => s.date === date);
    if (existing.length > 0) {
      return dailyScoresStore.update(existing[0].id, scores);
    }
    return dailyScoresStore.create({ user_id: userId, date, ...scores });
  },

  getDailyScore(userId, date) {
    const stored = dailyScoresStore.where(userId, s => s.date === date);
    if (stored.length > 0) return stored[0];
    return this.calculateDailyScore(userId, date);
  },

  getScoreHistory(userId, days = 30) {
    const scores = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const score = this.getDailyScore(userId, date);
      scores.push({ date, score: score.total_score || 0 });
    }
    return scores;
  },

  getWeeklyAverage(userId) {
    const scores = this.getScoreHistory(userId, 7);
    const avg = scores.reduce((sum, s) => sum + s.score, 0) / 7;
    return Math.round(avg);
  },

  // XP System
  getTotalXP(userId) {
    const ledger = xpLedgerStore.getAll(userId);
    return ledger.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  },

  addXP(userId, amount, source, referenceId = null) {
    return xpLedgerStore.create({
      user_id: userId,
      amount,
      source,
      reference_id: referenceId,
    });
  },

  getLevelFromXP(xp) {
    if (xp < 100) return { level: 1, title: 'Beginner', nextLevelXP: 100 };
    if (xp < 300) return { level: 2, title: 'Starter', nextLevelXP: 300 };
    if (xp < 600) return { level: 3, title: 'Starter', nextLevelXP: 600 };
    if (xp < 1000) return { level: 4, title: 'Starter', nextLevelXP: 1000 };
    if (xp < 1500) return { level: 5, title: 'Disciplined', nextLevelXP: 1500 };
    if (xp < 2200) return { level: 8, title: 'Disciplined', nextLevelXP: 2200 };
    if (xp < 3000) return { level: 10, title: 'Disciplined', nextLevelXP: 3000 };
    if (xp < 5000) return { level: 15, title: 'Dedicated', nextLevelXP: 5000 };
    if (xp < 8000) return { level: 20, title: 'Dedicated', nextLevelXP: 8000 };
    if (xp < 15000) return { level: 30, title: 'Master', nextLevelXP: 15000 };
    if (xp < 30000) return { level: 50, title: 'Elite', nextLevelXP: 30000 };
    return { level: 100, title: 'Unbreakable', nextLevelXP: null };
  },

  // Streak calculation
  getStreak(userId) {
    const scores = dailyScoresStore.getAll(userId).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    const today = format(new Date(), 'yyyy-MM-dd');
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();

    // Calculate current streak
    for (let i = 0; i < 365; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayScore = scores.find(s => s.date === date);
      if (dayScore && dayScore.total_score >= 70) {
        if (i === currentStreak) currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate best streak
    const sortedScores = scores.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const score of sortedScores) {
      if (score.total_score >= 70) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const successfulDays = scores.filter(s => s.total_score >= 70).length;

    return { currentStreak, bestStreak, successfulDays };
  },

  // Focus sessions
  getFocusStats(userId, date) {
    const sessions = focusSessionsStore.where(userId, s => {
      const d = s.started_at ? s.started_at.split('T')[0] : null;
      return d === date && s.completed;
    });
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return { sessions: sessions.length, totalMinutes };
  },

  focusSessionsStore,
  reflectionsStore,
  routinesStore,
  routineLogsStore,
};
