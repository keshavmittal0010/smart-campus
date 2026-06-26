'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [classes, setClasses] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }

    if (parsedUser) {
      fetch(`/api/faculty/dashboard?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setClasses(data.classes || []);
          setQuickStats(data.quickStats || []);
          setRecentSubmissions(data.recentSubmissions || []);
          setAttendanceToday(data.attendanceToday || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching faculty dashboard:', err);
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ').slice(0, 2).join(' ')} 👋</h1>
          <p className="page-subtitle">Faculty Dashboard — Computer Science Department</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => router.push('/analytics')}>📊 View Analytics</button>
          <button className="btn btn-primary" onClick={() => router.push('/notices')}>+ Post Notice</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {quickStats.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
            <div className={`stat-icon ${s.color}`}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span></div>
          </div>
        ))}
      </div>

      <div className="grid-responsive" style={{ marginBottom: '1.25rem' }}>
        {/* My Classes */}
        <div className="card">
          <div className="section-title">📚 My Classes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {classes.map(cls => (
              <div key={cls.id} style={{ padding: '0.875rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cls.name} — Section {cls.section}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cls.code} · {cls.semester} Sem · {cls.room}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{cls.enrolled}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>students</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Attendance Quick View */}
        <div className="card">
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <span>✅ Today's Attendance</span>
            <a href="/faculty/attendance" style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>Manage →</a>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { label: 'Present', count: attendanceToday.filter(a => a.status === 'present').length, color: 'var(--success)' },
              { label: 'Absent', count: attendanceToday.filter(a => a.status === 'absent').length, color: 'var(--danger)' },
              { label: 'Late', count: attendanceToday.filter(a => a.status === 'late').length, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {attendanceToday.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{a.roll}</span>
              </div>
              <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="section-title" style={{ justifyContent: 'space-between' }}>
          <span>📝 Recent Submissions — Pending Grading</span>
          <a href="/faculty/assignments" style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>View all →</a>
        </div>
        <div className="table-container" style={{ borderRadius: 'var(--radius-lg)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Assignment</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((sub, i) => (
                <tr key={i}>
                  <td><div style={{ fontWeight: 600 }}>{sub.student}</div></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{sub.roll}</td>
                  <td style={{ fontSize: '0.82rem' }}>{sub.assignment}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.submitted}</td>
                  <td>
                    <span className={`badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                      {sub.status === 'graded' ? `✓ ${sub.marks}/100` : '⏳ Pending'}
                    </span>
                  </td>
                  <td>
                    {sub.status !== 'graded' && (
                      <button className="btn btn-primary btn-sm" onClick={() => router.push('/faculty/assignments?tab=grade')}>Grade Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
