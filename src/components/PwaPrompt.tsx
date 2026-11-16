import React from 'react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Apple, 
  Share2
} from 'lucide-react';

interface PwaPromptProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallClick: () => void;
}

export const PwaPrompt: React.FC<PwaPromptProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallClick,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-main/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-surface rounded-3xl shadow-raised border border-subtle flex flex-col overflow-hidden text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent-text flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-main">
                Install on Phone or PC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5 text-xs sm:text-sm">
          
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-accent text-on-accent flex items-center justify-between shadow-soft">
              <div>
                <h4 className="font-bold text-xs sm:text-sm">1-Click Install Ready</h4>
                <p className="text-[11px] opacity-80">Add directly to your device home screen</p>
              </div>
              <button
                onClick={onInstallClick}
                className="px-3.5 py-1.5 bg-surface text-main font-bold rounded-xl text-xs hover:bg-sunken transition active:scale-95 cursor-pointer"
              >
                Install Now
              </button>
            </div>
          )}

          {/* Android */}
          <div className="p-3.5 rounded-2xl border border-subtle bg-sunken">
            <div className="flex items-center gap-2 font-bold text-main mb-1">
              <span>🤖 Android (Chrome)</span>
            </div>
            <p className="text-xs text-muted">
              Tap the <strong>three dots menu (⋮)</strong> at top right &rarr; tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
          </div>

          {/* iOS */}
          <div className="p-3.5 rounded-2xl border border-subtle bg-sunken">
            <div className="flex items-center gap-2 font-bold text-main mb-1">
              <Apple size={15} />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <p className="text-xs text-muted">
              Tap the <strong>Share button (<Share2 size={11} className="inline mx-0.5" />)</strong> &rarr; scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
          </div>

          {/* Desktop */}
          <div className="p-3.5 rounded-2xl border border-subtle bg-sunken">
            <div className="flex items-center gap-2 font-bold text-main mb-1">
              <Monitor size={15} className="text-accent" />
              <span>Desktop (Chrome / Edge / Mac)</span>
            </div>
            <p className="text-xs text-muted">
              Click the <strong>Install icon (💻 ⤓)</strong> inside your browser's address bar to run it in a clean dedicated app window.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-subtle bg-sunken flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-on-accent bg-accent hover:bg-accent-hover rounded-xl shadow-soft transition cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
