'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { MessageSquare, X, Send, Sparkles, LogIn } from 'lucide-react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface GlobalMessage {
  id: string;
  uid: string;
  gamertag: string;
  displayName: string;
  message: string;
  createdAt: any;
}

const DEFAULT_LOUNGE_MESSAGES: GlobalMessage[] = [
  {
    id: 'demo-1',
    uid: 'system',
    gamertag: 'SHAKTRIX_Bot',
    displayName: 'SHAKTRIX Bot',
    message: '⚡ Welcome to the SHAKTRIX Global Lounge! Connect & chat with online players.',
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'demo-2',
    uid: 'demo-user-1',
    gamertag: 'ViperX',
    displayName: 'ViperX',
    message: 'Who is ready for tonight\'s Valorant bracket tournament? 🔥',
    createdAt: new Date(Date.now() - 1800000)
  },
  {
    id: 'demo-3',
    uid: 'demo-user-2',
    gamertag: 'NeonBlade',
    displayName: 'NeonBlade',
    message: 'Our squad is looking for 1 entry fragger! Check out our team page 🛡️',
    createdAt: new Date(Date.now() - 600000)
  }
];

export default function GlobalChatWidget() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const { refreshCount } = useAutoRefresh();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GlobalMessage[]>(DEFAULT_LOUNGE_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Real-time Firestore stream listener for global chat
  useEffect(() => {
    const q = query(collection(db, "global_chat"), limit(60));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: GlobalMessage[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || '',
          gamertag: data.gamertag || 'Player',
          displayName: data.displayName || 'Player',
          message: data.message || '',
          createdAt: data.createdAt
        });
      });

      if (list.length > 0) {
        // Sort client-side by timestamp ascending (oldest to newest)
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return tA - tB;
        });

        if (!isOpen && !isFirstLoad.current) {
          setUnreadCount(prev => prev + (list.length - messages.length > 0 ? list.length - messages.length : 0));
        }

        isFirstLoad.current = false;
        setMessages(list);
      }
    }, (err: any) => {
      // Gracefully handle un-deployed rules without throwing unhandled console errors
      if (err?.code === 'permission-denied') {
        // Keep default lounge messages in state
      }
    });

    return () => unsubscribe();
  }, [refreshCount, isOpen, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    const myGamertag = profile?.gamertag || user.email?.split('@')[0] || 'Player';
    const myDisplayName = profile?.displayName || user.displayName || 'Player';
    setNewMessage('');
    setSending(true);

    const localMsg: GlobalMessage = {
      id: `local-${Date.now()}`,
      uid: user.uid,
      gamertag: myGamertag,
      displayName: myDisplayName,
      message: messageText,
      createdAt: new Date()
    };

    // Optimistic UI append
    setMessages(prev => [...prev, localMsg]);

    try {
      await addDoc(collection(db, "global_chat"), {
        uid: user.uid,
        gamertag: myGamertag,
        displayName: myDisplayName,
        message: messageText,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      // Handled silently
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setUnreadCount(0);
        }}
        aria-label="Toggle Global Lounge Chat"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 25px rgba(0, 240, 255, 0.4), 0 0 15px rgba(176, 38, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        className="hover-scale"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        
        {!isOpen && unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--accent-red)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 800,
            borderRadius: '9999px',
            padding: '0.15rem 0.45rem',
            boxShadow: '0 0 10px rgba(255, 42, 109, 0.6)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* FLOATING CHAT DRAWER PANEL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '2rem',
          zIndex: 999,
          width: 'min(380px, calc(100vw - 2.5rem))',
          height: '520px',
          background: 'rgba(6, 12, 26, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 240, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="fade-in"
        >
          {/* Header Bar */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(10, 16, 36, 0.95)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-green)',
                boxShadow: '0 0 8px var(--accent-green)'
              }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', fontFamily: 'var(--font-title)' }}>
                GLOBAL <span style={{ color: 'var(--neon-blue)' }}>LOUNGE</span>
              </h3>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              className="hover-opacity"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Sparkles size={24} style={{ color: 'var(--neon-blue)', margin: '0 auto 0.5rem auto' }} />
                Welcome to SHAKTRIX Global Lounge!<br />Be the first to say hello.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user?.uid === msg.uid;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                      <strong style={{ color: isMe ? 'var(--neon-blue)' : 'var(--neon-purple)' }}>
                        @{msg.gamertag}
                      </strong> • {formatTime(msg.createdAt)}
                    </div>
                    <div style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isMe 
                        ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(0, 136, 255, 0.25) 100%)' 
                        : 'rgba(16, 24, 53, 0.85)',
                      border: isMe 
                        ? '1px solid rgba(0, 240, 255, 0.35)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(10, 16, 36, 0.95)',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
            {user ? (
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Chat with SHAKTRIX players..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(4, 9, 20, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                    border: 'none',
                    color: '#fff',
                    cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                    opacity: newMessage.trim() && !sending ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Sign in to join global lounge chat</span>
                <Link href="/login" style={{ color: 'var(--neon-blue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <LogIn size={14} /> Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
