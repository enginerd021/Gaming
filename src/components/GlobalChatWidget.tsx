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
    message: '⚡ Welcome to the SHAKTRIX Global Lounge! Connect & chat live with online players across all pages.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'demo-2',
    uid: 'demo-user-1',
    gamertag: 'ViperX',
    displayName: 'ViperX',
    message: 'Who is ready for tonight\'s Valorant bracket tournament? 🔥',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'demo-3',
    uid: 'demo-user-2',
    gamertag: 'NeonBlade',
    displayName: 'NeonBlade',
    message: 'Our squad is looking for 1 entry fragger! Check out our team page 🛡️',
    createdAt: new Date(Date.now() - 600000).toISOString()
  }
];

export default function GlobalChatWidget() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GlobalMessage[]>(DEFAULT_LOUNGE_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel & localStorage history on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('shaktrix_global_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load local chat history:", e);
    }

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('shaktrix_global_chat');
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_MESSAGE') {
          const incoming: GlobalMessage = event.data.message;
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            const updated = [...prev, incoming];
            try {
              localStorage.setItem('shaktrix_global_chat_history', JSON.stringify(updated.slice(-100)));
            } catch (e) {}
            return updated;
          });
          if (!isOpen) {
            setUnreadCount(count => count + 1);
          }
        }
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'shaktrix_global_chat_history' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [isOpen]);

  // Scroll to bottom only if user is near bottom or opening chat
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      const el = chatScrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom || isFirstLoad.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
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
        let createdIso = new Date().toISOString();
        if (data.createdAt?.toDate) {
          createdIso = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdIso = new Date(data.createdAt).toISOString();
        }
        list.push({
          id: docSnap.id,
          uid: data.uid || '',
          gamertag: data.gamertag || 'Player',
          displayName: data.displayName || 'Player',
          message: data.message || '',
          createdAt: createdIso
        });
      });

      if (list.length > 0) {
        // Sort client-side by timestamp ascending (oldest to newest)
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (!isOpen && !isFirstLoad.current) {
          setUnreadCount(prev => prev + (list.length - messages.length > 0 ? list.length - messages.length : 0));
        }

        isFirstLoad.current = false;
        setMessages(list);

        try {
          localStorage.setItem('shaktrix_global_chat_history', JSON.stringify(list.slice(-100)));
        } catch (e) {}
      }
    }, (err: any) => {
      // Handled silently for un-deployed rules
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    
    // Determine Gamertag: User's profile gamertag or persistent guest handle
    let myGamertag = 'Guest';
    let myUid = 'guest';

    if (user) {
      myGamertag = profile?.gamertag || user.email?.split('@')[0] || 'Player';
      myUid = user.uid;
    } else {
      let guestTag = localStorage.getItem('shaktrix_guest_tag');
      if (!guestTag) {
        guestTag = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('shaktrix_guest_tag', guestTag);
      }
      myGamertag = guestTag;
      myUid = `guest-${guestTag}`;
    }

    const myDisplayName = myGamertag;
    setNewMessage('');
    setSending(true);

    const localMsg: GlobalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      uid: myUid,
      gamertag: myGamertag,
      displayName: myDisplayName,
      message: messageText,
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic UI update
    setMessages(prev => {
      const updated = [...prev, localMsg];
      try {
        localStorage.setItem('shaktrix_global_chat_history', JSON.stringify(updated.slice(-100)));
      } catch (err) {}
      return updated;
    });

    // 2. Broadcast to other tabs locally
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type: 'NEW_MESSAGE', message: localMsg });
      } catch (err) {}
    }

    // 3. Write to Cloud Firestore
    try {
      await addDoc(collection(db, "global_chat"), {
        uid: myUid,
        gamertag: myGamertag,
        displayName: myDisplayName,
        message: messageText,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore save fallback to local broadcast:", err);
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
        className="global-chat-launcher hover-scale"
        style={{
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
        <div 
          className="global-chat-drawer fade-in"
          style={{
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
          <div 
            ref={chatScrollRef}
            className="global-chat-scroll"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Sparkles size={24} style={{ color: 'var(--neon-blue)', margin: '0 auto 0.5rem auto' }} />
                Welcome to SHAKTRIX Global Lounge!<br />Be the first to say hello.
              </div>
            ) : (
              messages.map((msg) => {
                const currentUid = user ? user.uid : (typeof window !== 'undefined' ? localStorage.getItem('shaktrix_guest_tag') : null);
                const isMe = user ? (user.uid === msg.uid) : (msg.uid.includes(currentUid || 'guest'));

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

          {/* Footer Input Area - Enabled for both Logged In & Guests */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(10, 16, 36, 0.95)',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
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
          </div>
        </div>
      )}
    </>
  );
}
