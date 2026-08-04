'use client';

import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'panel' | 'card';
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'card',
  hoverable = true,
  className = '',
  style = {}
}) => {
  const baseClass = variant === 'panel' ? 'glass-panel' : 'glass-card';
  const hoverClass = hoverable ? 'card-hover' : '';

  return (
    <article className={`${baseClass} ${hoverClass} ${className}`} style={style}>
      {children}
    </article>
  );
};

export default GlassCard;
