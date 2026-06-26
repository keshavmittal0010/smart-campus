'use client';
import { useState, useEffect } from 'react';

const gradeColors: Record<string, string> = {
  'O': 'var(--success)', 'A+': 'var(--success)', 'A': 'var(--primary-400)',
  'B+': 'var(--primary-400)', 'B': 'var(--warning)', 'F': 'var(--danger)',
  'Pending': 'var(--text-muted)', 'N/A': 'var(--text-muted)',
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    const u = stored ? JSON.parse(stored) : null;
    if (!u?.id) { setError('Not logged in'); setLoading(false); return; }

    fetch(`/api/student/results?userId=${u.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setResults(data);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load results'); setLoading(false); });
  }, []);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--text-muted)' }}>Loading your results...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Results Found</div>
        <div style={{ fontSize: '0.875rem' }}>{error}</div>
      </div>
    </div>
  );

  const { subjects, cgpa, gradeCard } = results;
  const cgpaColor = cgpa >= 8.5 ? 'var(--success)' : cgpa >= 7 ? 'var(--primary-400)' : cgpa >= 5 ? 'var(--warning)' : 'var(--danger)';
  const cgpaGrade = cgpa >= 9 ? 'O' : cgpa >= 8 ? 'A+' : cgpa >= 7 ? 'A' : cgpa >= 6 ? 'B+' : cgpa >= 5 ? 'B' : 'F';

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📊 My Results</h1>
          <p className="page-subtitle">Semester {gradeCard.semester} · {gradeCard.department}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print Report Card</button>
        </div>
      </div>

      {/* CGPA Banner */}
      <div style={{ marginBottom: '1.5rem', padding: '1.5rem 2rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cumulative GPA</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, color: cgpaColor, lineHeight: 1 }}>{cgpa > 0 ? cgpa.toFixed(1) : '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of 10.0</div>
        </div>
        <div style={{ width: 1, height: 80, background: 'var(--border)' }} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Grade', value: cgpaGrade, color: cgpaColor },
            { label: 'Student ID', value: gradeCard.studentId, color: 'var(--text-primary)' },
            { label: 'Semester', value: `Sem ${gradeCard.semester}`, color: 'var(--text-primary)' },
            { label: 'Total Credits', value: gradeCard.totalCredits, color: 'var(--text-primary)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject-wise Results Table */}
      <div className="table-container" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>
          📋 Subject-wise Performance — Semester {gradeCard.semester}, {gradeCard.year}
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Code</th>
              <th>Credits</th>
              <th>Attendance</th>
              <th>Marks</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub: any) => (
              <tr key={sub.code}>
                <td style={{ fontWeight: 600 }}>{sub.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sub.code}</td>
                <td style={{ fontWeight: 600, textAlign: 'center' }}>{sub.credits}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="progress-bar-container" style={{ width: 80 }}>
                      <div className="progress-bar" style={{ width: `${sub.attendancePct}%`, background: sub.attendancePct >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sub.attendancePct >= 75 ? 'var(--success)' : 'var(--danger)' }}>{sub.attendancePct}%</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub.attended}/{sub.total} classes</div>
                </td>
                <td>
                  {sub.marks !== null ? (
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.marks}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{sub.maxMarks}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending</span>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: gradeColors[sub.grade] || 'var(--text-muted)' }}>{sub.grade}</span>
                </td>
                <td>
                  {sub.pass === null ? (
                    <span className="badge badge-gray">⏳ Pending</span>
                  ) : sub.pass ? (
                    <span className="badge badge-success">✓ Pass</span>
                  ) : (
                    <span className="badge badge-danger">✗ Fail</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grade Legend */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: '0.875rem' }}>📌 Grade Scale Reference</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { grade: 'O', range: '90-100%', color: 'var(--success)' },
            { grade: 'A+', range: '80-89%', color: 'var(--success)' },
            { grade: 'A', range: '70-79%', color: 'var(--primary-400)' },
            { grade: 'B+', range: '60-69%', color: 'var(--primary-400)' },
            { grade: 'B', range: '50-59%', color: 'var(--warning)' },
            { grade: 'F', range: 'Below 50%', color: 'var(--danger)' },
          ].map(g => (
            <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, color: g.color, fontSize: '0.95rem' }}>{g.grade}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({g.range})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
