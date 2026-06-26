'use client';
import { useState, useEffect } from 'react';

const feeBreakdown = [
  { label: 'Tuition Fee', amount: 85000, paid: true, dueDate: '2024-08-01' },
  { label: 'Hostel Fee', amount: 42000, paid: true, dueDate: '2024-08-01' },
  { label: 'Library Fee', amount: 2500, paid: true, dueDate: '2024-08-01' },
  { label: 'Lab Fee', amount: 8500, paid: false, dueDate: '2024-12-01' },
  { label: 'Miscellaneous', amount: 3200, paid: false, dueDate: '2024-11-30', overdue: true },
];

const paymentHistory = [
  { id: 'TXN001', date: '2024-08-05', desc: 'Tuition + Hostel + Library', amount: 129500, method: 'Net Banking', status: 'success' },
  { id: 'TXN002', date: '2024-05-10', desc: 'Semester 4 — Full Fees', amount: 138000, method: 'UPI', status: 'success' },
  { id: 'TXN003', date: '2024-01-12', desc: 'Semester 3 — Full Fees', amount: 135000, method: 'Debit Card', status: 'success' },
];

export default function FeePortalPage() {
  const [user, setUser] = useState<any>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handlePay = (label: string) => {
    setPayingId(label);
    setTimeout(() => {
      setPayingId(null);
      setPaidSuccess(label);
      setTimeout(() => setPaidSuccess(null), 4000);
    }, 2000);
  };

  const handlePrint = () => window.print();

  const totalDue = feeBreakdown.filter(f => !f.paid).reduce((s, f) => s + f.amount, 0);
  const totalPaid = feeBreakdown.filter(f => f.paid).reduce((s, f) => s + f.amount, 0);
  const totalFees = feeBreakdown.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="page-container">
      {paidSuccess && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)', animation: 'slideUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ✅ {paidSuccess} paid successfully! Receipt sent to {user?.email}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">💳 Fee Portal</h1>
          <p className="page-subtitle">Academic Year 2024–25 · Semester 5</p>
        </div>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print Receipt</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Fees', value: `₹${totalFees.toLocaleString('en-IN')}`, icon: '💰', color: 'var(--text-primary)', bg: 'var(--surface-2)' },
          { label: 'Amount Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: '✅', color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Amount Due', value: `₹${totalDue.toLocaleString('en-IN')}`, icon: '⚠️', color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
        ].map(item => (
          <div key={item.label} style={{ padding: '1.5rem', background: item.bg, border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{item.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Fee Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title" style={{ marginBottom: '1rem' }}>📋 Fee Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {feeBreakdown.map(fee => (
            <div key={fee.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: fee.overdue ? 'rgba(239,68,68,0.06)' : fee.paid ? 'rgba(16,185,129,0.04)' : 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: `1px solid ${fee.overdue ? 'rgba(239,68,68,0.25)' : fee.paid ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: fee.paid ? 'rgba(16,185,129,0.15)' : fee.overdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {fee.paid ? '✅' : fee.overdue ? '🚨' : '⏳'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{fee.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>₹{fee.amount.toLocaleString('en-IN')}</div>
                  {fee.paid ? (
                    <span className="badge badge-success">✓ Paid</span>
                  ) : fee.overdue ? (
                    <span className="badge badge-danger">⚠️ Overdue</span>
                  ) : (
                    <span className="badge badge-warning">Due</span>
                  )}
                </div>
                {!fee.paid && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={payingId === fee.label}
                    onClick={() => handlePay(fee.label)}
                    style={{ minWidth: 90 }}>
                    {payingId === fee.label ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Processing...
                      </span>
                    ) : '💳 Pay Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalDue > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pay All Dues at Once</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total outstanding: ₹{totalDue.toLocaleString('en-IN')}</div>
            </div>
            <button className="btn btn-primary" onClick={() => feeBreakdown.filter(f => !f.paid).forEach(f => handlePay(f.label))}>
              💳 Pay All — ₹{totalDue.toLocaleString('en-IN')}
            </button>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>📜 Payment History</div>
        <table className="table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map(txn => (
              <tr key={txn.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={handlePrint} title="Click to view/print receipt">{txn.id}</td>
                <td style={{ fontSize: '0.82rem' }}>{new Date(txn.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{txn.desc}</td>
                <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{txn.amount.toLocaleString('en-IN')}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{txn.method}</td>
                <td><span className="badge badge-success">✓ {txn.status}</span></td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={handlePrint}>🖨️ Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
