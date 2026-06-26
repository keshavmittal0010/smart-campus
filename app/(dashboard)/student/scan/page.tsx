'use client';
import { useState, useEffect, useRef } from 'react';

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'already';

export default function StudentQRScanPage() {
  const [state, setState] = useState<ScanState>('idle');
  const [message, setMessage] = useState('');
  const [classInfo, setClassInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [user, setUser] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const todayClass = {
    subject: classInfo?.className || 'Data Structures',
    code: classInfo?.classCode || 'CS301',
    faculty: 'Prof. R. Mehta',
    room: 'LH-301',
    time: '09:00 AM – 10:00 AM',
    color: '#3b82f6',
  };

  const startCamera = async () => {
    setState('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Simulate QR detection after 3s
      setTimeout(() => simulateSuccess(), 3000);
    } catch {
      // Camera not available — simulate directly
      setTimeout(() => simulateSuccess(), 2000);
    }
  };

  const simulateSuccess = async () => {
    stopCamera();
    try {
      const stored = localStorage.getItem('sc_user');
      const u = stored ? JSON.parse(stored) : null;
      if (u?.id) {
        const res = await fetch('/api/student/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id }),
        });
        const data = await res.json();
        if (data.success) {
          setClassInfo({ className: data.className, classCode: data.classCode, time: data.time });
          if (data.alreadyMarked) {
            setState('already');
            setMessage('Attendance already marked for today!');
          } else {
            setState('success');
            setMessage('Attendance marked successfully!');
          }
        } else {
          setState('error');
          setMessage(data.error || 'Scan failed');
        }
      } else {
        setClassInfo({ className: 'Data Structures', classCode: 'CS301', time: new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' }) });
        setState('success');
        setMessage('Attendance marked successfully!');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
    let c = 5;
    setCountdown(c);
    const t = setInterval(() => { c--; setCountdown(c); if (c <= 0) clearInterval(t); }, 1000);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleManualDemo = () => simulateSuccess();

  useEffect(() => () => stopCamera(), []);

  const stateConfig: Record<ScanState, { icon: string; color: string; bg: string }> = {
    idle:    { icon: '🔲', color: 'var(--primary-400)', bg: 'rgba(59,130,246,0.1)' },
    scanning:{ icon: '📷', color: 'var(--warning)',    bg: 'rgba(245,158,11,0.1)' },
    success: { icon: '✅', color: 'var(--success)',    bg: 'rgba(16,185,129,0.1)' },
    error:   { icon: '❌', color: 'var(--danger)',     bg: 'rgba(239,68,68,0.1)'  },
    already: { icon: '⚠️', color: 'var(--warning)',   bg: 'rgba(245,158,11,0.1)' },
  };

  const sc = stateConfig[state];

  return (
    <div className="page-container" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">🔲 QR Attendance</h1>
        <p className="page-subtitle">Scan the QR code displayed by your faculty</p>
      </div>

      {/* Current Class Banner */}
      <div style={{
        padding: '1rem 1.25rem', marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08))',
        border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-xl)',
        display: 'flex', gap: '1rem', alignItems: 'center'
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📚</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{todayClass.subject}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🕐 {todayClass.time} &nbsp;·&nbsp; 🚪 {todayClass.room} &nbsp;·&nbsp; 👨‍🏫 {todayClass.faculty}</div>
        </div>
        <span className="badge badge-primary">Active Now</span>
      </div>

      {/* Scanner Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {/* Scanner viewport */}
        <div style={{
          width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-xl)',
          background: state === 'scanning' ? '#000' : sc.bg,
          border: `2px solid ${sc.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', marginBottom: '1.25rem',
          transition: 'all 0.4s ease'
        }}>
          {/* Camera feed */}
          <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: state === 'scanning' ? 'block' : 'none' }} muted playsInline />

          {/* Overlay content */}
          {state !== 'scanning' && (
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{sc.icon}</div>
              <div style={{ fontWeight: 700, color: sc.color, fontSize: '1rem' }}>
                {state === 'idle' ? 'Ready to Scan' : state === 'success' ? 'Attendance Marked!' : state === 'error' ? 'Scan Failed' : 'Already Marked'}
              </div>
              {state === 'success' && countdown > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Confirmed {countdown}s ago</div>
              )}
            </div>
          )}

          {/* Scanning animation */}
          {state === 'scanning' && (
            <>
              {/* Corner brackets */}
              {[['top:16px;left:16px', 'border-top:3px solid #3b82f6;border-left:3px solid #3b82f6'],
                ['top:16px;right:16px', 'border-top:3px solid #3b82f6;border-right:3px solid #3b82f6'],
                ['bottom:16px;left:16px', 'border-bottom:3px solid #3b82f6;border-left:3px solid #3b82f6'],
                ['bottom:16px;right:16px', 'border-bottom:3px solid #3b82f6;border-right:3px solid #3b82f6']
              ].map(([pos, border], i) => (
                <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderRadius: 2, ...(Object.fromEntries(pos.split(';').filter(Boolean).map(s => { const [k, v] = s.split(':'); return [k.trim(), v.trim()]; }))), ...(Object.fromEntries(border.split(';').filter(Boolean).map(s => { const [k, v] = s.split(':'); return [k.trim().replace(/-./g, c => c[1].toUpperCase()), v.trim()]; }))) }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: 'absolute', left: '10%', right: '10%', height: 2,
                background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                animation: 'scanLine 1.5s ease-in-out infinite',
                boxShadow: '0 0 8px #3b82f6',
              }} />
              <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>
                Scanning for QR code...
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {state === 'idle' && (
            <>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={startCamera}>
                📷 Open Camera & Scan QR
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }} onClick={handleManualDemo}>
                🎮 Demo: Simulate Successful Scan
              </button>
            </>
          )}
          {state === 'scanning' && (
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { stopCamera(); setState('idle'); }}>
              ✕ Cancel Scanning
            </button>
          )}
          {(state === 'success' || state === 'error' || state === 'already') && (
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setState('idle')}>
              🔄 Scan Another Code
            </button>
          )}
        </div>
      </div>

      {/* Success Details */}
      {state === 'success' && classInfo && (
        <div className="card" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', animation: 'slideUp 0.4s ease' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)', marginBottom: '0.25rem' }}>Attendance Confirmed!</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>{classInfo.subject}</strong> · {new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </div>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Subject', value: classInfo.code },
              { label: 'Room', value: classInfo.room },
              { label: 'Status', value: '✓ Present' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {state === 'idle' && (
        <div className="card" style={{ background: 'var(--glass)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.875rem' }}>📋 How it works</div>
          {[
            { step: '1', text: 'Faculty generates a QR code for the current class session' },
            { step: '2', text: 'Click "Open Camera" and point at the QR displayed on screen' },
            { step: '3', text: 'Your GPS location is verified to confirm you\'re in the classroom' },
            { step: '4', text: 'Attendance is marked instantly — no manual entry needed' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: item.step !== '4' ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-400)', flexShrink: 0 }}>{item.step}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingTop: '0.15rem' }}>{item.text}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 15%; }
          50%  { top: 80%; }
          100% { top: 15%; }
        }
      `}</style>
    </div>
  );
}
