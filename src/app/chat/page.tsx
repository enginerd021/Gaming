import { Metadata } from 'next';
import ChatClient from '@/components/chat/ChatClient';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Global Chat Lounge | SHAKTRIX',
  description: 'Connect and chat live with online competitive players in the SHAKTRIX Global Lounge.',
};

export default function ChatPage() {
  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem', boxSizing: 'border-box' }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className="container" style={{ maxWidth: '850px', position: 'relative', zIndex: 1 }}>
        
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={32} style={{ color: 'var(--accent-cyan)' }} />
          <h1 style={{ fontSize: '2rem', margin: 0, textTransform: 'uppercase', fontFamily: 'var(--font-title)', letterSpacing: '0.05em' }}>
            Lobby Chat
          </h1>
        </div>

        <ChatClient />
      </div>
    </main>
  );
}
