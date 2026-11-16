import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Check, Sparkles } from 'lucide-react';
import type { TodoItem } from '../types';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TodoItem | null;
  onCompleteSession: (taskId: string, durationMinutes: number) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  task,
  onCompleteSession,
}) => {
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialMinutes * 60);
      setIsRunning(false);
      setIsBreak(false);
    }
  }, [isOpen, initialMinutes, task]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (!isBreak && task) {
              onCompleteSession(task.id, initialMinutes);
              triggerPartyPop('grand');
            } else {
              playPopSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreak, task, initialMinutes, onCompleteSession]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = initialMinutes * 60;
  const progressPct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
    playPopSound();
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialMinutes * 60);
    playPopSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-sm bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-main leading-tight">
                {isBreak ? 'Zen Break Time' : 'Deep Focus Session'}
              </h3>
              <span className="text-[10px] text-muted">
                {task ? task.text : 'Personal Flow State'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Circular Timer Visual Display */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="78"
                stroke="currentColor"
                strokeWidth="8"
                className="text-sunken fill-none"
              />
              <circle
                cx="88"
                cy="88"
                r="78"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={490}
                strokeDashoffset={490 - (490 * progressPct) / 100}
                strokeLinecap="round"
                className="text-accent fill-none transition-all duration-1000"
              />
            </svg>

            {/* Center Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-mono tracking-tight text-main">
                {timeFormatted}
              </span>
              <span className="text-[10px] font-bold text-muted uppercase mt-0.5">
                {isRunning ? (isBreak ? 'Resting' : 'Focusing...') : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick duration presets */}
          <div className="flex items-center gap-2">
            {[15, 25, 45].map((m) => (
              <button
                key={m}
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setInitialMinutes(m);
                  setSecondsLeft(m * 60);
                  playPopSound();
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  initialMinutes === m
                    ? 'bg-accent text-on-accent shadow-2xs'
                    : 'bg-sunken hover:bg-surface border border-subtle text-muted'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleResetTimer}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-surface hover:bg-sunken border border-border-input text-muted hover:text-main transition active:scale-95 cursor-pointer shadow-2xs"
            title="Reset timer"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleToggleTimer}
            className="min-h-[44px] px-8 rounded-2xl bg-accent hover:bg-accent-hover text-on-accent text-sm font-extrabold shadow-soft transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause size={16} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={16} className="fill-on-accent" />
                <span>Start Focus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
