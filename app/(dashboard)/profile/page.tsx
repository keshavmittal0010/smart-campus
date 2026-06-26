'use client';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', bio: '' });
  const [saved, setSaved] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Security password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setForm({ name: u.name, email: u.email, phone: '+91 9999999999', department: 'Computer Science & Engineering', bio: 'Passionate about technology, open-source contributions, and building scalable software solutions.' });
      // Fetch real stats
      fetch(`/api/profile?userId=${u.id}`)
        .then(r => r.json())
        .then(data => { setProfileData(data); setLoadingStats(false); })
        .catch(() => setLoadingStats(false));
    }
  }, []);

  const handleSave = () => {
    const updated = { ...user, name: form.name };
    localStorage.setItem('sc_user', JSON.stringify(updated));
    setUser(updated);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage({ text: '', isError: false });

    if (newPassword.length < 6) {
      setSecurityMessage({ text: 'New password must be at least 6 characters long', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ text: 'New passwords do not match', isError: true });
      return;
    }

    setUpdatingPassword(true);

    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        currentPassword,
        newPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        setUpdatingPassword(false);
        if (data.success) {
          setSecurityMessage({ text: 'Password successfully updated!', isError: false });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setSecurityMessage({ text: data.error || 'Failed to update password', isError: true });
        }
      })
      .catch(err => {
        setUpdatingPassword(false);
        console.error(err);
        setSecurityMessage({ text: 'Network error. Please try again.', isError: true });
      });
  };

  if (!user) return null;

  const activity = [
    { icon: '📝', text: 'Submitted "Binary Trees Problem Set"', time: '2 hours ago', color: 'var(--primary-400)' },
    { icon: '✅', text: 'Attendance marked for Data Structures', time: '3 hours ago', color: 'var(--success)' },
    { icon: '📓', text: 'Created note "AVL Trees Summary"', time: '1 day ago', color: 'var(--purple)' },
    { icon: '📢', text: 'Read notice "Exam Schedule Released"', time: '1 day ago', color: 'var(--warning)' },
    { icon: '⭐', text: 'Grade received for Socket Programming Lab: 87/100', time: '2 days ago', color: 'var(--orange)' },
    { icon: '📅', text: 'Timetable viewed for this week', time: '3 days ago', color: 'var(--info)' },
  ];

  let stats: any[] = [];
  if (user?.role === 'student') {
    stats = [
      { label: 'Overall Attendance', value: loadingStats ? '...' : `${profileData?.attendance ?? 0}%`, color: 'var(--primary-400)' },
      { label: 'Current CGPA', value: loadingStats ? '...' : (profileData?.cgpa ?? '—'), color: 'var(--success)' },
      { label: 'Assignments Submitted', value: loadingStats ? '...' : `${profileData?.submissions ?? 0}/${profileData?.totalAssignments ?? 0}`, color: 'var(--purple)' },
      { label: 'Semester', value: loadingStats ? '...' : `${profileData?.semester ?? '—'}th`, color: 'var(--warning)' },
    ];
  } else if (user?.role === 'admin') {
    stats = [
      { label: 'Total Users', value: loadingStats ? '...' : (profileData?.totalUsers ?? '—'), color: 'var(--primary-400)' },
      { label: 'System Status', value: loadingStats ? '...' : (profileData?.systemStatus ?? '—'), color: 'var(--success)' },
      { label: 'Notices Posted', value: loadingStats ? '...' : (profileData?.noticesPosted ?? '—'), color: 'var(--purple)' },
      { label: 'Access Level', value: loadingStats ? '...' : (profileData?.accessLevel ?? '—'), color: 'var(--warning)' },
    ];
  } else {
    stats = [
      { label: 'Classes Managed', value: loadingStats ? '...' : (profileData?.classesCount ?? '—'), color: 'var(--primary-400)' },
      { label: 'Students', value: loadingStats ? '...' : (profileData?.totalStudents ?? '—'), color: 'var(--success)' },
      { label: 'Notices Posted', value: loadingStats ? '...' : (profileData?.noticesPosted ?? '—'), color: 'var(--purple)' },
      { label: 'Employee ID', value: loadingStats ? '...' : (profileData?.employeeId ?? '—'), color: 'var(--warning)' },
    ];
  }

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>👤 My Profile</h1>

      {saved && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-lg)', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
          ✓ Profile updated successfully!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Left - Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              <div className="avatar avatar-xl" style={{ margin: '0 auto', fontSize: '1.8rem', width: 80, height: 80 }}>{user.avatar}</div>
              <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-500)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', cursor: 'pointer', color: 'white' }}>✏️</button>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'capitalize' }}>{user.role} · Computer Science</div>
            <span className={`badge ${user.role === 'admin' ? 'badge-purple' : user.role === 'faculty' ? 'badge-success' : 'badge-primary'}`}>
              {user.role === 'admin' ? '🏛️ Administrator' : user.role === 'faculty' ? '👨‍🏫 Faculty Member' : '🎓 Student'}
            </span>
            <div className="divider" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {stats.map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '0.875rem', fontSize: '0.875rem' }}>🔐 Account Security</div>
            {[
              { label: 'Two-Factor Auth', status: false },
              { label: 'Email Notifications', status: true },
              { label: 'Push Notifications', status: true },
              { label: 'SMS Alerts', status: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <div style={{
                  width: 36, height: 20, borderRadius: 999,
                  background: item.status ? 'var(--success)' : 'var(--surface-3)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3, left: item.status ? 18 : 4,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="tabs" style={{ display: 'inline-flex' }}>
            {['profile', 'activity', 'security'].map(t => (
              <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
                {t === 'profile' ? '👤 Profile Info' : t === 'activity' ? '📋 Activity History' : '🔐 Account Security'}
              </div>
            ))}
          </div>

          {tab === 'profile' ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Personal Information</div>
                {!editing ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Save Changes</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Full Name', key: 'name' },
                  { label: 'Email Address', key: 'email' },
                  { label: 'Phone Number', key: 'phone' },
                  { label: 'Department', key: 'department' },
                ].map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    {editing ? (
                      <input className="form-input" value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} />
                    ) : (
                      <div style={{ padding: '0.65rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {form[field.key as keyof typeof form]}
                      </div>
                    )}
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Bio</label>
                  {editing ? (
                    <textarea className="form-input" rows={3} value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} />
                  ) : (
                    <div style={{ padding: '0.65rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {form.bio}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : tab === 'activity' ? (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{a.text}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card animate-fade-in">
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                🔐 Change Account Password
              </div>
              
              {securityMessage.text && (
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1.25rem',
                  background: securityMessage.isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${securityMessage.isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  borderRadius: 'var(--radius-lg)',
                  color: securityMessage.isError ? 'var(--danger)' : 'var(--success)',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  {securityMessage.isError ? '⚠️' : '✓'} {securityMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Current Password</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>New Password</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingPassword}
                  style={{ alignSelf: 'flex-start', marginTop: '0.5rem', minWidth: '140px' }}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
