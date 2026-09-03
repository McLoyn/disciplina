import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/tasks';
import { Kanban, Plus, X, MoreHorizontal, Pencil, Trash2, GripVertical, CheckSquare, Square } from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_COLOR = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-muted' };
const BOARD_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#F97316', '#06B6D4', '#a78bfa'];

function BoardModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1' });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Board</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Board Name *</label>
            <input className="input" placeholder="e.g. Personal Project" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {BOARD_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-110' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Create Board</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskModal({ listId, boardId, task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    due_date: task?.due_date?.split('T')[0] || '',
    category: task?.category || '',
  });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input className="input" placeholder="e.g. Build portfolio homepage" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-16" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KanbanColumn({ list, boardId, userId, onRefresh }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const tasks = tasksService.getTasks(userId, list.id);

  const handleSaveTask = (form) => {
    if (editTask) {
      tasksService.updateTask(editTask.id, form);
    } else {
      tasksService.createTask(userId, list.id, boardId, form);
    }
    setShowAddTask(false);
    setEditTask(null);
    onRefresh();
  };

  const handleDelete = (taskId) => {
    tasksService.deleteTask(taskId);
    setMenuOpen(null);
    onRefresh();
  };

  const handleMoveTask = (task, newListId) => {
    tasksService.updateTask(task.id, { list_id: newListId });
    setMenuOpen(null);
    onRefresh();
  };

  return (
    <div className="flex flex-col min-w-[260px] max-w-[260px] bg-bg-elevated border border-border rounded-xl">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{list.name}</span>
          <span className="badge-muted badge text-xs">{tasks.length}</span>
        </div>
        <button onClick={() => setShowAddTask(true)} className="text-text-muted hover:text-text p-1 rounded transition-colors">
          <Plus size={15} />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
        {tasks.map(task => (
          <div key={task.id} className="bg-bg-card border border-border hover:border-border-light rounded-lg p-3 group transition-all">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
              <div className="relative">
                <button onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-text transition-all">
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen === task.id && (
                  <div className="absolute right-0 top-6 bg-bg-elevated border border-border rounded-xl shadow-2xl z-20 min-w-[130px] overflow-hidden">
                    <button onClick={() => { setEditTask(task); setMenuOpen(null); setShowAddTask(true); }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-xs w-full text-left">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(task.id)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-danger/10 text-danger text-xs w-full text-left">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            {task.description && <p className="text-text-muted text-xs mt-1 line-clamp-2">{task.description}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
              {task.due_date && (
                <span className="text-xs text-text-muted">{new Date(task.due_date + 'T00:00').toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <button onClick={() => setShowAddTask(true)}
            className="w-full py-6 border border-dashed border-border rounded-lg text-text-muted text-xs hover:border-border-light hover:text-text transition-all">
            + Add task
          </button>
        )}
      </div>

      {(showAddTask) && (
        <TaskModal
          listId={list.id} boardId={boardId} task={editTask}
          onClose={() => { setShowAddTask(false); setEditTask(null); }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

function BoardView({ board, userId, onBack, onRefresh }) {
  const [refresh, setRefresh] = useState(0);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);

  const lists = tasksService.getLists(userId, board.id);

  const doRefresh = () => { setRefresh(r => r + 1); onRefresh(); };

  const handleAddList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    tasksService.createList(userId, board.id, newListName, lists.length);
    setNewListName('');
    setAddingList(false);
    doRefresh();
  };

  // Create default lists if board is new
  if (lists.length === 0) {
    ['Backlog', 'To Do', 'In Progress', 'Done'].forEach((name, i) => {
      tasksService.createList(userId, board.id, name, i);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost text-sm py-1.5">← Back</button>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: board.color }} />
          <h2 className="font-bold text-lg">{board.name}</h2>
        </div>
      </div>

      {/* Board columns horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {lists.map(list => (
          <KanbanColumn key={list.id + refresh} list={list} boardId={board.id} userId={userId} onRefresh={doRefresh} />
        ))}

        {/* Add list */}
        {addingList ? (
          <form onSubmit={handleAddList} className="min-w-[220px]">
            <input className="input" placeholder="List name" value={newListName} onChange={e => setNewListName(e.target.value)} autoFocus />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="btn-primary text-xs py-1.5 px-3">Add</button>
              <button type="button" onClick={() => setAddingList(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddingList(true)}
            className="min-w-[200px] h-12 border border-dashed border-border rounded-xl text-text-muted text-sm hover:border-border-light hover:text-text transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add List
          </button>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [activeBoard, setActiveBoard] = useState(null);

  const boards = tasksService.getBoards(user.id);
  const stats = tasksService.getStats(user.id);

  const handleCreateBoard = (form) => {
    const board = tasksService.createBoard(user.id, form);
    setShowBoardModal(false);
    setActiveBoard(board);
    setRefresh(r => r + 1);
  };

  if (activeBoard) {
    return (
      <div className="animate-fade-in">
        <BoardView board={activeBoard} userId={user.id} onBack={() => { setActiveBoard(null); setRefresh(r => r + 1); }} onRefresh={() => setRefresh(r => r + 1)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks & Boards</h1>
          <p className="text-text-secondary text-sm mt-0.5">Kanban-style project management</p>
        </div>
        <button onClick={() => setShowBoardModal(true)} className="btn-primary">
          <Plus size={16} /> New Board
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Tasks', value: stats.total },
          { label: 'Completed', value: stats.done },
          { label: 'Active Boards', value: stats.active },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Boards grid */}
      {boards.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Kanban size={28} className="text-accent-light" />
          </div>
          <h3 className="font-semibold mb-1">No Boards Yet</h3>
          <p className="text-text-secondary text-sm mb-4">Create your first project board.</p>
          <button onClick={() => setShowBoardModal(true)} className="btn-primary mx-auto w-fit">
            <Plus size={16} /> Create Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => {
            const lists = tasksService.getLists(user.id, board.id);
            const tasks = lists.flatMap(l => tasksService.getTasks(user.id, l.id));
            const done = tasks.filter(t => t.status === 'Done').length;
            return (
              <button key={board.id} onClick={() => setActiveBoard(board)}
                className="card-hover text-left group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: board.color }}>
                    {board.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{board.name}</p>
                    {board.description && <p className="text-text-muted text-xs truncate">{board.description}</p>}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-text-muted mb-3">
                  <span>{lists.length} lists</span>
                  <span>{tasks.length} tasks</span>
                  <span className="text-success">{done} done</span>
                </div>
                {tasks.length > 0 && (
                  <div className="progress-bar">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(done / tasks.length) * 100}%`, background: board.color }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showBoardModal && <BoardModal onClose={() => setShowBoardModal(false)} onSave={handleCreateBoard} />}
    </div>
  );
}
