'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  where,
  updateDoc
} from 'firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { 
  Send, 
  Smile, 
  UserPlus, 
  Flag, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  UserX,
  VolumeX,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import GlassCard from '../ui/GlassCard';
import InviteCard from './InviteCard';
import ModerationPanel from './ModerationPanel';

// Curated gaming-relevant emoji set
const CURATED_EMOJIS = ['🔥', '💀', '🎮', '🏆', '😂', '👍', '👎', '😡', '🎯', '⚡', '🤝', '😢'];

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

export default function ChatClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const team = useAppStore((state) => state.team);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);

  // Form states
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Recruitment Form states
  const [showRecruitForm, setShowRecruitForm] = useState(false);
  const [userTournaments, setUserTournaments] = useState<MiniTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('general');
  const [recruitLoading, setRecruitLoading] = useState(false);
  
  // Moderation / Reports / Blocks
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showModPanel, setShowModPanel] = useState(false);
  
  // Status feedback toasts
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [muteStatus, setMuteStatus] = useState<{ isMuted: boolean; mutedUntil: number } | null>(null);

  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Load blocked list from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shaktrix_blocked_chat_users');
      if (saved) {
        try {
          setBlockedUsers(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  // Show active player count (based on unique senders in loaded chat list + local guests)
  const uniqueActiveChattersCount = new Set(messages.map(m => m.senderId)).size || 1;

  // Listen to global chat messages (Real-time sync)
  useEffect(() => {
    const q = query(
      collection(db, "globalChatMessages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: ChatMessage[] = [];
      snap.docs.forEach(docSnap => {
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
      setMessages(list);
      setLoading(false);

      if (snap.docs.length > 0) {
        setLastVisibleDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === 50);
      } else {
        setHasMore(false);
      }

      // Auto-scroll on new message if near bottom
      if (chatScrollRef.current) {
        const el = chatScrollRef.current;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom || isFirstLoad.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          isFirstLoad.current = false;
        }
      }
    }, (err) => {
      console.error("Chat snap error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user's registered tournaments for recruitment list
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
          // User team must be registered in the tournament to recruit players for it
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
      } catch (err) {
        console.error("Failed to load user tournaments:", err);
      }
    };

    loadTournaments();
  }, [team]);

  // Load older messages (pagination on demand)
  const handleLoadOlder = async () => {
    if (!lastVisibleDoc || loadingOlder || !hasMore) return;
    setLoadingOlder(true);

    try {
      const q = query(
        collection(db, "globalChatMessages"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleDoc),
        limit(50)
      );

      const snap = await getDocs(q);
      const list: ChatMessage[] = [];
      
      snap.docs.forEach(docSnap => {
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

      list.reverse();
      
      if (snap.docs.length > 0) {
        setMessages(prev => [...list, ...prev]);
        setLastVisibleDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4500);
  };

  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

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

  // Submit Text Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || sending || !user) return;

    const messageText = newMessageText.trim();
    
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

    // Check if input is exactly a single curated emoji
    const isSingleCuratedEmoji = CURATED_EMOJIS.includes(messageText);

    setSending(true);
    setErrorToast(null);

    try {
      await addDoc(collection(db, "globalChatMessages"), {
        senderId: user.uid,
        senderGamertag: profile?.gamertag || 'Player',
        senderAvatarUrl: user.photoURL || '',
        text: messageText,
        type: isSingleCuratedEmoji ? 'emoji' : 'text',
        createdAt: serverTimestamp()
      });

      setNewMessageText('');
      setShowEmojiPicker(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Curated Emoji click helper
  const handleEmojiClick = async (emoji: string) => {
    // If input is empty, click immediately sends as jumbo emoji message
    if (!newMessageText.trim() && user) {
      setSending(true);
      try {
        await addDoc(collection(db, "globalChatMessages"), {
          senderId: user.uid,
          senderGamertag: profile?.gamertag || 'Player',
          senderAvatarUrl: user.photoURL || '',
          text: emoji,
          type: 'emoji',
          createdAt: serverTimestamp()
        });
        setShowEmojiPicker(false);
      } catch (err) {
        showErrorToast('Failed to send emoji.');
      } finally {
        setSending(false);
      }
    } else {
      // Append emoji to text input
      setNewMessageText(prev => prev + emoji);
    }
  };

  // Submit Recruitment Invite Card
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
      let inviteData: any = {
        tournamentId: '',
        tournamentName: '',
        game: 'General',
        teamId: team.id,
        teamName: team.name,
        slotsLeft: 5 - (team.members || []).length,
        slotsTotal: 5,
        status: 'active'
      };

      if (selectedTournamentId !== 'general') {
        // Fetch details of selected tournament
        const tSnap = await getDoc(doc(db, "tournaments", selectedTournamentId));
        if (!tSnap.exists()) {
          throw new Error("Selected tournament not found.");
        }
        const tData = tSnap.data();

        // Determine size limit based on game
        const gameStr = tData.game || '';
        const gameLower = gameStr.toLowerCase();
        let sizeLimit = 5;
        if (gameLower.includes('apex') || gameLower.includes('rocket')) {
          sizeLimit = 3;
        }

        const slotsLeft = sizeLimit - (team.members || []).length;
        if (slotsLeft <= 0) {
          throw new Error("Your team roster is already full. You cannot recruit more players.");
        }

        inviteData = {
          tournamentId: selectedTournamentId,
          tournamentName: tData.name || tData.title || 'Tournament',
          game: gameStr,
          teamId: team.id,
          teamName: team.name,
          slotsLeft,
          slotsTotal: sizeLimit,
          status: 'active'
        };
      } else {
        if (inviteData.slotsLeft <= 0) {
          throw new Error("Your team roster is already full. You cannot recruit more players.");
        }
      }

      await addDoc(collection(db, "globalChatMessages"), {
        senderId: user.uid,
        senderGamertag: profile?.gamertag || 'Player',
        senderAvatarUrl: user.photoURL || '',
        text: selectedTournamentId === 'general'
          ? `Join team roster for ${team.name}`
          : `Team Recruitment for ${inviteData.tournamentName}`,
        type: 'invite',
        inviteData,
        createdAt: serverTimestamp()
      });

      localStorage.setItem('shaktrix_last_invite_sent_at', String(now));
      showSuccessToast(`Recruitment card posted for ${team.name}!`);
      setShowRecruitForm(false);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Failed to send recruitment invite.');
    } finally {
      setRecruitLoading(false);
    }
  };

  // Action: Report Message
  const handleReportMessage = async (msg: ChatMessage) => {
    if (!user) {
      showErrorToast("Please log in to report messages.");
      return;
    }
    if (!window.confirm("Are you sure you want to report this message for admin review?")) return;

    try {
      await addDoc(collection(db, "chatReports"), {
        messageId: msg.id,
        messageText: msg.text,
        reporterId: user.uid,
        reportedUserId: msg.senderId,
        reportedUserGamertag: msg.senderGamertag,
        reason: 'Player Flagged: Abusive/Link/Spam',
        createdAt: serverTimestamp()
      });
      showSuccessToast("Message reported. Administrators will review it shortly.");
    } catch (err: any) {
      console.error(err);
      showErrorToast("Failed to report message.");
    }
  };

  // Action: Block User locally (hide their messages)
  const handleBlockUser = (userId: string, gamertag: string) => {
    if (userId === user?.uid) return;
    if (!window.confirm(`Hide all messages from @${gamertag}? you can undo this by clearing local storage.`)) return;

    const newList = [...blockedUsers, userId];
    setBlockedUsers(newList);
    localStorage.setItem('shaktrix_blocked_chat_users', JSON.stringify(newList));
    showSuccessToast(`Blocked messages from @${gamertag}.`);
  };

  // Format creation timestamp
  const formatMsgTime = (timestamp: any) => {
    if (!timestamp) return 'Sending...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter out blocked users
  const filteredMessages = messages.filter(m => !blockedUsers.includes(m.senderId));

  const isMuted = muteStatus && muteStatus.mutedUntil > Date.now();
  const isAdmin = profile?.role === 'admin';

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: 'calc(100vh - 12rem)', minHeight: '400px' }}>
      
      {/* 1. Header Metadata & Guidelines */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '0.85rem 1.25rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.4rem',
          borderRadius: '16px 16px 0 0',
          background: 'rgba(6, 12, 26, 0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff66', display: 'inline-block', boxShadow: '0 0 8px #00ff66' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              SHAKTRIX Global Lounge
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({uniqueActiveChattersCount} players active)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setShowModPanel(!showModPanel)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              >
                Moderate Center
              </Button>
            )}
          </div>
        </div>

        {/* Community Guidelines Link / Banner */}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Lock size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>
            <strong>Guidelines:</strong> Be respectful. No links, image uploads, or abusive language. Violating rules mutes your account automatically.
          </span>
        </p>
      </div>

      {/* Flag feedback notifications */}
      {(errorToast || successToast) && (
        <div 
          style={{ 
            position: 'absolute', top: '15.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
            display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxWidth: '380px'
          }}
        >
          {errorToast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 60, 60, 0.95)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(255, 60, 60, 0.3)', fontSize: '0.8rem', fontWeight: 600 }}>
              <AlertTriangle size={15} />
              <span>{errorToast}</span>
            </div>
          )}
          {successToast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 12, 26, 0.98)', border: '1px solid var(--accent-cyan)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0, 240, 255, 0.3)', fontSize: '0.8rem', fontWeight: 600 }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>{successToast}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Messages List Container */}
      <div 
        ref={chatScrollRef}
        style={{ 
          overflowY: 'auto', 
          padding: '1.25rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          background: 'rgba(2, 4, 10, 0.25)',
          borderLeft: '1px solid var(--border-color)',
          borderRight: '1px solid var(--border-color)'
        }}
      >
        {/* Pagination Trigger */}
        {hasMore && (
          <button 
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            style={{
              alignSelf: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background 0.2s'
            }}
          >
            {loadingOlder ? <RefreshCw size={12} className="spin" /> : null}
            Load Older Messages
          </button>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '2rem 0' }}>
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton-pulse" style={{ width: '60%', height: '50px', borderRadius: '8px', alignSelf: n % 2 === 0 ? 'flex-end' : 'flex-start' }} />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
            No messages in lounge. Type a greeting below!
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isCurrentUser = msg.senderId === user?.uid;
            const isSenderAdmin = msg.senderId === 'uid-alpha' || msg.senderId === 'uid-delta' || msg.senderId === 'uid-epsilon'; // placeholder check or verify role
            const isJumboEmoji = msg.type === 'emoji';

            return (
              <article 
                key={msg.id}
                style={{
                  alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                  maxWidth: msg.type === 'invite' ? '100%' : '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Meta details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {msg.senderAvatarUrl && (
                    <img 
                      src={msg.senderAvatarUrl} 
                      alt="" 
                      style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  )}
                  <a 
                    href={`/profile?uid=${msg.senderId}`}
                    style={{ color: 'var(--text-secondary)', fontWeight: 700, textDecoration: 'none' }}
                    className="hover-underline"
                  >
                    @{msg.senderGamertag}
                  </a>
                  {isSenderAdmin && (
                    <span style={{ fontSize: '0.58rem', background: 'hsla(186, 100%, 48%, 0.15)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '0.02rem 0.2rem', borderRadius: '3px', fontWeight: 800 }}>
                      STAFF
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatMsgTime(msg.createdAt)}</span>
                </div>

                {/* Content Bubble / Card */}
                {msg.type === 'invite' && msg.inviteData ? (
                  <InviteCard 
                    inviteData={msg.inviteData} 
                    senderGamertag={msg.senderGamertag}
                    senderId={msg.senderId}
                    onJoinSuccess={(msgText) => showSuccessToast(msgText)}
                    onJoinError={(errText) => showErrorToast(errText)}
                  />
                ) : (
                  <div 
                    style={{
                      background: isCurrentUser 
                        ? 'hsla(186, 100%, 48%, 0.08)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isCurrentUser ? 'rgba(0, 240, 255, 0.25)' : 'var(--border-color)'}`,
                      borderRadius: isCurrentUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      padding: isJumboEmoji ? '0.4rem 0.6rem' : '0.65rem 0.9rem',
                      fontSize: isJumboEmoji ? '2.5rem' : '0.88rem',
                      lineHeight: '1.45',
                      color: 'var(--text-primary)',
                      position: 'relative',
                      wordBreak: 'break-word',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    {msg.text}

                    {/* Report / Moderation Trigger actions */}
                    {!isCurrentUser && (
                      <div className="chat-actions-hover" style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.75rem', opacity: 0.6 }}>
                        <button 
                          onClick={() => handleReportMessage(msg)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          title="Report Message"
                        >
                          <Flag size={12} className="hover-red" />
                        </button>
                        <button 
                          onClick={() => handleBlockUser(msg.senderId, msg.senderGamertag)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          title="Block User"
                        >
                          <UserX size={12} className="hover-red" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Composer Area */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.25rem', 
          borderTop: '1px solid var(--border-color)', 
          borderRadius: '0 0 16px 16px',
          background: 'rgba(6, 12, 26, 0.40)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {/* Recruitment Form Popover/Dropdown */}
        {showRecruitForm && team && (
          <form 
            onSubmit={handleSendRecruitment}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Recruit Teammates for {team.name}</span>
              <button type="button" onClick={() => setShowRecruitForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target Recruitment:</label>
              <select 
                value={selectedTournamentId}
                onChange={e => setSelectedTournamentId(e.target.value)}
                className="glass-input"
                style={{ fontSize: '0.82rem', padding: '0.4rem', background: 'var(--bg-primary)', color: '#fff' }}
              >
                <option value="general">General Team Invitation (Roster Join)</option>
                {userTournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.game})</option>
                ))}
              </select>
            </div>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={recruitLoading}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px', minHeight: 'auto' }}
            >
              {recruitLoading ? 'Posting Invite...' : 'Post Recruitment Card'}
            </Button>
          </form>
        )}

        {/* Main inputs */}
        {user ? (
          isMuted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontSize: '0.88rem', padding: '0.5rem 0', fontWeight: 600 }}>
              <VolumeX size={18} />
              <span>You are muted due to abusive language. Chat functions are disabled.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', position: 'relative' }}>
              
              {/* Emoji Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  title="Emoji popover"
                >
                  <Smile size={18} />
                </button>

                {/* Curated Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div 
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      bottom: '3rem',
                      left: 0,
                      zIndex: 300,
                      padding: '0.6rem',
                      background: 'rgba(6, 12, 26, 0.98)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.4rem',
                      width: '140px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                  >
                    {CURATED_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px', textAlign: 'center' }}
                        className="hover-bg-highlight"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div style={{ flexGrow: 1 }}>
                <input 
                  type="text"
                  placeholder="Send a message to the lobby (type emoji for jumbo size)..."
                  maxLength={300}
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  className="glass-input"
                  style={{
                    height: '2.5rem',
                    fontSize: '0.88rem',
                    padding: '0 0.85rem',
                    borderRadius: '10px'
                  }}
                  disabled={sending}
                />
              </div>

              {/* Recruitment Trigger (only shown if user is in a team) */}
              {team && (
                <button
                  type="button"
                  onClick={() => { setShowRecruitForm(!showRecruitForm); setShowEmojiPicker(false); }}
                  style={{
                    background: showRecruitForm ? 'hsla(186, 100%, 48%, 0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${showRecruitForm ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: showRecruitForm ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  title="Recruit players for tournament"
                >
                  <UserPlus size={18} />
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending || !newMessageText.trim()}
                className="btn btn-primary"
                style={{
                  height: '2.5rem',
                  width: '2.5rem',
                  padding: 0,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={15} />
              </button>

            </form>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '0.35rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            You must be logged in to chat. <a href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Log In</a> or <a href="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Sign Up</a> now.
          </div>
        )}
      </div>

      {/* Moderation Command Panel Modal */}
      {showModPanel && isAdmin && (
        <ModerationPanel onClose={() => setShowModPanel(false)} />
      )}

      {/* Hidden Hover styling logic */}
      <style jsx global>{`
        .chat-actions-hover {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        div:hover > .chat-actions-hover {
          opacity: 1 !important;
        }
        .hover-red:hover {
          color: var(--accent-red) !important;
        }
        .hover-bg-highlight:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
