'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const roles = [
  { id: 'student', label: 'Student', emoji: '🎓', color: '#3b82f6', demo: { email: 'arjun.sharma@campus.edu', password: 'student123' } },
  { id: 'faculty', label: 'Faculty', emoji: '👨‍🏫', color: '#10b981', demo: { email: 'prof.mehta@campus.edu', password: 'faculty123' } },
  { id: 'admin', label: 'Admin', emoji: '🏛️', color: '#8b5cf6', demo: { email: 'admin@campus.edu', password: 'admin123' } },
];

const features = [
  { icon: '📅', title: 'Smart Timetable', desc: 'AI-powered scheduling' },
  { icon: '✅', title: 'QR Attendance', desc: 'Contactless & fast' },
  { icon: '📝', title: 'Assignments', desc: 'Submit & track grades' },
  { icon: '📢', title: 'Notice Board', desc: 'Priority alerts' },
  { icon: '📓', title: 'Shared Notes', desc: 'Collaborative learning' },
  { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)!;
    setSelectedRole(roleId);
    setEmail(role.demo.email);
    setPassword(role.demo.password);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('sc_role', data.user.role);
      localStorage.setItem('sc_user', JSON.stringify({ ...data.user, loginTime: Date.now() }));
      localStorage.setItem('sc_token', data.token); // Store mock JWT
      
      router.push(`/${data.user.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Use the demo login buttons below.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Ambient background orbs */}
      <div className="login-bg-orb orb-1"></div>
      <div className="login-bg-orb orb-2"></div>
      <div className="login-bg-orb orb-3"></div>

      {/* Floating Antigravity Elements */}
      <div className="antigravity-container">
        {features.map((f, i) => (
          <div 
            key={f.title} 
            className="floating-card" 
            style={{ 
              top: `${15 + (i * 12)}%`, 
              left: i % 2 === 0 ? `${5 + (i * 3)}%` : 'auto',
              right: i % 2 !== 0 ? `${5 + (i * 2)}%` : 'auto',
              animationDelay: `-${i * 2.5}s`
            }}
          >
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
            <div className="desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Glass Login Panel */}
      <div className="login-glass-box">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 1.2rem',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 0 40px rgba(168,85,247,0.5)'
          }}>🎓</div>
          <div className="genz-title">SmartCampus</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Welcome to the future of education.</p>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {roles.map(role => (
              <button
                key={role.id}
                type="button"
                className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                style={{ color: selectedRole === role.id ? role.color : '' }}
                onClick={() => handleDemoLogin(role.id)}
              >
                <span style={{ fontSize: '1.5rem' }}>{role.emoji}</span>
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <input
              className="login-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>

          <div>
            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '0.8rem', fontSize: '0.85rem', color: '#fca5a5', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn-genz"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Enter Platform'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          Powered by SmartCampus AI © 2026
        </div>
      </div>
    </div>
  );
}
