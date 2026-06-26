'use client';
import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [attendanceSubjects, setAttendanceSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }
    
    if (parsedUser) {
      fetch(`/api/student/dashboard?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setStats(data.stats || []);
          setTodayClasses(data.todayClasses || []);
          setRecentAssignments(data.recentAssignments || []);
          setNotices(data.notices || []);
          setAttendanceSubjects(data.attendanceSubjects || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching dashboard:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = time.getHours() < 12 ? 'Good Morning' : time.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading dashboard...</div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your academic overview for today</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IST</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className={`stat-change ${s.up ? 'up' : ''}`} style={{ color: s.up ? 'var(--success)' : 'var(--warning)' }}>
                {s.up ? '↑' : '→'} {s.change}
              </div>
            </div>
            <div className={`stat-icon ${s.color}`}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span></div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-responsive" style={{ marginBottom: '1.25rem' }}>
        {/* Today's Classes */}
        <div className="card">
          <div className="section-title">📅 Today's Classes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayClasses.map((cls, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem', background: 'var(--surface-2)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
              }}>
                <div style={{ textAlign: 'center', minWidth: 48 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cls.time}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AM</div>
                </div>
                <div style={{ width: 3, height: 40, borderRadius: 99, background: cls.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cls.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cls.room} · {cls.faculty}</div>
                </div>
                <span className="badge badge-primary">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* Attendance Summary */}
        <div className="card">
          <div className="section-title">📊 Attendance Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {attendanceSubjects.map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.pct < 75 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {s.pct}%
                    {s.pct < 75 && <span style={{ fontSize: '0.65rem', marginLeft: '0.25rem', color: 'var(--danger)' }}>⚠️ Low</span>}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${s.pct}%`, background: s.pct < 75 ? 'linear-gradient(90deg,#ef4444,#f87171)' : `linear-gradient(90deg,${s.color},${s.color}99)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Bottom Grid */}
      <div className="dashboard-grid-main">
        {/* Assignments */}
        <div className="card">
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <span>📝 Assignments</span>
            <a href="/student/assignments" style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 500 }}>View all →</a>
          </div>
          <div className="table-container" style={{ borderRadius: 'var(--radius-lg)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssignments.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.subject}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: a.due === 'Tomorrow' ? 'var(--warning)' : 'var(--text-secondary)' }}>{a.due}</td>
                    <td>
                      <span className={`badge ${a.status === 'graded' ? 'badge-success' : a.status === 'submitted' ? 'badge-info' : 'badge-warning'}`}>
                        {a.status === 'graded' ? `✓ ${a.marks}/100` : a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notices */}
        <div className="card">
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <span>📢 Latest Notices</span>
            <a href="/notices" style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 500 }}>View all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notices.map((n, i) => (
              <div key={i} className={`notice-card ${n.priority}`} style={{ paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{n.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'high' ? 'badge-warning' : 'badge-primary'}`}>
                    {n.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
