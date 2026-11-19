import { describe, it, expect } from 'vitest';
import {
  isInstagramReelUrl,
  extractInstagramReelInfo,
  getInstagramDirectUrl,
  getInstagramEmbedUrl,
  getInstagramThumbnailUrl,
} from '../instagramHelper';

describe('instagramHelper', () => {
  it('detects standard Instagram reel URLs', () => {
    expect(isInstagramReelUrl('https://www.instagram.com/reel/C8xyz123/')).toBe(true);
    expect(isInstagramReelUrl('http://instagram.com/reels/C8xyz123/?igsh=123')).toBe(true);
    expect(isInstagramReelUrl('https://instagram.com/p/C8xyz123/')).toBe(true);
    expect(isInstagramReelUrl('Check this out https://www.instagram.com/reel/C8xyz123/ cool video')).toBe(true);
    expect(isInstagramReelUrl('https://google.com')).toBe(false);
    expect(isInstagramReelUrl('')).toBe(false);
  });

  it('extracts canonical url, shortcode, author and caption from shared text', () => {
    const sharedText = 'Check out this quick workout from @fitness_pro https://www.instagram.com/reel/C8xyz123/?igsh=abc123';
    const parsed = extractInstagramReelInfo(sharedText);

    expect(parsed).not.toBeNull();
    expect(parsed?.shortcode).toBe('C8xyz123');
    expect(parsed?.canonicalUrl).toBe('https://www.instagram.com/reel/C8xyz123/');
    expect(parsed?.embedUrl).toBe('https://www.instagram.com/reel/C8xyz123/embed/');
    expect(parsed?.author).toBe('@fitness_pro');
    expect(parsed?.suggestedHeadline).toBeDefined();
    expect(parsed?.thumbnailUrl).toBe('https://www.instagram.com/p/C8xyz123/media/?size=l');
  });

  it('generates direct, embed, and thumbnail URLs', () => {
    expect(getInstagramDirectUrl('ABC123xyz')).toBe('https://www.instagram.com/reel/ABC123xyz/');
    expect(getInstagramEmbedUrl('ABC123xyz')).toBe('https://www.instagram.com/reel/ABC123xyz/embed/');
    expect(getInstagramThumbnailUrl('ABC123xyz', 'm')).toBe('https://www.instagram.com/p/ABC123xyz/media/?size=m');
  });
});
