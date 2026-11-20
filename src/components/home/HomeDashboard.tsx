import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  Calendar, 
  Compass, 
  BookOpen, 
  Film, 
  Wallet, 
  Palette, 
  Moon, 
  Sun, 
  BarChart3, 
  User, 
  Mail, 
  X, 
  Copy, 
  Check
} from 'lucide-react';
import { WorkspaceView, LinkItem, TodoItem, ReelItem, FinanceTransaction, NoteItem, SketchItem } from '../../types';
import { playPopSound, triggerPartyPop } from '../../utils/delight';
import sreeshCharacterImg from '../../assets/sreesh_character.png';
import quoteBgImg from '../../assets/quote_bg.png';
import './home.css';

// Crisp inline SVGs for social media
const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

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
}

const INSPIRATIONAL_QUOTES = [
  { text: "Small steps today, big dreams tomorrow.", author: "Daily Wisdom" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "A calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
  { text: "Create space for what truly matters to you.", author: "Cozy Space" }
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
}) => {
  // Feature Slides State
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [showSlidesSection, setShowSlidesSection] = useState<boolean>(true);
  
  // Modals
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Active counts
  const activeTasksCount = useMemo(() => {
    return todos.filter(t => !t.completed && t.status !== 'archived').length;
  }, [todos]);

  // Slides Data
  const slidesData = [
    {
      id: 'links',
      targetView: 'links' as WorkspaceView,
      title: 'LinkVault & Bookmarks',
      badge: 'Visual Folders',
      desc: 'Keep your digital web organized. Clean 2x2 folder previews, quick-capture URL bar, custom pastel folders, and fluid drag-and-drop link filing.',
      bullets: [
        'Quick capsule capture bar with automatic favicon detection',
        'Visual 2x2 folder grid preview cards',
        'Tag filtering and instant keyword search',
        'Star favorite links for one-tap access'
      ],
      previewColor: 'from-purple-500/10 to-indigo-500/10',
      actionText: 'Explore Links Vault',
      icon: '🔗'
    },
    {
      id: 'habits',
      targetView: 'notebook' as WorkspaceView,
      title: 'Habits & Routine Tracker',
      badge: 'Consistency & Focus',
      desc: 'Form lifelong positive habits with intelligent streaks, daily reflections, morning & evening routines, and GitHub-style activity heatmaps.',
      bullets: [
        'Interactive streak counter and consistency heatmap',
        'Priority task management with high/medium/low tags',
        'Morning & evening daily reflection journals',
        'Fixed daily tasks that reset gracefully every morning'
      ],
      previewColor: 'from-emerald-500/10 to-teal-500/10',
      actionText: 'Open Habits & Tasks',
      icon: '✅'
    },
    {
      id: 'reels',
      targetView: 'reels' as WorkspaceView,
      title: 'Reels Vault & Video Studio',
      badge: 'Distraction-Free',
      desc: 'Curate your favorite educational reels and shorts without infinite doomscrolling. Watch inside a clean theater or organize by folders.',
      bullets: [
        'Clean card layout with video thumbnail previews',
        'Instagram & YouTube shorts inline player',
        'Custom thematic folders and creator tagging',
        'One-tap quick reel saver from URL'
      ],
      previewColor: 'from-rose-500/10 to-orange-500/10',
      actionText: 'Open Reels Vault',
      icon: '▶'
    },
    {
      id: 'finance',
      targetView: 'finance' as WorkspaceView,
      title: 'Personal Finance Hub',
      badge: 'Smart Insights',
      desc: 'Take command of your financial wellness. Enjoy tactile Numpad transaction entry, real-time balance calculations, and automatic spending insights.',
      bullets: [
        'Tactile mobile-friendly Numpad expense & income logger',
        'Automatic category spending breakdown & charts',
        'Monthly forecast and top-spend warnings',
        'Offline-first and encrypted local storage'
      ],
      previewColor: 'from-blue-500/10 to-sky-500/10',
      actionText: 'Open Finance Hub',
      icon: '👛'
    },
    {
      id: 'notes',
      targetView: 'notes' as WorkspaceView,
      title: 'Notes & Creative Sketchpad',
      badge: 'Pastel Studio',
      desc: 'Jot down fast ideas, checklists, and memories, or switch to the creative drawing canvas to doodle thoughts and sketches freehand.',
      bullets: [
        'Pastel note cards with custom tag colors',
        'Markdown and interactive checklist support',
        'Freehand HTML5 drawing canvas with multi-brush colors',
        'Pin critical notes to the top of your studio'
      ],
      previewColor: 'from-violet-500/10 to-pink-500/10',
      actionText: 'Open Notes & Sketch',
      icon: '📝'
    }
  ];

  // Quick Access Launchpad Links
  const quickAccessItems = [
    { name: 'Google', icon: '🌐', url: 'https://www.google.com', color: '#4285F4' },
    { name: 'YouTube', icon: '▶', url: 'https://www.youtube.com', color: '#FF0000' },
    { name: 'GitHub', icon: '🐱', url: 'https://github.com', color: '#24292e' },
    { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com', color: '#E1306C' },
    { name: 'LinkedIn', icon: '💼', url: 'https://www.linkedin.com', color: '#0077B5' },
    { name: 'ChatGPT', icon: '🤖', url: 'https://chatgpt.com', color: '#10A37F' },
  ];

  // Dynamic Recent Activity
  const recentActivities = useMemo(() => {
    const list: Array<{ id: string; icon: string; title: string; time: string; bg: string }> = [];

    // Most recent links
    if (links.length > 0) {
      list.push({
        id: 'act-link-1',
        icon: '🔗',
        title: `Saved "${links[0].title.slice(0, 22)}${links[0].title.length > 22 ? '...' : ''}"`,
        time: 'Recent',
        bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      });
    }

    // Most recent tasks
    const completedTask = todos.find(t => t.completed);
    if (completedTask) {
      list.push({
        id: 'act-todo-1',
        icon: '✅',
        title: `Completed "${completedTask.text.slice(0, 22)}${completedTask.text.length > 22 ? '...' : ''}"`,
        time: 'Today',
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      });
    } else if (todos.length > 0) {
      list.push({
        id: 'act-todo-2',
        icon: '📝',
        title: `Active habit: "${todos[0].text.slice(0, 22)}"`,
        time: 'Ongoing',
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      });
    }

    // Recent Reels
    if (reels.length > 0) {
      const reelTitle = reels[0].headline || reels[0].caption || 'Saved Reel';
      list.push({
        id: 'act-reel-1',
        icon: '▶',
        title: `Added reel "${reelTitle.slice(0, 22)}"`,
        time: '1d ago',
        bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
      });
    }

    // Recent Notes or Finance
    if (transactions.length > 0) {
      list.push({
        id: 'act-tx-1',
        icon: '👛',
        title: `Logged expense in ${transactions[0].category}`,
        time: 'Recent',
        bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      });
    } else if (notes.length > 0) {
      list.push({
        id: 'act-note-1',
        icon: '🎨',
        title: `Created note "${notes[0].title.slice(0, 22)}"`,
        time: 'Recent',
        bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
      });
    }

    // Fallbacks if user is brand new
    if (list.length === 0) {
      return [
        { id: 'f1', icon: '🔗', title: 'Added a new link', time: '2h ago', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' },
        { id: 'f2', icon: '✅', title: 'Completed a daily habit', time: '1d ago', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' },
        { id: 'f3', icon: '▶', title: 'Watched a saved reel', time: '2d ago', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40' },
        { id: 'f4', icon: '👛', title: 'Logged daily budget', time: '3d ago', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' },
      ];
    }

    return list.slice(0, 4);
  }, [links, todos, reels, transactions, notes]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('sreeshnav@sreeshspace.dev');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
    playPopSound();
  };

  return (
    <div className="sreesh-home-wrap">
      <div className="sreesh-home-container">

        {/* ========================================================================== */}
        {/* TOP NAVBAR                                                                */}
        {/* ========================================================================== */}
        <header className="sreesh-top-nav">
          {/* Logo & Brand */}
          <div 
            className="sreesh-logo" 
            onClick={() => {
              triggerPartyPop('stars');
              playPopSound();
            }}
            title="Click for celebratory sparkles ✨"
          >
            <div className="sreesh-logo-icon">S</div>
            <div className="sreesh-logo-text">
              Sreesh<span>Space</span>
            </div>
          </div>

          {/* Center Navigation Pills */}
          <nav className="sreesh-nav-pills" role="tablist">
            <button
              type="button"
              className="sreesh-nav-pill-btn active"
              onClick={() => playPopSound()}
            >
              <Compass size={14} />
              <span>Home</span>
            </button>
            <button
              type="button"
              className="sreesh-nav-pill-btn"
              onClick={() => {
                setIsAboutModalOpen(true);
                playPopSound();
              }}
            >
              <User size={14} />
              <span>About</span>
            </button>
            <button
              type="button"
              className="sreesh-nav-pill-btn"
              onClick={() => {
                setIsContactModalOpen(true);
                playPopSound();
              }}
            >
              <Mail size={14} />
              <span>Contact</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="sreesh-nav-actions">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="sreesh-circle-btn"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {onOpenHistoryTimeline && (
              <button
                type="button"
                onClick={onOpenHistoryTimeline}
                className="sreesh-circle-btn"
                title="View Activity Stats & Timeline"
                aria-label="View Stats"
              >
                <BarChart3 size={17} />
              </button>
            )}
          </div>
        </header>

        {/* ========================================================================== */}
        {/* HERO BANNER                                                               */}
        {/* ========================================================================== */}
        <section className="sreesh-hero-card">
          <div className="hero-left">
            <div className="welcome-chip">
              <Sparkles size={13} />
              <span>Welcome back!</span>
            </div>
            
            <h1 className="hero-heading">
              Hey, I'm <span className="name-accent">Sreesh!</span>
            </h1>

            <p className="hero-sub">
              Your personal space to stay productive, organized and inspired. 💜
            </p>

            <div className="hero-actions-row">
              <button
                type="button"
                className="btn-explore"
                onClick={() => {
                  onNavigate('links');
                  playPopSound();
                }}
              >
                <span>Let's Explore</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn-slides-toggle"
                onClick={() => {
                  setShowSlidesSection(prev => !prev);
                  playPopSound();
                }}
              >
                <Layers size={15} />
                <span>{showSlidesSection ? 'Hide Tour' : 'Show Tour'}</span>
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-motto-tag">
              <span>Dream · Learn · Grow ♡</span>
            </div>
            <img 
              src={sreeshCharacterImg} 
              alt="Sreesh working at desk with sleeping cat" 
              className="hero-character-img"
            />
          </div>
        </section>

        {/* ========================================================================== */}
        {/* 5 FEATURE CARDS (DIRECT NAVIGATION & LIVE COUNTS)                          */}
        {/* ========================================================================== */}
        <section className="sreesh-features-grid">
          {/* 1. Links */}
          <div 
            className="feature-card card-links"
            onClick={() => {
              onNavigate('links');
              playPopSound();
            }}
          >
            <div className="card-top-row">
              <div className="card-icon-squircle">
                <BookOpen size={20} />
              </div>
              <div className="card-arrow-circle">
                <ArrowRight size={13} />
              </div>
            </div>
            <h3 className="card-title">Links ({links.length})</h3>
            <p className="card-desc">Access all your important links.</p>
            <div className="card-watermark">🔗</div>
          </div>

          {/* 2. Habits & Tasks */}
          <div 
            className="feature-card card-habits"
            onClick={() => {
              onNavigate('notebook');
              playPopSound();
            }}
          >
            <div className="card-top-row">
              <div className="card-icon-squircle">
                <CheckCircle2 size={20} />
              </div>
              <div className="card-arrow-circle">
                <ArrowRight size={13} />
              </div>
            </div>
            <h3 className="card-title">Habits &amp; Tasks ({activeTasksCount})</h3>
            <p className="card-desc">Build good habits and get things done.</p>
            <div className="card-watermark">🌿</div>
          </div>

          {/* 3. Reels */}
          <div 
            className="feature-card card-reels"
            onClick={() => {
              onNavigate('reels');
              playPopSound();
            }}
          >
            <div className="card-top-row">
              <div className="card-icon-squircle">
                <Film size={20} />
              </div>
              <div className="card-arrow-circle">
                <ArrowRight size={13} />
              </div>
            </div>
            <h3 className="card-title">Reels ({reels.length})</h3>
            <p className="card-desc">Watch &amp; enjoy your favorite reels.</p>
            <div className="card-watermark">🎬</div>
          </div>

          {/* 4. Finances */}
          <div 
            className="feature-card card-finance"
            onClick={() => {
              onNavigate('finance');
              playPopSound();
            }}
          >
            <div className="card-top-row">
              <div className="card-icon-squircle">
                <Wallet size={20} />
              </div>
              <div className="card-arrow-circle">
                <ArrowRight size={13} />
              </div>
            </div>
            <h3 className="card-title">Finances ({transactions.length})</h3>
            <p className="card-desc">Track your money and plan better.</p>
            <div className="card-watermark">🪙</div>
          </div>

          {/* 5. Notes & Sketch */}
          <div 
            className="feature-card card-notes"
            onClick={() => {
              onNavigate('notes');
              playPopSound();
            }}
          >
            <div className="card-top-row">
              <div className="card-icon-squircle">
                <Palette size={20} />
              </div>
              <div className="card-arrow-circle">
                <ArrowRight size={13} />
              </div>
            </div>
            <h3 className="card-title">Notes &amp; Sketch ({notes.length + sketches.length})</h3>
            <p className="card-desc">Write, sketch and capture your thoughts.</p>
            <div className="card-watermark">🎨</div>
          </div>
        </section>

        {/* ========================================================================== */}
        {/* INTERACTIVE FEATURE SHOWCASE / SLIDES                                      */}
        {/* ========================================================================== */}
        {showSlidesSection && (
          <section className="sreesh-slides-section">
            <div className="slides-header-row">
              <div className="slides-heading-group">
                <Sparkles size={18} className="text-purple-600" />
                <h2>Feature Tour &amp; Capabilities</h2>
              </div>

              <div className="slides-tabs-pills">
                {slidesData.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`slide-tab-pill ${activeSlide === idx ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSlide(idx);
                      playPopSound();
                    }}
                  >
                    <span>{s.icon} {s.title.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="slides-body-grid">
              <div className="slide-info-col">
                <div className="welcome-chip" style={{ marginBottom: '8px' }}>
                  <span>{slidesData[activeSlide].badge}</span>
                </div>
                <h3>{slidesData[activeSlide].title}</h3>
                <p>{slidesData[activeSlide].desc}</p>

                <ul className="slide-features-list">
                  {slidesData[activeSlide].bullets.map((b, i) => (
                    <li key={i}>
                      <span className="bullet-icon">✦</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="btn-slide-action"
                  onClick={() => {
                    onNavigate(slidesData[activeSlide].targetView);
                    playPopSound();
                  }}
                >
                  <span>{slidesData[activeSlide].actionText}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="slide-preview-box">
                <div className={`absolute inset-0 bg-gradient-to-br ${slidesData[activeSlide].previewColor} opacity-70`} />
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-5xl mb-3">{slidesData[activeSlide].icon}</span>
                  <h4 className="font-head font-bold text-lg text-main mb-1">
                    {slidesData[activeSlide].title}
                  </h4>
                  <p className="text-xs text-muted max-w-xs mb-4">
                    Ready to use right now with your existing data.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(slidesData[activeSlide].targetView);
                      playPopSound();
                    }}
                    className="px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition"
                  >
                    Open View Now →
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================== */}
        {/* LOWER DASHBOARD: QUICK ACCESS, MOTIVATIONAL QUOTE, RECENT ACTIVITY         */}
        {/* ========================================================================== */}
        <section className="sreesh-widgets-grid">
          {/* Widget 1: Quick Access */}
          <div className="widget-card">
            <div className="widget-header-row">
              <h3 className="widget-title">
                <span>⭐</span>
                <span>Quick Access</span>
              </h3>
              <button
                type="button"
                className="widget-view-all"
                onClick={() => {
                  onNavigate('links');
                  playPopSound();
                }}
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="quick-access-grid">
              {quickAccessItems.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quick-access-item"
                  title={`Open ${item.name}`}
                  onClick={() => playPopSound()}
                >
                  <span className="quick-access-icon">{item.icon}</span>
                  <span className="quick-access-label">{item.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Widget 2: Motivational Quote Card */}
          <div className="widget-card quote-card-widget">
            <button
              type="button"
              className="btn-refresh-quote"
              onClick={handleNextQuote}
              title="Next Inspiring Quote"
              aria-label="Refresh Quote"
            >
              <RefreshCw size={14} />
            </button>

            <div className="quote-decor-mark">“</div>
            <p className="quote-text-main">
              {INSPIRATIONAL_QUOTES[quoteIndex].text}
            </p>
            <div className="quote-author">
              <span>{INSPIRATIONAL_QUOTES[quoteIndex].author}</span>
              <span>♡</span>
            </div>

            <img 
              src={quoteBgImg} 
              alt="Mountain silhouette scenery" 
              className="quote-bg-img"
            />
          </div>

          {/* Widget 3: Recent Activity */}
          <div className="widget-card">
            <div className="widget-header-row">
              <h3 className="widget-title">
                <span>🕒</span>
                <span>Recent Activity</span>
              </h3>
              {onOpenHistoryTimeline && (
                <button
                  type="button"
                  className="widget-view-all"
                  onClick={() => {
                    onOpenHistoryTimeline();
                    playPopSound();
                  }}
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            <div className="activity-list">
              {recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-item-left">
                    <div className={`activity-icon-squircle ${act.bg}`}>
                      <span>{act.icon}</span>
                    </div>
                    <span className="activity-title" title={act.title}>
                      {act.title}
                    </span>
                  </div>
                  <span className="activity-time">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================== */}
        {/* FOOTER                                                                     */}
        {/* ========================================================================== */}
        <footer className="sreesh-footer">
          <div className="footer-left">
            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
              S
            </div>
            <span className="footer-brand">SreeshSpace</span>
            <span className="footer-sub">· Your Personal Space</span>
          </div>

          <div className="footer-social-links">
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-icon-link" 
              title="YouTube"
            >
              <YoutubeIcon />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-icon-link" 
              title="GitHub"
            >
              <GithubIcon />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-icon-link" 
              title="Instagram"
            >
              <InstagramIcon />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-icon-link" 
              title="LinkedIn"
            >
              <LinkedinIcon />
            </a>
            <button
              type="button"
              className="footer-stay-connected-pill"
              onClick={() => setIsContactModalOpen(true)}
            >
              Stay Connected ♡
            </button>
          </div>
        </footer>

      </div>

      {/* ========================================================================== */}
      {/* ABOUT MODAL                                                                */}
      {/* ========================================================================== */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xl shadow-md">
                S
              </div>
              <div>
                <h3 className="font-head font-extrabold text-xl text-gray-900 dark:text-white">
                  About SreeshSpace
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Personal Productivity &amp; Cozy Digital Oasis v2.4
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <p>
                SreeshSpace is your all-in-one serene personal operating space created by <b>Sreeshnav</b>. It brings together bookmarks, habit consistency, reels, financial peace of mind, and notes into one tidy corner of the internet.
              </p>
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1.5">
                <div className="font-bold text-purple-800 dark:text-purple-300">🌟 Key Highlights</div>
                <div>✦ 100% Offline-capable Progressive Web App (PWA)</div>
                <div>✦ Encrypted local storage with PIN lock screen protection</div>
                <div>✦ High-speed tactile Numpad and responsive mobile gestures</div>
                <div>✦ No ads, no tracking, pure focus and peaceful productivity</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition"
            >
              Close &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* CONTACT MODAL                                                              */}
      {/* ========================================================================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>

            <h3 className="font-head font-extrabold text-xl text-gray-900 dark:text-white mb-1">
              Stay Connected ♡
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Reach out directly to Sreeshnav for suggestions, collaborations, or feedback.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-purple-600" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    sreeshnav@sreeshspace.dev
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 text-xs rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1 hover:bg-purple-200 transition"
                >
                  {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://github.com/Sreeshnavp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                >
                  <GithubIcon />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                >
                  <LinkedinIcon />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
