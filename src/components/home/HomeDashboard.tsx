import React, { useState, useMemo } from 'react';
import { WorkspaceView, LinkItem, TodoItem, ReelItem, FinanceTransaction, NoteItem, SketchItem } from '../../types';
import { playPopSound } from '../../utils/delight';
import avatarImg from '../../assets/avatar.jpg';
import sreeshCharacterImg from '../../assets/sreesh_character.png';
import quoteBgImg from '../../assets/quote_bg.png';

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
  'Small steps today, big dreams tomorrow. ♡',
  'Create space for what truly nourishes your heart. ✨',
  'Focus on the step in front of you, not the mountain. 🌿',
  'Warm tea, quiet moments, and happy progress. 🍵',
  'Organized spaces bring peaceful creative minds. 💜'
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Active counts
  const activeTasksCount = useMemo(() => {
    return todos.filter(t => !t.completed && t.status !== 'archived').length;
  }, [todos]);

  const totalNotesCount = notes.length + sketches.length;

  return (
    <div className="bg-[#FAF8F4] font-['Plus_Jakarta_Sans',sans-serif] text-[#1F2A24] antialiased min-h-screen flex flex-col selection:bg-purple-200">
      
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR (EXACT MATCH TO DESIGN IMAGE)               */}
      {/* ======================================================== */}
      <header className="sticky top-0 w-full z-40 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-stone-200/60 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Purple Ribbon 'S' Logo + SreeshSpace Brand */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            {/* S-Ribbon Gradient Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <span className="font-['Fraunces',serif] font-bold">S</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-['Fraunces',serif] font-bold text-xl text-[#1F2A24] tracking-tight group-hover:text-[#7C3AED] transition-colors">
                SreeshSpace
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] border border-purple-200 hidden sm:inline-block">
                Sreeshnav
              </span>
            </div>
          </div>

          {/* Center: Desktop Nav Pills [Home] [About] [Contact] */}
          <nav className="hidden sm:flex items-center p-1 rounded-full bg-white border border-stone-200/80 shadow-xs gap-1">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#7C3AED] text-white shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                playPopSound();
                setIsAboutModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">person</span>
              <span>About</span>
            </button>
            <button
              onClick={() => {
                playPopSound();
                setIsContactModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">mail</span>
              <span>Contact</span>
            </button>
          </nav>

          {/* Right: Actions (Dark Mode, Stats/Analytics, Lock) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playPopSound();
                onToggleDarkMode();
              }}
              className="w-9 h-9 rounded-full bg-white border border-stone-200/70 shadow-xs flex items-center justify-center text-stone-600 hover:text-[#7C3AED] hover:bg-purple-50 transition-all active:scale-95"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button
              onClick={() => {
                playPopSound();
                if (onOpenHistoryTimeline) onOpenHistoryTimeline();
              }}
              className="w-9 h-9 rounded-full bg-white border border-stone-200/70 shadow-xs flex items-center justify-center text-stone-600 hover:text-[#7C3AED] hover:bg-purple-50 transition-all active:scale-95"
              title="Activity & Analytics"
            >
              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            </button>

            <button
              onClick={() => {
                playPopSound();
                if (onLock) onLock();
              }}
              className="w-9 h-9 rounded-full bg-white border border-stone-200/70 shadow-xs flex items-center justify-center text-stone-600 hover:text-[#7C3AED] hover:bg-purple-50 transition-all active:scale-95 hidden sm:flex"
              title="Lock Space"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </button>

            <button
              onClick={() => {
                playPopSound();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="w-9 h-9 rounded-full bg-white border border-stone-200/70 shadow-xs flex items-center justify-center text-stone-600 hover:text-[#7C3AED] hover:bg-purple-50 transition-all active:scale-95 relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {isNotificationOpen && (
        <div className="fixed top-18 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-80 bg-white rounded-2xl p-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <span>🌸</span>
              <span>Sanctuary Updates</span>
            </div>
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="py-2.5 space-y-2 text-xs text-stone-600">
            <div className="flex items-start gap-2 bg-purple-50 p-2.5 rounded-xl border border-purple-100/60">
              <span className="text-purple-600 font-bold">✨</span>
              <div>
                <p className="font-semibold text-stone-800">SreeshSpace v2.0 Active</p>
                <p className="text-[11px] text-stone-500">All spaces, bookmarks, habits & finances synced safely.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN DASHBOARD CONTENT                                */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-6">

        {/* -------------------------------------------------------- */}
        {/* HERO BANNER (Hey, I'm Sreesh! + Anime Sreesh & Cat)      */}
        {/* -------------------------------------------------------- */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#EDE9FE] via-[#F5F0FF] to-[#FAF5FF] border border-purple-100 shadow-[0_4px_24px_rgba(124,58,237,0.06)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-purple-200/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text Block */}
          <div className="relative z-10 flex flex-col items-start space-y-3.5 max-w-lg">
            
            {/* Pill: Welcome back! */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-200/60 shadow-xs">
              <span className="text-xs">✨</span>
              <span className="text-xs font-bold tracking-tight">Welcome back!</span>
            </div>

            {/* Giant Heading */}
            <h1 className="font-['Fraunces',serif] font-bold text-3xl sm:text-4xl lg:text-5xl text-[#1F2A24] leading-[1.15] tracking-tight">
              Hey, I'm <span className="text-[#7C3AED]">Sreesh!</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Your personal space to stay productive, organized and inspired. 💜
            </p>

            {/* CTA Pill Button */}
            <div className="pt-1">
              <button
                onClick={() => {
                  playPopSound();
                  onNavigate('links');
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-md shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Let's Explore</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Right Anime Character Illustration */}
          <div className="relative z-10 w-full md:w-auto flex flex-col items-center justify-center">
            <div className="relative max-w-[340px] sm:max-w-[400px]">
              <img
                src={sreeshCharacterImg}
                alt="Sreesh with Laptop and Cat"
                className="w-full h-auto object-contain drop-shadow-md select-none pointer-events-none"
              />
              {/* Handwritten Floating script: Dream · Learn · Grow ♡ */}
              <div className="absolute top-2 right-2 sm:right-6 font-['Caveat',cursive] text-stone-700 text-sm sm:text-base font-bold rotate-[-4deg] select-none pointer-events-none">
                Dream · Learn · Grow ♡
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* 5 CATEGORY CARDS IN 5-COLUMN GRID                        */}
        {/* -------------------------------------------------------- */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          
          {/* Card 1: Links */}
          <div
            onClick={() => {
              playPopSound();
              onNavigate('links');
            }}
            className="group relative overflow-hidden rounded-[24px] bg-[#EDE9FE]/75 hover:bg-[#EDE9FE] border border-purple-200/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none min-h-[145px]"
          >
            {/* Top row: Icon Pill + Circle Arrow */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">link</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/90 text-stone-700 flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </div>
            </div>
            
            {/* Text details */}
            <div className="relative z-10">
              <h3 className="font-['Fraunces',serif] font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                Links ({links.length})
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">
                Access all your important links.
              </p>
            </div>

            {/* Watermark */}
            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[70px] text-[#7C3AED]/10 pointer-events-none select-none">
              public
            </span>
          </div>

          {/* Card 2: Habits & Tasks */}
          <div
            onClick={() => {
              playPopSound();
              onNavigate('notebook');
            }}
            className="group relative overflow-hidden rounded-[24px] bg-[#D1FAE5]/75 hover:bg-[#D1FAE5] border border-emerald-200/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none min-h-[145px]"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#006C49] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/90 text-stone-700 flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-['Fraunces',serif] font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                Habits &amp; Tasks ({activeTasksCount})
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">
                Build good habits and get things done.
              </p>
            </div>

            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[70px] text-[#006C49]/10 pointer-events-none select-none">
              potted_plant
            </span>
          </div>

          {/* Card 3: Reels */}
          <div
            onClick={() => {
              playPopSound();
              onNavigate('reels');
            }}
            className="group relative overflow-hidden rounded-[24px] bg-[#FFE4E6]/75 hover:bg-[#FFE4E6] border border-rose-200/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none min-h-[145px]"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#DE3B78] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">movie</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/90 text-stone-700 flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-['Fraunces',serif] font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                Reels ({reels.length})
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">
                Watch &amp; enjoy your favorite reels.
              </p>
            </div>

            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[70px] text-[#DE3B78]/10 pointer-events-none select-none">
              video_library
            </span>
          </div>

          {/* Card 4: Finances */}
          <div
            onClick={() => {
              playPopSound();
              onNavigate('finance');
            }}
            className="group relative overflow-hidden rounded-[24px] bg-[#E0F2FE]/75 hover:bg-[#E0F2FE] border border-sky-200/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none min-h-[145px]"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/90 text-stone-700 flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-['Fraunces',serif] font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                Finances ({transactions.length})
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">
                Track your money and plan better.
              </p>
            </div>

            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[70px] text-[#0284C7]/10 pointer-events-none select-none">
              paid
            </span>
          </div>

          {/* Card 5: Notes & Sketch */}
          <div
            onClick={() => {
              playPopSound();
              onNavigate('notes');
            }}
            className="group relative overflow-hidden rounded-[24px] bg-[#EDE9FE]/60 hover:bg-[#EDE9FE]/85 border border-purple-200/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none min-h-[145px] col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#9333EA] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">palette</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/90 text-stone-700 flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-['Fraunces',serif] font-bold text-base sm:text-lg text-[#1F2A24] leading-tight">
                Notes &amp; Sketch ({totalNotesCount})
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">
                Write, sketch and capture your thoughts.
              </p>
            </div>

            <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[70px] text-[#9333EA]/10 pointer-events-none select-none">
              edit_note
            </span>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* BOTTOM BENTO ROW (Quick Access | Quote Card | Recent)    */}
        {/* -------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Card 1: ⭐ Quick Access (3x2 App Grid) */}
          <div className="rounded-[28px] bg-white p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 font-['Fraunces',serif] font-bold text-base text-[#1F2A24]">
                <span className="text-amber-500">⭐</span>
                <span>Quick Access</span>
              </div>
              <button
                onClick={() => onNavigate('links')}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* 3x2 Grid of App Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Google */}
              <a
                href="https://google.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <span className="text-xl">🌐</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">Google</span>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 text-red-600 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">smart_display</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">YouTube</span>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 text-stone-800 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">code</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">GitHub</span>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 text-pink-600 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">Instagram</span>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 text-blue-600 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">work</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">LinkedIn</span>
              </a>

              {/* ChatGPT */}
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 text-emerald-600 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <span className="text-xs font-semibold text-stone-700">ChatGPT</span>
              </a>
            </div>
          </div>

          {/* Card 2: Quote Card with Purple Mountain Landscape Graphic */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#5B21B6] p-6 text-white shadow-sm flex flex-col justify-between min-h-[200px]">
            {/* Background Mountain Graphic / Trees Overlay */}
            <div 
              className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none bg-bottom bg-cover"
              style={{ backgroundImage: `url(${quoteBgImg})` }}
            />

            {/* Top row: ❝ icon + Interactive controls */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-3xl font-['Fraunces',serif] opacity-90 leading-none">❝</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    playPopSound();
                    setFavoriteQuote(!favoriteQuote);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ${
                    favoriteQuote ? 'bg-white text-rose-500' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title="Favorite Quote"
                >
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                </button>
                <button
                  onClick={() => {
                    playPopSound();
                    setQuoteIndex((quoteIndex + 1) % QUOTES.length);
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all active:rotate-180"
                  title="Next Inspiration"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Center Quote Text */}
            <div className="relative z-10 my-auto py-2">
              <p className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                {QUOTES[quoteIndex]}
              </p>
            </div>

            {/* Footer script */}
            <div className="relative z-10 flex items-center justify-between text-xs text-white/80 pt-2 border-t border-white/20">
              <span>Cozy Inspiration</span>
              <span className="font-['Caveat',cursive] text-sm">SreeshSpace ♡</span>
            </div>
          </div>

          {/* Card 3: 🕒 Recent Activity (View All →) */}
          <div className="rounded-[28px] bg-white p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 font-['Fraunces',serif] font-bold text-base text-[#1F2A24]">
                <span className="text-[#7C3AED]">🕒</span>
                <span>Recent Activity</span>
              </div>
              <button
                onClick={() => {
                  playPopSound();
                  if (onOpenHistoryTimeline) onOpenHistoryTimeline();
                }}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* 4 Activity Items */}
            <div className="space-y-2.5">
              {/* Activity 1: Added a new link */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 border border-purple-100/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    {links.length > 0 ? `Added ${links[0].title}` : 'Added a new link'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium shrink-0 ml-2">2h ago</span>
              </div>

              {/* Activity 2: Completed a task */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    Completed a habit task
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium shrink-0 ml-2">1d ago</span>
              </div>

              {/* Activity 3: Watched a reel */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    {reels.length > 0 ? `Saved ${reels[0].headline}` : 'Watched a reel'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium shrink-0 ml-2">2d ago</span>
              </div>

              {/* Activity 4: Created a note */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 border border-purple-100/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    {notes.length > 0 ? `Updated ${notes[0].title}` : 'Created a cozy note'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium shrink-0 ml-2">3d ago</span>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* FOOTER (Exact match to Image 3)                          */}
        {/* -------------------------------------------------------- */}
        <footer className="pt-8 pb-4 border-t border-stone-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          
          {/* Logo & Brand text */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-semibold text-stone-700">SreeshSpace</span>
            <span>•</span>
            <span>Your Personal Space</span>
          </div>

          {/* Social Icons & Stay Connected Pill */}
          <div className="flex items-center gap-3">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-500 hover:text-red-600 transition-colors"
              title="YouTube"
            >
              <span className="material-symbols-outlined text-[18px]">smart_display</span>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-500 hover:text-stone-900 transition-colors"
              title="GitHub"
            >
              <span className="material-symbols-outlined text-[18px]">code</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-500 hover:text-pink-600 transition-colors"
              title="Instagram"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-500 hover:text-blue-600 transition-colors"
              title="LinkedIn"
            >
              <span className="material-symbols-outlined text-[18px]">work</span>
            </a>

            <button
              onClick={() => {
                playPopSound();
                setIsContactModalOpen(true);
              }}
              className="px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200/70 hover:bg-purple-100 font-semibold transition-all active:scale-95 ml-1"
            >
              Stay Connected ♡
            </button>
          </div>
        </footer>
      </main>

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  S
                </div>
                <h3 className="font-['Fraunces',serif] font-bold text-lg text-stone-900">
                  About SreeshSpace
                </h3>
              </div>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Welcome to Sreeshnav's cozy personal sanctuary! Crafted to keep your digital life joyful, tidy, and peaceful: from bookmarking your favorite links and inspiration reels to tracking habits and personal finances.
            </p>
            <div className="p-3 bg-purple-50 rounded-2xl text-xs text-purple-900 font-medium">
              ✨ Offline-ready PWA • Encrypted PIN Vault • Local-first Cloud Sync
            </div>
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#7C3AED] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  💌
                </div>
                <h3 className="font-['Fraunces',serif] font-bold text-lg text-stone-900">
                  Connect with Sreeshnav
                </h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Have thoughts, feature ideas, or want to collaborate? Connect anytime!
            </p>
            <div className="space-y-2 text-xs font-semibold text-stone-700">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <span>📧 Email</span>
                <span className="text-[#7C3AED] select-all">sreeshnav@sreeshspace.dev</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <span>🐙 GitHub</span>
                <span className="text-[#7C3AED]">github.com/Sreeshnavp</span>
              </div>
            </div>
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#7C3AED] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Back to Sanctuary
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
