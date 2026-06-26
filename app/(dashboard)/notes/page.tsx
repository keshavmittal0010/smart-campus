'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const NOTE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 180, borderRadius: 'var(--radius-xl)', background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite', border: '1px solid var(--border)' }} />
        ))}
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}

function NotesPageContent() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('all');
  const [search, setSearch] = useState('');
  const [openNote, setOpenNote] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTags, setNewTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
    fetchNotes();
  }, []);

  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const noteIdParam = searchParams.get('id') || '';

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (noteIdParam && notes.length > 0) {
      const note = notes.find(n => n.id === noteIdParam);
      if (note) handleOpenNote(note);
    }
  }, [noteIdParam, notes]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch { setNotes([]); }
    finally { setLoading(false); }
  };

  const handleOpenNote = async (note: any) => {
    setOpenNote(note);
    // Increment view count
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'PATCH' });
      const data = await res.json();
      // Update local view count
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, views: data.views } : n));
    } catch {}
  };

  const handlePublish = async () => {
    if (!newTitle || !newContent || !newSubject || !user) return;
    setPublishing(true);
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: newTitle, content: newContent, subject: newSubject, tags }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setShowCreate(false);
        setNewTitle(''); setNewContent(''); setNewSubject(''); setNewTags('');
      }
    } finally { setPublishing(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setOpenNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Gather all tags from fetched notes
  const allTags = ['all', ...Array.from(new Set(notes.flatMap(n => n.tags || [])))];

  const filtered = notes.filter(n => {
    if (selectedTag !== 'all' && !(n.tags || []).includes(selectedTag)) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📓 Notes</h1>
          <p className="page-subtitle">Collaborative study notes and resources</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Note</button>
      </div>

      {/* Search + Tags */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}>
          <span>🔍</span>
          <input placeholder="Search notes, subjects..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', flex: 1, marginLeft: '0.5rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setSelectedTag(tag)}
              className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-ghost'}`}>
              {tag === 'all' ? '🏷️ All Tags' : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 180, borderRadius: 'var(--radius-xl)', background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📓</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No notes found</div>
          <div style={{ fontSize: '0.85rem' }}>Try a different search or tag filter</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {filtered.map((note, idx) => {
            const color = NOTE_COLORS[idx % NOTE_COLORS.length];
            return (
              <div key={note.id} className="note-card" onClick={() => handleOpenNote(note)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📓</div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {note.shared && <span className="badge badge-success">🌐 Shared</span>}
                    <span className="badge badge-gray">👁 {note.views}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{note.subject}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: 1.3 }}>{note.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>👤 {note.author}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(note.tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="badge badge-gray">#{tag}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>📅 {new Date(note.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  <span style={{ color, fontWeight: 600 }}>Read →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Detail Modal */}
      {openNote && (
        <div className="modal-overlay" onClick={() => setOpenNote(null)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{openNote.subject}</div>
                <div className="modal-title">{openNote.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {openNote.shared && <span className="badge badge-success">🌐 Shared</span>}
                {user && openNote.createdBy === user.id && (
                  <button className="icon-btn" title="Delete Note" onClick={() => handleDeleteNote(openNote.id)} style={{ color: 'var(--danger)', fontSize: '1.2rem', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                )}
                <button className="icon-btn" onClick={() => setOpenNote(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '50vh', overflowY: 'auto', fontFamily: 'inherit' }}>
                {openNote.content}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(openNote.tags || []).map((tag: string) => <span key={tag} className="badge badge-primary">#{tag}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>👤 {openNote.author}</span>
                <span>👁 {openNote.views} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📝 Create New Note</div>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Note title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select className="form-input" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                  <option value="">Select subject</option>
                  <option>Data Structures</option>
                  <option>Operating Systems</option>
                  <option>DBMS</option>
                  <option>Computer Networks</option>
                  <option>Software Engineering</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-input" placeholder="e.g. trees, algorithms, sorting" value={newTags} onChange={e => setNewTags(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Content (Markdown supported) *</label>
                <textarea className="form-input" rows={8} placeholder="# Your notes here&#10;&#10;Support markdown formatting..." value={newContent} onChange={e => setNewContent(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePublish} disabled={publishing || !newTitle || !newSubject || !newContent}>
                {publishing ? 'Publishing...' : '📓 Publish Note'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
