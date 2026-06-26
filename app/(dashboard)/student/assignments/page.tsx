'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function getDaysLeft(due: string) {
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'var(--danger)', urgent: true };
  if (diff === 0) return { label: 'Due today', color: 'var(--danger)', urgent: true };
  if (diff === 1) return { label: 'Due tomorrow', color: 'var(--warning)', urgent: true };
  return { label: `${diff} days left`, color: 'var(--text-muted)', urgent: false };
};

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading assignments...</div>
        </div>
      </div>
    }>
      <StudentAssignmentsPageContent />
    </Suspense>
  );
}

function StudentAssignmentsPageContent() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submitText, setSubmitText] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAssignments = (userId: string) => {
    fetch(`/api/student/assignments?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching assignments:', err);
        setAssignments([]);
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
      fetchAssignments(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (id: string) => {
    if (!submitText.trim() || !user) return;
    try {
      const res = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: id, userId: user.id, content: submitText })
      });

      if (!res.ok) throw new Error('Failed to submit assignment');

      fetchAssignments(user.id);
      setSelectedAssignment(null);
      setSubmitText('');
      showToast('📤 Assignment submitted successfully!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to submit assignment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading assignments...</div>
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
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '0.75rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', fontSize: '0.875rem', fontWeight: 600, animation: 'slideUp 0.3s ease' }}>
          {toast}
        </div>
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📝 Assignments</h1>
          <span className="badge badge-warning">{assignments.filter(a => a.status === 'pending' && !a.submitted).length} Pending</span>
          <span className="badge badge-success">{assignments.filter(a => a.status === 'graded').length} Graded</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        {['all', 'pending', 'submitted', 'graded'].map(f => (
          <div key={f} className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'submitted' ? '📤 Submitted' : '✅ Graded'}
          </div>
        ))}
      </div>

      {/* Assignment Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {assignments.map(a => {
          const daysLeft = getDaysLeft(a.due);
          const isSubmitted = a.submitted;
          const status = a.status === 'graded' ? 'graded' : isSubmitted ? 'submitted' : a.status;

          if (filter !== 'all' && status !== filter) return null;

          const searchParam = searchParams.get('search') || '';
          if (searchParam) {
            const q = searchParam.toLowerCase();
            const matches = a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q);
            if (!matches) return null;
          }

          return (
            <div key={a.id} className="assignment-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: `${a.color}20`, border: `1px solid ${a.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0
                }}>📄</div>
                <span className={`badge ${status === 'graded' ? 'badge-success' : status === 'submitted' ? 'badge-info' : daysLeft.urgent ? 'badge-danger' : 'badge-warning'}`}>
                  {status === 'graded' ? `✓ ${a.marks}/${a.maxMarks}` : status === 'submitted' ? '📤 Submitted' : '⏳ Pending'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{a.subject} · {a.code}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{a.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.desc}</div>
              </div>

              {a.feedback && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 8, padding: '0.65rem', fontSize: '0.78rem', color: 'var(--success)' }}>
                  💬 <strong>Feedback:</strong> {a.feedback}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: daysLeft.color }}>
                    {new Date(a.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {daysLeft.label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max: {a.maxMarks} marks</span>
                  {!isSubmitted && status !== 'graded' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setSelectedAssignment(a)}>
                      Submit →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Modal */}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{selectedAssignment.subject}</div>
                <div className="modal-title">📤 Submit Assignment</div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedAssignment(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{selectedAssignment.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due: {new Date(selectedAssignment.due).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Answer / Solution</label>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder="Write your solution, explain your approach..."
                  value={submitText}
                  onChange={e => setSubmitText(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{
                border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
                padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem'
              }}>
                📎 Drag & drop files or click to upload<br />
                <span style={{ fontSize: '0.75rem' }}>PDF, DOCX, ZIP up to 100MB</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedAssignment(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSubmit(selectedAssignment.id)}>
                📤 Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
