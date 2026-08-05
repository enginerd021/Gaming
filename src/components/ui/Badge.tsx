'use client';

import React from 'react';

export interface BadgeProps {
  variant?: 'cyan' | 'violet' | 'gold' | 'red' | 'live';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  children,
  className = '',
  style = {}
}) => {
  if (variant === 'live') {
    return (
      <span className={`badge badge-violet ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', ...style }}>
        <span className="live-dot" />
        {children}
      </span>
    );
  }

  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
};

export default Badge;
