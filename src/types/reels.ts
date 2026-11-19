export interface ReelItem {
  id: string;
  url: string; // Canonical Instagram URL (e.g., https://www.instagram.com/reel/C8xyz123/)
  shortcode: string; // The reel media shortcode (e.g., C8xyz123)
  headline?: string; // User's custom headline / title for this reel
  caption?: string; // Original Instagram caption or shared text
  takeaway?: string; // Key takeaway / highlight notes
  author?: string; // e.g. @creators
  tags?: string[]; // e.g. ['recipe', 'matcha', 'healthy']
  collection?: string; // e.g. 'Recipes', 'Fitness', 'Coding', 'Aesthetic', 'Inspo'
  favorite?: boolean;
  thumbnailUrl?: string; // Optional custom or fallback poster image
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export type ReelViewMode = 'grid' | 'feed';
export type ReelFilter = 'all' | 'favorites' | string;
