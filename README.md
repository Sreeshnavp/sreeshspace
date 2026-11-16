# 🪐 Orbit — Personal Link Vault & Habit Hub

> A personal link vault, habit tracker, and idea scratchpad built for **Sreeshnav**.

🌐 **Live Web App**: [https://sreeshnavp.github.io/sreeshspace/](https://sreeshnavp.github.io/sreeshspace/)

---

## ✨ Features

- **🔗 Fluid Links & Category Bento**: Drag & drop bookmarks into customizable category folders, reorder arrangements with liquid physics.
- **🔥 GitHub Activity Timeline & Streak Command Center**: 18-week contribution heatmap with distinct insights (*Best Record*, *Today's Focus*, *Weekly Rhythm*, *Total Momentum*).
- **📋 Side-by-Side To-Do Lists**:
  - **Daily Focus (Today)**: Real-time progress bar, priority tags, and automated completed task sinking.
  - **Permanent Goals & Habits**: Long-term mastery milestones with prominent tick squares and 1-click clean archiving.
  - **Fluid Cross-Column Dragging**: Drag tasks smoothly between Daily and Permanent lists.
- **📝 Scratchpad & Pastel Notes**:
  - Reorderable note cards with highlights, tags, and multi-file attachments.
  - Dedicated **Distraction-Free Reader Mode** and clean **Editor Modal**.
- **🌙 Concentrated Theming**:
  - Serene porcelain white mode (`#FFFFFF`).
  - Deep concentrated jewel dark mode with glowing borders and WCAG AA contrast.
- **📱 PWA & Offline Ready**: Installable on iPhone, Android, and Desktop as a standalone app.
- **🎉 Sensory Delights**: Zero-dependency Web Audio synthesizers and celebratory canvas confetti pops.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Icons**: Lucide Icons
- **Animation & Physics**: Canvas Confetti + Custom Liquid CSS Curves
- **Design Intelligence**: UI/UX Pro Max (`.agents/skills/ui-ux-pro-max/`)

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Check color contrast & WCAG compliance (104 automated tests)
npm run check:colors

# Build for production
npm run build
```

---

## 🎨 Colour Guide & Semantic Tokens

Orbit implements a calm, cozy, modern palette with strict semantic token enforcement (no raw hex values in components). All colors dynamically transition via CSS custom variables on `:root` and `[data-theme="dark"]`, paired with `[data-accent]`.

### Semantic Tokens Usage Map

| Role / Element | Token | Light Value | Dark Value | WCAG Contrast |
|---|---|---|---|---|
| **Page background** | `bg-page` | `#FAF8F4` | `#151311` | — |
| **Card / Modal surface** | `bg-surface` | `#FFFFFF` | `#1E1B18` | — |
| **Popover / Dropdown** | `bg-raised` | `#FFFFFF` | `#27231F` | Elevated shadow |
| **Inset / Search / Stripes** | `bg-sunken` | `#F3EFE8` | `#100F0D` | — |
| **Subtle Divider** | `border-subtle` | `#E6DFD3` | `#332E28` | Decorative |
| **Strong Border** | `border-strong` | `#CFC5B4` | `#463F37` | Hover outlines |
| **Interactive Border** | `border-input` | `#928877` | `#7A7164` | **3.5:1** (UI AA) |
| **Primary Text** | `text-main` | `#25211C` | `#F1ECE4` | **15.1:1 / 15.8:1** |
| **Secondary Text** | `text-muted` | `#5E564B` | `#B5ACA0` | **6.8:1 / 7.7:1** |
| **Captions / Faint Text** | `text-faint` | `#746B5D` | `#8F867A` | **4.6:1 / 4.8:1** |
| **Focus Ring** | `ring` | `#2E6B96` | `#8FC4EE` | **5.7:1 / 9.2:1** |

### Accent Themes (`data-accent`)

User-selectable in Settings or the Palette menu. Retints primary buttons, focus rings, selected items, and heatmap levels:

| Theme | Light Accent | Light On-Accent | Dark Accent | Dark On-Accent |
|---|---|---|---|---|
| **Sage (Default)** | `#3C6E57` | `#FFFFFF` (5.9:1) | `#7DB89D` | `#0F1F18` (7.5:1) |
| **Peach** | `#B84A26` | `#FFFFFF` (5.2:1) | `#F29372` | `#2A0F06` (7.9:1) |
| **Wisteria** | `#6E4FA0` | `#FFFFFF` (6.4:1) | `#B79CE0` | `#1B1030` (7.6:1) |
| **Sky** | `#2A6F9E` | `#FFFFFF` (5.4:1) | `#7DB4E0` | `#0A1E2E` (7.7:1) |
| **Honey** | `#C0860A` | `#25211C` (5.1:1) | `#EDB84A` | `#2A1C00` (9.1:1) |

### Status Colors (Paired with Icons)
- **Success**: `#2F7D4F` (Light) / `#6CC48D` (Dark)
- **Warning**: `#9A5708` (Light) / `#E8B04A` (Dark)
- **Danger**: `#B93C2E` (Light) / `#F0877A` (Dark)
- **Info**: `#2F6F9F` (Light) / `#7DB4E0` (Dark)

### 8 Category Hues
Evenly weighted: `sage`, `clay`, `lavender`, `sky`, `honey`, `rose`, `teal`, `stone`. Each category provides `{ solid, soft, text }` with guaranteed $\ge 4.5:1$ text contrast over its background tint.

### In-App Design System Viewer
Visit **`/#/design`** or tap the **Palette icon** in the header to view the live interactive token reference, accent switcher, category matrix, and heatmap previews.
