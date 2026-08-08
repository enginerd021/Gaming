'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StatItem {
  label: string;
  value: string;
  color?: string;
}

export interface StatsTickerProps {
  stats?: StatItem[];
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_STATS: StatItem[] = [
  { label: 'Active Arenas', value: '12+', color: 'var(--accent-cyan)' },
  { label: 'Prize Pools', value: '$50K+', color: 'var(--accent-violet)' },
  { label: 'Pro Players', value: '1.4K+', color: 'var(--accent-gold)' },
  { label: 'Real-time Sync', value: '99.9%', color: 'hsl(145, 80%, 45%)' },
];

export const StatsTicker: React.FC<StatsTickerProps> = ({
  stats,
  className = '',
  style = {}
}) => {
  const [tickerItems, setTickerItems] = useState<StatItem[]>(stats || DEFAULT_STATS);

  useEffect(() => {
    // Real-time subscription to matchHistory for live feed ticker
    const q = query(
      collection(db, "matchHistory"),
      orderBy("resolvedAt", "desc"),
      limit(4)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setTickerItems(stats || DEFAULT_STATS);
        return;
      }
      
      const items = snap.docs.map((doc) => {
        const d = doc.data();
        const tName = d.tournamentName || "Tournament";
        const winner = d.winnerId === d.team1Id ? d.team1Name : d.team2Name;
        const scoreStr = `${d.score1}-${d.score2}`;
        const labelStr = `${d.team1Name} vs ${d.team2Name} in ${tName}`;
        
        return {
          label: labelStr,
          value: `🏆 ${winner} (${scoreStr})`,
          color: 'var(--accent-green)'
        };
      });
      setTickerItems(items);
    }, (err) => {
      console.error("StatsTicker match history listener failed, falling back:", err);
      setTickerItems(stats || DEFAULT_STATS);
    });

    return () => unsub();
  }, [stats]);

  return (
    <div className={`glass-panel ${className}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', padding: '1.5rem 2rem', borderRadius: '16px', background: 'hsla(223, 20%, 8%, 0.7)', ...style }}>
      {tickerItems.map((item, i) => (
        <div key={i} className="slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color || 'var(--accent-cyan)', fontFamily: 'var(--font-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.value}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsTicker;
