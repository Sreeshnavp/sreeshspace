/**
 * Utilities for extracting, formatting, and embedding Instagram Reels & Posts
 */

export interface ParsedInstagramReel {
  canonicalUrl: string;
  embedUrl: string;
  shortcode: string;
  author?: string;
  suggestedCaption?: string;
  suggestedHeadline?: string;
  thumbnailUrl: string;
}

// Regex matching various Instagram URL formats:
// - instagram.com/reel/SHORTCODE/
// - instagram.com/reels/SHORTCODE/
// - instagram.com/p/SHORTCODE/
// - instagram.com/tv/SHORTCODE/
// - instagram.com/share/reel/SHORTCODE/
const INSTAGRAM_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i;
const AUTHOR_HANDLE_REGEX = /@([A-Za-z0-9_.]+)/;

/**
 * Checks if a string contains an Instagram reel/post URL
 */
export function isInstagramReelUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return INSTAGRAM_URL_REGEX.test(text.trim());
}

/**
 * Extracts shortcode, canonical URL, embed URL, author, and caption from shared text or URL
 */
export function extractInstagramReelInfo(input: string): ParsedInstagramReel | null {
  if (!input || typeof input !== 'string') return null;

  const match = input.match(INSTAGRAM_URL_REGEX);
  if (!match || !match[1]) return null;

  const shortcode = match[1];
  const canonicalUrl = `https://www.instagram.com/reel/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/`;

  // Detect author handle like "@foodie" in the shared text
  const authorMatch = input.match(AUTHOR_HANDLE_REGEX);
  const author = authorMatch ? `@${authorMatch[1]}` : undefined;

  // Clean remaining text as suggested caption (strip the URL itself)
  const remainingText = input
    .replace(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s]+/gi, '')
    .trim();

  const suggestedCaption = remainingText.length > 0 ? remainingText : undefined;

  // Generate a clean headline from the first few words or author if available
  let suggestedHeadline: string | undefined = undefined;
  if (suggestedCaption) {
    const firstLine = suggestedCaption.split('\n')[0].trim();
    if (firstLine.length > 0) {
      suggestedHeadline = firstLine.length > 40 ? `${firstLine.slice(0, 37)}...` : firstLine;
    }
  } else if (author) {
    suggestedHeadline = `Reel by ${author}`;
  } else {
    suggestedHeadline = `Instagram Reel (${shortcode.slice(0, 6)})`;
  }

  const thumbnailUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;

  return {
    canonicalUrl,
    embedUrl,
    shortcode,
    author,
    suggestedCaption,
    suggestedHeadline,
    thumbnailUrl,
  };
}

/**
 * Get Instagram cover photo / media thumbnail URL
 * Instagram redirects /media/?size=l to the CDN image
 */
export function getInstagramThumbnailUrl(shortcode: string, size: 't' | 'm' | 'l' = 'l'): string {
  return `https://www.instagram.com/p/${shortcode}/media/?size=${size}`;
}

/**
 * Get direct web and deep link URL for Instagram
 */
export function getInstagramDirectUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/`;
}

/**
 * Get embed URL for iframe
 */
export function getInstagramEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/embed/`;
}
