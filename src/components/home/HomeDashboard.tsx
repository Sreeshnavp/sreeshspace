import React, { useState, useMemo } from 'react';
import { WorkspaceView, LinkItem, TodoItem, ReelItem, FinanceTransaction, NoteItem, SketchItem } from '../../types';
import { playPopSound } from '../../utils/delight';
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
  const [showVibeCard, setShowVibeCard] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
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
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-border-subtle">
        <div className="h-20 px-space-lg flex items-center justify-between gap-space-sm max-w-lg mx-auto w-full">
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
                  Sreeshnav's Space
                </span>
              </div>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-peach-subtle/80 text-on-tertiary-fixed-variant font-label-sm text-label-sm shadow-[0_1px_4px_rgba(220,44,79,0.08)]">
                  <span>✨ Feeling Creative</span>
                </div>
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
        <div className="flex flex-col w-full max-w-lg mx-auto px-margin-mobile space-y-space-xl">
          
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
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm shadow-sm">
                  <span>☀️ Good morning!</span>
                </div>
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/90 backdrop-blur-md text-on-surface-variant font-label-sm text-label-sm shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>{timeString} • Cozy Focus</span>
                </div>
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
          </section>

          {/* SECTION 3: Quick Access Grid */}
          <section className="flex flex-col rounded-3xl bg-surface-card p-space-xl shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08)] space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sunshine-accent text-[20px]">⭐</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Quick Access</h2>
              </div>
              <button 
                onClick={() => {
                  playPopSound();
                  onNavigate('links');
                }}
                className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm hover:underline cursor-pointer"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
            
            {/* 3x2 Grid of Cute Rounded App Tiles */}
            <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
              {/* Google */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-sky-subtle/50 hover:bg-sky-subtle active:scale-95 transition-all text-center" 
                href="https://google.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-sky-accent">
                  <span className="material-symbols-outlined text-[24px]">language</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">Google</span>
              </a>

              {/* YouTube */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-peach-subtle/50 hover:bg-peach-subtle active:scale-95 transition-all text-center" 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-tertiary">
                  <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">YouTube</span>
              </a>

              {/* GitHub */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-sunshine-subtle/50 hover:bg-sunshine-subtle active:scale-95 transition-all text-center" 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-sunshine-accent">
                  <span className="material-symbols-outlined text-[24px]">pets</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">GitHub</span>
              </a>

              {/* Instagram */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-peach-subtle/40 hover:bg-peach-subtle active:scale-95 transition-all text-center" 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-tertiary-container">
                  <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">Instagram</span>
              </a>

              {/* LinkedIn */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-lavender-subtle/50 hover:bg-lavender-subtle active:scale-95 transition-all text-center" 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-primary">
                  <span className="material-symbols-outlined text-[24px]">work</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">LinkedIn</span>
              </a>

              {/* ChatGPT */}
              <a 
                className="flex flex-col items-center justify-center gap-2 p-space-md rounded-2xl bg-mint-subtle/50 hover:bg-mint-subtle active:scale-95 transition-all text-center" 
                href="https://chatgpt.com" 
                target="_blank" 
                rel="noreferrer"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface-card flex items-center justify-center shadow-sm text-secondary">
                  <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate w-full">ChatGPT</span>
              </a>
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
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Sreeshnav's Space</h3>
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
