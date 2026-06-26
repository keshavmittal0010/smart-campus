'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

const navItems: {
  student: NavItem[];
  faculty: NavItem[];
  admin: NavItem[];
} = {
  student: [
    { href: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/student/attendance', icon: '✅', label: 'Attendance' },
    { href: '/student/scan', icon: '🔲', label: 'Scan QR' },
    { href: '/student/assignments', icon: '📝', label: 'Assignments' },
    { href: '/student/timetable', icon: '📅', label: 'Timetable' },
    { href: '/student/results', icon: '📊', label: 'My Results' },
    { href: '/student/fees', icon: '💳', label: 'Fee Portal' },
    { href: '/chatbot', icon: '🤖', label: 'ARIA AI', badge: 1 },
    { href: '/notices', icon: '📢', label: 'Notices', badge: 3 },
    { href: '/notes', icon: '📓', label: 'Notes' },
    { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  ],
  faculty: [
    { href: '/faculty/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/faculty/attendance', icon: '✅', label: 'Attendance' },
    { href: '/faculty/assignments', icon: '📝', label: 'Assignments' },
    { href: '/faculty/timetable', icon: '📅', label: 'Timetable' },
    { href: '/chatbot', icon: '🤖', label: 'ARIA AI' },
    { href: '/notices', icon: '📢', label: 'Notices' },
    { href: '/notes', icon: '📓', label: 'Notes' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/admin/users', icon: '👥', label: 'User Management' },
    { href: '/admin/fees', icon: '💳', label: 'Manage Fees' },
    { href: '/chatbot', icon: '🤖', label: 'ARIA AI' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/notices', icon: '📢', label: 'Notices' },
    { href: '/notes', icon: '📓', label: 'Notes' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sc_user');
    if (!stored) {
      router.push('/');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      // Session expiry timeout: 24 hours (86400000ms)
      if (parsed.loginTime && Date.now() - parsed.loginTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('sc_role');
        localStorage.removeItem('sc_user');
        localStorage.removeItem('sc_token');
        router.push('/');
        return;
      }

      // ✅ ROLE GUARD: Ensure user can only access their own role's routes
      const role = parsed.role as string;
      const sharedRoutes = ['/notices', '/notes', '/chatbot', '/leaderboard', '/analytics', '/profile'];
      const isShared = sharedRoutes.some(r => pathname.startsWith(r));
      const isOwnRole = pathname.startsWith(`/${role}`);

      if (!isShared && !isOwnRole) {
        // User is trying to access another role's section — redirect to their dashboard
        router.replace(`/${role}/dashboard`);
        return;
      }

      setUser(parsed);
    } catch (e) {
      localStorage.removeItem('sc_role');
      localStorage.removeItem('sc_user');
      localStorage.removeItem('sc_token');
      router.push('/');
    }

    // Load theme
    const savedTheme = localStorage.getItem('sc_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Load or initialize notifications
    const savedNotifs = localStorage.getItem('sc_notifications');
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    } else {
      const defaultNotifs = [
        { id: 1, icon: '📝', title: 'Assignment Due Tomorrow', desc: 'Data Structures — Problem Set 4', time: '2h ago', unread: true, href: '/student/assignments' },
        { id: 2, icon: '📢', title: 'Exam Schedule Posted', desc: 'Mid-semester exams start Nov 12', time: '5h ago', unread: true, href: '/notices' },
        { id: 3, icon: '✅', title: 'Attendance Alert', desc: 'Your OS attendance is below 75%', time: '1d ago', unread: true, href: '/student/attendance' },
        { id: 4, icon: '📊', title: 'Grades Updated', desc: 'Quiz 3 marks published', time: '2d ago', unread: false, href: '/student/results' },
      ];
      setNotifications(defaultNotifs);
      localStorage.setItem('sc_notifications', JSON.stringify(defaultNotifs));
    }

    // Load unread notice count and sync with notifications
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notices');
        if (!res.ok) return;
        const notices = await res.json();
        const storedRead = localStorage.getItem('sc_read_notices');
        const readIds = storedRead ? JSON.parse(storedRead) : [];
        const unreadCount = notices.filter((n: any) => !readIds.includes(n.id)).length;
        setUnreadNoticeCount(unreadCount);

        // Inject real notices into notifications
        const noticeNotifs = notices.slice(0, 3).map((n: any) => ({
          id: n.id,
          icon: '📢',
          title: n.title,
          desc: n.content.substring(0, 40) + '...',
          time: n.time,
          unread: !readIds.includes(n.id),
          href: `/notices?id=${n.id}`
        }));

        setNotifications(prev => {
          const nonNotices = prev.filter(p => p.icon !== '📢');
          const merged = [...noticeNotifs, ...nonNotices];
          localStorage.setItem('sc_notifications', JSON.stringify(merged));
          return merged;
        });

      } catch (err) {
        console.error('Error fetching unread notices:', err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);

    // Event listener for notices updates
    const handleNoticesUpdated = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notices_updated', handleNoticesUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notices_updated', handleNoticesUpdated);
    };
  }, []);

  // Sync search input value with query param dynamically
  const searchValParam = searchParams.get('search') || '';
  useEffect(() => {
    setSearchVal(searchValParam);
  }, [searchValParam]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('sc_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const baseItems = navItems[user.role as keyof typeof navItems] || [];
  const items = baseItems.map(item => {
    if (item.href === '/notices') {
      return { ...item, badge: unreadNoticeCount > 0 ? unreadNoticeCount : undefined };
    }
    return item;
  });

  const handleLogout = () => {
    localStorage.removeItem('sc_role');
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    router.push('/');
  };

  const handleMarkAllRead = () => {
    const next = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(next);
    localStorage.setItem('sc_notifications', JSON.stringify(next));
  };

  const handleToggleRead = (id: number) => {
    const next = notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n);
    setNotifications(next);
    localStorage.setItem('sc_notifications', JSON.stringify(next));
  };

  const handleNotificationClick = (n: any) => {
    if (n.icon === '📢' && n.id.length > 10) {
      const storedRead = localStorage.getItem('sc_read_notices');
      const readIds = storedRead ? JSON.parse(storedRead) : [];
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
        localStorage.setItem('sc_read_notices', JSON.stringify(readIds));
        window.dispatchEvent(new Event('notices_updated'));
      }
    }

    const next = notifications.map(notif => notif.id === n.id ? { ...notif, unread: false } : notif);
    setNotifications(next);
    localStorage.setItem('sc_notifications', JSON.stringify(next));
    setNotifOpen(false);
    if (n.href) router.push(n.href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set('search', searchVal.trim());
    } else {
      params.delete('search');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`app-layout ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => router.push(`/${user.role}/dashboard`)} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-icon">🎓</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">SmartCampus</div>
            <div className="sidebar-logo-sub">Utility Platform</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {items.map(item => (
            <div
              key={item.href}
              className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user.avatar}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: 6, transition: 'color 0.2s' }}
              title="Logout" onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ marginRight: '0.5rem', display: 'flex', border: 'none', background: 'transparent' }} title="Toggle Sidebar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="topbar-breadcrumb">
              <span onClick={() => user && router.push(`/${user.role}/dashboard`)} style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary-400)' }}>SmartCampus</span>
              <span>/</span>
              <span className="topbar-breadcrumb-current">
                {items.find(i => i.href === pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>
          <form className="topbar-search" onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
            <input placeholder="Search active page..." value={searchVal} onChange={e => setSearchVal(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', flex: 1 }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
          </form>
          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme" style={{ fontSize: '1.2rem', padding: '0.4rem', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                🔔
                {notifications.some(n => n.unread) && <span className="notif-dot" />}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  width: 320, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', zIndex: 300,
                  overflow: 'hidden', animation: 'slideUp 0.2s ease'
                }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', cursor: 'pointer' }} onClick={handleMarkAllRead}>Mark all read</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => handleNotificationClick(n)} style={{
                      padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
                      background: n.unread ? 'rgba(59,130,246,0.04)' : 'transparent',
                      display: 'flex', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s'
                    }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.desc}</div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="avatar avatar-md" style={{ cursor: 'pointer' }} onClick={() => router.push('/profile')}>{user.avatar}</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="animate-fade-in" style={{ paddingBottom: '0' }}>{children}</div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-bottom-nav">
        {items.slice(0, 5).map(item => (
          <div key={item.href}
            className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
            onClick={() => router.push(item.href)}
          >
            <span style={{ fontSize: '1.3rem', position: 'relative' }}>
              {item.icon}
              {item.badge && <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--danger)', color: 'white', fontSize: '0.55rem', fontWeight: 800, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.badge}</span>}
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: pathname === item.href ? 700 : 500, color: pathname === item.href ? 'var(--primary-400)' : 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
