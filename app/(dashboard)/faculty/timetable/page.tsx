'use client';
import { useState, useEffect } from 'react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function FacultyTimetablePage() {
  const [view, setView] = useState<'week' | 'today'>('week');
  const [hoveredClass, setHoveredClass] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>({});
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as string;

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }

    if (parsedUser) {
      fetch(`/api/faculty/timetable?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setSchedule(data.schedule || {});
          setTodayClasses(data.todayClasses || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading faculty timetable:', err);
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
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading schedule...</div>
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
          <h1 className="page-title">📅 My Teaching Schedule</h1>
          <p className="page-subtitle">Faculty Weekly Timetable · {user?.name}</p>
        </div>
        <div className="tabs" style={{ display: 'inline-flex' }}>
          <div className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>📅 Week View</div>
          <div className={`tab ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>📍 Today</div>
        </div>
      </div>

      {/* Today's summary strip */}
      {todayClasses.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>📍 Today ({today}):</div>
          {todayClasses.map((cls, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', background: `${cls.color}15`, border: `1px solid ${cls.color}40`, borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cls.color, display: 'inline-block' }} />
              <span style={{ fontWeight: 600, color: cls.color }}>{cls.code}</span>
              <span style={{ color: 'var(--text-muted)' }}>{cls.time} · Sec {cls.section}</span>
            </div>
          ))}
        </div>
      )}

      {view === 'week' ? (
        <div style={{ overflowX: 'auto' }}>
          <div className="card" style={{ minWidth: 900, padding: '1.25rem' }}>
            {/* Single Grid Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gridAutoRows: 'minmax(52px, auto)', gap: '0.5rem' }}>
              {/* Grid header */}
              <div />
              {days.map((d, colIndex) => (
                <div key={d} style={{ gridRow: 1, gridColumn: colIndex + 2, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: d === today ? 'var(--primary-400)' : 'var(--text-muted)', padding: '0.5rem', borderRadius: 8, background: d === today ? 'rgba(59,130,246,0.08)' : 'transparent', marginBottom: '0.5rem' }}>
                  {d.slice(0, 3)}
                  {d === today && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-400)', margin: '2px auto 0' }} />}
                </div>
              ))}
              
              {/* Grid Background and Time labels */}
              {timeSlots.map((slot, rowIndex) => (
                <div key={`bg-${slot}`} style={{ display: 'contents' }}>
                  {/* Time Label (Column 1) */}
                  <div style={{ gridColumn: 1, gridRow: rowIndex + 2, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '0.5rem', paddingTop: '0.5rem', fontFamily: 'monospace' }}>
                    {slot}
                  </div>
                  {/* Empty Background Cells */}
                  {days.map((day, colIndex) => (
                    <div key={`bg-${day}-${slot}`} style={{ gridColumn: colIndex + 2, gridRow: rowIndex + 2, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid transparent' }} />
                  ))}
                </div>
              ))}

              {/* Grid Items (Classes) */}
              {days.map((day, colIndex) => {
                return timeSlots.map((slot, rowIndex) => {
                  const cls = schedule[day]?.[slot];
                  // Render the block only on the first hour. It will span down via gridRow.
                  if (cls && !cls.isContinuation) {
                    return (
                      <div
                        key={`class-${day}-${slot}`}
                        onMouseEnter={() => setHoveredClass({ ...cls, time: slot, day })}
                        onMouseLeave={() => setHoveredClass(null)}
                        style={{
                          gridColumn: colIndex + 2,
                          gridRow: `${rowIndex + 2} / span ${cls.duration || 1}`,
                          zIndex: 10,
                          borderRadius: 8, padding: '0.6rem',
                          background: `${cls.color}18`, border: `1px solid ${cls.color}50`,
                          cursor: 'pointer', transition: 'all 0.2s',
                          borderLeft: `3px solid ${cls.color}`,
                          minHeight: 52
                        }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cls.color }}>{cls.code}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{cls.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Sec {cls.section} · {cls.room}</div>
                      </div>
                    );
                  }
                  return null;
                });
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Today Detail View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {todayClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌴</div>
              <div style={{ fontWeight: 600 }}>No classes today!</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Enjoy your free day.</div>
            </div>
          ) : todayClasses.map((cls, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderLeft: `4px solid ${cls.color}` }}>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cls.color }}>{cls.time}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{parseInt(cls.time) + cls.duration}:00 end</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${cls.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📚</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{cls.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {cls.code} · Section {cls.section} &nbsp;·&nbsp; 🚪 {cls.room}
                </div>
              </div>
              <span className="badge badge-primary">📚 Lecture</span>
            </div>
          ))}
        </div>
      )}

      {/* Class hover tooltip */}
      {hoveredClass && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: `1px solid ${hoveredClass.color}`, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', zIndex: 200, minWidth: 220, animation: 'slideUp 0.2s ease' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: hoveredClass.color, marginBottom: '0.25rem' }}>{hoveredClass.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {hoveredClass.day} · {hoveredClass.time}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🚪 {hoveredClass.room} · Section {hoveredClass.section}</div>
        </div>
      )}
    </div>
  );
}
