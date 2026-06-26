'use client';
import { useState, useEffect } from 'react';

export default function FeePortalPage() {
  const [user, setUser] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);

      fetch(`/api/student/fees?userId=${parsedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.fees) setFees(data.fees);
          if (data.payments) setPayments(data.payments);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching student fees:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handlePay = (feeId: string, label: string) => {
    setPayingId(feeId);
    fetch('/api/student/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeId, method: 'UPI' }),
    })
      .then((res) => res.json())
      .then((data) => {
        setPayingId(null);
        if (data.success) {
          // Update fees locally
          setFees((prev) =>
            prev.map((f) => (f.id === feeId ? { ...f, paid: true } : f))
          );
          // Add new payment to history
          setPayments((prev) => [data.payment, ...prev]);
          setPaidSuccess(label);
          setTimeout(() => setPaidSuccess(null), 4000);
        } else {
          alert(data.error || 'Payment failed');
        }
      })
      .catch((err) => {
        setPayingId(null);
        console.error('Error paying fee:', err);
        alert('Payment failed due to a network error');
      });
  };

  const handlePrint = () => window.print();

  const totalDue = fees.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter((f) => f.paid).reduce((s, f) => s + f.amount, 0);
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading fee details...</div>
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
      {paidSuccess && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.15)', border: '1px solid var(--success)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)', animation: 'slideUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ✅ {paidSuccess} paid successfully! Receipt sent to {user?.email}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">💳 Fee Portal</h1>
          <p className="page-subtitle">Academic Year 2024–25 · Semester {user?.semester || '5'}</p>
        </div>
        <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print Receipt</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Fees', value: `₹${totalFees.toLocaleString('en-IN')}`, icon: '💰', color: 'var(--text-primary)', bg: 'var(--surface-2)' },
          { label: 'Amount Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: '✅', color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Amount Due', value: `₹${totalDue.toLocaleString('en-IN')}`, icon: '⚠️', color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
        ].map((item) => (
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
          {fees.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No assigned fees found.</div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: fee.overdue && !fee.paid ? 'rgba(239,68,68,0.06)' : fee.paid ? 'rgba(16,185,129,0.04)' : 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: `1px solid ${fee.overdue && !fee.paid ? 'rgba(239,68,68,0.25)' : fee.paid ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
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
                      disabled={payingId === fee.id}
                      onClick={() => handlePay(fee.id, fee.label)}
                      style={{ minWidth: 90 }}>
                      {payingId === fee.id ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Processing...
                        </span>
                      ) : '💳 Pay Now'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {totalDue > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pay All Dues at Once</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total outstanding: ₹{totalDue.toLocaleString('en-IN')}</div>
            </div>
            <button className="btn btn-primary" onClick={() => fees.filter((f) => !f.paid).forEach((f) => handlePay(f.id, f.label))}>
              💳 Pay All — ₹{totalDue.toLocaleString('en-IN')}
            </button>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="table-container">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>📜 Payment History</div>
        {payments.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transaction history found.</div>
        ) : (
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
              {payments.map((txn) => (
                <tr key={txn.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={handlePrint} title="Click to view/print receipt">{txn.id.substring(0, 8).toUpperCase()}</td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(txn.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                  <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{txn.feeLabel}</td>
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
        )}
      </div>
    </div>
  );
}
