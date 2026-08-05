'use client';

import React from 'react';

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
  stats = DEFAULT_STATS,
  className = '',
  style = {}
}) => {
  return (
    <div className={`glass-panel ${className}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', padding: '1.5rem 2rem', borderRadius: '16px', background: 'hsla(223, 20%, 8%, 0.7)', ...style }}>
      {stats.map((item, i) => (
        <div key={i}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: item.color || 'var(--accent-cyan)', fontFamily: 'var(--font-title)' }}>
            {item.value}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsTicker;
