'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(t); router.push('/'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '2rem'
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '8rem', lineHeight: 1, filter: 'grayscale(0.3)' }}>🎓</div>
        <div style={{
          position: 'absolute', top: -10, right: -10,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--danger)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'white',
          boxShadow: '0 0 20px rgba(239,68,68,0.5)'
        }}>!</div>
      </div>
      <div>
        <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '0.5rem' }}>404</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Page Not Found</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 380, lineHeight: 1.6 }}>
          This page doesn't exist in the campus portal. Redirecting to login in <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>{count}s</span>...
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={() => router.push('/')}>🏠 Go to Login</button>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Go Back</button>
      </div>
    </div>
  );
}
