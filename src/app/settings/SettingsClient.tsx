'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  User, Settings, Bell, Lock, Gamepad2, Shield, Check, AlertCircle, 
  Moon, Sun, CheckCircle2, Save, RefreshCw, Key, Globe, Monitor, 
  Volume2, VolumeX, Eye, Download, Sliders, Sparkles
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function SettingsClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'games' | 'website' | 'notifications' | 'security'>('profile');
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Game Connections
  const [riotId, setRiotId] = useState('');
  const [steamId, setSteamId] = useState('');
  const [bgmiId, setBgmiId] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');

  // Website & Platform Preferences
  const [themeMode, setThemeMode] = useState<'neon' | 'light'>('neon');
  const [serverRegion, setServerRegion] = useState('Asia South (India)');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [teamInviteNotifs, setTeamInviteNotifs] = useState(true);
  const [matchReminderNotifs, setMatchReminderNotifs] = useState(true);

  // Status
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    // Load local theme
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('shaktrix_theme') as 'neon' | 'light') || 'neon';
      setThemeMode(savedTheme);
    }

    if (profile) {
      setDisplayName(profile.displayName || '');
      setGamertag(profile.gamertag || '');
      setDob(profile.dob || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.photoURL || profile.avatarUrl || '');

      if (profile.gameConnections) {
        setRiotId(profile.gameConnections.riotId || '');
        setSteamId(profile.gameConnections.steamId || '');
        setBgmiId(profile.gameConnections.bgmiId || '');
        setDiscordHandle(profile.gameConnections.discordHandle || '');
      }

      if (profile.websitePreferences) {
        setServerRegion(profile.websitePreferences.serverRegion || 'Asia South (India)');
        setReducedMotion(!!profile.websitePreferences.reducedMotion);
        setSoundEffects(profile.websitePreferences.soundEffects ?? true);
        setPublicProfile(profile.websitePreferences.publicProfile ?? true);
        setPerformanceMode(!!profile.websitePreferences.performanceMode);
      }

      if (profile.notificationSettings) {
        setEmailNotifs(profile.notificationSettings.emailNotifs ?? true);
        setTeamInviteNotifs(profile.notificationSettings.teamInviteNotifs ?? true);
        setMatchReminderNotifs(profile.notificationSettings.matchReminderNotifs ?? true);
      }
    }
  }, [profile]);

  const handleToggleTheme = (newTheme: 'neon' | 'light') => {
    setThemeMode(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shaktrix_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const ref = doc(db, "profiles", user.uid);
      await updateDoc(ref, {
        displayName: displayName.trim(),
        gamertag: gamertag.trim(),
        dob: dob || '',
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        gameConnections: {
          riotId: riotId.trim(),
          steamId: steamId.trim(),
          bgmiId: bgmiId.trim(),
          discordHandle: discordHandle.trim()
        },
        websitePreferences: {
          themeMode,
          serverRegion,
          reducedMotion,
          soundEffects,
          publicProfile,
          performanceMode
        },
        notificationSettings: {
          emailNotifs,
          teamInviteNotifs,
          matchReminderNotifs
        },
        updatedAt: Date.now()
      });

      setSuccessMsg('Account and Website settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setErrorMsg(err?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      user: { uid: user?.uid, email: user?.email },
      profile,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shaktrix-player-data-${user?.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  };

  if (!user && typeof window !== 'undefined') {
    return (
      <main style={{ padding: '8rem 1.25rem 4rem 1.25rem', minHeight: '100vh', textAlign: 'center' }}>
        <GlassCard variant="panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem' }}>
          <Lock size={36} style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
          <h2>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please log in to access your account settings.</p>
          <Link href="/login">
            <Button variant="primary">LOG IN TO CONTINUE</Button>
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            <Settings size={14} /> PLAYER & WEBSITE SETTINGS CONTROL CENTER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            ACCOUNT <span className="text-gradient-cyan">SETTINGS</span>
          </h1>
        </div>

        {/* FEEDBACK MESSAGES */}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0, 255, 170, 0.12)', border: '1px solid #00ffaa', color: '#00ffaa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255, 60, 60, 0.12)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* MAIN SETTINGS LAYOUT (TABS LEFT, CONTENT RIGHT) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          
          {/* TAB SIDEBAR */}
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '14px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { id: 'profile', label: 'Profile Information', icon: <User size={16} /> },
              { id: 'games', label: 'Connected Game IDs', icon: <Gamepad2 size={16} /> },
              { id: 'website', label: 'Website Preferences', icon: <Monitor size={16} /> },
              { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
              { id: 'security', label: 'Security & Privacy', icon: <Shield size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: activeTab === tab.id ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT PANEL */}
          <div style={{ gridColumn: 'span 2' }}>
            <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* TAB 1: PROFILE */}
                {activeTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0 }}>
                      Profile Information
                    </h2>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Unique Gamertag
                      </label>
                      <input
                        type="text"
                        value={gamertag}
                        onChange={(e) => setGamertag(e.target.value)}
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="glass-input"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Avatar Image URL
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Player Bio / Description
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Share your competitive experience, favorite roles, or main titles..."
                        className="glass-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: CONNECTED GAME IDS */}
                {activeTab === 'games' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0 }}>
                      Connected Game IDs
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Link your official in-game handles to verify tournament check-ins and match lobbies.
                    </p>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Riot ID (Valorant / League)
                      </label>
                      <input
                        type="text"
                        value={riotId}
                        onChange={(e) => setRiotId(e.target.value)}
                        placeholder="Gamertag#TAG"
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        BGMI Character ID / Name
                      </label>
                      <input
                        type="text"
                        value={bgmiId}
                        onChange={(e) => setBgmiId(e.target.value)}
                        placeholder="512345678"
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Steam Custom URL / ID
                      </label>
                      <input
                        type="text"
                        value={steamId}
                        onChange={(e) => setSteamId(e.target.value)}
                        placeholder="76561198..."
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Discord Username
                      </label>
                      <input
                        type="text"
                        value={discordHandle}
                        onChange={(e) => setDiscordHandle(e.target.value)}
                        placeholder="username"
                        className="glass-input"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: WEBSITE & PLATFORM PREFERENCES */}
                {activeTab === 'website' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0 }}>
                      Website & Platform Preferences
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Customize website appearance, animations, server region, sound effects, and performance settings.
                    </p>

                    {/* Theme Mode Selection */}
                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Website Theme
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div
                          onClick={() => handleToggleTheme('neon')}
                          style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: themeMode === 'neon' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            border: themeMode === 'neon' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Moon size={20} style={{ color: 'var(--neon-blue)' }} />
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Neon Dark Mode</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cyberpunk glow aesthetic</span>
                          </div>
                          {themeMode === 'neon' && <CheckCircle2 size={18} style={{ color: 'var(--accent-cyan)', marginLeft: 'auto' }} />}
                        </div>

                        <div
                          onClick={() => handleToggleTheme('light')}
                          style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: themeMode === 'light' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            border: themeMode === 'light' ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Sun size={20} style={{ color: 'var(--accent-gold)' }} />
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>Minimal Light Mode</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clean high-contrast theme</span>
                          </div>
                          {themeMode === 'light' && <CheckCircle2 size={18} style={{ color: 'var(--accent-gold)', marginLeft: 'auto' }} />}
                        </div>
                      </div>
                    </div>

                    {/* Server Region Selector */}
                    <div>
                      <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Preferred Tournament Server Region
                      </label>
                      <select
                        value={serverRegion}
                        onChange={(e) => setServerRegion(e.target.value)}
                        className="glass-input"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="Asia South (India)" style={{ background: '#0a1228', color: '#fff' }}>Asia South (India / Mumbai)</option>
                        <option value="South East Asia (Singapore)" style={{ background: '#0a1228', color: '#fff' }}>South East Asia (Singapore)</option>
                        <option value="Middle East (Bahrain)" style={{ background: '#0a1228', color: '#fff' }}>Middle East (Bahrain / Dubai)</option>
                        <option value="Europe West (Frankfurt)" style={{ background: '#0a1228', color: '#fff' }}>Europe West (Frankfurt)</option>
                        <option value="North America (Virginia)" style={{ background: '#0a1228', color: '#fff' }}>North America (Virginia)</option>
                      </select>
                    </div>

                    {/* Toggles List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Reduced Motion & Animations</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disable background particle loops & 3D tilt effects</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={reducedMotion}
                          onChange={(e) => setReducedMotion(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tournament Match & Chat Sound Effects</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Play audio cues for match invites & countdowns</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={soundEffects}
                          onChange={(e) => setSoundEffects(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Performance Boost Mode</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Optimize rendering for low-spec laptops & mobile devices</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={performanceMode}
                          onChange={(e) => setPerformanceMode(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                        />
                      </label>
                    </div>

                  </div>
                )}

                {/* TAB 4: NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0 }}>
                      Notification Preferences
                    </h2>

                    {[
                      { label: 'Email Notifications for Tournament Confirmations', state: emailNotifs, setter: setEmailNotifs },
                      { label: 'Team Squad Invite Alerts', state: teamInviteNotifs, setter: setTeamInviteNotifs },
                      { label: 'Match Start & Check-In Reminders', state: matchReminderNotifs, setter: setMatchReminderNotifs }
                    ].map((item, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
                        <input
                          type="checkbox"
                          checked={item.state}
                          onChange={(e) => item.setter(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                        />
                      </label>
                    ))}
                  </div>
                )}

                {/* TAB 5: SECURITY & PRIVACY */}
                {activeTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: 0 }}>
                      Security & Data Privacy
                    </h2>

                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        Account Email Address
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
                    </div>

                    {/* Public Profile Visibility Toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Public Player Profile</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow other players to discover your stats & match history</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={publicProfile}
                        onChange={(e) => setPublicProfile(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                      />
                    </label>

                    {/* Reset Password */}
                    <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-primary)' }}>Reset Account Password</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>We will send a password reset link to your email.</span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendPasswordReset}
                        variant="outline"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      >
                        <Key size={14} /> SEND RESET EMAIL
                      </Button>
                    </div>

                    {resetEmailSent && (
                      <div style={{ fontSize: '0.825rem', color: '#00ffaa' }}>
                        Password reset link sent! Check your email inbox.
                      </div>
                    )}

                    {/* Export Data */}
                    <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-primary)' }}>Export My Player Data</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Download a JSON archive of your profile, stats, and settings.</span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleExportData}
                        variant="outline"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      >
                        <Download size={14} /> EXPORT DATA (JSON)
                      </Button>
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="primary" disabled={saving} style={{ padding: '0.75rem 2rem', borderRadius: '9999px' }}>
                    {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                    {saving ? 'SAVING CHANGES...' : 'SAVE ALL SETTINGS'}
                  </Button>
                </div>

              </form>
            </GlassCard>
          </div>

        </div>

      </div>
    </main>
  );
}
