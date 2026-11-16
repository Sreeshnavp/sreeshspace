// Helper for concentrated, rich jewel theme colors in dark mode and serene pastels in light mode

export interface NoteColorTheme {
  name: string;
  lightBg: string;
  lightBorder: string;
  lightText: string;
  lightHighlightBg: string;
  lightHighlightText: string;
  darkBg: string;
  darkBorder: string;
  darkText: string;
  darkHighlightBg: string;
  darkHighlightText: string;
  accent: string;
}

export const NOTE_THEMES: Record<string, NoteColorTheme> = {
  sage: {
    name: 'Matcha Sage',
    lightBg: '#f0f7f3',
    lightBorder: '#cde4d6',
    lightText: '#142a1f',
    lightHighlightBg: '#e1ede6',
    lightHighlightText: '#23533c',
    darkBg: '#0e241b',
    darkBorder: '#235e44',
    darkText: '#bbf0d8',
    darkHighlightBg: '#183c2e',
    darkHighlightText: '#5be4a7',
    accent: '#4e876c',
  },
  peach: {
    name: 'Apricot Peach',
    lightBg: '#fff4ef',
    lightBorder: '#fddbcf',
    lightText: '#3a1a11',
    lightHighlightBg: '#feeddf',
    lightHighlightText: '#7a311d',
    darkBg: '#2d160f',
    darkBorder: '#6d311f',
    darkText: '#ffd0be',
    darkHighlightBg: '#441f14',
    darkHighlightText: '#ff9c78',
    accent: '#ee7751',
  },
  honey: {
    name: 'Warm Honey',
    lightBg: '#fff9ec',
    lightBorder: '#fde8b8',
    lightText: '#352409',
    lightHighlightBg: '#fef5e1',
    lightHighlightText: '#7b5711',
    darkBg: '#281d09',
    darkBorder: '#604513',
    darkText: '#fee3a2',
    darkHighlightBg: '#3d2c0e',
    darkHighlightText: '#fbbd41',
    accent: '#f59e0b',
  },
  lavender: {
    name: 'Lavender Wisteria',
    lightBg: '#f6f2fa',
    lightBorder: '#e2d6ef',
    lightText: '#2b1b3d',
    lightHighlightBg: '#efeaf5',
    lightHighlightText: '#583679',
    darkBg: '#221430',
    darkBorder: '#562f7e',
    darkText: '#e8d4fc',
    darkHighlightBg: '#361c4f',
    darkHighlightText: '#cc9cff',
    accent: '#8e6eb4',
  },
  sky: {
    name: 'Sky Ice Blue',
    lightBg: '#f1f8fc',
    lightBorder: '#cce7f7',
    lightText: '#102737',
    lightHighlightBg: '#e1f2fb',
    lightHighlightText: '#1d5479',
    darkBg: '#0e2030',
    darkBorder: '#1e4d75',
    darkText: '#bfe4fd',
    darkHighlightBg: '#17344e',
    darkHighlightText: '#5ec2fb',
    accent: '#4597de',
  },
  rose: {
    name: 'Rose Quartz',
    lightBg: '#fdf2f6',
    lightBorder: '#fcd3e1',
    lightText: '#371321',
    lightHighlightBg: '#feebe6',
    lightHighlightText: '#872a4e',
    darkBg: '#2d111e',
    darkBorder: '#6c2242',
    darkText: '#fec9de',
    darkHighlightBg: '#45162c',
    darkHighlightText: '#fb6a9f',
    accent: '#e64980',
  },
};

// Match arbitrary hex color to nearest theme or return fallback
export function getConcentratedNoteTheme(hex?: string): NoteColorTheme {
  if (!hex) return NOTE_THEMES.sage;

  const h = hex.toLowerCase();
  if (h.includes('e1ed') || h.includes('f0f7') || h.includes('c5dc') || h.includes('matcha') || h.includes('sage')) {
    return NOTE_THEMES.sage;
  }
  if (h.includes('feed') || h.includes('fff4') || h.includes('fddb') || h.includes('peach') || h.includes('apricot')) {
    return NOTE_THEMES.peach;
  }
  if (h.includes('fef5') || h.includes('fff9') || h.includes('fde8') || h.includes('honey') || h.includes('amber')) {
    return NOTE_THEMES.honey;
  }
  if (h.includes('efea') || h.includes('f6f2') || h.includes('e2d6') || h.includes('lavender') || h.includes('wisteria')) {
    return NOTE_THEMES.lavender;
  }
  if (h.includes('e1f2') || h.includes('f1f8') || h.includes('cce7') || h.includes('sky') || h.includes('blue')) {
    return NOTE_THEMES.sky;
  }
  if (h.includes('feeb') || h.includes('fdf2') || h.includes('fcd3') || h.includes('rose') || h.includes('pink')) {
    return NOTE_THEMES.rose;
  }

  return NOTE_THEMES.sage;
}
