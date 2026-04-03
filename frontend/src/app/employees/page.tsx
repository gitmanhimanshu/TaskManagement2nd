'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'invitations'>('employees');
  const [inviteData, setInviteData] = useState({ email: '', first_name: '', last_name: '' });
  const [addData, setAddData] = useState({ email: '', first_name: '', last_name: '', password: '', role: 'member' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [empPage, setEmpPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [empPagination, setEmpPagination] = useState<any>(null);
  const [invPagination, setInvPagination] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, [empPage]);

  useEffect(() => {
    loadInvitations();
  }, [invPage]);

  const loadEmployees = async () => {
    try {
      const { data } = await api.get(`/employees?page=${empPage}&limit=10`);
      setEmployees(data.employees);
      setEmpPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data } = await api.get(`/employees/invitations?page=${invPage}&limit=10`);
      setInvitations(data.invitations);
      setInvPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load invitations', error);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/employees/invite', inviteData);
      showMessage(data.message, 'success');
      setShowInviteForm(false);
      setInviteData({ email: '', first_name: '', last_name: '' });
      loadInvitations();
    } catch (error: any) {
      showMessage(error.response?.data?.error?.message || 'Failed to send invitation', 'error');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', addData);
      showMessage('Employee added successfully', 'success');
      setShowAddForm(false);
      setAddData({ email: '', first_name: '', last_name: '', password: '', role: 'member' });
      loadEmployees();
    } catch (error: any) {
      showMessage(error.response?.data?.error?.message || 'Failed to add employee', 'error');
    }
  };

  const handleDeleteInvitation = async (id: number) => {
    if (confirm('Delete this invitation?')) {
      try {
        await api.delete(`/employees/invitations/${id}`);
        showMessage('Invitation deleted successfully', 'success');
        loadInvitations();
      } catch (error: any) {
        showMessage(error.response?.data?.error?.message || 'Failed to delete invitation', 'error');
      }
    }
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
      <div className="container">
        <div className="header">
          <div>
            <h1>Team Management</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: '14px' }}>Manage your team members</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">← Back</button>
        </div>

        {message && <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>{message}</div>}

        <div className="card">
          <div style={{ 
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', 
            padding: '24px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Grow Your Team</h2>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', maxWidth: '600px', margin: 0 }}>
                Expand your workspace by onboarding new members. Sending an invite will email them a secure unique link to join on their own, or you can add members manually.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button 
                onClick={() => { setShowInviteForm(true); setShowAddForm(false); }} 
                className="btn btn-primary"
                style={{ boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}
              >
                📧 Send Email Invite
              </button>
              <button 
                onClick={() => { setShowAddForm(true); setShowInviteForm(false); }} 
                className="btn btn-secondary"
              >
                ➕ Add Manually
              </button>
            </div>
          </div>

          {showInviteForm && (
            <div className="modal-overlay" onClick={() => setShowInviteForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>📧 Invite Employee</h3>
                  <button onClick={() => setShowInviteForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                <form onSubmit={handleInvite}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="input" placeholder="employee@company.com" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" className="input" placeholder="John" value={inviteData.first_name} onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="input" placeholder="Doe" value={inviteData.last_name} onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Send Invitation</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowInviteForm(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddForm && (
            <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>➕ Add Employee</h3>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                <form onSubmit={handleAdd}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="input" placeholder="employee@company.com" value={addData.email} onChange={(e) => setAddData({ ...addData, email: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" className="input" placeholder="John" value={addData.first_name} onChange={(e) => setAddData({ ...addData, first_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="input" placeholder="Doe" value={addData.last_name} onChange={(e) => setAddData({ ...addData, last_name: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" className="input" placeholder="••••••••" value={addData.password} onChange={(e) => setAddData({ ...addData, password: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="select" value={addData.role} onChange={(e) => setAddData({ ...addData, role: e.target.value })}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Add Employee</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
            <button onClick={() => setActiveTab('employees')} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'employees' ? '3px solid #667eea' : '3px solid transparent', color: activeTab === 'employees' ? '#667eea' : '#6b7280', fontWeight: activeTab === 'employees' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}>
              Team ({empPagination?.total || 0})
            </button>
            <button onClick={() => setActiveTab('invitations')} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'invitations' ? '3px solid #667eea' : '3px solid transparent', color: activeTab === 'invitations' ? '#667eea' : '#6b7280', fontWeight: activeTab === 'invitations' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }}>
              Invitations ({invPagination?.total || 0})
            </button>
          </div>

          {activeTab === 'employees' && (
            <>
              <div className="task-grid">
                {employees.map((emp) => (
                  <div key={emp.id} className="task-row">
                    <div className="task-info">
                      <h3 className="task-title">{emp.first_name} {emp.last_name}</h3>
                      <p className="task-description">{emp.email}</p>
                    </div>
                    <div className="task-status-col">
                      <span className={emp.is_admin ? 'badge badge-high' : 'badge badge-low'} style={{ fontSize: '10px', padding: '4px 10px' }}>
                        {emp.is_admin ? '👑 Admin' : '👤 Member'}
                      </span>
                    </div>
                    <div className="task-priority-col">
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(emp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination pagination={empPagination} onPageChange={setEmpPage} />
            </>
          )}

          {activeTab === 'invitations' && (
            <>
              <div className="task-grid">
                {invitations.length === 0 ? (
                  <div className="empty-state"><h3>No pending invitations</h3></div>
                ) : (
                  invitations.map((inv) => (
                    <div key={inv.id} className="task-row" style={{ borderLeftColor: '#fbbf24' }}>
                      <div className="task-info">
                        <h3 className="task-title">{inv.first_name} {inv.last_name}</h3>
                        <p className="task-description">{inv.email}</p>
                      </div>
                      <div className="task-status-col">
                        <span className="badge badge-pending" style={{ fontSize: '10px', padding: '4px 10px' }}>⏳ Pending</span>
                      </div>
                      <div className="task-priority-col">
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>By {inv.invited_by}</span>
                      </div>
                      <div className="task-assigned-col">
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                      </div>
                      <div className="task-actions-col">
                        <button onClick={() => handleDeleteInvitation(inv.id)} className="btn btn-danger" title="Delete">🗑</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Pagination pagination={invPagination} onPageChange={setInvPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
