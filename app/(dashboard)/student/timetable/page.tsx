'use client';
import { useState, useEffect } from 'react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function TimetablePage() {
  const [view, setView] = useState<'week' | 'today'>('week');
  const [hoveredClass, setHoveredClass] = useState<any>(null);
  const [schedule, setSchedule] = useState<Record<string, Record<string, any>>>({});
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as string;

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }

    if (parsedUser) {
      fetch(`/api/student/timetable?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setSchedule(data.schedule || {});
          setTodayClasses(data.todayClasses || []);
          setSubjects(data.subjects || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching timetable:', err);
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
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading timetable...</div>
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
          <h1 className="page-title">📅 Timetable</h1>
          <p className="page-subtitle">Semester 5 — Class Schedule 2024</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="tabs" style={{ display: 'inline-flex' }}>
            <div className={`tab ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>📆 Today</div>
            <div className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>📅 Week View</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {subjects.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>

      {view === 'today' ? (
        <div>
          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '2rem' }}>📆</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{todayClasses.length} classes scheduled today</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {todayClasses.map((cls, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1.25rem', padding: '1.25rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', alignItems: 'center', transition: 'all 0.2s'
              }}>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{cls.time.split(' ')[0]}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cls.time.split(' ')[1]}</div>
                </div>
                <div style={{ width: 4, height: 50, borderRadius: 99, background: cls.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{cls.subject}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🚪 {cls.room} &nbsp;·&nbsp; 👨‍🏫 {cls.faculty}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-primary">1 Hour</span>
                  <span className="badge badge-gray">Lecture</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 900, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {/* Single Grid Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(6, 1fr)', gridAutoRows: 'minmax(70px, auto)' }}>
              {/* Header row */}
              <div style={{ gridRow: 1, gridColumn: 1, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
              {days.map((day, colIndex) => (
                <div key={day} style={{
                  gridRow: 1, gridColumn: colIndex + 2,
                  padding: '0.875rem 0.5rem', background: 'var(--surface-2)',
                  textAlign: 'center', fontSize: '0.78rem', fontWeight: 700,
                  color: day === today ? 'var(--primary-400)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderRight: '1px solid var(--border)',
                  borderBottom: day === today ? '2px solid var(--primary-500)' : '1px solid var(--border)'
                }}>
                  {day.slice(0, 3)}
                  {day === today && <span className="badge badge-primary" style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.6rem' }}>TODAY</span>}
                </div>
              ))}

              {/* Grid Background and Time labels */}
              {timeSlots.map((time, rowIndex) => (
                <div key={`bg-${time}`} style={{ display: 'contents' }}>
                  {/* Time Label */}
                  <div style={{ gridRow: rowIndex + 2, gridColumn: 1, padding: '0.5rem', background: 'var(--surface-2)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {time}
                  </div>
                  {/* Empty Background Cells */}
                  {days.map((day, colIndex) => (
                    <div key={`bg-${day}-${time}`} style={{ gridRow: rowIndex + 2, gridColumn: colIndex + 2, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: day === today ? 'rgba(59,130,246,0.03)' : 'transparent' }} />
                  ))}
                </div>
              ))}

              {/* Grid Items (Classes) */}
              {days.map((day, colIndex) => {
                return timeSlots.map((time, rowIndex) => {
                  const cls = schedule[day]?.[time];
                  // Render the block only on the first hour. It will span down via gridRow.
                  if (cls && !cls.isContinuation) {
                    return (
                      <div key={`class-${day}-${time}`} style={{ gridRow: `${rowIndex + 2} / span ${cls.duration || 1}`, gridColumn: colIndex + 2, padding: '0.25rem', zIndex: 10 }}>
                        <div style={{
                          background: `${cls.color}15`,
                          border: `1px solid ${cls.color}40`,
                          borderLeft: `3px solid ${cls.color}`,
                          borderRadius: 6,
                          padding: '0.35rem 0.5rem',
                          height: '100%', minHeight: 56,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={() => setHoveredClass({ ...cls, day, time })}
                          onMouseLeave={() => setHoveredClass(null)}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cls.color }}>{cls.subject}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{cls.room}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{cls.faculty}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                });
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
