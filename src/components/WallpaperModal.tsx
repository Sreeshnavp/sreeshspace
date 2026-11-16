import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Sliders, 
  Eye, 
  Sparkles,
  Check,
  Layers
} from 'lucide-react';
import { playPopSound, triggerPartyPop } from '../utils/delight';

export interface BackgroundSettings {
  opacity: number; // 0.05 to 1.0
  blur: number;    // 0 to 20
  enabled: boolean;
}

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string | null;
  settings: BackgroundSettings;
  onSaveImage: (dataUrl: string | null) => void;
  onUpdateSettings: (settings: BackgroundSettings) => void;
}

// 4 cozy ambient presets so the user can test instantly
const PRESET_WALLPAPERS = [
  {
    name: 'Zen Garden',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80',
    color: '#3C6E57',
  },
  {
    name: 'Misty Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    color: '#2A6F9E',
  },
  {
    name: 'Warm Sunset',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1600&q=80',
    color: '#B84A26',
  },
  {
    name: 'Night Sky & Stars',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    color: '#6E4FA0',
  },
];

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  currentImage,
  settings,
  onSaveImage,
  onUpdateSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image is too large (max 15 MB). Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onSaveImage(dataUrl);
        onUpdateSettings({ ...settings, enabled: true });
        triggerPartyPop('single');
        playPopSound();
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    onSaveImage(null);
    onUpdateSettings({ ...settings, enabled: false });
    playPopSound();
  };

  const handleSelectPreset = (url: string) => {
    onSaveImage(url);
    onUpdateSettings({ ...settings, enabled: true });
    triggerPartyPop('single');
    playPopSound();
  };

  const opacityPercent = Math.round(settings.opacity * 100);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-main/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl border border-subtle shadow-raised p-5 sm:p-6 space-y-5 text-main max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Grab Handle */}
        <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shadow-2xs shrink-0">
              <ImageIcon size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-main leading-tight">
                Custom Wallpaper
              </h3>
              <p className="text-xs text-muted">
                Personalize your full site background with your favorite photo
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

        {/* Upload Zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer select-none ${
              isDragging
                ? 'border-accent bg-accent-soft/30 scale-[1.01]'
                : 'border-border-input hover:border-accent bg-sunken/40 hover:bg-sunken/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-surface border border-subtle text-accent mx-auto flex items-center justify-center shadow-2xs mb-2.5">
              <Upload size={22} className="stroke-[2.2]" />
            </div>
            <p className="text-sm font-extrabold text-main mb-1">
              Click or drag & drop an image here
            </p>
            <p className="text-xs text-faint">
              Supports JPG, PNG, WEBP, GIF, SVG (up to 15 MB)
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-danger mt-2 px-1">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Current Wallpaper Preview & Quick Controls */}
        {currentImage && (
          <div className="p-4 rounded-2xl bg-sunken border border-subtle space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-16 h-12 rounded-xl bg-cover bg-center border border-subtle shadow-2xs shrink-0"
                  style={{ backgroundImage: `url(${currentImage})` }}
                />
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-main block truncate">
                    Active Background
                  </span>
                  <span className="text-[11px] text-accent font-bold">
                    Opacity: {opacityPercent}% • Blur: {settings.blur}px
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-danger hover:bg-danger-soft/20 text-xs font-bold transition cursor-pointer min-h-[44px]"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>

            {/* OPACITY SLIDER (User's Core Request) */}
            <div className="space-y-1.5 pt-2 border-t border-subtle">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-main flex items-center gap-1.5">
                  <Sliders size={13} className="text-accent" />
                  <span>Background Opacity</span>
                </span>
                <span className="font-mono font-black text-accent px-2 py-0.5 rounded-lg bg-surface border border-subtle text-xs">
                  {opacityPercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={opacityPercent}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  onUpdateSettings({ ...settings, opacity: val, enabled: true });
                }}
                className="w-full accent-accent cursor-pointer h-2 bg-surface rounded-lg appearance-none border border-subtle"
              />
              <div className="flex items-center justify-between text-[10px] text-faint px-0.5">
                <span>Subtle (5%)</span>
                <span>Balanced (25%)</span>
                <span>Vibrant (100%)</span>
              </div>
            </div>

            {/* BLUR SLIDER */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-main flex items-center gap-1.5">
                  <Layers size={13} className="text-accent" />
                  <span>Soft Blur Effect</span>
                </span>
                <span className="font-mono font-black text-muted px-2 py-0.5 rounded-lg bg-surface border border-subtle text-xs">
                  {settings.blur}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={settings.blur}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({ ...settings, blur: val });
                }}
                className="w-full accent-accent cursor-pointer h-2 bg-surface rounded-lg appearance-none border border-subtle"
              />
              <div className="flex items-center justify-between text-[10px] text-faint px-0.5">
                <span>Sharp (0px)</span>
                <span>Medium (10px)</span>
                <span>Atmospheric (20px)</span>
              </div>
            </div>
          </div>
        )}

        {/* Cozy Nature Presets */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-extrabold text-muted block">
            Or pick an ambient wallpaper preset:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_WALLPAPERS.map((preset) => {
              const isSelected = currentImage === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`relative group rounded-2xl overflow-hidden border transition-all text-left h-20 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent'
                      : 'border-subtle hover:border-strong'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${preset.url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2 text-white text-[11px] font-bold truncate flex items-center justify-between">
                    <span>{preset.name}</span>
                    {isSelected && <Check size={12} className="stroke-[3] text-emerald-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-hover text-on-accent rounded-2xl text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer min-h-[44px]"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
