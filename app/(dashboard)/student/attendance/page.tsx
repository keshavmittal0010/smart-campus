'use client';
import { useState, useEffect } from 'react';

function AttendanceRing({ pct, color, size = 100 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="attendance-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="attendance-ring-text">
        <div className="pct" style={{ color: pct < 75 ? 'var(--danger)' : 'var(--text-primary)' }}>{pct}%</div>
        <div className="label">attended</div>
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }

    if (parsedUser) {
      fetch(`/api/student/attendance?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setSubjects(data.subjects || []);
          setAttendanceLog(data.attendanceLog || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching attendance:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading attendance details...</div>
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

  const overall = subjects.length > 0 
    ? Math.round(subjects.reduce((s, sub) => s + (sub.attended / sub.total * 100), 0) / subjects.length)
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">✅ My Attendance</h1>
        <p className="page-subtitle">Track your attendance across all subjects</p>
      </div>

      {/* Overall Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <AttendanceRing pct={overall} color={overall < 75 ? '#ef4444' : '#3b82f6'} size={110} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Overall Attendance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{overall}%</div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${overall >= 75 ? 'badge-success' : 'badge-danger'}`}>
                {overall >= 75 ? '✓ Above Minimum' : '⚠️ Below 75% Threshold'}
              </span>
              <span className="badge badge-gray">Semester 5 · 2024</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Classes Attended', value: subjects.reduce((s, sub) => s + sub.attended, 0), color: 'var(--success)' },
              { label: 'Classes Missed', value: subjects.reduce((s, sub) => s + (sub.total - sub.attended), 0), color: 'var(--danger)' },
              { label: 'Total Classes', value: subjects.reduce((s, sub) => s + sub.total, 0), color: 'var(--text-primary)' },
              { label: 'Subjects Safe', value: subjects.filter(s => (s.attended / s.total * 100) >= 75).length, color: 'var(--primary-400)' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem', display: 'inline-flex' }}>
        {['overview', 'log'].map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'overview' ? '📊 Subject Overview' : '📋 Attendance Log'}
          </div>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid-responsive" style={{ gap: '1rem' }}>
          {subjects.map(sub => {
            const pct = Math.round((sub.attended / sub.total) * 100);
            const safe = pct >= 75;
            return (
              <div key={sub.code} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <AttendanceRing pct={pct} color={safe ? sub.color : '#ef4444'} size={90} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{sub.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{sub.code} · {sub.faculty}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {sub.attended}/{sub.total} classes attended
                  </div>
                  <span className={`badge ${safe ? 'badge-success' : 'badge-danger'}`}>
                    {safe ? '✓ Safe' : `⚠️ Need ${Math.ceil((0.75 * sub.total - sub.attended) / 0.25)} more`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLog.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.date}</td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.subject}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.time}</td>
                  <td>
                    <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                      {log.status === 'present' ? '✓ Present' : log.status === 'late' ? '⏰ Late' : '✗ Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
