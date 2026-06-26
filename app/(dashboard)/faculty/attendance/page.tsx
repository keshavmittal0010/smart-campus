'use client';
import { useState, useEffect } from 'react';

export default function FacultyAttendancePage() {
  const [qrVisible, setQrVisible] = useState(false);
  const [timer, setTimer] = useState(1800);
  const [qrActive, setQrActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  const fetchAttendanceData = (userId: string, classId?: string) => {
    setLoading(true);
    let url = `/api/faculty/attendance?userId=${userId}`;
    if (classId) url += `&classId=${classId}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setClassInfo(data.classInfo);
        setClassesList(data.classesList || []);
        if (data.classInfo) {
          setSelectedClassId(data.classInfo.id);
        }

        const initialAttendance: Record<string, string> = {};
        (data.students || []).forEach((s: any) => {
          initialAttendance[s.roll] = s.status;
        });
        setAttendance(initialAttendance);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching attendance data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    let parsedUser: any = null;
    if (stored) {
      parsedUser = JSON.parse(stored);
      setUser(parsedUser);
    }

    if (parsedUser) {
      fetchAttendanceData(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const generateQR = () => {
    setQrVisible(true);
    setQrActive(true);
    let t = 1800;
    const interval = setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) { clearInterval(interval); setQrActive(false); }
    }, 1000);
  };

  const toggleStatus = (roll: string) => {
    const cycle: Record<string, string> = { present: 'absent', absent: 'late', late: 'present' };
    setAttendance(prev => ({ ...prev, [roll]: cycle[prev[roll]] }));
  };

  const save = async () => {
    if (!user || !selectedClassId) return;

    try {
      const attendanceList = students.map(s => ({
        studentId: s.studentId,
        status: attendance[s.roll] || 'present'
      }));

      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          attendanceList
        })
      });

      if (!res.ok) throw new Error('Failed to save attendance');

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading attendance list...</div>
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

  const present = Object.values(attendance).filter(s => s === 'present').length;
  const absent = Object.values(attendance).filter(s => s === 'absent').length;
  const late = Object.values(attendance).filter(s => s === 'late').length;

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="page-container">
       <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">✅ Attendance Management</h1>
          <p className="page-subtitle">
            {classInfo ? `${classInfo.name} (${classInfo.code}-${classInfo.section})` : 'Loading class...'} · {classInfo?.dateString || new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {classesList.length > 1 && (
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={selectedClassId}
              onChange={e => {
                setSelectedClassId(e.target.value);
                fetchAttendanceData(user?.id, e.target.value);
              }}
            >
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.code}-{c.section}</option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary">📊 View History</button>
          <button className="btn btn-primary" onClick={generateQR}>🔲 Generate QR Code</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Students', value: students.length, color: 'var(--primary-400)', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Present', value: present, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'Absent', value: absent, color: 'var(--danger)', bg: 'var(--danger-bg)' },
          { label: 'Late', value: late, color: 'var(--warning)', bg: 'var(--warning-bg)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 'var(--radius-xl)', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* QR Panel */}
      {qrVisible && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex-responsive" style={{ gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="qr-container" style={{ maxWidth: 200 }}>
                {/* QR Code SVG simulation */}
                <svg width={150} height={150} viewBox="0 0 150 150" style={{ borderRadius: 8 }}>
                  <rect width={150} height={150} fill="white" />
                  {/* QR pattern blocks */}
                  {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                    const inFinder = (r < 7 && c < 7) || (r < 7 && c > 9) || (r > 9 && c < 7);
                    const color = inFinder ? '#000' : Math.random() > 0.5 ? '#000' : 'white';
                    return <rect key={`${r}-${c}`} x={10 + c * 19} y={10 + r * 19} width={17} height={17} fill={color} rx={1} />;
                  }))}
                  <text x={75} y={145} textAnchor="middle" fontSize={8} fill="#666">CS301-A QR</text>
                </svg>
                {qrActive && (
                  <div className="qr-timer" style={{ marginTop: '0.75rem' }}>
                    ⏱ Expires in {fmt(timer)}
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                QR Code Generated for Data Structures — CS301-A
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Students can scan this QR code to mark their attendance. The code expires in <strong style={{ color: 'var(--warning)' }}>{fmt(timer)}</strong>.
                Students must be within 100m of the classroom and connected to campus WiFi.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem 1.25rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-lg)', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{present}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>scanned so far</span>
                </div>
                {!qrActive && <span className="badge badge-danger">QR Expired — Generate New</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {saved && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-lg)', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
          ✓ Attendance saved successfully!
        </div>
      )}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Student Attendance List</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAttendance(Object.fromEntries(students.map(s => [s.roll, 'present'])))}>✓ Mark All Present</button>
            <button className="btn btn-primary btn-sm" onClick={save}>💾 Save Attendance</button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.roll}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.roll}</td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>
                  <span className={`badge ${attendance[s.roll] === 'present' ? 'badge-success' : attendance[s.roll] === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                    {attendance[s.roll] === 'present' ? '✓ Present' : attendance[s.roll] === 'late' ? '⏰ Late' : '✗ Absent'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(s.roll)}>
                    🔄 Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
