'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const categories = ['All', 'Examination', 'Events', 'Facilities', 'Placements', 'Research', 'General'];
const priorities = ['All', 'urgent', 'high', 'medium', 'low'];

export default function NoticesPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading notices...</div>
        </div>
      </div>
    }>
      <NoticesPageContent />
    </Suspense>
  );
}

function NoticesPageContent() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [readNotices, setReadNotices] = useState<string[]>([]);
  const [openNotice, setOpenNotice] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [noticesData, setNoticesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const fetchNotices = () => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        setNoticesData(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching notices:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    const storedRead = localStorage.getItem('sc_read_notices');
    if (storedRead) {
      setReadNotices(JSON.parse(storedRead));
    }
    fetchNotices();
  }, []);

  const searchParams = useSearchParams();
  const noticeIdParam = searchParams.get('id') || '';

  useEffect(() => {
    if (noticeIdParam && noticesData.length > 0) {
      const notice = noticesData.find(n => n.id === noticeIdParam);
      if (notice) {
        setOpenNotice(notice);
        setReadNotices(prev => {
          const next = [...prev];
          if (!next.includes(noticeIdParam)) {
            next.push(noticeIdParam);
            localStorage.setItem('sc_read_notices', JSON.stringify(next));
            window.dispatchEvent(new Event('notices_updated'));
          }
          return next;
        });
      }
    }
  }, [noticeIdParam, noticesData]);

  const handleCreateNotice = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          priority: newPriority,
          category: 'General',
          userId: user.id
        })
      });

      if (!res.ok) throw new Error('Failed to create notice');

      const data = await res.json();
      setNoticesData(prev => [data.notice, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      setNewPriority('medium');
      window.dispatchEvent(new Event('notices_updated'));
      showToast('📢 Notice posted successfully!');
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to post notice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading notices...</div>
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

  const searchParam = searchParams.get('search') || '';

  const filtered = noticesData.filter(n => {
    if (selectedCategory !== 'All' && n.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && n.priority !== selectedPriority) return false;
    if (searchParam) {
      const q = searchParam.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = noticesData.filter(n => !n.read && !readNotices.includes(n.id)).length;

  const priorityConfig: Record<string, { label: string; badge: string; border: string }> = {
    urgent: { label: '🚨 URGENT', badge: 'badge-danger', border: 'var(--danger)' },
    high: { label: '🔴 HIGH', badge: 'badge-warning', border: 'var(--orange)' },
    medium: { label: '🔵 MEDIUM', badge: 'badge-primary', border: 'var(--primary-500)' },
    low: { label: '⚫ LOW', badge: 'badge-gray', border: 'var(--text-muted)' },
  };

  return (
    <div className="page-container">
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '0.75rem 1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', fontSize: '0.875rem', fontWeight: 600, animation: 'slideUp 0.3s ease' }}>
          {toast}
        </div>
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📢 Notice Board</h1>
          <p className="page-subtitle">
            Campus announcements and notifications
            {unreadCount > 0 && <span style={{ marginLeft: '0.75rem' }} className="badge badge-danger">{unreadCount} unread</span>}
          </p>
        </div>
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Post Notice</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`btn btn-sm ${selectedCategory === c ? 'btn-primary' : 'btn-ghost'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {priorities.map(p => (
              <button key={p} onClick={() => setSelectedPriority(p)}
                className={`btn btn-sm ${selectedPriority === p ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(notice => {
          const isRead = notice.read || readNotices.includes(notice.id);
          const pc = priorityConfig[notice.priority];
          return (
            <div key={notice.id} className={`notice-card ${notice.priority}`}
              style={{ paddingLeft: '1.5rem', opacity: isRead ? 0.75 : 1, cursor: 'pointer' }}
              onClick={() => {
                setOpenNotice(notice);
                setReadNotices(prev => {
                  const next = [...prev];
                  if (!next.includes(notice.id)) {
                    next.push(notice.id);
                    localStorage.setItem('sc_read_notices', JSON.stringify(next));
                    window.dispatchEvent(new Event('notices_updated'));
                  }
                  return next;
                });
              }}>
              {notice.pinned && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '1rem', fontSize: '0.7rem', color: 'var(--warning)' }}>📌 Pinned</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${pc.badge}`}>{pc.label}</span>
                  <span className="badge badge-gray">{notice.category}</span>
                  {!isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', display: 'inline-block' }} />}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{notice.time}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{notice.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {notice.content}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                👤 {notice.author} &nbsp;·&nbsp; 📅 {new Date(notice.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice Detail Modal */}
      {openNotice && (
        <div className="modal-overlay" onClick={() => setOpenNotice(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`badge ${priorityConfig[openNotice.priority].badge}`}>{priorityConfig[openNotice.priority].label}</span>
                  <span className="badge badge-gray">{openNotice.category}</span>
                </div>
                <div className="modal-title">{openNotice.title}</div>
              </div>
              <button className="icon-btn" onClick={() => setOpenNotice(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{openNotice.content}</div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>👤 {openNotice.author}</span>
                <span>📅 {new Date(openNotice.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Notice Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📢 Post New Notice</div>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input className="form-input" placeholder="Enter notice title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" rows={5} placeholder="Write notice content..." value={newContent} onChange={e => setNewContent(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateNotice}>📢 Publish Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
