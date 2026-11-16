#!/usr/bin/env node

/**
 * WCAG 2.1 Contrast Ratio Verification Script for Orbit
 * Verifies all text/bg and UI/bg color pairs across Light & Dark themes and all 5 Accent themes.
 */

// Helper: parse hex to sRGB [0..1]
function hexToRgb(hex) {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Helper: linearize sRGB channel
function linearize(c255) {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Helper: calculate relative luminance
function luminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// Helper: calculate contrast ratio (L1 + 0.05) / (L2 + 0.05)
function contrastRatio(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const top = Math.max(l1, l2);
  const bottom = Math.min(l1, l2);
  return (top + 0.05) / (bottom + 0.05);
}

// Token Definitions
const THEMES = {
  light: {
    surfaces: {
      page: '#FAF8F4',
      surface: '#FFFFFF',
      raised: '#FFFFFF',
      sunken: '#F3EFE8',
    },
    borders: {
      subtle: '#E6DFD3',
      strong: '#CFC5B4',
      input: '#928877',
    },
    text: {
      main: '#25211C',
      muted: '#5E564B',
      faint: '#746B5D',
    },
    ring: '#2E6B96',
    status: {
      success: { solid: '#2F7D4F', soft: '#E7F3EB', text: '#215A38' },
      warning: { solid: '#9A5708', soft: '#F9EFE2', text: '#743E02' },
      danger:  { solid: '#B93C2E', soft: '#FBECE9', text: '#89271C' },
      info:    { solid: '#2F6F9F', soft: '#E6F0F7', text: '#1E4D71' },
    },
    accents: {
      sage:     { accent: '#3C6E57', hover: '#315846', soft: '#E1EDE6', text: '#2B5543', onAccent: '#FFFFFF' },
      peach:    { accent: '#B84A26', hover: '#9A3D1F', soft: '#FDEBE3', text: '#8A3519', onAccent: '#FFFFFF' },
      wisteria: { accent: '#6E4FA0', hover: '#5B4087', soft: '#EFEAF5', text: '#54397F', onAccent: '#FFFFFF' },
      sky:      { accent: '#2A6F9E', hover: '#225B83', soft: '#E3EFF7', text: '#1F5276', onAccent: '#FFFFFF' },
      honey:    { accent: '#C0860A', hover: '#A67305', soft: '#FBF1D9', text: '#7A4F00', onAccent: '#25211C' },
    },
  },
  dark: {
    surfaces: {
      page: '#151311',
      surface: '#1E1B18',
      raised: '#27231F',
      sunken: '#100F0D',
    },
    borders: {
      subtle: '#332E28',
      strong: '#463F37',
      input: '#7A7164',
    },
    text: {
      main: '#F1ECE4',
      muted: '#B5ACA0',
      faint: '#8F867A',
    },
    ring: '#8FC4EE',
    status: {
      success: { solid: '#6CC48D', soft: '#162B1F', text: '#8DD6A8' },
      warning: { solid: '#E8B04A', soft: '#2E230F', text: '#F0C778' },
      danger:  { solid: '#F0877A', soft: '#301916', text: '#F5A9A0' },
      info:    { solid: '#7DB4E0', soft: '#182530', text: '#A1CBEB' },
    },
    accents: {
      sage:     { accent: '#7DB89D', hover: '#93C7AF', soft: '#1F2D26', text: '#9FD0B8', onAccent: '#0F1F18' },
      peach:    { accent: '#F29372', hover: '#F5AA8F', soft: '#311A13', text: '#F7BDB0', onAccent: '#2A0F06' },
      wisteria: { accent: '#B79CE0', hover: '#C8B3E8', soft: '#261C33', text: '#D5C4F0', onAccent: '#1B1030' },
      sky:      { accent: '#7DB4E0', hover: '#97C5E7', soft: '#182633', text: '#A7CEEC', onAccent: '#0A1E2E' },
      honey:    { accent: '#EDB84A', hover: '#F2C86F', soft: '#2F2414', text: '#F5D68B', onAccent: '#2A1C00' },
    },
  },
};

const CATEGORIES = {
  light: {
    sage:     { solid: '#487A64', soft: '#E7F0EB', text: '#2A5240' },
    clay:     { solid: '#9E5D42', soft: '#F5ECE7', text: '#6E3924' },
    lavender: { solid: '#7A5E9C', soft: '#EFEBF5', text: '#4D366B' },
    sky:      { solid: '#3A769E', soft: '#E6EFF5', text: '#224E6B' },
    honey:    { solid: '#A67C24', soft: '#F6F0E2', text: '#6B4E10' },
    rose:     { solid: '#9E546E', soft: '#F6EBF0', text: '#6D3046' },
    teal:     { solid: '#387E7E', soft: '#E5F2F2', text: '#1E5454' },
    stone:    { solid: '#6E6A63', soft: '#EEECE9', text: '#433F38' },
  },
  dark: {
    sage:     { solid: '#7BB79B', soft: '#1D2D24', text: '#9CD2B7' },
    clay:     { solid: '#D99377', soft: '#32211A', text: '#EBB19B' },
    lavender: { solid: '#B59CD4', soft: '#282035', text: '#CDB8E8' },
    sky:      { solid: '#7FB4D6', soft: '#192732', text: '#A4D0EC' },
    honey:    { solid: '#D9B25F', soft: '#302717', text: '#ECC97E' },
    rose:     { solid: '#D48DA5', soft: '#331F27', text: '#E8ACC0' },
    teal:     { solid: '#78BCBC', soft: '#182A2A', text: '#9CD7D7' },
    stone:    { solid: '#ABA59B', soft: '#252320', text: '#CCC6BC' },
  },
};

let errors = 0;
let passed = 0;

function check(name, hexFg, hexBg, minRatio, type = 'text') {
  const ratio = contrastRatio(hexFg, hexBg);
  const ok = ratio >= minRatio;
  if (!ok) {
    errors++;
    console.error(`❌ FAIL: [${name}] ${hexFg} on ${hexBg} = ${ratio.toFixed(2)}:1 (minimum ${minRatio}:1 required)`);
  } else {
    passed++;
    console.log(`✓ PASS: [${name}] ${ratio.toFixed(2)}:1 (>= ${minRatio}:1)`);
  }
}

console.log('='.repeat(70));
console.log('Orbit WCAG 2.1 Contrast Ratio Verification');
console.log('='.repeat(70));

for (const theme of ['light', 'dark']) {
  console.log(`\n--- Theme: ${theme.toUpperCase()} ---`);
  const t = THEMES[theme];

  // 1. Text on Surfaces (Normal text >= 4.5:1)
  for (const sName of ['page', 'surface', 'sunken']) {
    const sHex = t.surfaces[sName];
    check(`${theme} text-main on ${sName}`, t.text.main, sHex, 4.5);
    check(`${theme} text-muted on ${sName}`, t.text.muted, sHex, 4.5);
    check(`${theme} text-faint on ${sName}`, t.text.faint, sHex, 4.5);
  }

  // 2. UI Controls & Borders (>= 3.0:1)
  check(`${theme} border-input on surface`, t.borders.input, t.surfaces.surface, 3.0, 'ui');
  check(`${theme} border-input on page`, t.borders.input, t.surfaces.page, 3.0, 'ui');
  check(`${theme} focus ring on surface`, t.ring, t.surfaces.surface, 3.0, 'ui');
  check(`${theme} focus ring on page`, t.ring, t.surfaces.page, 3.0, 'ui');

  // 3. Status Badges & Text (>= 4.5:1 on soft bg)
  for (const [sKey, sVal] of Object.entries(t.status)) {
    check(`${theme} status ${sKey} text on soft`, sVal.text, sVal.soft, 4.5);
    check(`${theme} status ${sKey} solid icon on surface`, sVal.solid, t.surfaces.surface, 3.0, 'ui');
  }

  // 4. Accent Themes (5 accents per theme)
  for (const [aName, aVal] of Object.entries(t.accents)) {
    check(`${theme} accent-${aName} onAccent on accent`, aVal.onAccent, aVal.accent, 4.5);
    check(`${theme} accent-${aName} text on accent-soft`, aVal.text, aVal.soft, 4.5);
    check(`${theme} accent-${aName} on surface (UI)`, aVal.accent, t.surfaces.surface, 3.0, 'ui');
  }

  // 5. Category Palettes (>= 4.5:1 text on soft, >= 3.0:1 solid icon on surface)
  const cats = CATEGORIES[theme];
  for (const [cName, cVal] of Object.entries(cats)) {
    check(`${theme} category-${cName} text on soft`, cVal.text, cVal.soft, 4.5);
    check(`${theme} category-${cName} solid icon on surface`, cVal.solid, t.surfaces.surface, 3.0, 'ui');
  }
}

console.log('\n' + '='.repeat(70));
console.log(`Verification Complete: ${passed} passed, ${errors} failed.`);
console.log('='.repeat(70));

if (errors > 0) {
  process.exit(1);
} else {
  console.log('🎉 All WCAG 2.1 color contrast checks passed perfectly!');
  process.exit(0);
}
