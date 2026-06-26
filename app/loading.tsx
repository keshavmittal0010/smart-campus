export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '1.5rem'
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary-500)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem'
        }}>🎓</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Loading SmartCampus</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Preparing your workspace...</div>
      </div>
    </div>
  );
}
