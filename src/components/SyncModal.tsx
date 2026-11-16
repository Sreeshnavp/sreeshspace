import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  getSyncKey,
  setSyncKey,
  getLastSyncedAt,
  syncWithCloud,
  subscribeToSyncStatus,
  type SyncStatus
} from '../services/syncService';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed: () => void;
  onToast: (msg: string) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed,
  onToast,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'synced',
    lastSyncedAt: getLastSyncedAt(),
    syncKey: getSyncKey(),
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const mobileShareUrl = `${currentOrigin}${currentPath}?sync=${encodeURIComponent(syncStatus.syncKey)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileShareUrl);
      setCopiedLink(true);
      playPopSound();
      onToast('Mobile sync link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onToast('Could not copy automatically. Please copy the link manually.');
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(syncStatus.syncKey);
      setCopiedKey(true);
      playPopSound();
      onToast('Sync key copied!');
      setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      onToast('Could not copy automatically.');
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Orbit — Personal Vault & Habits',
          text: `Connect to my Orbit vault (${syncStatus.syncKey})`,
          url: mobileShareUrl,
        });
        playPopSound();
      } catch {
        // Share cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    setErrorNotice(null);
    try {
      const res = await syncWithCloud({
        onMerged: () => {
          onDataRefreshed();
        },
      });

      if (res.success) {
        playPopSound();
        triggerPartyPop();
        onToast('✨ Successfully synced with Supabase cloud!');
      } else {
        setErrorNotice(res.error || 'Failed to sync with Supabase');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Unexpected sync error');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleSwitchKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customKeyInput.trim().toLowerCase();
    if (clean.length < 3) {
      setErrorNotice('Sync key must be at least 3 characters');
      return;
    }

    try {
      setSyncKey(clean);
      setCustomKeyInput('');
      setErrorNotice(null);
      setIsSyncingNow(true);
      playPopSound();

      const res = await syncWithCloud({
        onMerged: () => {
          onDataRefreshed();
        },
      });

      if (res.success) {
        onToast(`Switched to vault "${clean}" & synced!`);
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Error switching vault');
    } finally {
      setIsSyncingNow(false);
    }
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 10) return 'Just now';
      if (diff < 60) return `${diff} seconds ago`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
      const hours = Math.floor(mins / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-page/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div 
        className="w-full max-w-lg bg-surface border border-subtle rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between bg-sunken/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent-text flex items-center justify-center shadow-2xs border border-accent/20">
              <Cloud size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 id="sync-modal-title" className="font-extrabold text-base sm:text-lg text-main leading-tight">
                Orbit Cloud Sync
              </h2>
              <p className="text-xs text-muted">
                Supabase Realtime Cloud Vault
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-faint hover:text-main hover:bg-sunken transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Status Card */}
          <div className="p-4 rounded-2xl bg-sunken/60 border border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncStatus.state === 'synced' ? 'bg-success' : syncStatus.state === 'syncing' ? 'bg-accent' : 'bg-faint'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    syncStatus.state === 'synced' ? 'bg-success' : syncStatus.state === 'syncing' ? 'bg-accent' : 'bg-faint'
                  }`} />
                </span>
                <span className="text-xs font-bold text-main uppercase tracking-wider">
                  {syncStatus.state === 'synced' && 'Cloud Active & Synced'}
                  {syncStatus.state === 'syncing' && 'Syncing with Supabase...'}
                  {syncStatus.state === 'offline' && 'Offline (Local-First Mode)'}
                  {syncStatus.state === 'error' && 'Sync Error'}
                </span>
              </div>
              <span className="text-[11px] text-faint">
                ap-south-1
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted mb-3">
              <span>Last synced:</span>
              <span className="font-semibold text-main">
                {formatLastSync(syncStatus.lastSyncedAt)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingNow}
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-on-accent text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw size={14} className={isSyncingNow ? 'animate-spin' : ''} />
              <span>{isSyncingNow ? 'Syncing Now...' : 'Sync Now'}</span>
            </button>
          </div>

          {errorNotice && (
            <div className="p-3 rounded-xl bg-danger-soft border border-danger/20 flex items-start gap-2.5 text-xs text-danger">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Multi-Device Pairing Section */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-3">
            <div className="flex items-center gap-2 text-main font-bold text-sm">
              <Laptop size={16} className="text-accent" />
              <span>+</span>
              <Smartphone size={16} className="text-accent" />
              <span>Connect Phone & Laptop</span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Use the same Vault Sync Key on both your laptop and phone to mirror your links, habits, notes, and routines automatically.
            </p>

            {/* Sync Key Display */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-faint mb-1.5">
                Your Vault Sync Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-sunken border border-border-input font-mono text-xs font-bold text-main truncate select-all">
                  {syncStatus.syncKey}
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="p-2.5 rounded-xl border border-border-input hover:border-accent bg-surface hover:bg-sunken text-muted hover:text-main transition cursor-pointer shrink-0"
                  title="Copy sync key"
                >
                  {copiedKey ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Mobile Link Sharing */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-xl border border-accent bg-accent-soft text-accent-text hover:bg-accent hover:text-on-accent transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2 px-3 rounded-xl border border-subtle bg-sunken hover:bg-surface text-muted hover:text-main transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Switch Vault Section */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5">
            <label className="block text-xs font-bold text-main">
              Connect to Existing Vault
            </label>
            <p className="text-[11px] text-muted">
              Entering a sync key links this device to that vault and merges your data.
            </p>
            <form onSubmit={handleSwitchKey} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. sreeshnav-vault"
                value={customKeyInput}
                onChange={(e) => setCustomKeyInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-sunken border border-border-input text-xs text-main placeholder:text-faint focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={!customKeyInput.trim() || isSyncingNow}
                className="px-3.5 py-2 rounded-xl bg-surface border border-border-input hover:border-accent text-xs font-bold text-main hover:text-accent-text disabled:opacity-50 transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Connect</span>
                <ArrowRight size={13} />
              </button>
            </form>
          </div>

          {/* Local-First & Privacy Guarantee */}
          <div className="p-3 rounded-xl bg-sunken/40 border border-subtle flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted leading-relaxed">
              <strong className="text-main">100% Local-First:</strong> All your data is always stored in your browser's IndexedDB first. Orbit works seamlessly offline, and automatically syncs in the background when connected.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-subtle bg-sunken/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface border border-border-input hover:border-accent text-xs font-bold text-main hover:text-accent-text transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
