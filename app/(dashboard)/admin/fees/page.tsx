'use client';
import { useState, useEffect } from 'react';

export default function AdminFeesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  // Selected student's detailed fees and payments
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);

  // Loading states
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  // Add Fee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFeeLabel, setNewFeeLabel] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [newFeeDueDate, setNewFeeDueDate] = useState('');

  // Fetch student summary list
  const fetchStudents = () => {
    setLoadingList(true);
    fetch('/api/admin/fees')
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setFilteredStudents(data);
        setLoadingList(false);
      })
      .catch((err) => {
        console.error('Error fetching students:', err);
        setLoadingList(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter student list based on query
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredStudents(students);
      return;
    }
    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // Fetch detailed fees for selected student
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    fetch(`/api/admin/fees?studentId=${student.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStudentFees(data.fees || []);
        setStudentPayments(data.payments || []);
        setLoadingDetails(false);
      })
      .catch((err) => {
        console.error('Error fetching student details:', err);
        setLoadingDetails(false);
      });
  };

  // Add a new fee demand
  const handleAddFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newFeeLabel || !newFeeAmount || !newFeeDueDate) return;

    setSubmitting(true);
    fetch('/api/admin/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: selectedStudent.id,
        label: newFeeLabel,
        amount: Number(newFeeAmount),
        dueDate: newFeeDueDate,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmitting(false);
        if (data.success) {
          // Add to local detail list
          setStudentFees((prev) => [...prev, data.fee].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
          setIsAddModalOpen(false);
          setNewFeeLabel('');
          setNewFeeAmount('');
          setNewFeeDueDate('');
          // Refresh list to update totals
          fetchStudents();
        } else {
          alert(data.error || 'Failed to add fee');
        }
      })
      .catch((err) => {
        setSubmitting(false);
        console.error('Error adding fee:', err);
        alert('Failed to add fee');
      });
  };

  // Manually mark a fee as paid
  const handleMarkPaid = (feeId: string) => {
    setActingId(feeId);
    fetch('/api/admin/fees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeId, paid: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        setActingId(null);
        if (data.success) {
          // Update details list locally
          setStudentFees((prev) =>
            prev.map((f) => (f.id === feeId ? { ...f, paid: true } : f))
          );
          // Fetch updated details list to reload payment history
          if (selectedStudent) handleSelectStudent(selectedStudent);
          // Refresh list to update totals
          fetchStudents();
        } else {
          alert(data.error || 'Failed to mark paid');
        }
      })
      .catch((err) => {
        setActingId(null);
        console.error('Error marking paid:', err);
        alert('Error performing action');
      });
  };

  // Delete a fee demand
  const handleDeleteFee = (feeId: string) => {
    if (!confirm('Are you sure you want to delete this fee charge?')) return;
    setActingId(feeId);
    fetch(`/api/admin/fees?feeId=${feeId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => {
        setActingId(null);
        if (data.success) {
          // Update details list locally
          setStudentFees((prev) => prev.filter((f) => f.id !== feeId));
          // Refresh list to update totals
          fetchStudents();
        } else {
          alert(data.error || 'Failed to delete fee');
        }
      })
      .catch((err) => {
        setActingId(null);
        console.error('Error deleting fee:', err);
        alert('Error performing action');
      });
  };

  // Calculate overall metrics
  const totalBilled = students.reduce((sum, s) => sum + s.totalFees, 0);
  const totalCollected = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstanding = students.reduce((sum, s) => sum + s.totalDue, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Manage Student Fees</h1>
          <p className="page-subtitle">Billing demands, invoices, collections, and outstanding dues</p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Billed', value: `₹${totalBilled.toLocaleString('en-IN')}`, icon: '🧾', color: 'var(--text-primary)', bg: 'var(--surface-2)' },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, icon: '💰', color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Outstanding Dues', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, icon: '⚠️', color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Collection Rate', value: `${collectionRate}%`, icon: '📈', color: 'var(--primary-400)', bg: 'rgba(59,130,246,0.08)' },
        ].map((item) => (
          <div key={item.label} style={{ padding: '1.25rem', background: item.bg, border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '40% 60%' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
        {/* Left Side: Students List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="section-title" style={{ margin: 0 }}>👥 Students Registry</div>
            <input
              type="text"
              placeholder="Search Student ID, name, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                width: '60%',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loadingList ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading student data...</div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students match search query.</div>
            ) : (
              filteredStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: selectedStudent?.id === s.id ? 'var(--surface-3)' : 'var(--surface-2)',
                    border: `1px solid ${selectedStudent?.id === s.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStudent?.id !== s.id) e.currentTarget.style.borderColor = 'var(--text-muted)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStudent?.id !== s.id) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {s.studentId} · {s.department} · Sem {s.semester}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: s.totalDue > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      ₹{s.totalDue.toLocaleString('en-IN')} Due
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Paid: ₹{s.totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Selected Student Details & Actions */}
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>ACCOUNT DETAILS</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0' }}>{selectedStudent.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    ID: {selectedStudent.studentId} · Sem {selectedStudent.semester} · {selectedStudent.department}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
                    ➕ Assign Fee
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}>
                    ❌ Close
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading student ledger...</div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Demanded Fee Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {studentFees.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>No fees assigned.</div>
                    ) : (
                      studentFees.map((fee) => (
                        <div
                          key={fee.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            background: fee.paid ? 'rgba(16,185,129,0.03)' : fee.overdue ? 'rgba(239,68,68,0.04)' : 'var(--surface-2)',
                            border: `1px solid ${fee.paid ? 'rgba(16,185,129,0.15)' : fee.overdue ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-lg)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{fee.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>₹{fee.amount.toLocaleString('en-IN')}</div>
                              {fee.paid ? (
                                <span className="badge badge-success">Paid</span>
                              ) : fee.overdue ? (
                                <span className="badge badge-danger">Overdue</span>
                              ) : (
                                <span className="badge badge-warning">Due</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {!fee.paid && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  disabled={actingId === fee.id}
                                  onClick={() => handleMarkPaid(fee.id)}
                                  title="Mark as Paid Manually"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                                >
                                  ✅
                                </button>
                              )}
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={actingId === fee.id}
                                onClick={() => handleDeleteFee(fee.id)}
                                title="Delete/Waive Fee Charge"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Payment Transactions Ledger</h4>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {studentPayments.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>No payments recorded.</div>
                    ) : (
                      <table className="table" style={{ fontSize: '0.78rem' }}>
                        <thead>
                          <tr>
                            <th>Transaction ID</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentPayments.map((p) => (
                            <tr key={p.id}>
                              <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.id.substring(0, 8).toUpperCase()}</td>
                              <td style={{ fontWeight: 600 }}>{p.feeLabel}</td>
                              <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                              <td>{new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                              <td>{p.method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Fee Modal Dialog */}
      {isAddModalOpen && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '400px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Assign Fee Demand</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddFee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Fee Description/Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee - Sem 5, Library Fine, etc."
                  value={newFeeLabel}
                  onChange={(e) => setNewFeeLabel(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Fee Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Due Date</label>
                <input
                  type="date"
                  required
                  value={newFeeDueDate}
                  onChange={(e) => setNewFeeDueDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Creating Demand...' : 'Create Fee Demand'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
