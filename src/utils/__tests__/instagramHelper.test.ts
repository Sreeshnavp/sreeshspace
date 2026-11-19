import { describe, it, expect } from 'vitest';
import {
  isInstagramReelUrl,
  extractInstagramReelInfo,
  getInstagramDirectUrl,
  getInstagramEmbedUrl,
  getInstagramThumbnailUrl,
  isBrokenCoverUrl,
  isValidCoverUrl,
  resolveInstagramCover,
  batchResolveReelCovers,
} from '../instagramHelper';
import type { ReelItem } from '../../types';

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

  it('validates cover photo URLs correctly', () => {
    expect(isBrokenCoverUrl('https://www.instagram.com/p/Df4KRu/media/?size=l')).toBe(true);
    expect(isBrokenCoverUrl('https://www.instagram.com/p/Df4KRu/media?size=m')).toBe(true);
    expect(isBrokenCoverUrl('')).toBe(true);
    expect(isBrokenCoverUrl(undefined)).toBe(true);

    expect(isValidCoverUrl('https://instagram.fccj8-1.fna.fbcdn.net/v/t51.82787-15/pic.jpg')).toBe(true);
    expect(isValidCoverUrl('https://scontent.cdninstagram.com/v/t51.82787-15/pic.jpg')).toBe(true);
    expect(isValidCoverUrl('data:image/png;base64,abc')).toBe(true);
    expect(isValidCoverUrl('https://www.instagram.com/p/Df4KRu/media/?size=l')).toBe(false);
  });

  it('resolves real original cover photo for saved reels', async () => {
    const meta = await resolveInstagramCover('Df4KRuLxMF7');
    expect(meta).not.toBeNull();
    expect(meta?.thumbnailUrl).toContain('fbcdn.net');
    expect(isValidCoverUrl(meta?.thumbnailUrl)).toBe(true);
    expect(meta?.author).toBe('@asianetnews');
  });

  it('batch resolves broken reel covers into high-res cover photos', async () => {
    const testReels: ReelItem[] = [
      {
        id: 'r1',
        url: 'https://www.instagram.com/reel/Df4KRuLxMF7/',
        shortcode: 'Df4KRuLxMF7',
        thumbnailUrl: 'https://www.instagram.com/p/Df4KRuLxMF7/media/?size=l',
        createdAt: new Date().toISOString(),
      },
    ];

    const { updated, reels } = await batchResolveReelCovers(testReels);
    expect(updated).toBe(true);
    expect(reels[0].thumbnailUrl).toContain('fbcdn.net');
    expect(isValidCoverUrl(reels[0].thumbnailUrl)).toBe(true);
  });
});
