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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-espresso-900 rounded-3xl shadow-2xl border border-cream-300 dark:border-espresso-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-300 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-espresso-900 dark:text-cream-50">
                Install on Phone or PC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-espresso-800/40 hover:text-espresso-800 dark:text-cream-100/40 dark:hover:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-espresso-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5 text-xs sm:text-sm">
          
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-sage-600 text-white flex items-center justify-between shadow-pill">
              <div>
                <h4 className="font-bold text-xs sm:text-sm">1-Click Install Ready</h4>
                <p className="text-[11px] text-sage-100">Add directly to your device home screen</p>
              </div>
              <button
                onClick={onInstallClick}
                className="px-3.5 py-1.5 bg-white text-sage-800 font-bold rounded-xl text-xs hover:bg-cream-100 transition active:scale-95"
              >
                Install Now
              </button>
            </div>
          )}

          {/* Android */}
          <div className="p-3.5 rounded-2xl border border-cream-200 dark:border-espresso-800 bg-cream-50/70 dark:bg-espresso-850">
            <div className="flex items-center gap-2 font-bold text-espresso-900 dark:text-cream-50 mb-1">
              <span>🤖 Android (Chrome)</span>
            </div>
            <p className="text-xs text-espresso-800/70 dark:text-cream-100/70">
              Tap the <strong>three dots menu (⋮)</strong> at top right &rarr; tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
          </div>

          {/* iOS */}
          <div className="p-3.5 rounded-2xl border border-cream-200 dark:border-espresso-800 bg-cream-50/70 dark:bg-espresso-850">
            <div className="flex items-center gap-2 font-bold text-espresso-900 dark:text-cream-50 mb-1">
              <Apple size={15} />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <p className="text-xs text-espresso-800/70 dark:text-cream-100/70">
              Tap the <strong>Share button (<Share2 size={11} className="inline mx-0.5" />)</strong> &rarr; scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
          </div>

          {/* Desktop */}
          <div className="p-3.5 rounded-2xl border border-cream-200 dark:border-espresso-800 bg-cream-50/70 dark:bg-espresso-850">
            <div className="flex items-center gap-2 font-bold text-espresso-900 dark:text-cream-50 mb-1">
              <Monitor size={15} className="text-sage-600" />
              <span>Desktop (Chrome / Edge / Mac)</span>
            </div>
            <p className="text-xs text-espresso-800/70 dark:text-cream-100/70">
              Click the <strong>Install icon (💻 ⤓)</strong> inside your browser's address bar to run it in a clean dedicated app window.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cream-200 dark:border-espresso-800 bg-cream-50/50 dark:bg-espresso-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-sage-600 hover:bg-sage-500 rounded-xl shadow-pill transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
