// Mock Auth Service - simulates Supabase Auth with localStorage
// Replace this file with real Supabase client when ready

export const mockAuth = {
  currentUser: null,

  getUser() {
    const stored = localStorage.getItem('disciplina_user');
    return stored ? JSON.parse(stored) : null;
  },

  async signUp({ email, password, name }) {
    const users = JSON.parse(localStorage.getItem('disciplina_users') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      display_name: name,
      avatar_url: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      daily_goal: 70,
      wake_time: '06:00',
      sleep_time: '22:00',
      onboarding_complete: false,
      created_at: new Date().toISOString(),
    };
    users.push({ ...user, password });
    localStorage.setItem('disciplina_users', JSON.stringify(users));
    localStorage.setItem('disciplina_user', JSON.stringify(user));
    return { user };
  },

  async signIn({ email, password }) {
    const users = JSON.parse(localStorage.getItem('disciplina_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const { password: _, ...user } = found;
    localStorage.setItem('disciplina_user', JSON.stringify(user));
    return { user };
  },

  async signOut() {
    localStorage.removeItem('disciplina_user');
  },

  async updateProfile(updates) {
    const user = this.getUser();
    if (!user) throw new Error('Not authenticated');
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('disciplina_user', JSON.stringify(updated));
    // Also update in users array
    const users = JSON.parse(localStorage.getItem('disciplina_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem('disciplina_users', JSON.stringify(users));
    }
    return updated;
  },
};

// Generic localStorage DB helper
export function createStore(key) {
  return {
    getAll(userId) {
      const data = JSON.parse(localStorage.getItem(`disciplina_${key}`) || '[]');
      return userId ? data.filter(item => item.user_id === userId) : data;
    },
    getById(id) {
      const data = JSON.parse(localStorage.getItem(`disciplina_${key}`) || '[]');
      return data.find(item => item.id === id) || null;
    },
    create(record) {
      const data = JSON.parse(localStorage.getItem(`disciplina_${key}`) || '[]');
      const newRecord = {
        ...record,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.push(newRecord);
      localStorage.setItem(`disciplina_${key}`, JSON.stringify(data));
      return newRecord;
    },
    update(id, updates) {
      const data = JSON.parse(localStorage.getItem(`disciplina_${key}`) || '[]');
      const idx = data.findIndex(item => item.id === id);
      if (idx === -1) throw new Error(`Item not found`);
      data[idx] = { ...data[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(`disciplina_${key}`, JSON.stringify(data));
      return data[idx];
    },
    delete(id) {
      const data = JSON.parse(localStorage.getItem(`disciplina_${key}`) || '[]');
      const filtered = data.filter(item => item.id !== id);
      localStorage.setItem(`disciplina_${key}`, JSON.stringify(filtered));
    },
    where(userId, filterFn) {
      return this.getAll(userId).filter(filterFn);
    },
  };
}
