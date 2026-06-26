'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FacultyAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading assignments...</div>
        </div>
      </div>
    }>
      <FacultyAssignmentsPageContent />
    </Suspense>
  );
}

function FacultyAssignmentsPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('list');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<any>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState('');
  const [maxMks, setMaxMks] = useState('100');

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAssignments = (userId: string) => {
    fetch(`/api/faculty/assignments?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
        return fetch(`/api/faculty/dashboard?userId=${userId}`);
      })
      .then(res => res ? res.json() : null)
      .then(dashData => {
        if (dashData && dashData.classes) {
          setClassesList(dashData.classes);
          if (dashData.classes.length > 0) {
            setSelectedClassId(dashData.classes[0].id);
          }
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

  const tabParam = searchParams.get('tab') || '';
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  const handleSelectAssignmentForGrading = (assignment: any) => {
    setSelectedAssignment(assignment);
    setTab('grade');
    setLoadingSubmissions(true);

    fetch(`/api/faculty/assignments/submissions?assignmentId=${assignment.id}`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data || []);
        setLoadingSubmissions(false);
      })
      .catch(err => {
        console.error('Error fetching submissions:', err);
        setLoadingSubmissions(false);
      });
  };

  const handleGradeSubmission = async () => {
    if (!gradingStudent || !marks || !selectedAssignment) return;

    try {
      const res = await fetch('/api/faculty/assignments/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: gradingStudent.id,
          marks: parseFloat(marks),
          feedback
        })
      });

      if (!res.ok) throw new Error('Failed to submit grade');

      // Refresh submissions
      const subsRes = await fetch(`/api/faculty/assignments/submissions?assignmentId=${selectedAssignment.id}`);
      const subsData = await subsRes.json();
      setSubmissions(subsData || []);

      // Refresh assignments
      if (user) {
        const assigRes = await fetch(`/api/faculty/assignments?userId=${user.id}`);
        const assigData = await assigRes.json();
        setAssignments(assigData || []);
        const updatedAssign = (assigData || []).find((a: any) => a.id === selectedAssignment.id);
        if (updatedAssign) setSelectedAssignment(updatedAssign);
      }

      setGradingStudent(null);
      setMarks('');
      setFeedback('');
      showToast('✅ Grade saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to submit grade. Please try again.');
    }
  };

  const handleCreateAssignment = async () => {
    if (!title.trim() || !due || !maxMks || !selectedClassId || !user) return;

    try {
      const res = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          classId: selectedClassId,
          title,
          description: desc,
          dueDate: due,
          maxMarks: maxMks
        })
      });

      if (!res.ok) throw new Error('Failed to create assignment');

      fetchAssignments(user.id);

      setShowCreate(false);
      setTitle('');
      setDesc('');
      setDue('');
      setMaxMks('100');
      showToast('✅ Assignment published successfully!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to create assignment. Please try again.');
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
          <h1 className="page-title">📝 Assignment Management</h1>
          <p className="page-subtitle">Create, manage, and grade assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Assignment</button>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <div className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>📋 All Assignments</div>
        <div className={`tab ${tab === 'grade' ? 'active' : ''}`} onClick={() => { setTab('grade'); if (assignments.length > 0 && !selectedAssignment) handleSelectAssignmentForGrading(assignments[0]); }}>⭐ Grade Submissions</div>
      </div>

      {tab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignments.map(a => {
            const searchParam = searchParams.get('search') || '';
            if (searchParam) {
              const q = searchParam.toLowerCase();
              const matches = a.title.toLowerCase().includes(q) || a.class.toLowerCase().includes(q);
              if (!matches) return null;
            }
            const submPct = Math.round((a.submissions / a.total) * 100);
            const gradedPct = a.submissions > 0 ? Math.round((a.graded / a.submissions) * 100) : 0;
            return (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span className="badge badge-primary">{a.class}</span>
                      <span className={`badge ${a.published ? 'badge-success' : 'badge-gray'}`}>{a.published ? '✓ Published' : '📝 Draft'}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Due: {new Date(a.due).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · Max: {a.maxMarks} marks</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm">✏️ Edit</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSelectAssignmentForGrading(a)}>⭐ Grade</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Submissions ({a.submissions}/{a.total})</div>
                    <div className="progress-bar-container">
                      <div className="progress-bar blue" style={{ width: `${submPct}%` }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{submPct}% submitted</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Graded ({a.graded}/{a.submissions})</div>
                    <div className="progress-bar-container">
                      <div className="progress-bar green" style={{ width: `${gradedPct}%` }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{gradedPct}% graded</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'grade' && selectedAssignment && (
        <div>
          <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{selectedAssignment.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedAssignment.class} · {selectedAssignment.submissions} submissions</div>
            </div>
            <select 
              className="form-input" 
              style={{ width: 'auto' }} 
              value={assignments.findIndex(a => a.id === selectedAssignment.id)} 
              onChange={e => handleSelectAssignmentForGrading(assignments[parseInt(e.target.value)])}
            >
              {assignments.map((a, i) => <option key={a.id} value={i}>{a.title}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Roll No.</th><th>Submitted</th><th>Marks</th><th>Action</th></tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 600 }}>{s.student}</div></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.roll}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.submitted}</td>
                    <td>
                      {s.marks !== null
                        ? <span className="badge badge-success">✓ {s.marks}/{selectedAssignment.maxMarks}</span>
                        : <span className="badge badge-warning">⏳ Pending</span>}
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setGradingStudent(s)}>
                        {s.marks !== null ? '✏️ Re-grade' : '⭐ Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingStudent && (
        <div className="modal-overlay" onClick={() => setGradingStudent(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{gradingStudent.roll}</div>
                <div className="modal-title">⭐ Grade — {gradingStudent.student}</div>
              </div>
              <button className="icon-btn" onClick={() => setGradingStudent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Student's Submission:</div>
                {gradingStudent.text}
              </div>
              <div className="form-group">
                <label className="form-label">Marks (out of {selectedAssignment?.maxMarks || 100})</label>
                <input className="form-input" type="number" min="0" max={selectedAssignment?.maxMarks || 100}
                  placeholder="Enter marks..." value={marks} onChange={e => setMarks(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback (optional)</label>
                <textarea className="form-input" rows={3} placeholder="Write feedback for the student..." value={feedback} onChange={e => setFeedback(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setGradingStudent(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGradeSubmission}>💾 Save Grade</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📝 Create New Assignment</div>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input className="form-input" placeholder="Enter assignment title..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Instructions</label>
                <textarea className="form-input" rows={4} placeholder="Describe the assignment requirements..." value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Marks</label>
                  <input className="form-input" type="number" value={maxMks} onChange={e => setMaxMks(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Class / Section</label>
                <select 
                  className="form-input"
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.code}-{c.section} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Save as Draft</button>
              <button className="btn btn-primary" onClick={handleCreateAssignment}>📢 Publish Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
