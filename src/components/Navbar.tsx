'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { User, LogOut, Menu, X, Bell, ChevronDown } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  writeBatch, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface AppNotification {
  id: string;
  type: 'team_invite' | 'tournament_starting' | 'match_result' | 'registration_confirmed';
  message: string;
  relatedId: string;
  read: boolean;
  createdAt: any;
}

export default function Navbar() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const logout = useAppStore((state) => state.logout);
  const loading = useAppStore((state) => state.loading);
  const isOffline = useAppStore((state) => state.isOffline);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { refreshCount } = useAutoRefresh();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dropdown states for the inner-page black bar
  const [productsOpen, setProductsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Auto-hide scroll logic (Home page only)
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      
      if (isHome) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setNavVisible(false);
        } else {
          setNavVisible(true);
        }
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isHome]);

  const handleLogout = async () => {
    try {
      await logout();
      setNotifOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  // Relative time formatter
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Keyboard navigation & Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to unread notifications (limit to 50, sort client-side)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const ref = collection(db, "profiles", user.uid, "notifications");
    const q = query(ref, limit(50));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        const rawDate = data.createdAt;
        let created = new Date();
        if (rawDate && typeof rawDate.toDate === 'function') {
          created = rawDate.toDate();
        } else if (rawDate) {
          created = new Date(rawDate);
        }
        return {
          id: d.id,
          type: data.type,
          message: data.message,
          relatedId: data.relatedId,
          read: !!data.read,
          createdAt: created
        } as AppNotification;
      });

      // Sort client-side newest first & filter unread
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const unreadList = list.filter(n => !n.read);
      setNotifications(unreadList);
    }, (err) => {
      console.error("Notifications listener error:", err);
    });
    return () => unsub();
  }, [user, refreshCount]);

  const handleMarkRead = async (notifId: string) => {
    if (!user) return;
    // Optimistic UI removal
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    try {
      const ref = doc(db, "profiles", user.uid, "notifications", notifId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;
    const targets = [...notifications];
    // Optimistic UI clearance
    setNotifications([]);
    try {
      const batch = writeBatch(db);
      targets.forEach(n => {
        const ref = doc(db, "profiles", user.uid, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to bulk mark read:", err);
    }
  };

  return (
    <>
      {isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 110,
          background: 'var(--accent-red)', color: '#fff', textAlign: 'center',
          fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem', letterSpacing: '0.1em',
        }}>
          OFFLINE MODE — DISPLAYING CACHED DATA
        </div>
      )}

      {/* HEADER: Dynamic rendering based on isHome route */}
      <header 
        style={{
          position: 'fixed',
          top: isOffline ? '2rem' : '0',
          left: 0,
          right: 0,
          zIndex: 100,
          // Inner pages get a solid black container bar; Home gets transparent edge-to-edge
          background: isHome 
            ? (isScrolled ? 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' : 'transparent')
            : '#000000',
          padding: isHome ? '1.5rem 3rem' : '1.25rem 3rem',
          borderBottom: isHome ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), background 0.3s ease',
          boxShadow: isHome ? 'none' : '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1920px', margin: '0 auto' }}>
          
          {/* LEFT SIDE: Logo + Action Buttons/Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" style={{ 
              fontWeight: 900, fontSize: '1.4rem', fontFamily: 'var(--font-title)', 
              letterSpacing: '-0.02em', color: '#fff', textTransform: 'uppercase'
            }}>
              SHAKTI GAMING
            </Link>

            {/* Inner Page Interactive Dropdowns (Zentry Style) */}
            {!isHome && (
              <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }}>
                
                {/* Products Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => { setProductsOpen(!productsOpen); setAboutOpen(false); }}
                    className="zentry-pill-btn"
                  >
                    PRODUCTS <ChevronDown size={14} className={`transform transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {productsOpen && (
                    <div className="zentry-dropdown-menu">
                      <Link href="/tournaments" onClick={() => setProductsOpen(false)} className="dropdown-item">Tournaments</Link>
                      <Link href="/teams" onClick={() => setProductsOpen(false)} className="dropdown-item">Teams Hub</Link>
                      <Link href="/leaderboard" onClick={() => setProductsOpen(false)} className="dropdown-item">Global Leaderboard</Link>
                    </div>
                  )}
                </div>

                {/* White Paper / Quick Link */}
                <Link href="/tournaments" className="zentry-pill-btn">
                  ARENAS
                </Link>
              </div>
            )}

            {/* Home Page White Pills */}
            {isHome && (
              <nav className="desktop-nav" style={{ display: 'none', gap: '0.75rem' }}>
                <Link href="/tournaments" className="zentry-pill-btn">
                  TOURNAMENTS <ChevronDown size={14} />
                </Link>
                <Link href="/teams" className="zentry-pill-btn">
                  TEAMS
                </Link>
              </nav>
            )}
          </div>

          {/* RIGHT SIDE: Navigation Links / User Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            
            <nav className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '2rem' }}>
              
              {/* Inner Page About Dropdown */}
              {!isHome && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setAboutOpen(!aboutOpen); setProductsOpen(false); }} className="zentry-text-link flex items-center gap-1">
                    ABOUT <ChevronDown size={12} />
                  </button>
                  {aboutOpen && (
                    <div className="zentry-dropdown-menu right-0">
                      <a href="#about" onClick={() => setAboutOpen(false)} className="dropdown-item">Platform Mission</a>
                      <a href="#rules" onClick={() => setAboutOpen(false)} className="dropdown-item">Rulebook</a>
                    </div>
                  )}
                </div>
              )}

              <Link href="/leaderboard" className="zentry-text-link">
                LEADERBOARD
              </Link>

              {!user && !loading && (
                <>
                  <Link href="/login" className="zentry-text-link">LOGIN</Link>
                  <Link href="/register" className="zentry-text-link">JOIN NOW</Link>
                </>
              )}
            </nav>

            {/* Authenticated User Controls */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifOpen(!notifOpen);
                    }}
                    className="btn btn-outline touch-target"
                    aria-label={`Notifications, ${notifications.length} unread`}
                    aria-expanded={notifOpen}
                    style={{
                      position: 'relative',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: notifOpen ? 'hsla(186, 100%, 48%, 0.1)' : 'none',
                      border: notifOpen ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: notifOpen ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span 
                        className="pulse-badge"
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'var(--accent-cyan)',
                          color: 'var(--bg-primary)',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          borderRadius: '50%',
                          height: '16px',
                          width: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {notifOpen && (
                    <div 
                      className="glass-panel fade-in"
                      style={{
                        position: 'absolute',
                        top: '3rem',
                        right: 0,
                        width: '320px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        padding: '1rem',
                        border: '1px solid hsla(186, 100%, 48%, 0.15)',
                        background: 'hsla(223, 20%, 5%, 0.95)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                        {notifications.length > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            No unread notifications.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              style={{
                                padding: '0.6rem',
                                borderRadius: '6px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}
                            >
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                                {notif.message}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <Link 
                                    href={
                                      notif.type === 'team_invite' 
                                        ? '/teams' 
                                        : `/tournaments/${notif.relatedId}`
                                    }
                                    onClick={() => {
                                      handleMarkRead(notif.id);
                                      setNotifOpen(false);
                                    }}
                                    style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
                                  >
                                    View
                                  </Link>
                                  <button 
                                    onClick={() => handleMarkRead(notif.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="desktop-actions" style={{ display: 'none', alignItems: 'center', gap: '1.5rem' }}>
                   <Link href="/profile" className="zentry-text-link">
                     PROFILE
                   </Link>
                   <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }} className="hover-opacity">
                     <LogOut size={18} />
                   </button>
                </div>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DROPDOWN */}
      {mobileMenuOpen && (
         <nav style={{
            position: 'fixed', top: '5rem', left: '1rem', right: '1rem', background: 'rgba(0,0,0,0.95)', 
            backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '1.5rem', zIndex: 99,
            display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.1)'
         }} className="mobile-dropdown">
            <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>TOURNAMENTS</Link>
            <Link href="/teams" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>TEAMS</Link>
            <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>LEADERBOARD</Link>
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }}/>
            {user ? (
               <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontWeight: 700 }}>PROFILE</Link>
                  <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontWeight: 700, textAlign: 'left', padding: 0 }}>SIGN OUT</button>
               </>
            ) : (
               <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', fontWeight: 700 }}>LOGIN</Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>JOIN NOW</Link>
               </>
            )}
         </nav>
      )}

      {/* GLOBAL ANIMATIONS & STYLING */}
      <style jsx global>{`
        @media (min-width: 1025px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-toggle { display: none !important; }
          .mobile-dropdown { display: none !important; }
        }
        .zentry-pill-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: #fff;
          color: #000;
          padding: 0.4rem 1.25rem;
          border-radius: 9999px;
          fontSize: 0.75rem;
          fontWeight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .zentry-pill-btn:hover {
          transform: scale(1.05);
          background: #e2e8f0;
        }
        .zentry-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.75rem);
          left: 0;
          min-width: 180px;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 200;
          animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .zentry-dropdown-menu.right-0 {
          left: auto;
          right: 0;
        }
        .dropdown-item {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.7);
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .zentry-text-link {
          color: #fff;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .zentry-text-link:hover {
          opacity: 1;
        }
        .zentry-text-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0%;
          height: 1px;
          background: #fff;
          transition: width 0.3s ease;
        }
        .zentry-text-link:hover::after {
          width: 100%;
        }
        .hover-opacity:hover {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}