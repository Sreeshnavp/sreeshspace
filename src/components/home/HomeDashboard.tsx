import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { WorkspaceView, LinkItem, TodoItem, ReelItem, FinanceTransaction, NoteItem, SketchItem } from '../../types';
import { playPopSound } from '../../utils/delight';
import { useScrollVisibility } from '../../utils/useScrollVisibility';
import avatarImg from '../../assets/avatar.jpg';
import sreeshCharacterImg from '../../assets/sreesh_character.png';

interface HomeDashboardProps {
  onNavigate: (view: WorkspaceView) => void;
  links: LinkItem[];
  todos: TodoItem[];
  reels: ReelItem[];
  transactions: FinanceTransaction[];
  notes: NoteItem[];
  sketches: SketchItem[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHistoryTimeline?: () => void;
  onOpenDesignGuide?: () => void;
  onLock?: () => void;
}

const QUOTES = [
  'Small steps every day lead to big dreams blooming. Take a deep breath, trust your gentle pace, and celebrate each tiny victory today.',
  'Create space for what truly nourishes your heart. When your environment feels peaceful, creativity flows effortlessly. ✨',
  'Focus on the step right in front of you, not the mountain ahead. Every quiet habit builds your future sanctuary. 🌿',
  'Warm tea, quiet moments, and happy progress. Give yourself grace to rest and grow at your own natural pace. 🍵',
  'Organized spaces bring peaceful creative minds. You are building something meaningful, one gentle day at a time. 💜'
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  links,
  todos,
  reels,
  transactions,
  notes,
  sketches,
  darkMode,
  onToggleDarkMode,
  onOpenHistoryTimeline,
  onOpenDesignGuide,
  onLock,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [favoriteQuote, setFavoriteQuote] = useState(false);
  const [statusVibe, setStatusVibe] = useState('✨ Feeling Creative');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditQuickLinksOpen, setIsEditQuickLinksOpen] = useState(false);
  const [editingQuickLink, setEditingQuickLink] = useState<any | null>(null);
  const [isAddingQuickLink, setIsAddingQuickLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('language');

  const [quickAccessLinks, setQuickAccessLinks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sreesh-quick-access-links-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'ql-1', title: 'Google', url: 'https://google.com', icon: 'language', bgClass: 'bg-sky-subtle/50', colorClass: 'text-sky-accent' },
      { id: 'ql-2', title: 'YouTube', url: 'https://youtube.com', icon: 'play_arrow', bgClass: 'bg-peach-subtle/50', colorClass: 'text-tertiary' },
      { id: 'ql-3', title: 'GitHub', url: 'https://github.com', icon: 'pets', bgClass: 'bg-sunshine-subtle/50', colorClass: 'text-sunshine-accent' },
      { id: 'ql-4', title: 'Instagram', url: 'https://instagram.com', icon: 'photo_camera', bgClass: 'bg-peach-subtle/40', colorClass: 'text-tertiary-container' },
      { id: 'ql-5', title: 'LinkedIn', url: 'https://linkedin.com', icon: 'work', bgClass: 'bg-lavender-subtle/50', colorClass: 'text-primary' },
      { id: 'ql-6', title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'smart_toy', bgClass: 'bg-mint-subtle/50', colorClass: 'text-secondary' },
    ];
  });

  const triggerCelebration = () => {
    try {
      playPopSound();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6B38D4', '#006C49', '#DE3B78', '#F59E0B', '#0284C7']
      });
    } catch {}
  };

  const handleDeleteQuickLink = (id: string) => {
    playPopSound();
    setQuickAccessLinks((prev) => {
      const next = prev.filter((l) => l.id !== id);
      try { localStorage.setItem('sreesh-quick-access-links-v2', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSaveQuickLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    let cleanUrl = newLinkUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (editingQuickLink) {
      setQuickAccessLinks((prev) => {
        const next = prev.map((l) =>
          l.id === editingQuickLink.id ? { ...l, title: newLinkTitle.trim(), url: cleanUrl, icon: newLinkIcon } : l
        );
        try { localStorage.setItem('sreesh-quick-access-links-v2', JSON.stringify(next)); } catch {}
        return next;
      });
      setEditingQuickLink(null);
    } else {
      const colors = [
        { bgClass: 'bg-sky-subtle/50', colorClass: 'text-sky-accent' },
        { bgClass: 'bg-peach-subtle/50', colorClass: 'text-tertiary' },
        { bgClass: 'bg-lavender-subtle/50', colorClass: 'text-primary' },
        { bgClass: 'bg-mint-subtle/50', colorClass: 'text-secondary' },
      ];
      const color = colors[quickAccessLinks.length % colors.length];
      const newL = {
        id: 'ql-' + Date.now(),
        title: newLinkTitle.trim(),
        url: cleanUrl,
        icon: newLinkIcon || 'language',
        ...color,
      };
      setQuickAccessLinks((prev) => {
        const next = [...prev, newL];
        try { localStorage.setItem('sreesh-quick-access-links-v2', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingQuickLink(false);
    triggerCelebration();
  };
  const [showVibeCard, setShowVibeCard] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const isHeaderVisible = useScrollVisibility();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Active counts
  const activeTasksCount = useMemo(() => {
    return todos.filter(t => !t.completed && t.status !== 'archived').length;
  }, [todos]);

  const totalNotesCount = notes.length + sketches.length;

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  }, []);

  const timeString = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleNextQuote = () => {
    playPopSound();
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  return (
    <div className="bg-canvas-bg font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (EXACT 1:1 TO STITCH & SCREENSHOT)          */}
      {/* ======================================================== */}
      <header className={`fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-border-subtle transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}>
        <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-space-sm w-full max-w-7xl mx-auto">
          {/* Left: Avatar with Sparkle + Name + Status Pill */}
          <div className="flex items-center gap-space-md">
            <div 
              onClick={() => setIsAboutModalOpen(true)}
              className="relative flex items-center justify-center cursor-pointer group"
              title="View profile info"
            >
              <img 
                src={avatarImg} 
                alt="Sreeshnav" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-fixed shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-container rounded-full flex items-center justify-center shadow-sm text-[9px]">
                ✨
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">
                  Orbit
                </span>
              </div>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <button 
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setIsStatusModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-peach-subtle/80 text-on-tertiary-fixed-variant font-label-sm text-label-sm shadow-[0_1px_4px_rgba(220,44,79,0.08)] hover:bg-peach-subtle active:scale-95 transition-all cursor-pointer"
                  title="Change daily vibe status"
                >
                  <span>{statusVibe}</span>
                  <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Lock & Notification Actions */}
          <div className="flex items-center gap-space-xs">
            <button 
              onClick={() => {
                playPopSound();
                if (onLock) onLock();
              }}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95"
              title="Lock Vault"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </button>
            <button 
              onClick={() => {
                playPopSound();
                setIsNotificationOpen(true);
              }}
              className="relative w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN FEED CONTAINER (STITCH EXACT 1:1)                */}
      {/* ======================================================== */}
      <main className="flex flex-col relative w-full pt-20 pb-28 bg-canvas-bg min-h-screen">
        <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-space-xl">
          
          {/* SECTION 1: Cute Welcome Banner & Whimsical Illustration Card */}
          <section className="relative w-full rounded-3xl bg-lavender-subtle/70 p-space-xl overflow-hidden shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08)]">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-fixed rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-space-md">
              
              {/* Illustration Container with Status Pills */}
              <div className="w-full h-44 rounded-2xl overflow-hidden shadow-sm relative group bg-gradient-to-br from-[#EDE9FE] to-[#D1FAE5]">
                <img 
                  src="https://lh3.googleusercontent.com/aida/ALJJyrBNDxbzlLEXspXKrh52OFTGTX3-X0AV3jut7K4xsBvYnX4rw4RRXdDfD9ixmtlnNjbkNIqzZgWMTmnSRsCkQEDQ-zAx54pEJib1qWPEjnBdMOfD_gtDp-X5cK4fzzoE9CLPT6i1aUhdGPsxnKmAMDLO5UNoKowKHnskApyL1nTNWxAjFQG895pagG7SbwcnhPvkR3CVFw0xN0ypYeMs5HZ2_00yG-KwxJ79-NIH_DBb" 
                  alt="Cozy Sanctuary Illustration" 
                  onError={(e) => {
                    // Fallback to local character artwork
                    (e.currentTarget as HTMLImageElement).src = sreeshCharacterImg;
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                <button 
                  type="button"
                  onClick={() => {
                    playPopSound();
                    try {
                      confetti({ particleCount: 30, spread: 50, origin: { y: 0.3 } });
                    } catch {}
                  }}
                  className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Cheer up!"
                >
                  <span>☀️ Good morning!</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setIsStatusModalOpen(true);
                  }}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/90 backdrop-blur-md text-on-surface-variant font-label-sm text-label-sm shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Change focus vibe"
                >
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>{timeString} • {statusVibe.replace(/^[^s]+s*/, '')}</span>
                </button>
              </div>

              {/* Greeting row */}
              <div className="flex items-center gap-space-md pt-1">
                <div className="relative shrink-0">
                  <img 
                    src={avatarImg} 
                    alt="Sreeshnav" 
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-fixed shadow-[0_2px_8px_rgba(139,92,246,0.2)]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-sunshine-subtle border-2 border-surface-card rounded-full flex items-center justify-center text-[10px] shadow-sm">
                    ✨
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-primary font-bold tracking-wide uppercase">
                    {formattedDate}
                  </span>
                  <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface mt-0.5">
                    Good morning, <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">Sreeshnav! ✨</span>
                  </h1>
                </div>
              </div>

              {/* Tagline */}
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                Your personal sanctuary to stay inspired, peaceful, and productive today. 💜
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-space-sm pt-space-xs w-full sm:w-auto">
                <button 
                  onClick={() => {
                    playPopSound();
                    onNavigate('links');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_4px_16px_rgba(107,56,212,0.35)] hover:bg-primary-container active:scale-95 transition-all"
                  id="exploreBtn"
                >
                  <span>Let's Explore</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button 
                  onClick={() => {
                    playPopSound();
                    setShowVibeCard(!showVibeCard);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-card text-on-surface-variant font-label-lg text-label-lg shadow-sm hover:bg-surface-container active:scale-95 transition-all"
                  id="toggleTourBtn"
                >
                  <span>✨</span>
                  <span id="tourToggleText">{showVibeCard ? 'Hide Vibe' : 'Daily Vibe'}</span>
                </button>
              </div>

              {/* Expandable Vibe Detail */}
              {showVibeCard && (
                <div className="p-4 rounded-2xl bg-surface-card/90 border border-purple-200/60 shadow-xs flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span className="flex items-center gap-1">🌸 Today's Cozy Vibe</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint-subtle text-secondary font-semibold">Peaceful Pace</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Prioritize joy and gentleness today. One focused task completed with care brings more fulfillment than ten rushed ones. Take mindful pauses, hydrate, and celebrate each small achievement! 🍵
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: Feature Hub Overview Cards (Daily Hubs - 5 Categories) */}
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-primary font-headline-sm text-headline-sm">🌸</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Daily Hubs</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">5 Categories Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Links (Lavender) */}
            <div 
              onClick={() => {
                playPopSound();
                onNavigate('links');
              }}
              className="group relative overflow-hidden rounded-3xl bg-lavender-subtle p-space-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="relative z-10 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">menu_book</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Links</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
                      {links.length}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Access all your important links</span>
                </div>
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-sm group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              {/* Watermark chain */}
              <span className="absolute -bottom-3 -right-2 material-symbols-outlined text-[80px] text-primary/10 select-none pointer-events-none">
                link
              </span>
            </div>

            {/* 2. Habits & Tasks (Mint) */}
            <div 
              onClick={() => {
                playPopSound();
                onNavigate('notebook');
              }}
              className="group relative overflow-hidden rounded-3xl bg-mint-subtle p-space-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="relative z-10 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">task_alt</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Habits & Tasks</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">
                      {activeTasksCount}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Build good habits and get things done</span>
                </div>
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-sm group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              {/* Watermark leaf */}
              <span className="absolute -bottom-3 -right-2 material-symbols-outlined text-[80px] text-secondary/10 select-none pointer-events-none">
                potted_plant
              </span>
            </div>

            {/* 3. Reels & Media (Peach) */}
            <div 
              onClick={() => {
                playPopSound();
                onNavigate('reels');
              }}
              className="group relative overflow-hidden rounded-3xl bg-peach-subtle p-space-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="relative z-10 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-2xl bg-tertiary-container flex items-center justify-center text-on-tertiary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">movie</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Reels</span>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm">
                      {reels.length}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Watch & enjoy your favorite reels</span>
                </div>
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-sm group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              {/* Watermark clapperboard */}
              <span className="absolute -bottom-3 -right-2 material-symbols-outlined text-[80px] text-tertiary/10 select-none pointer-events-none">
                video_library
              </span>
            </div>

            {/* 4. Finances (Sky) */}
            <div 
              onClick={() => {
                playPopSound();
                onNavigate('finance');
              }}
              className="group relative overflow-hidden rounded-3xl bg-sky-subtle p-space-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="relative z-10 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-2xl bg-sky-accent flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Finances</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-subtle text-sky-accent font-label-sm text-label-sm">
                      {transactions.length}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Track your money and plan better</span>
                </div>
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-sm group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              {/* Watermark vault */}
              <span className="absolute -bottom-3 -right-2 material-symbols-outlined text-[80px] text-sky-accent/10 select-none pointer-events-none">
                account_balance
              </span>
            </div>

            {/* 5. Notes & Sketch (Grape / Lilac) */}
            <div 
              onClick={() => {
                playPopSound();
                onNavigate('notes');
              }}
              className="group relative overflow-hidden rounded-3xl bg-surface-container-high/60 p-space-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
            >
              <div className="relative z-10 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">palette</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface">Notes & Sketch</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                      {totalNotesCount}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Write, sketch and capture your thoughts</span>
                </div>
              </div>
              <div className="relative z-10 w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-on-surface shadow-sm group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              {/* Watermark palette */}
              <span className="absolute -bottom-3 -right-2 material-symbols-outlined text-[80px] text-primary-container/10 select-none pointer-events-none">
                brush
              </span>
            </div>
            </div>
          </section>

          {/* SECTION 3: Quick Access Grid */}
          <section className="flex flex-col rounded-3xl bg-surface-card p-space-xl shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08)] space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sunshine-accent text-[20px]">⭐</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Quick Access</h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    playPopSound();
                    setIsEditQuickLinksOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm hover:underline cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span>Edit Links</span>
                </button>
                <button 
                  onClick={() => {
                    playPopSound();
                    onNavigate('links');
                  }}
                  className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm hover:underline cursor-pointer"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
            
            {/* Dynamic Grid of Cute Rounded App Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-space-sm pt-space-xs">
              {quickAccessLinks.map((item) => (
                <a
                  key={item.id}
                  className={`flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl ${item.bgClass || 'bg-sky-subtle/50'} hover:opacity-90 active:scale-95 transition-all text-center group`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${item.title} (${item.url})`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm ${item.colorClass || 'text-primary'}`}>
                    <span className="material-symbols-outlined text-[24px]">{item.icon || 'language'}</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface truncate w-full font-semibold">
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* SECTION 4: Daily Gentle Note */}
          <section className="relative flex flex-col rounded-3xl bg-gradient-to-r from-surface-card to-lavender-subtle/40 p-space-xl shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08)] border border-border-subtle overflow-hidden space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach-subtle/80 text-on-tertiary-fixed-variant font-label-sm text-label-sm shadow-sm">
                <span>🌸</span>
                <span>Daily Gentle Note ✨</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Refreshed at 8:00 AM</span>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="flex items-start gap-space-xs">
                <span className="text-primary text-[32px] font-headline-md leading-none select-none shrink-0">“</span>
                <p className="font-headline-sm text-[17px] leading-relaxed text-on-surface italic tracking-normal" id="quoteText">
                  {QUOTES[quoteIndex]}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-space-xs border-t border-border-subtle">
              <div className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                <span>—</span>
                <span className="font-bold text-primary">Cozy Reminder</span>
                <span>♡</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    playPopSound();
                    setFavoriteQuote(!favoriteQuote);
                  }}
                  className={`w-10 h-10 rounded-full bg-surface-card flex items-center justify-center hover:bg-peach-subtle hover:text-tertiary active:scale-95 transition-all shadow-sm ${
                    favoriteQuote ? 'text-tertiary bg-peach-subtle/60' : 'text-on-surface-variant'
                  }`} 
                  title={favoriteQuote ? 'Saved to Favorites' : 'Save to Favorites'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {favoriteQuote ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
                <button 
                  onClick={handleNextQuote}
                  className="w-10 h-10 rounded-full bg-lavender-subtle text-primary flex items-center justify-center hover:bg-lavender-subtle/80 active:rotate-180 transition-transform shadow-sm" 
                  id="refreshQuoteBtn" 
                  title="New Note"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
              </div>
            </div>
          </section>

          {/* Quick Shortcuts Pill Bar */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                playPopSound();
                onToggleDarkMode();
              }}
              className="px-3.5 py-1.5 rounded-full bg-surface-card text-on-surface-variant text-xs font-medium hover:bg-lavender-subtle hover:text-primary transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            {onOpenHistoryTimeline && (
              <button
                onClick={() => {
                  playPopSound();
                  onOpenHistoryTimeline();
                }}
                className="px-3.5 py-1.5 rounded-full bg-surface-card text-on-surface-variant text-xs font-medium hover:bg-lavender-subtle hover:text-primary transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>Timeline</span>
              </button>
            )}
            {onOpenDesignGuide && (
              <button
                onClick={() => {
                  playPopSound();
                  onOpenDesignGuide();
                }}
                className="px-3.5 py-1.5 rounded-full bg-surface-card text-on-surface-variant text-xs font-medium hover:bg-lavender-subtle hover:text-primary transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">palette</span>
                <span>Design Guide</span>
              </button>
            )}
          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. MODALS (NOTIFICATIONS, ABOUT, CONTACT)                */}
      {/* ======================================================== */}
      {/* Notifications Modal */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold">Sanctuary Updates</h3>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-lavender-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">✨ Daily Streak Active</span>
                  <span className="text-[10px] text-on-surface-variant">Today</span>
                </div>
                <p className="text-xs text-on-surface-variant">You're making steady daily progress across habits and tasks!</p>
              </div>
              <div className="p-3 rounded-2xl bg-mint-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-secondary">🌱 Vault Ready</span>
                  <span className="text-[10px] text-on-surface-variant">All tabs synced</span>
                </div>
                <p className="text-xs text-on-surface-variant">Links, Habits, Finances, Reels and Notes are synced safely.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all"
            >
              All Caught Up!
            </button>
          </div>
        </div>
      )}

      {/* Edit Quick Access Links Modal */}
      {isEditQuickLinksOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface font-fraunces">Edit Quick Links</h3>
              </div>
              <button 
                onClick={() => {
                  setIsEditQuickLinksOpen(false);
                  setIsAddingQuickLink(false);
                  setEditingQuickLink(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">Customize, add, or remove your favorite quick launcher bookmarks.</p>

            {/* List of active links */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {quickAccessLinks.map((ql) => (
                <div key={ql.id} className="p-2.5 rounded-2xl bg-surface-container border border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center text-primary shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">{ql.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-on-surface truncate block">{ql.title}</span>
                      <span className="text-[10px] text-on-surface-variant truncate block">{ql.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuickLink(ql);
                        setNewLinkTitle(ql.title);
                        setNewLinkUrl(ql.url);
                        setNewLinkIcon(ql.icon || 'language');
                        setIsAddingQuickLink(true);
                      }}
                      className="p-1 text-on-surface-variant hover:text-primary rounded-lg text-xs font-bold"
                      title="Edit link"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuickLink(ql.id)}
                      className="p-1 text-on-surface-variant hover:text-tertiary rounded-lg text-xs font-bold"
                      title="Delete link"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Form */}
            {isAddingQuickLink || editingQuickLink ? (
              <div className="p-3 rounded-2xl bg-lavender-subtle/50 border border-primary/30 space-y-2 animate-fadeIn text-xs">
                <h4 className="font-bold text-primary">
                  {editingQuickLink ? 'Edit Quick Link' : 'Add New Quick Link'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Title (e.g. Notion)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="col-span-2 px-3 py-1.5 rounded-xl border border-border-subtle bg-white"
                    autoFocus
                  />
                  <select
                    value={newLinkIcon}
                    onChange={(e) => setNewLinkIcon(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-border-subtle bg-white font-medium"
                  >
                    <option value="language">🌐 Web</option>
                    <option value="play_arrow">▶ Play</option>
                    <option value="pets">🐾 Code</option>
                    <option value="photo_camera">📷 Camera</option>
                    <option value="work">💼 Work</option>
                    <option value="smart_toy">🤖 AI</option>
                    <option value="bolt">⚡ Fast</option>
                    <option value="star">⭐ Star</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="URL (e.g. notion.so or https://notion.so)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-border-subtle bg-white"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveQuickLink}
                    className="flex-1 py-1.5 rounded-xl bg-primary text-white font-bold cursor-pointer shadow-xs"
                  >
                    {editingQuickLink ? 'Save Changes' : 'Add Link ✨'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingQuickLink(false);
                      setEditingQuickLink(null);
                      setNewLinkTitle('');
                      setNewLinkUrl('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-on-surface-variant cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingQuickLink(null);
                  setNewLinkTitle('');
                  setNewLinkUrl('');
                  setNewLinkIcon('language');
                  setIsAddingQuickLink(true);
                }}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold text-xs hover:bg-lavender-subtle/50 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Add Quick Link</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsEditQuickLinksOpen(false);
                setIsAddingQuickLink(false);
                setEditingQuickLink(null);
              }}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary-container cursor-pointer"
            >
              Done ✨
            </button>
          </div>
        </div>
      )}

      {/* Daily Vibe & Status Picker Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌸</span>
                <h3 className="font-headline-sm text-base font-bold text-on-surface font-fraunces">Daily Vibe &amp; Focus</h3>
              </div>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">Set your mood and intention for your sanctuary today.</p>
            <div className="space-y-2">
              {[
                { label: '✨ Feeling Creative', desc: 'Inspired to build and design' },
                { label: '🍵 Cozy Focus', desc: 'Calm deep work with gentle breaks' },
                { label: '🌿 Peaceful Pace', desc: 'Unhurried and mindful flow' },
                { label: '🔥 Goal Crusher', desc: 'Knocking down priority tasks' },
                { label: '🌸 Rest & Recharge', desc: 'Gentle reading and relaxing' },
              ].map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setStatusVibe(v.label);
                    setIsStatusModalOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    statusVibe === v.label
                      ? 'bg-lavender-subtle border-primary text-primary font-bold shadow-xs'
                      : 'bg-surface-container border-border-subtle text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div>
                    <span className="text-xs block font-semibold">{v.label}</span>
                    <span className="text-[10px] text-on-surface-variant block mt-0.5">{v.desc}</span>
                  </div>
                  {statusVibe === v.label && (
                    <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl border border-border-subtle flex flex-col gap-4 text-center items-center">
            <div className="relative">
              <img 
                src={avatarImg} 
                alt="Sreeshnav" 
                className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-fixed shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-sunshine-subtle rounded-full flex items-center justify-center text-[11px] shadow-sm">
                ✨
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Orbit</h3>
              <p className="text-xs text-primary font-medium">Personal Sanctuary & Creative Hub</p>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Designed with love and gentle whimsy to keep your links, daily habits, reels, finances, and notes beautifully organized in one serene place.
            </p>
            <div className="flex items-center gap-2 w-full pt-1">
              <button 
                onClick={() => {
                  setIsAboutModalOpen(false);
                  setIsContactModalOpen(true);
                }}
                className="flex-1 py-2 rounded-full bg-lavender-subtle text-primary font-bold text-xs hover:bg-lavender-subtle/80"
              >
                Say Hello
              </button>
              <button 
                onClick={() => setIsAboutModalOpen(false)}
                className="flex-1 py-2 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl border border-border-subtle flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 rounded-full bg-peach-subtle flex items-center justify-center text-xl text-tertiary">
              💌
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Stay Connected</h3>
              <p className="text-xs text-on-surface-variant">Reach out or check out more projects</p>
            </div>
            <div className="flex flex-col gap-2 w-full text-xs">
              <a 
                href="https://github.com/Sreeshnavp" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
              >
                <span className="font-medium">GitHub</span>
                <span className="text-primary font-bold">@Sreeshnavp ↗</span>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
              >
                <span className="font-medium">LinkedIn</span>
                <span className="text-primary font-bold">Sreeshnav ↗</span>
              </a>
            </div>
            <button 
              onClick={() => setIsContactModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
