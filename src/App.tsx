import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Sparkles, FolderPlus, Folder, ExternalLink, GripVertical, Star, Paperclip, Check, Copy, Edit3, Trash2, LayoutGrid, Link2, BookOpen } from 'lucide-react';

import type { LinkItem, CategoryInfo, Attachment, TodoItem, NoteItem, WorkspaceView } from './types';
import { 
  loadLinks, 
  saveLinks, 
  loadCategories, 
  saveCategories, 
  loadTodos,
  saveTodos,
  loadNotes,
  saveNotes,
  DEFAULT_CATEGORIES, 
  INITIAL_LINKS,
  INITIAL_TODOS,
  INITIAL_NOTES
} from './services/storage';
import { normalizeUrl, generateSuggestedTitle, getFaviconUrl, extractDomain, formatRelativeTime } from './utils/urlHelper';

import { Header } from './components/Header';
import { QuickAddBar } from './components/QuickAddBar';
import { CategoryBundleSquare } from './components/CategoryBundleSquare';
import { StandaloneLinkCard } from './components/StandaloneLinkCard';
import { FolderGridPopup } from './components/FolderGridPopup';
import { EditCategoryModal } from './components/EditCategoryModal';
import { LinkModal } from './components/LinkModal';
import { DetailModal } from './components/DetailModal';
import { ExportImportModal } from './components/ExportImportModal';
import { PwaPrompt } from './components/PwaPrompt';
import { AttachmentViewerModal } from './components/AttachmentViewerModal';
import { NotebookArea } from './components/NotebookArea';

export function App() {
  // Main Data States
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>(DEFAULT_CATEGORIES);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('both');
  const [isLoading, setIsLoading] = useState(true);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Active Dragging Link ID & Category Dragging State (for 100% reliable fluid drag-and-drop)
  const [activeDraggingLinkId, setActiveDraggingLinkId] = useState<string | null>(null);
  const [isDraggingAnyCategory, setIsDraggingAnyCategory] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark/Light Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sreeshspace_theme');
    if (saved) return saved === 'dark';
    return false; // Warm cream theme default
  });

  // Copied feedback helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Viewer
  const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');
  const [prefilledCategory, setPrefilledCategory] = useState<string>('');
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [detailLink, setDetailLink] = useState<LinkItem | null>(null);
  const [folderModalCategory, setFolderModalCategory] = useState<CategoryInfo | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPwaPromptOpen, setIsPwaPromptOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Initial Data Load
  useEffect(() => {
    async function init() {
      try {
        const [loadedLinks, loadedCats, loadedTodos, loadedNotes] = await Promise.all([
          loadLinks(),
          loadCategories(),
          loadTodos(),
          loadNotes(),
        ]);
        setLinks(loadedLinks);
        setCategories(loadedCats);
        setTodos(loadedTodos);
        setNotes(loadedNotes);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Theme Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sreeshspace_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sreeshspace_theme', 'light');
    }
  }, [darkMode]);

  // PWA install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsPwaPromptOpen(false);
      }
    }
  };

  // Keyboard shortcut: Ctrl+K or / to search, N to add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(
        (document.activeElement?.tagName || '').toUpperCase()
      );
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        (document.querySelector('header input') as HTMLInputElement | null)?.focus();
      } else if (!isInput && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setEditingLink(null);
        setPrefilledUrl('');
        setPrefilledCategory('Uncategorized');
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Separate links into Standalone/Loose links and Categorized links
  const { standaloneLinks, searchFilteredLinks } = useMemo(() => {
    const catNameSet = new Set(categories.map((c) => c.name.toLowerCase()));
    
    // Standalone links on the canvas
    const standalone = links.filter((l) => {
      const cat = (l.category || '').toLowerCase();
      return !cat || cat === 'uncategorized' || !catNameSet.has(cat);
    });

    let searchResults: LinkItem[] = [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      searchResults = links.filter((l) => {
        const inTitle = (l.title || '').toLowerCase().includes(q);
        const inUrl = (l.url || '').toLowerCase().includes(q);
        const inNotes = (l.notes || '').toLowerCase().includes(q);
        const inCat = (l.category || '').toLowerCase().includes(q);
        return inTitle || inUrl || inNotes || inCat;
      });
    }

    return {
      standaloneLinks: standalone,
      searchFilteredLinks: searchResults,
    };
  }, [links, categories, searchQuery]);

  // Quick 1-click Add -> Saves directly to canvas
  const handleQuickAdd = async (url: string, suggestedTitle?: string) => {
    const normalized = normalizeUrl(url);
    const newLink: LinkItem = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: normalized,
      title: suggestedTitle || generateSuggestedTitle(normalized),
      category: 'Uncategorized',
      notes: '',
      pinned: false,
      attachments: [],
      clicks: 0,
      favicon: getFaviconUrl(normalized),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newLink, ...links];
    setLinks(updated);
    await saveLinks(updated);

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    showToast('Saved to your canvas! Drag into any folder above ✨');
  };

  // Save Link from Modal
  const handleSaveLink = async (linkData: Partial<LinkItem>) => {
    let updated: LinkItem[];

    if (editingLink) {
      updated = links.map((l) =>
        l.id === editingLink.id
          ? ({ ...l, ...linkData, updatedAt: new Date().toISOString() } as LinkItem)
          : l
      );
    } else {
      const newLink: LinkItem = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url: linkData.url || '',
        title: linkData.title || '',
        category: linkData.category || 'Uncategorized',
        notes: linkData.notes || '',
        pinned: linkData.pinned || false,
        attachments: linkData.attachments || [],
        clicks: 0,
        favicon: linkData.favicon || getFaviconUrl(linkData.url || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newLink, ...links];
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
      showToast('Saved to your vault! 🌸');
    }

    setLinks(updated);
    await saveLinks(updated);
    setEditingLink(null);
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    await saveLinks(updated);
    if (detailLink?.id === id) {
      setDetailLink(null);
    }
    showToast('Bookmark deleted');
  };

  // Toggle Pin
  const handleTogglePin = async (id: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, pinned: !l.pinned, updatedAt: new Date().toISOString() } : l
    );
    setLinks(updated);
    await saveLinks(updated);
    if (detailLink?.id === id) {
      setDetailLink(updated.find((l) => l.id === id) || null);
    }
  };

  // Click tracking
  const handleVisitLink = async (link: LinkItem) => {
    const updated = links.map((l) =>
      l.id === link.id ? { ...l, clicks: (l.clicks || 0) + 1 } : l
    );
    setLinks(updated);
    await saveLinks(updated);
  };

  // DRAG & DROP ONTO CATEGORY SQUARE: 100% reliable
  const handleDropLinkOnCategory = async (linkId: string, targetCategoryName: string) => {
    setActiveDraggingLinkId(null);
    const targetLink = links.find((l) => l.id === linkId);
    if (!targetLink) return;

    if (targetLink.category.toLowerCase() === targetCategoryName.toLowerCase()) {
      return;
    }

    const updated = links.map((l) =>
      l.id === linkId
        ? { ...l, category: targetCategoryName, updatedAt: new Date().toISOString() }
        : l
    );

    setLinks(updated);
    await saveLinks(updated);

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    showToast(`Filed "${targetLink.title}" into ${targetCategoryName}! 📂`);
  };

  // Reorder Category Squares by dragging
  const handleReorderCategory = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setCategories(reordered);
    await saveCategories(reordered);
    showToast('Categories reordered! ✨');
  };

  // Move link directly to another category (from inside popup or backdrop drop)
  const handleMoveLinkCategory = async (linkId: string, newCategoryName: string) => {
    const updated = links.map((l) =>
      l.id === linkId ? { ...l, category: newCategoryName } : l
    );
    setLinks(updated);
    await saveLinks(updated);
    showToast(newCategoryName === 'Uncategorized' ? 'Moved to Home canvas! 📎' : `Moved to ${newCategoryName}! ✨`);
  };

  // Reorder links inside a category folder (from inside popup)
  const handleReorderLinksInCategory = async (reorderedLinks: LinkItem[]) => {
    setLinks(reorderedLinks);
    await saveLinks(reorderedLinks);
  };

  // Add Category Bundle
  const handleAddCategory = async (newCat: { name: string; color: string; icon?: string }) => {
    const id = `cat-${Date.now()}`;
    const updated = [...categories, { id, name: newCat.name, color: newCat.color, icon: newCat.icon || '📁' }];
    setCategories(updated);
    await saveCategories(updated);
    showToast(`Created folder "${newCat.name}"! 🌸`);
  };

  // Save / Rename Category
  const handleSaveCategory = async (updatedCat: CategoryInfo) => {
    const oldCat = categories.find((c) => c.id === updatedCat.id);
    const updatedCats = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));

    let updatedLinks = links;
    if (oldCat && oldCat.name !== updatedCat.name) {
      updatedLinks = links.map((l) =>
        l.category.toLowerCase() === oldCat.name.toLowerCase()
          ? { ...l, category: updatedCat.name }
          : l
      );
      setLinks(updatedLinks);
      await saveLinks(updatedLinks);
    }

    setCategories(updatedCats);
    await saveCategories(updatedCats);

    if (folderModalCategory?.id === updatedCat.id) {
      setFolderModalCategory(updatedCat);
    }

    showToast(`Updated "${updatedCat.name}"! ✨`);
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, catName: string) => {
    const remainingCats = categories.filter((c) => c.id !== catId);

    const updatedLinks = links.map((l) =>
      l.category.toLowerCase() === catName.toLowerCase()
        ? { ...l, category: 'Uncategorized' }
        : l
    );

    setLinks(updatedLinks);
    setCategories(remainingCats);
    await saveLinks(updatedLinks);
    await saveCategories(remainingCats);

    if (folderModalCategory?.id === catId) {
      setFolderModalCategory(null);
    }

    showToast(`Folder removed. Bookmarks moved to canvas.`);
  };

  // --- TODO HANDLERS ---
  const handleAddTodo = async (
    text: string, 
    type: 'daily' | 'permanent' = 'daily', 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      type,
      date: new Date().toISOString().slice(0, 10),
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTodo, ...todos];
    setTodos(updated);
    await saveTodos(updated);
    showToast(`Added ${type === 'daily' ? 'daily task' : 'permanent goal'} "${text}"! 📋`);
  };

  const handleToggleTodo = async (id: string) => {
    const updated = todos.map((t) =>
      t.id === id
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : undefined,
          }
        : t
    );
    setTodos(updated);
    await saveTodos(updated);
  };

  const handleDeleteTodo = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    await saveTodos(updated);
    showToast('Task removed');
  };

  const handleClearCompletedDaily = async () => {
    const updated = todos.filter((t) => !(t.type === 'daily' && t.completed));
    setTodos(updated);
    await saveTodos(updated);
    showToast('Cleared completed daily tasks ✨');
  };

  const handleClearCompletedPermanent = async () => {
    const updated = todos.filter((t) => !(t.type === 'permanent' && t.completed));
    setTodos(updated);
    await saveTodos(updated);
    showToast('Cleared completed permanent goals 🎯');
  };

  const handleReorderTodos = async (reordered: TodoItem[]) => {
    setTodos(reordered);
    await saveTodos(reordered);
  };

  // --- NOTE HANDLERS ---
  const handleAddNote = async (newNote: { 
    title: string; 
    content: string; 
    highlight?: string;
    color: string; 
    pinned: boolean;
    attachments?: Attachment[];
  }) => {
    const item: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newNote.title,
      content: newNote.content,
      highlight: newNote.highlight,
      color: newNote.color,
      pinned: newNote.pinned,
      attachments: newNote.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [item, ...notes];
    setNotes(updated);
    await saveNotes(updated);
    showToast(`Saved note "${item.title}"! 📝`);
  };

  const handleUpdateNote = async (updatedNote: NoteItem) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updated);
    await saveNotes(updated);
    showToast('Note updated! ✨');
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    await saveNotes(updated);
    showToast('Note deleted');
  };

  const handleReorderNotes = async (reordered: NoteItem[]) => {
    setNotes(reordered);
    await saveNotes(reordered);
  };

  // Import Backup
  const handleImportData = async (data: { 
    links: LinkItem[]; 
    categories: CategoryInfo[];
    todos?: TodoItem[];
    notes?: NoteItem[];
  }) => {
    const existingUrls = new Set(links.map((l) => l.url.toLowerCase()));
    const newItems = data.links.filter((l) => !existingUrls.has(l.url.toLowerCase()));
    const finalLinks = [...newItems, ...links];

    const existingCats = new Set(categories.map((c) => c.name.toLowerCase()));
    const newCats = data.categories.filter((c) => !existingCats.has(c.name.toLowerCase()));
    const finalCats = [...categories, ...newCats];

    setLinks(finalLinks);
    setCategories(finalCats);
    await saveLinks(finalLinks);
    await saveCategories(finalCats);

    if (data.todos && Array.isArray(data.todos)) {
      setTodos(data.todos);
      await saveTodos(data.todos);
    }
    if (data.notes && Array.isArray(data.notes)) {
      setNotes(data.notes);
      await saveNotes(data.notes);
    }

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    showToast('Import successful! 🎉');
  };

  // Reset to Sample Data
  const handleResetData = async () => {
    setLinks(INITIAL_LINKS);
    setCategories(DEFAULT_CATEGORIES);
    setTodos(INITIAL_TODOS);
    setNotes(INITIAL_NOTES);
    await saveLinks(INITIAL_LINKS);
    await saveCategories(DEFAULT_CATEGORIES);
    await saveTodos(INITIAL_TODOS);
    await saveNotes(INITIAL_NOTES);
    showToast('Reset to cozy defaults! 🌿');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-espresso-950 flex flex-col font-sans transition-colors duration-200">
      
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => {
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory('Uncategorized');
          setIsAddModalOpen(true);
        }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenPwaGuide={() => setIsPwaPromptOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        totalCount={links.length}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-espresso-900/90 dark:bg-cream-100/90 text-white dark:text-espresso-900 px-4 py-2 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Single Screen Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        
        {/* Quick Add Bar */}
        <QuickAddBar
          onQuickAdd={handleQuickAdd}
          onOpenDetailedModal={(url) => {
            setEditingLink(null);
            setPrefilledUrl(url || '');
            setPrefilledCategory('Uncategorized');
            setIsAddModalOpen(true);
          }}
        />

        {/* IF SEARCHING: Show Live Search Results */}
        {searchQuery.trim() ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-espresso-900 dark:text-cream-50">
                Search results for "{searchQuery}" ({searchFilteredLinks.length})
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sage-700 dark:text-sage-300 font-semibold hover:underline"
              >
                Clear search
              </button>
            </div>

            {searchFilteredLinks.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-espresso-850 border border-cream-300 dark:border-espresso-800">
                <p className="text-sm font-bold text-espresso-800 dark:text-cream-100 mb-1">
                  No matching links found
                </p>
                <p className="text-xs text-espresso-800/50 dark:text-cream-100/50">
                  Try searching with a different keyword or clear search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
                {searchFilteredLinks.map((link) => (
                  <StandaloneLinkCard
                    key={link.id}
                    link={link}
                    onSelect={(l) => setDetailLink(l)}
                    onTogglePin={handleTogglePin}
                    onVisit={handleVisitLink}
                    onOpenAttachment={(att) => setActiveAttachment(att)}
                    onDragStart={(e, id) => {
                      setActiveDraggingLinkId(id);
                      e.dataTransfer.setData('text/plain', id);
                      e.dataTransfer.setData('application/link-id', id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setActiveDraggingLinkId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MAIN WORKSPACE CANVAS: VIEW SWITCHER + LINKS + NOTEBOOK & TASKS */
          <div className="space-y-6">

            {/* Workspace View Switcher: All-in-One vs Links vs Notebook */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-cream-200/50 dark:bg-espresso-900/50 border border-cream-200/80 dark:border-espresso-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWorkspaceView('both')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceView === 'both'
                      ? 'bg-white dark:bg-espresso-800 text-espresso-900 dark:text-cream-50 shadow-2xs font-extrabold'
                      : 'text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-900 dark:hover:text-cream-50'
                  }`}
                >
                  <LayoutGrid size={13} className="stroke-[2.2]" />
                  <span>All-in-One</span>
                </button>
                <button
                  onClick={() => setWorkspaceView('links')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceView === 'links'
                      ? 'bg-white dark:bg-espresso-800 text-espresso-900 dark:text-cream-50 shadow-2xs font-extrabold'
                      : 'text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-900 dark:hover:text-cream-50'
                  }`}
                >
                  <Link2 size={13} className="stroke-[2.2]" />
                  <span>Links ({links.length})</span>
                </button>
                <button
                  onClick={() => setWorkspaceView('notebook')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceView === 'notebook'
                      ? 'bg-white dark:bg-espresso-800 text-espresso-900 dark:text-cream-50 shadow-2xs font-extrabold'
                      : 'text-espresso-800/60 dark:text-cream-100/60 hover:text-espresso-900 dark:hover:text-cream-50'
                  }`}
                >
                  <BookOpen size={13} className="stroke-[2.2]" />
                  <span>Notebook & Tasks ({todos.filter(t => !t.completed).length})</span>
                </button>
              </div>
            </div>
            
            {/* 1. LINKS SECTION (Category Bundles + Loose Bookmarks) */}
            {(workspaceView === 'both' || workspaceView === 'links') && (
              <div className="space-y-4">
                {/* Toolbar Header with Small "+ New Folder" Button */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">🔗</span>
                    <h2 className="font-extrabold text-base sm:text-lg text-espresso-900 dark:text-cream-50">
                      Links
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream-200 dark:bg-espresso-800 text-espresso-800/70 dark:text-cream-100/70 font-mono font-bold">
                      {links.length}
                    </span>
                  </div>

                  {/* Small cute button on the side to create a category */}
                  <button
                    onClick={() => {
                      const name = prompt('Enter a name for the new folder:');
                      if (name && name.trim()) {
                        handleAddCategory({
                          name: name.trim(),
                          color: '#4e876c',
                          icon: '📁',
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-espresso-850 hover:bg-cream-200 dark:hover:bg-espresso-800 border border-cream-300 dark:border-espresso-750 text-xs font-bold text-sage-700 dark:text-sage-300 shadow-2xs transition-all active:scale-95"
                  >
                    <Plus size={13} className="stroke-[2.5]" />
                    <span>New Folder</span>
                  </button>
                </div>

                {/* UNIFIED SYMMETRICAL GRID: Category Squares AND Standalone Bookmarks all in one view! */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
                  
                  {/* Category Bundle Squares */}
                  {categories.map((category, index) => (
                    <CategoryBundleSquare
                      key={category.id || category.name}
                      category={category}
                      links={links}
                      index={index}
                      activeDraggingLinkId={activeDraggingLinkId}
                      onOpenFolder={(cat) => setFolderModalCategory(cat)}
                      onEditCategory={(cat) => setEditingCategory(cat)}
                      onDropLink={handleDropLinkOnCategory}
                      onReorderCategory={handleReorderCategory}
                      onStartDragCategory={() => setIsDraggingAnyCategory(true)}
                      onEndDragCategory={() => setIsDraggingAnyCategory(false)}
                      isDraggingAnyCategory={isDraggingAnyCategory}
                    />
                  ))}

                  {/* Standalone Bookmarks sitting right in the same canvas */}
                  {standaloneLinks.map((link) => (
                    <StandaloneLinkCard
                      key={link.id}
                      link={link}
                      onSelect={(l) => setDetailLink(l)}
                      onTogglePin={handleTogglePin}
                      onVisit={handleVisitLink}
                      onOpenAttachment={(att) => setActiveAttachment(att)}
                      onDragStart={(e, id) => {
                        setActiveDraggingLinkId(id);
                        e.dataTransfer.setData('text/plain', id);
                        e.dataTransfer.setData('application/link-id', id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setActiveDraggingLinkId(null)}
                    />
                  ))}

                </div>
              </div>
            )}

            {/* 2. NOTEBOOK & TASKS SECTION: Daily Focus + Permanent Goals + Detailed GitHub Heatmap + Scratchpad Notes */}
            {(workspaceView === 'both' || workspaceView === 'notebook') && (
              <div className="pt-2">
                <NotebookArea
                  links={links}
                  todos={todos}
                  notes={notes}
                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onClearCompletedDaily={handleClearCompletedDaily}
                  onClearCompletedPermanent={handleClearCompletedPermanent}
                  onReorderTodos={handleReorderTodos}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onReorderNotes={handleReorderNotes}
                  onOpenAttachment={(att) => setActiveAttachment(att)}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory('Uncategorized');
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-5 right-5 sm:hidden z-40 w-13 h-13 rounded-full bg-sage-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Add Bookmark"
      >
        <Plus size={24} className="stroke-[2.5]" />
      </button>

      {/* MODALS */}

      {/* Link Creation / Editing Modal */}
      <LinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory('');
        }}
        onSave={handleSaveLink}
        initialData={editingLink}
        categories={categories}
        onAddCategory={handleAddCategory}
        defaultUrl={prefilledUrl}
        defaultCategory={prefilledCategory}
      />

      {/* Link Detail Reader Modal */}
      <DetailModal
        link={detailLink}
        onClose={() => setDetailLink(null)}
        onEdit={(l) => {
          setDetailLink(null);
          setEditingLink(l);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteLink}
        onTogglePin={handleTogglePin}
        onVisit={handleVisitLink}
        onOpenAttachment={(att) => setActiveAttachment(att)}
        categories={categories}
      />

      {/* Category Square Folder POPUP (Grid of Cards inside + Reordering + Move!) */}
      <FolderGridPopup
        category={folderModalCategory}
        links={links}
        allCategories={categories}
        onClose={() => setFolderModalCategory(null)}
        onOpenLinkDetail={(l) => {
          setFolderModalCategory(null);
          setDetailLink(l);
        }}
        onEditLink={(l) => {
          setEditingLink(l);
          setIsAddModalOpen(true);
        }}
        onDeleteLink={handleDeleteLink}
        onTogglePin={handleTogglePin}
        onVisitLink={handleVisitLink}
        onOpenAttachment={(att) => setActiveAttachment(att)}
        onAddNewLinkToCategory={(catName) => {
          setEditingLink(null);
          setPrefilledUrl('');
          setPrefilledCategory(catName);
          setIsAddModalOpen(true);
        }}
        onEditCategory={(cat) => setEditingCategory(cat)}
        onMoveLinkCategory={handleMoveLinkCategory}
        onReorderLinksInCategory={handleReorderLinksInCategory}
      />

      {/* Top-Level High-Z Attachment Viewer (Floats above current tab without going back!) */}
      <AttachmentViewerModal
        attachment={activeAttachment}
        onClose={() => setActiveAttachment(null)}
      />

      {/* Edit / Rename Category Modal */}
      <EditCategoryModal
        isOpen={Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Backup and Sync Modal */}
      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        links={links}
        categories={categories}
        todos={todos}
        notes={notes}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* PWA / App Install Modal */}
      <PwaPrompt
        isOpen={isPwaPromptOpen}
        onClose={() => setIsPwaPromptOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallClick={handleInstallPwa}
      />

    </div>
  );
}

export default App;
