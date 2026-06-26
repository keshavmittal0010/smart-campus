'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
        Loading users...
      </div>
    }>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Add form state
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', role: 'student', department: 'Computer Science', semester: '1' });
  // Edit form state
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', role: '', department: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const exportUsersToCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Semester/Employee ID', 'Status'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.department || 'N/A',
      u.semester || u.employeeId || 'N/A',
      u.status || 'Active'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_campus_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 CSV export downloaded successfully!');
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  const handleCreate = async () => {
    if (!addForm.firstName || !addForm.email) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm({ firstName: '', lastName: '', email: '', role: 'student', department: 'Computer Science', semester: '1' });
        fetchUsers();
        showToast('✅ User created successfully!');
      } else {
        const err = await res.json();
        showToast(`❌ ${err.error}`);
      }
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setSelected(null);
        fetchUsers();
        showToast('✅ User updated successfully!');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchUsers(); showToast('🗑️ User deleted.'); }
    } catch { showToast('❌ Failed to delete user'); }
    setDeleteId(null);
  };

  const openEdit = (u: any) => {
    setSelected(u);
    setEditForm({ firstName: u.name.split(' ')[0], lastName: u.name.split(' ').slice(1).join(' '), email: u.email, role: u.role, department: u.department });
  };

  const roleColors: Record<string, string> = { student: 'badge-primary', faculty: 'badge-success', admin: 'badge-purple' };

  return (
    <div className="page-container">
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '0.75rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', fontSize: '0.875rem', fontWeight: 600, animation: 'slideUp 0.3s ease' }}>
          {toast}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-subtitle">Manage all campus users, roles, and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={exportUsersToCSV}>📥 Export CSV</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users', value: total, color: 'var(--primary-400)' },
          { label: 'Students', value: users.filter(u => u.role === 'student').length, color: 'var(--info)' },
          { label: 'Faculty', value: users.filter(u => u.role === 'faculty').length, color: 'var(--success)' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{loading ? '...' : s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          {['all', 'student', 'faculty', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : ''}`}
              style={{ background: roleFilter === r ? undefined : 'transparent', border: 'none', textTransform: 'capitalize' }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', flex: 1 }} />
          </div>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {users.length} of {total} users</span>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            No users found
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${user.role === 'faculty' ? '#10b981,#059669' : user.role === 'admin' ? '#8b5cf6,#7c3aed' : '#3b82f6,#1d4ed8'})` }}>
                        {user.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openEdit(user)} title="Click to edit user details">
                          ID: {user.studentId || user.employeeId || 'admin'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.email}</td>
                  <td><span className={`badge ${roleColors[user.role]}`} style={{ textTransform: 'capitalize' }}>{user.role}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.department}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(user.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">➕ Add New User</div>
              <button className="icon-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" placeholder="First name..." value={addForm.firstName} onChange={e => setAddForm(p => ({...p, firstName: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Last name..." value={addForm.lastName} onChange={e => setAddForm(p => ({...p, lastName: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="user@campus.edu" value={addForm.email} onChange={e => setAddForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={addForm.role} onChange={e => setAddForm(p => ({...p, role: e.target.value}))}>
                    <option value="student">student</option>
                    <option value="faculty">faculty</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={addForm.department} onChange={e => setAddForm(p => ({...p, department: e.target.value}))}>
                    <option>Computer Science</option>
                    <option>Electronics</option>
                    <option>Mechanical</option>
                    <option>Civil Engineering</option>
                    <option>Information Tech.</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : '➕ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">✏️ Edit User — {selected.name}</div>
              <button className="icon-btn" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={editForm.firstName} onChange={e => setEditForm(p => ({...p, firstName: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={editForm.lastName} onChange={e => setEditForm(p => ({...p, lastName: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={editForm.role} onChange={e => setEditForm(p => ({...p, role: e.target.value}))}>
                    <option value="student">student</option>
                    <option value="faculty">faculty</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={editForm.department} onChange={e => setEditForm(p => ({...p, department: e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🗑️ Confirm Delete</div>
              <button className="icon-btn" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>🗑️ Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
