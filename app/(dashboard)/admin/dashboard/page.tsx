'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError('Failed to load stats'); setLoading(false); });
  }, []);

  const adminStats = stats ? [
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), change: `Active learners`, icon: '🎓', color: 'blue' },
    { label: 'Faculty Members', value: stats.totalFaculty.toLocaleString(), change: `Across departments`, icon: '👨‍🏫', color: 'green' },
    { label: 'Active Classes', value: stats.totalClasses.toLocaleString(), change: `Running this sem`, icon: '📚', color: 'purple' },
    { label: 'Campus Notices', value: stats.totalNotices.toLocaleString(), change: `Posted notices`, icon: '📢', color: 'orange' },
  ] : [];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="page-title">Welcome, {user?.name} 🏛️</h1>
          <p className="page-subtitle">Admin Dashboard — Campus-Wide Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary">📊 Export Report</button>
          <button className="btn btn-primary">🚨 Emergency Broadcast</button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--danger)', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card" style={{ background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ height: 60, borderRadius: 8, background: 'var(--surface-3)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {adminStats.map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-info">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-change up">{s.change}</div>
              </div>
              <div className={`stat-icon ${s.color}`}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Platform Stats + Recent Users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Recent Registrations */}
        <div className="card">
          <div className="section-title">👥 Recent Registrations</div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Loading...</div>
          ) : stats?.recentUsers?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stats.recentUsers.map((u: any, i: number) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < stats.recentUsers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${u.role === 'faculty' ? '#10b981,#059669' : u.role === 'admin' ? '#8b5cf6,#7c3aed' : '#3b82f6,#1d4ed8'})` }}>
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.department}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${u.role === 'faculty' ? 'badge-success' : u.role === 'admin' ? 'badge-purple' : 'badge-primary'}`} style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>{u.role}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No users found</div>
          )}
        </div>

        {/* Platform Stats */}
        <div className="card">
          <div className="section-title">📊 Platform Stats Today</div>
          {stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Attendance Marked Today', value: stats.platformStats.attendanceMarkedToday, icon: '✅', color: 'var(--success)' },
                { label: 'Submissions This Week', value: stats.platformStats.submissionsThisWeek, icon: '📝', color: 'var(--primary-400)' },
                { label: 'Total Active Users', value: stats.totalStudents + stats.totalFaculty, icon: '👥', color: 'var(--purple)' },
                { label: 'Total Classes Running', value: stats.totalClasses, icon: '🏫', color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: item.color }}>{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="section-title">⚡ Quick Admin Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { icon: '👥', label: 'Manage Users', desc: 'Add, edit, deactivate users', href: '/admin/users', color: '#3b82f6' },
            { icon: '📢', label: 'Post Notice', desc: 'Campus-wide announcement', href: '/notices', color: '#10b981' },
            { icon: '📊', label: 'View Analytics', desc: 'Detailed platform insights', href: '/analytics', color: '#8b5cf6' },
            { icon: '📋', label: 'Generate Report', desc: 'Export academic reports', href: '#', color: '#f59e0b' },
          ].map(action => (
            <a key={action.label} href={action.href} style={{ padding: '1.25rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = action.color; (e.currentTarget as HTMLElement).style.background = `${action.color}10`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{action.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{action.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
