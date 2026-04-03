'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { taskAPI, authAPI, api } from '@/lib/api';
import { Task } from '@/types';

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    priority: 'MEDIUM', 
    status: 'PENDING',
    assigned_users: [] as number[],
    due_date: getTomorrowDate()
  });
  const [filter, setFilter] = useState({ status: '', search: '', page: '1' });
  const [pagination, setPagination] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Auto-assign current user when creating new task
      if (formData.assigned_users.length === 0 && !editingTask) {
        setFormData(prev => ({ ...prev, assigned_users: [parsedUser.id] }));
      }
    }
    loadTasks();
    loadEmployees();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const params = {
        ...filter,
        page: filter.page || '1',
        limit: '10'
      };
      const { data } = await taskAPI.getTasks(params);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load tasks', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.employees);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskAPI.createTask(formData);
      setShowForm(false);
      // Reset form and auto-assign current user
      setFormData({ 
        title: '', 
        description: '', 
        priority: 'MEDIUM', 
        status: 'PENDING', 
        assigned_users: user ? [user.id] : [],
        due_date: getTomorrowDate()
      });
      loadTasks();
      showToast('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task', error);
      showToast('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      await taskAPI.updateTask(editingTask.id, formData);
      setEditingTask(null);
      setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'PENDING', assigned_users: [], due_date: getTomorrowDate() });
      loadTasks();
      showToast('Task updated successfully!');
    } catch (error) {
      console.error('Failed to update task', error);
      showToast('Failed to update task', 'error');
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assigned_users: task.assigned_users?.map((u: any) => u.id) || [],
      due_date: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    // Reset form and auto-assign current user
    setFormData({ 
      title: '', 
      description: '', 
      priority: 'MEDIUM', 
      status: 'PENDING', 
      assigned_users: user ? [user.id] : [],
      due_date: getTomorrowDate()
    });
  };

  const handleToggle = async (id: number) => {
    try {
      await taskAPI.toggleTask(id);
      loadTasks();
      showToast('Task status toggled!');
    } catch (error) {
      console.error('Failed to toggle task', error);
      showToast('Failed to toggle task', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this task?')) {
      try {
        await taskAPI.deleteTask(id);
        loadTasks();
        showToast('Task deleted successfully!');
      } catch (error) {
        console.error('Failed to delete task', error);
        showToast('Failed to delete task', 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout network call failed', error);
      showToast('Session ended locally.', 'success');
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  const toggleAssignee = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }));
  };

  const getPriorityBadge = (priority: string) => {
    const classes: any = {
      LOW: 'badge badge-low',
      MEDIUM: 'badge badge-medium',
      HIGH: 'badge badge-high',
      URGENT: 'badge badge-urgent',
    };
    return classes[priority] || 'badge';
  };

  const getStatusBadge = (status: string) => {
    const classes: any = {
      PENDING: 'badge badge-pending',
      IN_PROGRESS: 'badge badge-in-progress',
      COMPLETED: 'badge badge-completed',
    };
    return classes[status] || 'badge';
  };

  const Pagination = ({ pagination, onPageChange }: any) => {
    if (!pagination || pagination.total_pages <= 1) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
        </span>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.total_pages}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {toast && (
        <div 
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, margin: 0, boxShadow: 'var(--shadow-lg)' }} 
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          {toast.message}
        </div>
      )}
      <div className="container">
        <div className="header">
          <div>
            <h1>Task Dashboard</h1>
            {user && (
              <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: '14px' }}>
                Welcome, {user.first_name}! {user.is_admin && '(Admin)'}
              </p>
            )}
          </div>
          <div className="header-actions">
            {user?.is_admin && (
              <button onClick={() => router.push('/employees')} className="btn btn-secondary">
                👥 Team
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Tasks</h2>
            <button 
              onClick={() => { 
                setShowForm(true); 
                setEditingTask(null);
                // Auto-assign current user when opening create form
                if (user) {
                  setFormData(prev => ({ ...prev, assigned_users: [user.id] }));
                }
              }} 
              className="btn btn-primary"
            >
              + New Task
            </button>
          </div>

          {(showForm || editingTask) && (
            <div className="modal-overlay" onClick={() => { setShowForm(false); cancelEdit(); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    {editingTask ? '✏️ Edit Task' : '➕ Create New Task'}
                  </h3>
                  <button 
                    onClick={() => { setShowForm(false); cancelEdit(); }} 
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask}>
              
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <div style={{ 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px', 
                  padding: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {employees.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>No team members available</p>
                  ) : (
                    employees.map((emp) => (
                      <label 
                        key={emp.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '8px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          marginBottom: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigned_users.includes(emp.id)}
                          onChange={() => toggleAssignee(emp.id)}
                          style={{ marginRight: '10px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {formData.assigned_users.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    {formData.assigned_users.length} member(s) selected
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  {editingTask ? '💾 Update Task' : '✓ Create Task'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); cancelEdit(); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-bar">
            <input
              type="text"
              className="input"
              placeholder="🔍 Search tasks..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <select
              className="select"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              style={{ minWidth: '200px', marginBottom: 0 }}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="task-grid">
            {tasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks found</h3>
                <p>Create your first task to get started!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="task-row">
                  {/* Task Info Column */}
                  <div className="task-info">
                    <h3 className="task-title">{task.title}</h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                  </div>

                  {/* Status Column */}
                  <div className="task-status-col">
                    <span className={getStatusBadge(task.status)} style={{ fontSize: '10px', padding: '4px 10px' }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Priority Column */}
                  <div className="task-priority-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className={getPriorityBadge(task.priority)} style={{ fontSize: '10px', padding: '4px 10px' }}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Assigned Users Column */}
                  <div className="task-assigned-col">
                    {task.assigned_users && task.assigned_users.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {task.assigned_users.slice(0, 2).map((user: any) => (
                          <span 
                            key={user.id}
                            className="user-avatar"
                            style={{ 
                              width: '24px',
                              height: '24px',
                              fontSize: '10px'
                            }}
                            title={user.name}
                          >
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        ))}
                        {task.assigned_users.length > 2 && (
                          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                            +{task.assigned_users.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Unassigned</span>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="task-actions-col">
                    <button 
                      onClick={() => startEdit(task)} 
                      className="btn btn-secondary"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleToggle(task.id)} 
                      className="btn btn-secondary"
                      title={task.status === 'COMPLETED' ? 'Reopen' : 'Complete'}
                    >
                      {task.status === 'COMPLETED' ? '↩' : '✓'}
                    </button>
                    <button 
                      onClick={() => handleDelete(task.id)} 
                      className="btn btn-danger"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage: number) => setFilter({ ...filter, page: newPage.toString() })} />
        </div>
      </div>
    </div>
  );
}
