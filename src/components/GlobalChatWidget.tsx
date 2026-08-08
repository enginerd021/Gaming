'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDoc,
  getDocs,
  doc,
  where,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { MessageSquare, X, Send, Sparkles, LogIn, UserPlus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import InviteCard from './chat/InviteCard';
import Button from './ui/Button';

interface ChatMessage {
  id: string;
  senderId: string;
  senderGamertag: string;
  senderAvatarUrl: string;
  text: string;
  createdAt: any;
  type: 'text' | 'emoji' | 'invite';
  inviteData?: {
    tournamentId: string;
    tournamentName: string;
    game: string;
    teamId: string;
    teamName: string;
    slotsLeft: number;
    slotsTotal: number;
    status: 'active' | 'expired' | 'full';
  };
}

interface MiniTournament {
  id: string;
  name: string;
  game: string;
  status: string;
}

export default function GlobalChatWidget() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const team = useAppStore((state) => state.team);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Recruitment states
  const [showRecruitForm, setShowRecruitForm] = useState(false);
  const [userTournaments, setUserTournaments] = useState<MiniTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [recruitLoading, setRecruitLoading] = useState(false);

  // Toast status feedback
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4500);
  };

  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // Real-time Firestore stream listener for globalChatMessages
  useEffect(() => {
    const q = query(
      collection(db, "globalChatMessages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          senderId: data.senderId || '',
          senderGamertag: data.senderGamertag || 'Player',
          senderAvatarUrl: data.senderAvatarUrl || '',
          text: data.text || '',
          createdAt: data.createdAt,
          type: data.type || 'text',
          inviteData: data.inviteData
        });
      });

      // Reverse so oldest is first
      list.reverse();

      if (list.length > 0) {
        if (!isOpen && !isFirstLoad.current) {
          setUnreadCount(prev => prev + (list.length - messages.length > 0 ? list.length - messages.length : 0));
        }

        isFirstLoad.current = false;
        setMessages(list);
      }
    }, (err: any) => {
      console.error("Widget message stream error:", err);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Fetch registered tournaments for team recruitment list
  useEffect(() => {
    if (!team) {
      setUserTournaments([]);
      return;
    }

    const loadTournaments = async () => {
      try {
        const q = query(
          collection(db, "tournaments"),
          where("status", "==", "Upcoming")
        );
        const snap = await getDocs(q);
        const tList: MiniTournament[] = [];
        
        snap.docs.forEach(d => {
          const data = d.data();
          const registeredTeamIds: string[] = data.registeredTeamIds || [];
          if (registeredTeamIds.includes(team.id)) {
            tList.push({
              id: d.id,
              name: data.name || data.title || 'Tournament',
              game: data.game || '',
              status: data.status || 'Upcoming'
            });
          }
        });
        
        setUserTournaments(tList);
        if (tList.length > 0) {
          setSelectedTournamentId(tList[0].id);
        }
      } catch (err) {
        console.error("Failed to load user tournaments in widget:", err);
      }
    };

    loadTournaments();
  }, [team]);

  // Scroll to bottom only if user is near bottom or opening chat
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      const el = chatScrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (isNearBottom || isFirstLoad.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        isFirstLoad.current = false;
      }
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Profanity word list
  const PROFANITY_WORDS = [
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'bastard', 'slut', 'whore', 'fag', 'nigger',
    'saala', 'sala', 'chutiya', 'chutya', 'chut1ya', 'chu', 'bhenchod', 'behenchod', 'madarchod', 'harami', 'kamina', 'kaminey', 'randi', 
    'gaand', 'gand', 'loda', 'lauda', 'bhosadi', 'bhosdike', 'bhosada', 'lodu', 'muth', 'muthi', 'tatte', 'kutta', 'kamine', 'gandi', 
    'g@ndi', 'g@nd', 'bc', 'mc'
  ];

  // Helper validation functions
  const checkProfanity = (text: string): boolean => {
    const lowercaseText = text.toLowerCase();
    const words = lowercaseText.split(/[^a-zA-Z0-9]/);
    for (const w of words) {
      if (PROFANITY_WORDS.includes(w)) return true;
    }
    const normalized = lowercaseText
      .replace(/[^a-z0-9]/g, '')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/!/g, 'i');
    for (const badWord of PROFANITY_WORDS) {
      const normalizedBadWord = badWord.replace(/[^a-z0-9]/g, '');
      if (normalized.includes(normalizedBadWord)) {
        return true;
      }
    }
    return false;
  };

  const containsLinks = (text: string): boolean => {
    const urlRegex = /(https?:\/\/|www\.)/i;
    if (urlRegex.test(text)) return true;
    const wordUrlRegex = /([a-z0-9]+)\s*(\.|dot|\[\.\]|\(\s*dot\s*\))\s*(com|net|org|edu|gov|io|co|in|info|vercel|vercel\.app|vercel\s+app)/i;
    if (wordUrlRegex.test(text)) return true;
    return false;
  };

  const checkImpersonation = (text: string, gamertag: string, displayName: string): boolean => {
    const lowerText = text.toLowerCase();
    const lowerTag = gamertag.toLowerCase();
    const lowerName = displayName.toLowerCase();
    const badPatterns = ['admin', 'mod', 'shaktrix'];
    for (const pattern of badPatterns) {
      if (lowerTag.startsWith(pattern) || lowerName.startsWith(pattern) || lowerText.startsWith(pattern)) {
        return true;
      }
    }
    return false;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    const messageText = newMessage.trim();

    // 1. Base64 check
    if (/data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(messageText)) {
      showErrorToast('Base64 image uploads are not permitted in chat.');
      return;
    }

    // 2. Link check
    if (containsLinks(messageText)) {
      showErrorToast('Links are not allowed in the chat lounge.');
      // Log flagged attempt
      await addDoc(collection(db, "flaggedMessages"), {
        userId: user.uid,
        userGamertag: profile?.gamertag || 'Player',
        text: messageText,
        reason: 'Blocked Link',
        createdAt: serverTimestamp()
      }).catch(console.error);
      return;
    }

    // 3. Impersonation check
    const isStaffEmail = ['asthaojas30@gmail.com', 'vk844504@gmail.com'].includes(user.email || '');
    if (!isStaffEmail && checkImpersonation(messageText, profile?.gamertag || '', user.displayName || '')) {
      showErrorToast('Impersonation detected: display names or gamertags starting with Admin, Mod, or SHAKTRIX are restricted.');
      // Log flagged attempt
      await addDoc(collection(db, "flaggedMessages"), {
        userId: user.uid,
        userGamertag: profile?.gamertag || 'Player',
        text: messageText,
        reason: 'Impersonation Attempt',
        createdAt: serverTimestamp()
      }).catch(console.error);
      return;
    }

    // 4. Profanity check
    if (checkProfanity(messageText)) {
      showErrorToast('Abusive or vulgar language is blocked.');
      
      // Increment strikes client-side
      const currentStrikes = (profile?.chatStrikes || 0) + 1;
      const profileRef = doc(db, "profiles", user.uid);
      
      let updatedData: any = { chatStrikes: currentStrikes };
      if (currentStrikes >= 3) {
        const muteDuration = 15 * 60 * 1000;
        updatedData.mutedUntil = Date.now() + muteDuration;
        updatedData.chatStrikes = 0;
        showErrorToast('You have been muted for 15 minutes due to multiple strikes.');
      } else {
        showErrorToast(`Warning Strike ${currentStrikes}/3: Please keep chat respectful.`);
      }

      await updateDoc(profileRef, updatedData).catch(console.error);

      // Log flagged message
      await addDoc(collection(db, "flaggedMessages"), {
        userId: user.uid,
        userGamertag: profile?.gamertag || 'Player',
        text: messageText,
        reason: `Profanity Strike ${currentStrikes}`,
        createdAt: serverTimestamp()
      }).catch(console.error);
      
      return;
    }

    // 5. Rate limit check (2 seconds)
    const now = Date.now();
    const lastSent = Number(localStorage.getItem('shaktrix_last_msg_sent_at') || 0);
    if (now - lastSent < 2000) {
      showErrorToast('Please wait 2 seconds between messages.');
      return;
    }
    localStorage.setItem('shaktrix_last_msg_sent_at', String(now));

    // 6. Mute check
    const muteTime = profile?.mutedUntil || 0;
    if (muteTime > now) {
      const mins = Math.ceil((muteTime - now) / 60000);
      showErrorToast(`You are muted. Try again in ${mins} minute(s).`);
      return;
    }

    setNewMessage('');
    setSending(true);

    try {
      await addDoc(collection(db, "globalChatMessages"), {
        senderId: user.uid,
        senderGamertag: profile?.gamertag || 'Player',
        senderAvatarUrl: user.photoURL || '',
        text: messageText,
        type: 'text',
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSendRecruitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || recruitLoading || !user || !team) return;

    // Rate limit check for invites (30 seconds)
    const now = Date.now();
    const lastInvite = Number(localStorage.getItem('shaktrix_last_invite_sent_at') || 0);
    if (now - lastInvite < 30000) {
      const secsLeft = Math.ceil((30000 - (now - lastInvite)) / 1000);
      showErrorToast(`Please wait ${secsLeft}s before sending another team invite.`);
      return;
    }

    setRecruitLoading(true);
    setErrorToast(null);

    try {
      const tSnap = await getDoc(doc(db, "tournaments", selectedTournamentId));
      if (!tSnap.exists()) {
        throw new Error("Selected tournament not found.");
      }
      const tData = tSnap.data();

      // Determine size limit
      const gameStr = tData.game || '';
      const gameLower = gameStr.toLowerCase();
      let sizeLimit = 5;
      if (gameLower.includes('apex') || gameLower.includes('rocket')) {
        sizeLimit = 3;
      }

      const slotsLeft = sizeLimit - (team.members || []).length;
      if (slotsLeft <= 0) {
        throw new Error("Your team roster is already full.");
      }

      await addDoc(collection(db, "globalChatMessages"), {
        senderId: user.uid,
        senderGamertag: profile?.gamertag || 'Player',
        senderAvatarUrl: user.photoURL || '',
        text: `Team Recruitment for ${tData.name || tData.title || 'Tournament'}`,
        type: 'invite',
        inviteData: {
          tournamentId: selectedTournamentId,
          tournamentName: tData.name || tData.title || 'Tournament',
          game: gameStr,
          teamId: team.id,
          teamName: team.name,
          slotsLeft,
          slotsTotal: sizeLimit,
          status: 'active'
        },
        createdAt: serverTimestamp()
      });

      localStorage.setItem('shaktrix_last_invite_sent_at', String(now));
      showSuccessToast(`Recruitment card posted!`);
      setShowRecruitForm(false);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Failed to send recruitment.');
    } finally {
      setRecruitLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Sending...';
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
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 999
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
            position: 'fixed',
            bottom: '6rem',
            right: '2rem',
            width: '380px',
            height: '500px',
            zIndex: 999,
            background: 'rgba(6, 12, 26, 0.96)',
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

          {/* Toast Feedbacks */}
          {(errorToast || successToast) && (
            <div style={{ position: 'absolute', top: '3.5rem', left: '5%', width: '90%', zIndex: 1000 }}>
              {errorToast && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 60, 60, 0.95)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
                  <AlertTriangle size={14} />
                  <span>{errorToast}</span>
                </div>
              )}
              {successToast && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(6, 12, 26, 0.98)', border: '1px solid var(--accent-cyan)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>{successToast}</span>
                </div>
              )}
            </div>
          )}

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
                const isMe = user ? (user.uid === msg.senderId) : false;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                      <strong style={{ color: isMe ? 'var(--neon-blue)' : 'var(--neon-purple)' }}>
                        @{msg.senderGamertag}
                      </strong> • {formatTime(msg.createdAt)}
                    </div>
                    {msg.type === 'invite' && msg.inviteData ? (
                      <InviteCard 
                        inviteData={msg.inviteData}
                        senderGamertag={msg.senderGamertag}
                        senderId={msg.senderId}
                        onJoinSuccess={(txt) => showSuccessToast(txt)}
                        onJoinError={(err) => showErrorToast(err)}
                      />
                    ) : (
                      <div style={{
                        padding: '0.65rem 0.9rem',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isMe 
                          ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 136, 255, 0.2) 100%)' 
                          : 'rgba(16, 24, 53, 0.85)',
                        border: isMe 
                          ? '1px solid rgba(0, 240, 255, 0.3)' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recruitment Selector inside widget */}
          {showRecruitForm && team && (
            <form 
              onSubmit={handleSendRecruitment}
              style={{
                background: 'rgba(10, 16, 36, 0.98)',
                borderTop: '1px solid rgba(0, 240, 255, 0.15)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>Recruit for {team.name}</span>
                <button type="button" onClick={() => setShowRecruitForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
              </div>
              
              {userTournaments.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Your team isn't registered in any upcoming tournaments. Register on the Tournaments page first!
                </p>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={selectedTournamentId}
                    onChange={e => setSelectedTournamentId(e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      padding: '0.4rem',
                      background: 'rgba(4, 9, 20, 0.8)',
                      border: '1px solid rgba(0, 240, 255, 0.2)',
                      color: '#fff',
                      borderRadius: '6px'
                    }}
                  >
                    {userTournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.game})</option>
                    ))}
                  </select>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={recruitLoading}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '6px', minHeight: 'auto' }}
                  >
                    {recruitLoading ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Footer Input Area */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(10, 16, 36, 0.95)',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
            {user ? (
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

                {/* Recruitment button inside widget */}
                {team && (
                  <button
                    type="button"
                    onClick={() => setShowRecruitForm(!showRecruitForm)}
                    style={{
                      background: showRecruitForm ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${showRecruitForm ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      width: '2.2rem',
                      height: '2.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: showRecruitForm ? 'var(--accent-cyan)' : '#fff',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Recruit players"
                  >
                    <UserPlus size={16} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                    border: 'none',
                    color: '#fff',
                    cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                    opacity: newMessage.trim() && !sending ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.35rem 0' }}>
                You must be logged in to chat. <a href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Log In</a> or <a href="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Sign Up</a>.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
