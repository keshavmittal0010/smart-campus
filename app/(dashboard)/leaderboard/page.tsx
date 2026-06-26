'use client';
import { useState, useEffect } from 'react';

const allBadges = [
  { icon: '🔥', name: 'Streak Scholar', desc: '30-day attendance streak', earned: false },
  { icon: '⚡', name: 'Speed Submitter', desc: 'Submitted before deadline 5× in a row', earned: true },
  { icon: '🌟', name: 'Note Champion', desc: 'Most viewed notes this month', earned: false },
  { icon: '📚', name: 'Quick Learner', desc: 'Accessed notes within 1h of posting', earned: true },
  { icon: '🎯', name: 'Perfect Week', desc: '100% attendance for a full week', earned: true },
  { icon: '🏆', name: 'Top Performer', desc: 'Top 10% grade in any subject', earned: false },
];

const rankColors: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  2: { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
  3: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'board' | 'badges'>('board');
  const [sortBy, setSortBy] = useState<'points' | 'attendance' | 'streak'>('points');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    const u = stored ? JSON.parse(stored) : null;
    if (u?.id) setCurrentUserId(u.id);
    fetch(`/api/leaderboard?userId=${u?.id || ''}`)
      .then(r => r.json())
      .then(data => { setLeaderboard(data.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...leaderboard].sort((a, b) => b[sortBy] - a[sortBy]);
  const myRank = leaderboard.find(l => l.isCurrentUser) || leaderboard[3] || leaderboard[0];
  const topUser = sorted[0];

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading rankings...</div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">Semester 5 · Computer Science Rankings</p>
        </div>
        <div className="tabs" style={{ display: 'inline-flex' }}>
          <div className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>🏆 Rankings</div>
          <div className={`tab ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>🎖️ My Badges</div>
        </div>
      </div>

      {tab === 'board' && (
        <>
          {/* My position card */}
          {myRank && (
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-400)', minWidth: 60, textAlign: 'center' }}>#{myRank.rank}</div>
                <div className="avatar avatar-lg">{myRank.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Your Current Rank — {myRank.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>🔥 {myRank.streak}-day streak &nbsp;·&nbsp; ⭐ {myRank.points.toLocaleString()} pts</div>
                </div>
                {topUser && myRank.rank > 1 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Points to #1</div>
                    <div style={{ fontWeight: 700, color: 'var(--warning)' }}>+{(topUser.points - myRank.points).toLocaleString()} pts</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sort controls */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Sort by:</span>
            {(['points', 'attendance', 'streak'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`btn btn-sm ${sortBy === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {s === 'points' ? '⭐ Points' : s === 'attendance' ? '✅ Attendance' : '🔥 Streak'}
              </button>
            ))}
          </div>

          {/* Top 3 podium */}
          {sorted.length >= 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[sorted[1], sorted[0], sorted[2]].map((user, idx) => {
                const displayRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const rc = rankColors[displayRank];
                return (
                  <div key={user.roll} className="card" style={{
                    textAlign: 'center',
                    background: rc.bg, border: `1px solid ${rc.border}`,
                    paddingTop: idx === 1 ? '2rem' : '1.25rem',
                    order: idx === 1 ? -1 : idx,
                  }}>
                    <div style={{ fontSize: idx === 1 ? '2.5rem' : '1.8rem', marginBottom: '0.25rem' }}>
                      {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : '🥉'}
                    </div>
                    <div className="avatar avatar-lg" style={{ margin: '0 auto 0.75rem', fontSize: idx === 1 ? '1.2rem' : '0.9rem', width: idx === 1 ? 56 : 44, height: idx === 1 ? 56 : 44 }}>{user.avatar}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{user.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: rc.text }}>{user.points.toLocaleString()}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>points</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full leaderboard table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Attendance</th>
                  <th>Submissions</th>
                  <th>Streak</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((user, i) => (
                  <tr key={user.roll} style={{ background: user.isCurrentUser ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
                    <td>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.8rem',
                        background: i < 3 ? [rankColors[1].bg, rankColors[2].bg, rankColors[3].bg][i] : 'var(--glass)',
                        color: i < 3 ? [rankColors[1].text, rankColors[2].text, rankColors[3].text][i] : 'var(--text-muted)',
                      }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm">{user.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.roll}</div>
                        </div>
                        {user.isCurrentUser && <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>You</span>}
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: user.attendance >= 85 ? 'var(--success)' : user.attendance >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{user.attendance}%</span></td>
                    <td style={{ fontWeight: 600 }}>{user.submissions}</td>
                    <td><span style={{ color: 'var(--orange)', fontWeight: 600 }}>🔥 {user.streak}d</span></td>
                    <td><span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-400)' }}>{user.points.toLocaleString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'badges' && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🎖️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Your Badge Collection</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{allBadges.filter(b => b.earned).length} of {allBadges.length} badges earned</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="progress-bar-container" style={{ width: 120, marginBottom: '0.25rem' }}>
                <div className="progress-bar blue" style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{Math.round((allBadges.filter(b => b.earned).length / allBadges.length) * 100)}% complete</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {allBadges.map(badge => (
              <div key={badge.name} className="card" style={{
                textAlign: 'center',
                opacity: badge.earned ? 1 : 0.5,
                background: badge.earned ? 'var(--surface)' : 'var(--glass)',
                border: badge.earned ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: badge.earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{badge.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{badge.desc}</div>
                <div style={{ marginTop: '0.75rem' }}>
                  {badge.earned ? <span className="badge badge-success">✓ Earned</span> : <span className="badge badge-gray">🔒 Locked</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
