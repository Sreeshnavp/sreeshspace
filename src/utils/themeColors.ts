// Semantic tokens authority for Categories, Folders, and Notes

export type CategoryKey = 'sage' | 'clay' | 'lavender' | 'sky' | 'honey' | 'rose' | 'teal' | 'stone';

export interface CategoryToken {
  key: CategoryKey;
  name: string;
  solidClass: string;
  softClass: string;
  textClass: string;
  solidVar: string;
  softVar: string;
  textVar: string;
}

export const CATEGORY_KEYS: CategoryKey[] = [
  'sage',
  'clay',
  'lavender',
  'sky',
  'honey',
  'rose',
  'teal',
  'stone',
];

export const CATEGORY_TOKENS: Record<CategoryKey, CategoryToken> = {
  sage: {
    key: 'sage',
    name: 'Sage',
    solidClass: 'bg-cat-sage-solid',
    softClass: 'bg-cat-sage-soft',
    textClass: 'text-cat-sage-text',
    solidVar: 'rgb(var(--cat-sage-solid))',
    softVar: 'rgb(var(--cat-sage-soft))',
    textVar: 'rgb(var(--cat-sage-text))',
  },
  clay: {
    key: 'clay',
    name: 'Clay',
    solidClass: 'bg-cat-clay-solid',
    softClass: 'bg-cat-clay-soft',
    textClass: 'text-cat-clay-text',
    solidVar: 'rgb(var(--cat-clay-solid))',
    softVar: 'rgb(var(--cat-clay-soft))',
    textVar: 'rgb(var(--cat-clay-text))',
  },
  lavender: {
    key: 'lavender',
    name: 'Lavender',
    solidClass: 'bg-cat-lavender-solid',
    softClass: 'bg-cat-lavender-soft',
    textClass: 'text-cat-lavender-text',
    solidVar: 'rgb(var(--cat-lavender-solid))',
    softVar: 'rgb(var(--cat-lavender-soft))',
    textVar: 'rgb(var(--cat-lavender-text))',
  },
  sky: {
    key: 'sky',
    name: 'Sky',
    solidClass: 'bg-cat-sky-solid',
    softClass: 'bg-cat-sky-soft',
    textClass: 'text-cat-sky-text',
    solidVar: 'rgb(var(--cat-sky-solid))',
    softVar: 'rgb(var(--cat-sky-soft))',
    textVar: 'rgb(var(--cat-sky-text))',
  },
  honey: {
    key: 'honey',
    name: 'Honey',
    solidClass: 'bg-cat-honey-solid',
    softClass: 'bg-cat-honey-soft',
    textClass: 'text-cat-honey-text',
    solidVar: 'rgb(var(--cat-honey-solid))',
    softVar: 'rgb(var(--cat-honey-soft))',
    textVar: 'rgb(var(--cat-honey-text))',
  },
  rose: {
    key: 'rose',
    name: 'Rose',
    solidClass: 'bg-cat-rose-solid',
    softClass: 'bg-cat-rose-soft',
    textClass: 'text-cat-rose-text',
    solidVar: 'rgb(var(--cat-rose-solid))',
    softVar: 'rgb(var(--cat-rose-soft))',
    textVar: 'rgb(var(--cat-rose-text))',
  },
  teal: {
    key: 'teal',
    name: 'Teal',
    solidClass: 'bg-cat-teal-solid',
    softClass: 'bg-cat-teal-soft',
    textClass: 'text-cat-teal-text',
    solidVar: 'rgb(var(--cat-teal-solid))',
    softVar: 'rgb(var(--cat-teal-soft))',
    textVar: 'rgb(var(--cat-teal-text))',
  },
  stone: {
    key: 'stone',
    name: 'Stone',
    solidClass: 'bg-cat-stone-solid',
    softClass: 'bg-cat-stone-soft',
    textClass: 'text-cat-stone-text',
    solidVar: 'rgb(var(--cat-stone-solid))',
    softVar: 'rgb(var(--cat-stone-soft))',
    textVar: 'rgb(var(--cat-stone-text))',
  },
};

export function resolveCategoryKey(input?: string): CategoryKey {
  if (!input) return 'sage';
  const val = input.toLowerCase();

  for (const k of CATEGORY_KEYS) {
    if (val === k || val.includes(k)) return k;
  }

  // Legacy hex mappings
  if (val.includes('4e876c') || val.includes('e1ed') || val.includes('f0f7') || val.includes('cde4')) return 'sage';
  if (val.includes('f7885e') || val.includes('ee7751') || val.includes('b74422') || val.includes('peach') || val.includes('apricot')) return 'clay';
  if (val.includes('aa73d7') || val.includes('8e6eb4') || val.includes('wisteria') || val.includes('purple')) return 'lavender';
  if (val.includes('38bdf8') || val.includes('4597de') || val.includes('2c79c5') || val.includes('sky') || val.includes('blue')) return 'sky';
  if (val.includes('f59e0b') || val.includes('honey') || val.includes('amber') || val.includes('warm')) return 'honey';
  if (val.includes('ec4899') || val.includes('e64980') || val.includes('rose') || val.includes('pink')) return 'rose';
  if (val.includes('teal') || val.includes('cyan') || val.includes('green')) return 'teal';

  return 'stone';
}

export function getCategoryToken(input?: string): CategoryToken {
  return CATEGORY_TOKENS[resolveCategoryKey(input)];
}

// Note Themes interface for backward compatibility & rich semantics
export interface NoteColorTheme {
  key: CategoryKey;
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  solidVar: string;
  softVar: string;
  textVar: string;
}

export const NOTE_THEMES: Record<CategoryKey, NoteColorTheme> = Object.fromEntries(
  CATEGORY_KEYS.map((k) => [
    k,
    {
      key: k,
      name: CATEGORY_TOKENS[k].name,
      bgClass: CATEGORY_TOKENS[k].softClass,
      textClass: CATEGORY_TOKENS[k].textClass,
      borderClass: 'border-subtle',
      solidVar: CATEGORY_TOKENS[k].solidVar,
      softVar: CATEGORY_TOKENS[k].softVar,
      textVar: CATEGORY_TOKENS[k].textVar,
    },
  ])
) as Record<CategoryKey, NoteColorTheme>;

export function getConcentratedNoteTheme(color?: string): NoteColorTheme {
  const key = resolveCategoryKey(color);
  return NOTE_THEMES[key];
}
