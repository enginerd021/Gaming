'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Profile } from '@/store/useAppStore';

export interface PodiumProps {
  topThree: Profile[];
}

export const Podium: React.FC<PodiumProps> = ({ topThree }) => {
  if (!topThree || topThree.length === 0) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', margin: '2rem 0 4rem 0', flexWrap: 'wrap' }} className="podium-container">
      
      {/* 2nd Place (Silver) */}
      {topThree[1] && (
        <article className="podium-card silver" style={{ width: '220px', order: 1 }}>
          <div className="podium-rank-badge">2</div>
          <Link href={`/players/${topThree[1].gamertag}`} style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', display: 'block' }} className="hover-cyan">
            {topThree[1].displayName}
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{topThree[1].gamertag}</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.75rem' }}>
            {topThree[1].stats?.points || 1000} XP
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {topThree[1].stats?.wins || 0} Victories
          </div>
        </article>
      )}

      {/* 1st Place (Gold Champion) */}
      {topThree[0] && (
        <article className="podium-card gold" style={{ width: '250px', order: 2 }}>
          <div className="podium-rank-badge" style={{ position: 'relative' }}>
            <Star size={14} style={{ position: 'absolute', top: '-8px', fill: '#fff', stroke: 'none' }} />
            1
          </div>
          <div className="badge badge-gold" style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>Champion</div>
          <Link href={`/players/${topThree[0].gamertag}`} style={{ fontWeight: 800, fontSize: '1.3rem', textAlign: 'center', display: 'block' }} className="hover-cyan">
            {topThree[0].displayName}
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{topThree[0].gamertag}</span>
          <div className="text-gradient-gold" style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.75rem' }}>
            {topThree[0].stats?.points || 1000} XP
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {topThree[0].stats?.wins || 0} Victories
          </div>
        </article>
      )}

      {/* 3rd Place (Bronze) */}
      {topThree[2] && (
        <article className="podium-card bronze" style={{ width: '200px', order: 3 }}>
          <div className="podium-rank-badge">3</div>
          <Link href={`/players/${topThree[2].gamertag}`} style={{ fontWeight: 700, fontSize: '1.05rem', textAlign: 'center', display: 'block' }} className="hover-cyan">
            {topThree[2].displayName}
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{topThree[2].gamertag}</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.75rem' }}>
            {topThree[2].stats?.points || 1000} XP
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {topThree[2].stats?.wins || 0} Victories
          </div>
        </article>
      )}

    </div>
  );
};

export default Podium;
