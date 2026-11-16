/**
 * Orbit Design System Tokens (Single Source of Truth)
 * Values strictly match scripts/check-contrast.mjs and index.css
 */

export const THEME_TOKENS = {
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
} as const;

export const CATEGORY_PALETTES = {
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
} as const;

export const CONFETTI_COLORS = [
  THEME_TOKENS.light.accents.sage.accent,
  THEME_TOKENS.light.accents.peach.accent,
  THEME_TOKENS.light.accents.wisteria.accent,
  THEME_TOKENS.light.accents.sky.accent,
  THEME_TOKENS.light.accents.honey.accent,
];

export const STAR_COLORS = [
  THEME_TOKENS.light.accents.honey.accent,
  THEME_TOKENS.light.status.warning.solid,
  THEME_TOKENS.dark.accents.honey.accent,
];
