'use client';
import { useEffect, useRef, useState } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const months = ['Aug', 'Sep', 'Oct', 'Nov'];
const subjects = ['Data Structures', 'OS', 'DBMS', 'Networks', 'SE'];

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview');
  const [user, setUser] = useState<any>({ role: 'faculty' });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    const u = stored ? JSON.parse(stored) : {};
    fetch(`/api/analytics?userId=${u.id || ''}&role=${u.role || 'faculty'}`)
      .then(r => r.json())
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartDefaults = {
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } } },
      tooltip: { backgroundColor: '#1a1a24', borderColor: '#3f3f46', borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  // Build chart data from API response
  const months = analytics?.months || ['Aug', 'Sep', 'Oct', 'Nov'];
  const subjects = analytics?.subjects || ['Data Structures', 'OS', 'DBMS', 'Networks', 'SE'];

  const attendanceData = {
    labels: months,
    datasets: analytics?.attendanceTrend?.map((t: any) => ({
      label: t.label,
      data: t.data,
      borderColor: t.color,
      backgroundColor: `${t.color}1a`,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: t.color,
    })) || [],
  };

  const gradeData = {
    labels: analytics?.gradesBySubject?.map((g: any) => g.subject) || subjects,
    datasets: [{
      label: 'Average Score',
      data: analytics?.gradesBySubject?.map((g: any) => g.avg) || [],
      backgroundColor: analytics?.gradesBySubject?.map((g: any) => g.bg) || [],
      borderColor: analytics?.gradesBySubject?.map((g: any) => g.border) || [],
      borderWidth: 1, borderRadius: 6,
    }],
  };

  const gradeDistributionData = {
    labels: ['90-100 (A)', '80-89 (B)', '70-79 (C)', '60-69 (D)', '<60 (F)'],
    datasets: [{
      label: 'Number of Students',
      data: analytics?.gradeDistribution || [12, 18, 15, 8, 3],
      backgroundColor: [
        'rgba(16,185,129,0.8)',
        'rgba(59,130,246,0.8)',
        'rgba(245,158,11,0.8)',
        'rgba(139,92,246,0.8)',
        'rgba(239,68,68,0.8)',
      ],
      borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'],
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const submissionData = {
    labels: ['Submitted On Time', 'Late Submission', 'Not Submitted'],
    datasets: [{
      data: analytics ? [
        analytics.submissionRate.onTime,
        analytics.submissionRate.late,
        analytics.submissionRate.notSubmitted,
      ] : [68, 18, 14],
      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
      borderColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 2,
    }],
  };

  const engagementData = {
    labels: months,
    datasets: [
      { label: 'Active Users', data: [2100, 2340, 2580, 2790], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', tension: 0.4, fill: true },
      { label: 'Notes Views', data: [4200, 5100, 6300, 7200], borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', tension: 0.4, fill: true },
    ],
  };

  const totalStats = analytics?.totalStats || { totalStudents: 0, avgAttendance: 0, submitRate: 0, totalClasses: 0 };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📊 Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time insights and performance metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="form-input" style={{ width: 'auto' }}>
            <option>Semester 5 — 2024</option>
            <option>Semester 4 — 2024</option>
          </select>
          <button className="btn btn-primary">📥 Export Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Avg Attendance', value: loading ? '...' : `${totalStats.avgAttendance}%`, change: '↑ Real-time', color: 'var(--success)', icon: '✅' },
          { label: 'Avg Grade Score', value: loading ? '...' : `${analytics?.gradesBySubject?.[0]?.avg ?? 0}/100`, change: '↑ From submissions', color: 'var(--primary-400)', icon: '⭐' },
          { label: 'Submit Rate', value: loading ? '...' : `${totalStats.submitRate}%`, change: '→ This semester', color: 'var(--warning)', icon: '📝' },
          { label: 'Total Students', value: loading ? '...' : totalStats.totalStudents.toLocaleString(), change: '↑ Active learners', color: 'var(--purple)', icon: '👥' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{kpi.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '0.72rem', color: kpi.change.startsWith('↑') ? 'var(--success)' : 'var(--text-muted)' }}>{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        {['overview', 'attendance', 'grades', 'engagement'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'overview' ? '📋 Overview' : t === 'attendance' ? '✅ Attendance' : t === 'grades' ? '⭐ Grades' : '📈 Engagement'}
          </div>
        ))}
      </div>

      {/* Charts */}
      {(tab === 'overview' || tab === 'attendance') && (
        <div style={{ display: 'grid', gridTemplateColumns: tab === 'overview' ? '2fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="section-title">📈 Attendance Trend (Monthly)</div>
            <div style={{ height: 280 }}>
              <Line data={attendanceData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: false } as any} />
            </div>
          </div>
          {tab === 'overview' && (
            <div className="card">
              <div className="section-title">📝 Assignment Submissions</div>
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={submissionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } } } as any} />
              </div>
            </div>
          )}
        </div>
      )}

      {(tab === 'overview' || tab === 'grades') && (
        <div style={{ display: 'grid', gridTemplateColumns: tab === 'grades' ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="grid-responsive">
          <div className="card">
            <div className="section-title">⭐ Average Grade by Subject</div>
            <div style={{ height: 280 }}>
              <Bar data={gradeData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: false } as any} />
            </div>
          </div>
          {tab === 'grades' && (
            <div className="card">
              <div className="section-title">📊 Grade Distribution (Class-wide)</div>
              <div style={{ height: 280 }}>
                <Bar data={gradeDistributionData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: false, plugins: { ...chartDefaults.plugins, legend: { display: false } } } as any} />
              </div>
            </div>
          )}
        </div>
      )}

      {(tab === 'overview' || tab === 'engagement') && (
        <div className="card">
          <div className="section-title">👥 Platform Engagement</div>
          <div style={{ height: 280 }}>
            <Line data={engagementData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: false } as any} />
          </div>
        </div>
      )}

      {/* Subject Performance Table */}
      {tab === 'grades' && (
        <div className="table-container" style={{ marginTop: '1.25rem' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Subject-wise Performance Summary</div>
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Avg Score</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Pass Rate</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sub: 'Data Structures', avg: 78, high: 97, low: 42, pass: 89 },
                { sub: 'Operating Systems', avg: 65, high: 91, low: 31, pass: 74 },
                { sub: 'DBMS', avg: 85, high: 99, low: 58, pass: 96 },
                { sub: 'Computer Networks', avg: 72, high: 94, low: 38, pass: 82 },
                { sub: 'Software Engineering', avg: 80, high: 98, low: 55, pass: 92 },
              ].map(row => (
                <tr key={row.sub}>
                  <td style={{ fontWeight: 600 }}>{row.sub}</td>
                  <td><span style={{ fontWeight: 700, color: row.avg >= 80 ? 'var(--success)' : row.avg >= 65 ? 'var(--warning)' : 'var(--danger)' }}>{row.avg}/100</span></td>
                  <td style={{ color: 'var(--success)' }}>{row.high}</td>
                  <td style={{ color: 'var(--danger)' }}>{row.low}</td>
                  <td><span className={`badge ${row.pass >= 85 ? 'badge-success' : row.pass >= 75 ? 'badge-warning' : 'badge-danger'}`}>{row.pass}%</span></td>
                  <td>
                    <div className="progress-bar-container" style={{ width: 120 }}>
                      <div className="progress-bar" style={{ width: `${row.avg}%`, background: row.avg >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : row.avg >= 65 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                    </div>
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
