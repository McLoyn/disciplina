import { createStore } from './supabase';

const boardsStore = createStore('boards');
const listsStore = createStore('board_lists');
const tasksStore = createStore('tasks');
const checklistsStore = createStore('task_checklists');

export const tasksService = {
  // Boards
  getBoards(userId) {
    return boardsStore.where(userId, b => !b.is_archived);
  },
  createBoard(userId, data) {
    return boardsStore.create({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366F1',
      is_archived: false,
    });
  },
  updateBoard(id, data) { return boardsStore.update(id, data); },
  archiveBoard(id) { return boardsStore.update(id, { is_archived: true }); },
  deleteBoard(id) { boardsStore.delete(id); },

  // Lists
  getLists(userId, boardId) {
    return listsStore.where(userId, l => l.board_id === boardId && !l.is_archived)
      .sort((a, b) => a.position - b.position);
  },
  createList(userId, boardId, name, position = 0) {
    return listsStore.create({
      user_id: userId,
      board_id: boardId,
      name,
      position,
      is_archived: false,
    });
  },
  updateList(id, data) { return listsStore.update(id, data); },
  deleteList(id) { listsStore.delete(id); },

  // Tasks
  getTasks(userId, listId) {
    return tasksStore.where(userId, t => t.list_id === listId && t.status !== 'Archived')
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  },
  getAllTasks(userId) {
    return tasksStore.where(userId, t => t.status !== 'Archived');
  },
  getTasksForToday(userId) {
    const today = new Date().toISOString().split('T')[0];
    return tasksStore.where(userId, t =>
      t.status !== 'Archived' && t.status !== 'Done' &&
      t.due_date && t.due_date.startsWith(today)
    );
  },
  createTask(userId, listId, boardId, data) {
    const xpMap = { Low: 5, Medium: 10, High: 20 };
    return tasksStore.create({
      user_id: userId,
      board_id: boardId,
      list_id: listId,
      title: data.title,
      description: data.description || '',
      status: data.status || 'To Do',
      priority: data.priority || 'Medium',
      category: data.category || '',
      due_date: data.due_date || null,
      estimated_duration: data.estimated_duration || null,
      xp_reward: xpMap[data.priority] || 10,
      position: data.position || 0,
    });
  },
  updateTask(id, data) { return tasksStore.update(id, data); },
  deleteTask(id) { tasksStore.delete(id); },

  // Checklists
  getChecklists(taskId) {
    const all = JSON.parse(localStorage.getItem('disciplina_task_checklists') || '[]');
    return all.filter(c => c.task_id === taskId).sort((a, b) => a.position - b.position);
  },
  createChecklist(userId, taskId, title) {
    return checklistsStore.create({ user_id: userId, task_id: taskId, title, is_completed: false, position: 0 });
  },
  toggleChecklist(id, is_completed) {
    return checklistsStore.update(id, { is_completed });
  },
  deleteChecklist(id) { checklistsStore.delete(id); },

  // Stats
  getStats(userId) {
    const tasks = this.getAllTasks(userId);
    const boards = this.getBoards(userId);
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done').length;
    return { total, done, active: boards.length };
  },
};
