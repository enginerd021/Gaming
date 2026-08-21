'use client';

import React from 'react';
import { SearchX, RefreshCw, Trophy, Users, ShieldAlert, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptySearchResultProps {
  title?: string;
  description?: string;
  searchQuery?: string;
  icon?: React.ReactNode;
  onReset?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptySearchResult({
  title = "No Results Found",
  description,
  searchQuery,
  icon,
  onReset,
  actionLabel,
  onAction
}: EmptySearchResultProps) {
  return (
    <div className="glass-panel fade-in" style={{
      padding: '3.5rem 2rem',
      borderRadius: '20px',
      textAlign: 'center',
      border: '1px solid rgba(0, 240, 255, 0.2)',
      background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.9) 0%, rgba(16, 8, 36, 0.9) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      margin: '2rem 0'
    }}>
      {/* GLOWING ICON WRAPPER */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'rgba(0, 240, 255, 0.1)',
        border: '1px solid var(--accent-cyan)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-cyan)',
        boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)'
      }}>
        {icon || <SearchX size={36} />}
      </div>

      <div style={{ maxWidth: '480px' }}>
        <h3 style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          fontFamily: 'var(--font-title)',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: '0.4rem'
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          margin: 0
        }}>
          {description || (
            searchQuery ? (
              <>We couldn&apos;t find any items matching &quot;<strong style={{ color: 'var(--accent-cyan)' }}>{searchQuery}</strong>&quot;. Try adjusting your keywords or clearing filters.</>
            ) : (
              'No items currently match the selected criteria.'
            )
          )}
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} /> RESET SEARCH & FILTERS
          </Button>
        )}

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            variant="primary"
            style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
