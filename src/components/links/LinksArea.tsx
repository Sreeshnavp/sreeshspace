import React, { useState, useMemo } from 'react';
import type { LinkItem, CategoryInfo, WorkspaceView } from '../../types';
import { playPopSound } from '../../utils/delight';
import { extractDomain } from '../../utils/urlHelper';
import { useScrollVisibility } from '../../utils/useScrollVisibility';
import avatarImg from '../../assets/avatar.jpg';

interface LinksAreaProps {
  links: LinkItem[];
  categories: CategoryInfo[];
  onNavigate: (view: WorkspaceView) => void;
  onLock?: () => void;
  onOpenAddLinkModal: (categoryName?: string) => void;
  onSelectLink: (link: LinkItem) => void;
  onTogglePin: (id: string) => void;
  onVisitLink: (link: LinkItem) => void;
  onOpenFolder: (category: CategoryInfo) => void;
  onEditCategory: (category: CategoryInfo) => void;
  onAddCategory: (category: { name: string; color: string; icon: string }) => void;
  onDropLinkOnCategory: (linkId: string, categoryName: string) => void;
  onReorderCategory: (fromIndex: number, toIndex: number) => void;
  onOpenHistoryTimeline?: () => void;
}

export const LinksArea: React.FC<LinksAreaProps> = ({
  links,
  categories,
  onNavigate,
  onLock,
  onOpenAddLinkModal,
  onSelectLink,
  onTogglePin,
  onVisitLink,
  onOpenFolder,
  onEditCategory,
  onAddCategory,
  onDropLinkOnCategory,
  onReorderCategory,
}) => {
  const [viewTab, setViewTab] = useState<'folders' | 'all' | 'starred'>('folders');
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [activeReorderCatId, setActiveReorderCatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const isHeaderVisible = useScrollVisibility();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Unique categories deduplicated by name
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((c) => {
      const key = (c.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  // Grouped links per category
  const categorizedMap = useMemo(() => {
    const map = new Map<string, LinkItem[]>();
    links.forEach((link) => {
      const cat = (link.category || 'Uncategorized').trim();
      const existing = map.get(cat) || [];
      existing.push(link);
      map.set(cat, existing);
    });
    return map;
  }, [links]);

  // Unfiled links (Uncategorized or Independent Links)
  const unfiledLinks = useMemo(() => {
    return links.filter(
      (l) =>
        !l.category ||
        l.category === 'Uncategorized' ||
        l.category.toLowerCase() === 'independent links' ||
        l.category.toLowerCase() === 'canvas' ||
        l.category.trim() === ''
    );
  }, [links]);

  const starredLinks = useMemo(() => {
    return links.filter((l) => l.pinned);
  }, [links]);

  // Visual helper for pastel gradients & accents matching Stitch
  const getFolderStyle = (index: number, category: CategoryInfo) => {
    const c = (category.color || '').toLowerCase();
    const idx = index % 4;

    if (c === 'purple' || c === 'lavender' || idx === 0) {
      return {
        gradient: 'from-lavender-subtle/30 via-surface-card to-surface-card hover:border-primary/40',
        badgeBg: 'bg-lavender-subtle text-primary ring-2 ring-primary/20',
        countBadge: 'bg-lavender-subtle text-primary',
        accentRing: 'ring-primary',
      };
    }
    if (c === 'sky' || c === 'blue' || idx === 1) {
      return {
        gradient: 'from-sky-subtle/30 via-surface-card to-surface-card hover:border-sky-accent/40',
        badgeBg: 'bg-sky-subtle text-sky-accent ring-2 ring-sky-accent/20',
        countBadge: 'bg-sky-subtle text-sky-accent',
        accentRing: 'ring-sky-accent',
      };
    }
    if (c === 'peach' || c === 'pink' || c === 'rose' || idx === 2) {
      return {
        gradient: 'from-peach-subtle/40 via-surface-card to-surface-card hover:border-tertiary-container/30',
        badgeBg: 'bg-peach-subtle text-tertiary-container ring-2 ring-tertiary-container/20',
        countBadge: 'bg-peach-subtle text-tertiary-container',
        accentRing: 'ring-tertiary-container',
      };
    }
    // Mint / Sage
    return {
      gradient: 'from-mint-subtle/40 via-surface-card to-surface-card hover:border-secondary/40',
      badgeBg: 'bg-mint-subtle text-secondary ring-2 ring-secondary/20',
      countBadge: 'bg-mint-subtle text-secondary',
      accentRing: 'ring-secondary',
    };
  };

  // Helper for unfiled link item icon
  const getUnfiledIcon = (url: string, title?: string) => {
    const text = (url + ' ' + (title || '')).toLowerCase();
    if (text.includes('figma')) {
      return { icon: 'design_services', bgClass: 'bg-peach-subtle/80 text-tertiary-container' };
    }
    if (text.includes('vercel')) {
      return { icon: 'deployed_code', bgClass: 'bg-surface-card border border-border-subtle text-on-surface' };
    }
    if (text.includes('raycast')) {
      return { icon: 'bolt', bgClass: 'bg-peach-subtle text-tertiary-container' };
    }
    if (text.includes('linear')) {
      return { icon: 'task_alt', bgClass: 'bg-lavender-subtle text-primary' };
    }
    if (text.includes('github') || text.includes('git') || text.includes('terminal')) {
      return { icon: 'terminal', bgClass: 'bg-sunshine-subtle text-sunshine-accent' };
    }
    if (text.includes('youtube') || text.includes('video') || text.includes('clip')) {
      return { icon: 'play_circle', bgClass: 'bg-peach-subtle text-tertiary-container' };
    }
    if (text.includes('web') || text.includes('globe') || text.includes('turn')) {
      return { icon: 'public', bgClass: 'bg-sky-subtle text-sky-accent' };
    }
    return { icon: 'bookmark', bgClass: 'bg-lavender-subtle text-primary' };
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, link: LinkItem) => {
    setDraggedLinkId(link.id);
    e.dataTransfer.setData('text/plain', link.id);
    e.dataTransfer.setData('application/link-id', link.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLinkId(null);
    setDragOverCategory(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, categoryName: string) => {
    e.preventDefault();
    setDragOverCategory(null);
    const linkId = draggedLinkId || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/link-id');
    if (linkId) {
      onDropLinkOnCategory(linkId, categoryName);
      playPopSound();
      const targetLink = links.find((l) => l.id === linkId);
      const title = targetLink?.title || 'Link';
      showToast(`Moved "${title}" to ${categoryName}! ✨`);
    }
  };

  const handleNewFolder = () => {
    playPopSound();
    const folderName = prompt('Enter new folder name (e.g. 💻 AI Projects, 📚 Research):', 'My Folder');
    if (folderName && folderName.trim()) {
      const icons = ['💻', '📁', '🎯', '🚀', '🎨', '📚', '☕', '🌿'];
      const colors = ['purple', 'sky', 'peach', 'mint'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddCategory({
        name: folderName.trim(),
        icon: randomIcon,
        color: randomColor,
      });
      showToast(`Folder "${folderName.trim()}" created! 🎉`);
    }
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
              onClick={() => onNavigate('home')}
              className="relative flex items-center justify-center cursor-pointer group"
              title="Return to Home"
            >
              <img 
                src={avatarImg} 
                alt="Sreeshnav" 
                className="w-9 h-9 rounded-full object-cover border-2 border-surface-card shadow-sm group-hover:scale-105 transition-transform" 
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
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN FEED CONTAINER (STITCH EXACT 1:1)                */}
      {/* ======================================================== */}
      <main className="flex flex-col relative w-full pt-20 pb-28 bg-canvas-bg min-h-screen">
        <div className="flex flex-col w-full px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto pb-12 gap-space-md">
          
          {/* Toolbar matching Google Stitch: Links Title + View Tabs + New Folder / Add Link Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <h1 className="font-display-lg text-[26px] font-bold text-on-surface tracking-tight mr-1 font-fraunces">
                Links
              </h1>
              <div className="flex items-center bg-surface-card rounded-full p-1 shadow-sm gap-1 border border-border-subtle">
                <button 
                  onClick={() => { setViewTab('folders'); playPopSound(); }}
                  className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all ${
                    viewTab === 'folders' 
                      ? 'bg-lavender-subtle text-primary font-bold shadow-sm' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Folders
                </button>
                <button 
                  onClick={() => { setViewTab('all'); playPopSound(); }}
                  className={`px-2.5 py-1 rounded-full font-label-md text-label-md transition-all ${
                    viewTab === 'all' 
                      ? 'bg-lavender-subtle text-primary font-bold shadow-sm' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => { setViewTab('starred'); playPopSound(); }}
                  className={`px-2.5 py-1 rounded-full font-label-md text-label-md transition-all flex items-center gap-0.5 ${
                    viewTab === 'starred' 
                      ? 'bg-lavender-subtle text-primary font-bold shadow-sm' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="text-sunshine-accent text-[13px]">★</span> Starred
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button 
                onClick={handleNewFolder}
                className="px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle text-on-surface font-label-md text-label-md hover:bg-lavender-subtle flex items-center gap-1 shadow-sm active:scale-95 transition-all" 
                id="newFolderBtn"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">create_new_folder</span>
                <span>+ New folder</span>
              </button>
              <button 
                onClick={() => onOpenAddLinkModal()}
                className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-[0_3px_10px_rgba(107,56,212,0.25)] flex items-center gap-1 hover:bg-primary-container active:scale-95 transition-all font-bold" 
                id="addLinkBtn"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Add link</span>
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div 
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full shadow-lg font-label-md text-label-md flex items-center gap-2 transition-all duration-300 pointer-events-none animate-fadeIn" 
              id="toastBanner"
            >
              <span className="material-symbols-outlined text-secondary-fixed text-[18px]">check_circle</span>
              <span id="toastMessage">{toastMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB CONTENT                                              */}
          {/* ======================================================== */}
          {viewTab === 'starred' ? (
            /* Starred Bookmarks View */
            <div className="flex flex-col gap-3 w-full">
              {starredLinks.length === 0 ? (
                <div className="bg-surface-card rounded-3xl p-8 border border-border-subtle text-center flex flex-col items-center">
                  <div className="text-4xl mb-2 text-sunshine-accent">★</div>
                  <h3 className="font-fraunces text-xl font-bold text-on-surface mb-1">No Starred Bookmarks Yet</h3>
                  <p className="text-on-surface-variant text-xs max-w-sm">
                    Click the star icon ★ on any link to pin your favorites here for instant access.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {starredLinks.map((link) => {
                    const iconConfig = getUnfiledIcon(link.url, link.title);
                    return (
                      <div 
                        key={link.id}
                        onClick={() => onSelectLink(link)}
                        className="link-pill flex items-center justify-between p-2.5 rounded-2xl bg-surface-card text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconConfig.bgClass}`}>
                            <span className="material-symbols-outlined text-[18px]">{iconConfig.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="truncate font-semibold block text-[13px]">{link.title || link.url}</span>
                            <span className="text-[11px] text-on-surface-variant truncate block font-mono">
                              {extractDomain(link.url) || link.url}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(link.id);
                            }}
                            className="text-sunshine-accent text-sm p-1"
                            title="Unstar"
                          >
                            ★
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVisitLink(link);
                            }}
                            className="text-primary hover:underline text-xs font-bold p-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : viewTab === 'all' ? (
            /* Flat Unbundled All Links View */
            <div className="flex flex-col gap-3 w-full">
              {links.length === 0 ? (
                <div className="bg-surface-card rounded-3xl p-8 border border-border-subtle text-center flex flex-col items-center">
                  <div className="text-4xl mb-2">🔎</div>
                  <h3 className="font-fraunces text-xl font-bold text-on-surface mb-1">No Bookmarks Saved Yet</h3>
                  <p className="text-on-surface-variant text-xs max-w-sm">
                    Tap + Add link to save your first bookmark to your cozy space.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {links.map((link) => {
                    const iconConfig = getUnfiledIcon(link.url, link.title);
                    return (
                      <div 
                        key={link.id}
                        onClick={() => onSelectLink(link)}
                        className="link-pill flex items-center justify-between p-2.5 rounded-2xl bg-surface-card text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconConfig.bgClass}`}>
                            <span className="material-symbols-outlined text-[18px]">{iconConfig.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="truncate font-semibold block text-[13px]">{link.title || link.url}</span>
                            <span className="text-[11px] text-on-surface-variant truncate block font-mono">
                              {extractDomain(link.url) || link.url}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas-bg text-on-surface-variant font-medium">
                            {link.category || 'Unfiled'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVisitLink(link);
                            }}
                            className="text-primary hover:underline text-xs font-bold p-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Folders View (Matching stitch dd9daaa0d6d44b3697e5791b55fd4b30 1:1) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {uniqueCategories.map((category, idx) => {
                const folderLinks = categorizedMap.get(category.name) || [];
                const style = getFolderStyle(idx, category);
                const isDragTarget = dragOverCategory === category.name;

                return (
                  <div 
                    key={category.id || category.name}
                    onClick={() => {
                      playPopSound();
                      onOpenFolder(category);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCategory(category.name);
                    }}
                    onDragLeave={() => {
                      if (dragOverCategory === category.name) {
                        setDragOverCategory(null);
                      }
                    }}
                    onDrop={(e) => handleDropOnFolder(e, category.name)}
                    className={`folder-dropzone bg-surface-card rounded-3xl p-4 shadow-[0_3px_14px_rgba(21,19,17,0.04)] border border-border-subtle flex flex-col gap-3 transition-all duration-200 relative overflow-hidden bg-gradient-to-br ${style.gradient} cursor-pointer hover:shadow-md hover:border-primary/40 ${
                      isDragTarget ? `ring-2 ${style.accentRing} scale-[1.01] bg-lavender-subtle/40` : ''
                    }`}
                    data-folder={category.name}
                  >
                    {/* Folder Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] shadow-sm ${style.badgeBg}`}>
                          {category.icon || '📁'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight font-fraunces">
                              {category.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold ${style.countBadge}`}>
                              {folderLinks.length}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {folderLinks.length} {folderLinks.length === 1 ? 'bookmark' : 'bookmarks'}
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCategory(category);
                        }}
                        className="w-8 h-8 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-xs active:scale-95 cursor-pointer" 
                        title="Edit folder"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>

                    {/* 2x2 Grid of Link Pills or Empty Slot Targets */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const link = folderLinks[slotIdx];
                        const isOverflow = slotIdx === 3 && folderLinks.length > 4;

                        if (link) {
                          const initial = (link.title?.[0] || 'L').toUpperCase();
                          return (
                            <div 
                              key={link.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, link)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOverflow) {
                                  onOpenFolder(category);
                                } else {
                                  onSelectLink(link);
                                }
                              }}
                              className="link-pill flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-canvas-bg text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all select-none"
                              data-title={link.title}
                              title={link.title}
                            >
                              <span className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-[11px] shadow-xs font-bold text-sky-accent shrink-0">
                                {link.title.toLowerCase().includes('edit') ? 'H' : initial}
                              </span>
                              <span className="truncate flex-1 font-semibold text-xs">
                                {isOverflow ? `+${folderLinks.length - 3} more` : link.title}
                              </span>
                            </div>
                          );
                        }

                        // Empty Slot Target
                        return (
                          <div 
                            key={`empty-slot-${slotIdx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddLinkModal(category.name);
                            }}
                            className="slot-target flex items-center justify-center py-2.5 rounded-2xl border-2 border-dashed border-outline-variant/60 text-outline hover:text-primary hover:border-primary/60 cursor-pointer bg-canvas-bg/50 active:scale-95 transition-all"
                            title={`Add link to ${category.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-on-surface-variant font-label-sm text-label-sm">
                      <div className="relative flex items-center gap-1 text-outline">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPopSound();
                            setActiveReorderCatId(activeReorderCatId === category.id ? null : category.id);
                          }}
                          className="flex items-center gap-1 text-xs hover:text-primary transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-lavender-subtle active:scale-95"
                          title="Reorder category"
                        >
                          <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                          <span>Reorder</span>
                        </button>

                        {/* Reorder Popover */}
                        {activeReorderCatId === category.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bottom-full mb-1 z-30 bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95"
                          >
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                playPopSound();
                                if (onReorderCategory) onReorderCategory(idx, idx - 1);
                                showToast(`Moved "${category.name}" up`);
                                setActiveReorderCatId(null);
                              }}
                              className="p-1.5 rounded-xl hover:bg-lavender-subtle text-on-surface disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Move Up"
                            >
                              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                              <span>Up</span>
                            </button>
                            <button
                              type="button"
                              disabled={idx === uniqueCategories.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                playPopSound();
                                if (onReorderCategory) onReorderCategory(idx, idx + 1);
                                showToast(`Moved "${category.name}" down`);
                                setActiveReorderCatId(null);
                              }}
                              className="p-1.5 rounded-xl hover:bg-lavender-subtle text-on-surface disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Move Down"
                            >
                              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                              <span>Down</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFolder(category);
                        }}
                        className="flex items-center gap-1 text-primary font-bold hover:underline py-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* ======================================================== */}
              {/* INDEPENDENT LINKS CARD (UNFILED)                        */}
              {/* ======================================================== */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCategory('Uncategorized');
                }}
                onDragLeave={() => {
                  if (dragOverCategory === 'Uncategorized') {
                    setDragOverCategory(null);
                  }
                }}
                onDrop={(e) => handleDropOnFolder(e, 'Uncategorized')}
                className={`folder-dropzone bg-surface-card rounded-3xl p-4 shadow-[0_3px_14px_rgba(21,19,17,0.04)] border-2 border-primary/30 flex flex-col gap-3 transition-all duration-200 relative overflow-hidden ${
                  dragOverCategory === 'Uncategorized' ? 'ring-2 ring-primary scale-[1.01] bg-lavender-subtle/30' : ''
                }`}
                data-folder="Independent Links"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-lavender-subtle/40 rounded-full blur-xl pointer-events-none" />
                
                {/* Unfiled Links Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1" id="unfiledContainer">
                  {unfiledLinks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-on-surface-variant col-span-2">
                      No unfiled links. Tap below to add a quick link!
                    </div>
                  ) : (
                    unfiledLinks.map((link) => {
                      const iconConfig = getUnfiledIcon(link.url, link.title);
                      return (
                        <div 
                          key={link.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, link)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectLink(link)}
                          className="link-pill flex items-center justify-between p-2.5 rounded-2xl bg-canvas-bg text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all cursor-pointer"
                          data-title={link.title}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconConfig.bgClass}`}>
                              <span className="material-symbols-outlined text-[18px]">
                                {iconConfig.icon}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="truncate font-semibold block text-[13px] text-on-surface">
                                {link.title || link.url}
                              </span>
                              <span className="text-[11px] text-on-surface-variant truncate block font-mono">
                                {extractDomain(link.url) || link.url.replace(/^https?:\/\//, '')}
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-outline cursor-move flex-shrink-0 ml-1 hover:text-primary">
                            drag_indicator
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Unfiled Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-on-surface-variant font-label-sm text-label-sm">
                  <div className="flex items-center gap-1.5 text-outline">
                    <span className="material-symbols-outlined text-[16px] text-primary">touch_app</span>
                    <span>Drag onto any folder above</span>
                  </div>
                  <button 
                    onClick={() => onOpenAddLinkModal('Uncategorized')}
                    className="flex items-center gap-1 text-primary font-bold hover:underline py-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add unfiled link</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. FLOATING ACTION BUTTON (FAB)                          */}
      {/* ======================================================== */}
      <div className="fixed bottom-24 right-5 z-40 flex items-center">
        <button 
          onClick={() => {
            playPopSound();
            onOpenAddLinkModal();
          }}
          className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_4px_16px_rgba(107,56,212,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-surface-card cursor-pointer" 
          id="floatingAddBtn" 
          title="Add New Link"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>

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
                  <span className="font-bold text-xs text-primary">🔖 Links Synced</span>
                  <span className="text-[10px] text-on-surface-variant">Live</span>
                </div>
                <p className="text-xs text-on-surface-variant">All bookmarks and folder categories are organized neatly.</p>
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
    </div>
  );
};
