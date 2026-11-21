import React, { useState, useEffect, useRef } from 'react';
import avatarImg from '../assets/avatar.jpg';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    let frameId: number;
    let timerComplete: ReturnType<typeof setTimeout>;
    let timerFinish: ReturnType<typeof setTimeout>;

    const startTime = performance.now();
    // 2.4 seconds duration for loading 0% to 100% (within the 2-3 sec requirement)
    const duration = 2400;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Natural ease-in-out cubic progression curve
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const current = Math.min(100, Math.round(eased * 100));

      setProgress(current);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Short pause at 100% so user sees completion
        timerComplete = setTimeout(() => {
          setFading(true);
          // Smooth fade out duration 350ms
          timerFinish = setTimeout(() => {
            if (onFinishRef.current) onFinishRef.current();
          }, 350);
        }, 250);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerComplete);
      clearTimeout(timerFinish);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#fff9f6] text-stone-800 font-sans antialiased flex flex-col justify-between items-center relative overflow-hidden select-none px-6 py-12 transition-opacity duration-300 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Whimsical Background Glows & Floating Sparkles */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-violet-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-100/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-purple-200/35 blur-3xl pointer-events-none" />

      {/* Decorative Sparkles */}
      <div className="absolute top-16 left-10 text-violet-400 text-lg animate-float-gentle select-none">✦</div>
      <div className="absolute top-28 right-12 text-amber-400 text-2xl animate-float-gentle select-none" style={{ animationDelay: '1.2s' }}>✨</div>
      <div className="absolute bottom-36 left-12 text-pink-400 text-xl animate-float-gentle select-none" style={{ animationDelay: '2s' }}>🌸</div>
      <div className="absolute bottom-48 right-14 text-emerald-400 text-lg animate-float-gentle select-none" style={{ animationDelay: '0.7s' }}>🌱</div>

      {/* Top Status Pill */}
      <div className="w-full max-w-sm flex justify-center pt-4 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-violet-100 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold tracking-wide text-violet-900/80">Personal Sanctuary • v2.0</span>
        </div>
      </div>

      {/* Central Logo, Greeting & Brand Title */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto z-10">
        {/* Outer Glowing Rings for Logo */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-violet-300/40 via-pink-200/40 to-amber-200/40 blur-md animate-pulse-subtle" />
          <div className="relative p-1.5 rounded-full bg-white shadow-xl shadow-violet-500/10 ring-4 ring-violet-100/80">
            <img
              src={avatarImg}
              alt="Sreeshnav's Space Logo"
              className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover shadow-inner"
            />
            {/* Mini Floating Status Badge */}
            <div className="absolute bottom-1 right-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-1.5 rounded-full shadow-md border-2 border-white flex items-center justify-center">
              <span className="material-symbols-rounded text-sm">auto_awesome</span>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 font-serif mb-2">
          Sreeshnav's Space
        </h1>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200/60 mb-4 shadow-sm">
          <span>✨</span>
          <span>Quiet flow, cozy vibes & everyday focus</span>
        </div>

        <p className="text-sm text-stone-600 max-w-xs leading-relaxed mb-6 font-medium">
          Your all-in-one sanctuary for links, habits, finances, reels, and cozy thoughts.
        </p>

        {/* Cute Loading Bar & Indicator */}
        <div className="w-56 flex flex-col items-center gap-2.5">
          <div className="w-full h-2 rounded-full bg-stone-200/70 overflow-hidden relative shadow-inner p-0.5">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-400 rounded-full relative overflow-hidden shadow-sm transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/40 animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center justify-between w-full text-[11px] font-semibold text-stone-600 px-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-rounded text-xs text-violet-500 animate-spin">sync</span>
              Opening your sanctuary...
            </span>
            <span className="text-violet-600 font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Quote & Safety Note */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 text-center pb-2 z-10">
        <div className="px-4 py-2.5 rounded-2xl bg-white/70 border border-violet-100/70 shadow-sm backdrop-blur-sm">
          <p className="text-xs italic text-stone-600 font-serif">
            "Small daily disciplines compound into quiet confidence."
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium pt-1">
          <span className="material-symbols-rounded text-xs text-violet-400">favorite</span>
          <span>Made with love for Sreeshnav</span>
        </div>
      </div>
    </div>
  );
}
