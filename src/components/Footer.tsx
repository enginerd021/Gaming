'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/maintenance') {
    return null;
  }

  return (
    <footer className="esports-footer" style={{ flexShrink: 0 }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
          {/* Brand */}
          <div>
            <div className="footer-brand">
              SHAKT<span className="accent">RIX</span>
            </div>
            <div className="footer-tagline">India&apos;s competitive esports platform</div>
          </div>

          {/* Nav links */}
          <ul className="footer-links">
            <li><a href="/tournaments">Tournaments</a></li>
            <li><a href="/teams">Teams</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="/players">Players</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span className="footer-copy">&copy; {new Date().getFullYear()} SHAKTRIX Esports. All rights reserved.</span>
          <span className="footer-copy">Tournament brackets &amp; Live Leaderboards synced in real-time.</span>
        </div>
      </div>
    </footer>
  );
}
