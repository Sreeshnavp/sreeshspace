import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Delete, Check, ShieldAlert, Sparkles } from 'lucide-react';
import avatarImg from '../assets/avatar.png';
import { verifyPin, setDeviceUnlocked } from '../utils/security';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // Check PIN when length reaches 4
  const handleCheckPin = useCallback(
    async (code: string) => {
      if (code.length !== 4 || isVerifying) return;
      setIsVerifying(true);

      const isValid = await verifyPin(code);
      if (isValid) {
        playPopSound();
        triggerPartyPop('stars');
        setDeviceUnlocked(rememberDevice);
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        setError(true);
        setErrorMessage('Incorrect PIN. Access denied 🚫');
        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        playPopSound();
        setTimeout(() => {
          setPin('');
          setError(false);
          setIsVerifying(false);
        }, 550);
      }
    },
    [isVerifying, rememberDevice, onUnlock]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4 || isVerifying) return;
      const next = pin + digit;
      setPin(next);
      setError(false);
      setErrorMessage('');
      playPopSound();

      if (next.length === 4) {
        handleCheckPin(next);
      }
    },
    [pin, isVerifying, handleCheckPin]
  );

  const handleDelete = useCallback(() => {
    if (pin.length === 0 || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
    playPopSound();
  }, [pin, isVerifying]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-page text-main overflow-y-auto selection:bg-accent-soft selection:text-accent-text">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center">
        <div className="w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-rose-300 via-amber-200 to-indigo-300 blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-xs sm:max-w-sm flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-surface/90 backdrop-blur-xl border border-subtle shadow-raised animate-in zoom-in-95 duration-200">
        
        {/* Avatar Portrait with glowing lock badge */}
        <div className="relative mb-3 group select-none">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-soft">
            <div className="w-full h-full rounded-[20px] overflow-hidden bg-surface relative">
              <img
                src={avatarImg}
                alt="Sreeshnav"
                className="w-full h-full object-cover rounded-[20px]"
              />
            </div>
          </div>
          {/* Floating lock badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-main text-surface flex items-center justify-center shadow-soft border-2 border-surface">
            <Lock size={13} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Space Name & Subtitle */}
        <h1 className="font-head font-black text-xl sm:text-2xl text-main tracking-tight">
          Orbit
        </h1>
        <p className="text-xs text-muted mt-1 font-medium flex items-center justify-center gap-1">
          <Sparkles size={11} className="text-accent" />
          <span>Private Vault • Enter PIN to unlock</span>
        </p>

        {/* 4 PIN Indicator Dots */}
        <div className={`flex items-center gap-4 my-6 transition-transform ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 scale-110 shadow-sm'
                    : isFilled
                    ? 'bg-main scale-120 shadow-2xs'
                    : 'bg-sunken border-2 border-subtle'
                }`}
              />
            );
          })}
        </div>

        {/* Error Notice */}
        {errorMessage ? (
          <p className="text-xs font-bold text-rose-500 -mt-2 mb-4 animate-in fade-in">
            {errorMessage}
          </p>
        ) : (
          <div className="h-4 -mt-2 mb-4" />
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[260px] select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-surface hover:bg-sunken border border-subtle shadow-2xs text-lg sm:text-xl font-black text-main transition active:scale-90 cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={() => {
              setPin('');
              setError(false);
              playPopSound();
            }}
            className="h-14 rounded-2xl hover:bg-sunken text-xs font-bold text-muted transition active:scale-95 cursor-pointer flex items-center justify-center"
            title="Clear"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-surface hover:bg-sunken border border-subtle shadow-2xs text-lg sm:text-xl font-black text-main transition active:scale-90 cursor-pointer flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl hover:bg-sunken text-muted hover:text-main transition active:scale-90 cursor-pointer flex items-center justify-center"
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* "Remember this device" Checkbox */}
        <label className="mt-5 flex items-center gap-2 text-xs text-muted cursor-pointer select-none hover:text-main transition">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="w-4 h-4 rounded-md accent-accent cursor-pointer"
          />
          <span className="font-semibold">Keep unlocked on this device</span>
        </label>
      </div>
    </div>
  );
};
