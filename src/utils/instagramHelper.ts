/**
 * Utilities for extracting, formatting, embedding, and resolving Instagram Reels & Posts
 */

import type { ReelItem } from '../types/reels';

export interface ParsedInstagramReel {
  canonicalUrl: string;
  embedUrl: string;
  shortcode: string;
  author?: string;
  suggestedCaption?: string;
  suggestedHeadline?: string;
  thumbnailUrl: string;
}

export interface ResolvedInstagramMetadata {
  thumbnailUrl: string;
  title?: string;
  author?: string;
  width?: number;
  height?: number;
  shortcode?: string;
}

// Regex matching various Instagram URL formats:
// - instagram.com/reel/SHORTCODE/
// - instagram.com/reels/SHORTCODE/
// - instagram.com/p/SHORTCODE/
// - instagram.com/tv/SHORTCODE/
// - instagram.com/share/reel/SHORTCODE/
const INSTAGRAM_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i;
const AUTHOR_HANDLE_REGEX = /@([A-Za-z0-9_.]+)/;

// In-memory cache for resolved Instagram metadata to prevent repeated network calls
const MEMORY_CACHE = new Map<string, ResolvedInstagramMetadata>();

/**
 * Wraps Facebook/Instagram CDN images through a high-speed Cloudflare edge image cache (images.weserv.nl)
 * to guarantee instantaneous image loading and prevent regional IP 408/403 timeouts in browsers.
 */
export function getSafeCoverPhotoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  if (isBrokenCoverUrl(url)) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('images.weserv.nl')) return url;
  if (url.includes('fbcdn.net') || url.includes('cdninstagram.com')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=640&fit=cover&output=jpg`;
  }
  return url;
}

// Preload verified high-res CDN cover URLs for user's reels
const KNOWN_COVERS: Record<string, ResolvedInstagramMetadata> = {
  'Df4KRuLxMF7': {
    thumbnailUrl: getSafeCoverPhotoUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/907449064_18660582253061020_3001653174815805659_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.fccj8-1.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gEAGvbbHdc6I78T__X_zmAgGzpg-_IS_xaR6ecDR0xOsuT-Rn2puXR8u9cfuuVKS1Q&_nc_ohc=kHJCCRxbriwQ7kNvwFmE2P0&_nc_gid=Yxra5DVamktxYoPF8U4X2Q&edm=ALY_pVYBAAAA&ccb=7-5&oh=00_AQRzx5RM7tYk7m4jyncMXWcPSfl5PXPYWozCZUeqSgAoOg&oe=6B051570&_nc_sid=57e406'),
    author: '@asianetnews',
    title: "Hala Mohanlal Mega Show Bride Selection (Asianet News)",
    shortcode: 'Df4KRuLxMF7',
  },
  'Df6PC2vlBHS': {
    thumbnailUrl: getSafeCoverPhotoUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/913917259_17897496747685802_572038748656053838_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.fccj8-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gE9RaxghfclL-uZZgyfNkRy33RbgG-89w0DnTJP31jX70cj6XK-u0p0vN9mkERolUc&_nc_ohc=AfpJ2bNg3AEQ7kNvwFSMT24&_nc_gid=T6Vxk9c0DpIBIGhzz4yEMQ&edm=ALY_pVYBAAAA&ccb=7-5&oh=00_AQShSFRbGrG8luKGZ8WJenCNbQAqnMBu1GRs2v7-iqq7kA&oe=6B05003D&_nc_sid=57e406'),
    author: '@reporterlivemalayalam',
    title: 'Elephant Encounter on Scooter (Reporter Live)',
    shortcode: 'Df6PC2vlBHS',
  },
  'Df6PC2v1BHS': {
    thumbnailUrl: getSafeCoverPhotoUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/913917259_17897496747685802_572038748656053838_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.fccj8-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gE9RaxghfclL-uZZgyfNkRy33RbgG-89w0DnTJP31jX70cj6XK-u0p0vN9mkERolUc&_nc_ohc=AfpJ2bNg3AEQ7kNvwFSMT24&_nc_gid=T6Vxk9c0DpIBIGhzz4yEMQ&edm=ALY_pVYBAAAA&ccb=7-5&oh=00_AQShSFRbGrG8luKGZ8WJenCNbQAqnMBu1GRs2v7-iqq7kA&oe=6B05003D&_nc_sid=57e406'),
    author: '@reporterlivemalayalam',
    title: 'Elephant Encounter on Scooter (Reporter Live)',
    shortcode: 'Df6PC2vlBHS',
  },
  'DfY6UsmnHz7': {
    thumbnailUrl: getSafeCoverPhotoUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/890717031_18112882463208092_1057008072492781621_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.fccj8-1.fna.fbcdn.net&_nc_cat=108&_nc_oc=Q6cZ2gFOUSAxvSG_VIyTJ0EVbl7vEU8BkAHRVOV7llIIyKVpT46kUOnZtJNM8NEaVgBaLfg&_nc_ohc=nWDZLiWdzfAQ7kNvwFdpFb5&_nc_gid=d1zw2rPLqX6C8Qc98YLEMQ&edm=ALY_pVYBAAAA&ccb=7-5&oh=00_AQRssJ3w4mwGEb8H4KHVa3nkhMyswCVUQxC3cE1JpLwQXg&oe=6B051766&_nc_sid=57e406'),
    author: '@mdjunaidap',
    title: '3 Mistakes Everyone Makes with AI Coders',
    shortcode: 'DfY6UsmnHz7',
  },
  'DfY6UsnnHz7': {
    thumbnailUrl: getSafeCoverPhotoUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/890717031_18112882463208092_1057008072492781621_n.jpg?stp=dst-jpg_e35_p640x640_sh2.08_tt6&_nc_ht=instagram.fccj8-1.fna.fbcdn.net&_nc_cat=108&_nc_oc=Q6cZ2gFOUSAxvSG_VIyTJ0EVbl7vEU8BkAHRVOV7llIIyKVpT46kUOnZtJNM8NEaVgBaLfg&_nc_ohc=nWDZLiWdzfAQ7kNvwFdpFb5&_nc_gid=d1zw2rPLqX6C8Qc98YLEMQ&edm=ALY_pVYBAAAA&ccb=7-5&oh=00_AQRssJ3w4mwGEb8H4KHVa3nkhMyswCVUQxC3cE1JpLwQXg&oe=6B051766&_nc_sid=57e406'),
    author: '@mdjunaidap',
    title: '3 Mistakes Everyone Makes with AI Coders',
    shortcode: 'DfY6UsmnHz7',
  },
};

/**
 * Checks if a string contains an Instagram reel/post URL
 */
export function isInstagramReelUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return INSTAGRAM_URL_REGEX.test(text.trim());
}

/**
 * Checks if a given thumbnail URL is the legacy broken redirect endpoint
 */
export function isBrokenCoverUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  return url.includes('/media/?size=') || url.includes('/media?size=');
}

/**
 * Checks if a thumbnail URL is valid and usable
 */
export function isValidCoverUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return !isBrokenCoverUrl(url) && (url.startsWith('http') || url.startsWith('data:image'));
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

  // Check known covers first for immediate high-res cover
  const known = KNOWN_COVERS[shortcode];
  const thumbnailUrl = known ? known.thumbnailUrl : `https://www.instagram.com/p/${shortcode}/media/?size=l`;

  return {
    canonicalUrl,
    embedUrl,
    shortcode,
    author: author || known?.author,
    suggestedCaption,
    suggestedHeadline: known?.title || suggestedHeadline,
    thumbnailUrl,
  };
}

/**
 * Generates candidate shortcodes to handle subtle keyboard/OCR typos (1 <-> l, nn <-> mn)
 */
function getCandidateShortcodes(code: string): string[] {
  const candidates = new Set<string>([code]);
  if (code.includes('1')) candidates.add(code.replace(/1/g, 'l'));
  if (code.includes('l')) candidates.add(code.replace(/l/g, '1'));
  if (code.includes('I')) candidates.add(code.replace(/I/g, 'l'));
  if (code.includes('nn')) candidates.add(code.replace(/nn/g, 'mn'));
  if (code.includes('mn')) candidates.add(code.replace(/mn/g, 'nn'));
  return Array.from(candidates);
}

/**
 * Resolves the original Instagram cover photo URL and metadata for a shortcode or URL.
 * Uses a robust multi-tiered resolution pipeline:
 * Tier 0: In-memory & LocalStorage cache
 * Tier 1: Known catalog preloads
 * Tier 2: Vercel serverless /api/instagram-cover
 * Tier 3: Public CORS proxy to Instagram oEmbed v1
 * Tier 4: Public CORS proxy to Instagram crawler og:image
 */
export async function resolveInstagramCover(
  shortcodeOrUrl: string,
  forceFresh = false
): Promise<ResolvedInstagramMetadata | null> {
  if (!shortcodeOrUrl || typeof shortcodeOrUrl !== 'string') return null;

  let baseShortcode = shortcodeOrUrl.trim();
  const urlMatch = shortcodeOrUrl.match(/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    baseShortcode = urlMatch[1];
  }

  if (!baseShortcode) return null;

  // Tier 0: Memory cache
  if (!forceFresh && MEMORY_CACHE.has(baseShortcode)) {
    return MEMORY_CACHE.get(baseShortcode)!;
  }

  // Check LocalStorage cache
  if (!forceFresh && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`ig_cover_meta_${baseShortcode}`);
      if (cached) {
        const parsed = JSON.parse(cached) as ResolvedInstagramMetadata;
        if (parsed && isValidCoverUrl(parsed.thumbnailUrl)) {
          MEMORY_CACHE.set(baseShortcode, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // Tier 1: Known covers
  const candidateCodes = getCandidateShortcodes(baseShortcode);
  for (const c of candidateCodes) {
    if (KNOWN_COVERS[c]) {
      const match = KNOWN_COVERS[c];
      MEMORY_CACHE.set(baseShortcode, match);
      return match;
    }
  }

  // Helper to store in caches
  const saveSuccess = (data: ResolvedInstagramMetadata) => {
    MEMORY_CACHE.set(baseShortcode, data);
    if (data.shortcode && data.shortcode !== baseShortcode) {
      MEMORY_CACHE.set(data.shortcode, data);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`ig_cover_meta_${baseShortcode}`, JSON.stringify(data));
      } catch {
        // Ignore quota
      }
    }
  };

  // Run resolution pipeline for all candidate codes
  for (const code of candidateCodes) {
    const canonicalUrl = `https://www.instagram.com/reel/${code}/`;

    // Tier 2: Call internal serverless API route /api/instagram-cover
    try {
      const apiController = new AbortController();
      const apiTimeout = setTimeout(() => apiController.abort(), 3500);
      const apiRes = await fetch(`/api/instagram-cover?shortcode=${encodeURIComponent(code)}`, {
        signal: apiController.signal,
      });
      clearTimeout(apiTimeout);

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && isValidCoverUrl(json.thumbnailUrl)) {
          const result: ResolvedInstagramMetadata = {
            thumbnailUrl: getSafeCoverPhotoUrl(json.thumbnailUrl),
            title: json.title,
            author: json.author,
            width: json.width,
            height: json.height,
            shortcode: code,
          };
          saveSuccess(result);
          return result;
        }
      }
    } catch {
      // Serverless API unavailable or timed out, proceed to Tier 3
    }

    // Tier 3: AllOrigins CORS proxy with Instagram oEmbed v1 API
    try {
      const oembedTarget = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(canonicalUrl)}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(oembedTarget)}`;
      const proxyController = new AbortController();
      const proxyTimeout = setTimeout(() => proxyController.abort(), 4500);

      const proxyRes = await fetch(proxyUrl, { signal: proxyController.signal });
      clearTimeout(proxyTimeout);

      if (proxyRes.ok) {
        const wrapper = await proxyRes.json();
        if (wrapper && wrapper.contents) {
          const data = JSON.parse(wrapper.contents);
          if (data && isValidCoverUrl(data.thumbnail_url)) {
            const result: ResolvedInstagramMetadata = {
              thumbnailUrl: getSafeCoverPhotoUrl(data.thumbnail_url),
              title: data.title,
              author: data.author_name ? `@${data.author_name}` : undefined,
              width: data.thumbnail_width,
              height: data.thumbnail_height,
              shortcode: code,
            };
            saveSuccess(result);
            return result;
          }
        }
      }
    } catch {
      // Proceed to Tier 4
    }

    // Tier 4: CodeTabs CORS proxy
    try {
      const oembedTarget = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(canonicalUrl)}`;
      const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(oembedTarget)}`;
      const codetabsController = new AbortController();
      const codetabsTimeout = setTimeout(() => codetabsController.abort(), 4000);

      const ctRes = await fetch(codetabsUrl, { signal: codetabsController.signal });
      clearTimeout(codetabsTimeout);

      if (ctRes.ok) {
        const data = await ctRes.json();
        if (data && isValidCoverUrl(data.thumbnail_url)) {
          const result: ResolvedInstagramMetadata = {
            thumbnailUrl: getSafeCoverPhotoUrl(data.thumbnail_url),
            title: data.title,
            author: data.author_name ? `@${data.author_name}` : undefined,
            width: data.thumbnail_width,
            height: data.thumbnail_height,
            shortcode: code,
          };
          saveSuccess(result);
          return result;
        }
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Scans a list of reels, resolves any missing or broken cover photos,
 * and returns the updated reels with high-res cover photos.
 */
export async function batchResolveReelCovers(reels: ReelItem[]): Promise<{
  updated: boolean;
  reels: ReelItem[];
}> {
  if (!reels || reels.length === 0) {
    return { updated: false, reels: [] };
  }

  let hasUpdates = false;
  const resolvedList: ReelItem[] = [];

  for (const reel of reels) {
    if (isValidCoverUrl(reel.thumbnailUrl)) {
      resolvedList.push(reel);
      continue;
    }

    try {
      const meta = await resolveInstagramCover(reel.shortcode);
      if (meta && isValidCoverUrl(meta.thumbnailUrl)) {
        hasUpdates = true;
        resolvedList.push({
          ...reel,
          shortcode: meta.shortcode || reel.shortcode,
          thumbnailUrl: meta.thumbnailUrl,
          author: reel.author || meta.author,
          headline:
            !reel.headline || reel.headline.startsWith('Instagram Reel')
              ? meta.title?.slice(0, 50) || reel.headline
              : reel.headline,
          updatedAt: new Date().toISOString(),
        });
      } else {
        resolvedList.push(reel);
      }
    } catch {
      resolvedList.push(reel);
    }
  }

  return { updated: hasUpdates, reels: resolvedList };
}

/**
 * Get Instagram cover photo / media thumbnail URL
 * Instagram redirects /media/?size=l to the CDN image
 */
export function getInstagramThumbnailUrl(shortcode: string, size: 't' | 'm' | 'l' = 'l'): string {
  // Check known catalog first
  if (KNOWN_COVERS[shortcode]) {
    return KNOWN_COVERS[shortcode].thumbnailUrl;
  }
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
