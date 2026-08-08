'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, MessageCircle, Check, X, Copy } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  style?: React.CSSProperties;
}

export default function ShareButton({ title, description, url, style }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}${window.location.search}`
    : 'https://shakti-gaming-esports.vercel.app');
  const shareText = description
    ? `${title} — ${description}`
    : `Check out "${title}" on SHAKTRIX! 🎮`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTwitter = () => {
    const tweet = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleDiscordCopy = async () => {
    const discordMsg = `🎮 **${title}** — ${description || 'SHAKTRIX Esports'}\n🔗 ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(discordMsg);
    } catch {
      const el = document.createElement('textarea');
      el.value = discordMsg;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setOpen(false);
  };

  const ACTIONS = [
    {
      id: 'twitter',
      label: 'Share on X / Twitter',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: '#1DA1F2',
      bg: 'rgba(29, 161, 242, 0.12)',
      onClick: handleTwitter,
    },
    {
      id: 'whatsapp',
      label: 'Share on WhatsApp',
      icon: <MessageCircle size={15} />,
      color: '#25D366',
      bg: 'rgba(37, 211, 102, 0.12)',
      onClick: handleWhatsApp,
    },
    {
      id: 'discord',
      label: 'Copy Discord Message',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963a.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
        </svg>
      ),
      color: '#5865F2',
      bg: 'rgba(88, 101, 242, 0.12)',
      onClick: handleDiscordCopy,
    },
    {
      id: 'copy',
      label: copied ? 'Link Copied!' : 'Copy Link',
      icon: copied ? <Check size={15} /> : <Copy size={15} />,
      color: copied ? 'var(--accent-green)' : 'var(--accent-cyan)',
      bg: copied ? 'rgba(0, 255, 136, 0.1)' : 'rgba(var(--accent-cyan-rgb), 0.1)',
      onClick: handleCopyLink,
    },
  ];

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-block', zIndex: open ? 100 : 1, ...style }}>
      <button
        id="share-button-trigger"
        onClick={() => setOpen(v => !v)}
        aria-label="Share this page"
        title="Share"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.55rem 1rem',
          borderRadius: '8px',
          border: `1px solid ${open ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          background: open ? 'rgba(var(--accent-cyan-rgb), 0.1)' : 'rgba(255,255,255,0.05)',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Share2 size={15} />
        Share
      </button>

      {open && (
        <div
          id="share-popover"
          className="glass-panel fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '230px',
            padding: '0.75rem',
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', padding: '0 0.2rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              Share
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
              aria-label="Close share menu"
            >
              <X size={13} />
            </button>
          </div>

          {ACTIONS.map(action => (
            <button
              key={action.id}
              id={`share-${action.id}`}
              onClick={action.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid transparent',
                background: action.bg,
                color: action.color,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = action.color; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}

          <div style={{
            marginTop: '0.3rem',
            padding: '0.45rem 0.65rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '6px',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-color)',
          }}>
            🔗 {shareUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      )}
    </div>
  );
}
