'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong in the arena",
  message = "A system anomaly has interrupted your current operation. Please try rebooting the connection.",
  onRetry
}) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '520px',
      margin: '0 auto',
      zIndex: 1,
    }} className="fade-in">
      <div className="glass-panel" style={{
        position: 'relative',
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        borderRadius: '20px',
        border: '1px solid rgba(255, 42, 109, 0.25)',
        boxShadow: '0 0 40px rgba(255, 42, 109, 0.05), 0 25px 60px rgba(0, 0, 0, 0.7)',
        background: 'rgba(6, 8, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        {/* Warning Icon with Red Pulsing Glow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(255, 42, 109, 0.1)',
          border: '2px solid var(--accent-red)',
          color: 'var(--accent-red)',
          marginBottom: '1.5rem',
          boxShadow: '0 0 20px rgba(255, 42, 109, 0.3)',
          animation: 'pulseSkeleton 2s infinite ease-in-out'
        }}>
          <AlertTriangle size={36} />
        </div>

        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-title)',
          textTransform: 'uppercase'
        }}>
          {title}
        </h2>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '2rem',
          fontFamily: 'var(--font-body)',
        }}>
          {message}
        </p>

        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              padding: '0.8rem 1.8rem',
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, var(--accent-red) 0%, #D81B60 100%)',
              boxShadow: '0 0 24px rgba(255, 42, 109, 0.4)',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            <RefreshCw size={18} />
            Reboot / Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
