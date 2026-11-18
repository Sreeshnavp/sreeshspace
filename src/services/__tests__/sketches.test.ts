import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mergeItemsById, mergeVaultData } from '../syncService';
import type { SketchItem } from '../../types';

describe('Sketches & Doodles Service', () => {
  it('merges sketches by id choosing the newer timestamp', () => {
    const localSketches: SketchItem[] = [
      {
        id: 'sk-1',
        title: 'Draft Cat Doodle',
        dataUrl: 'data:image/png;base64,local',
        paperStyle: 'cream',
        createdAt: '2026-11-18T10:00:00.000Z',
        updatedAt: '2026-11-18T10:00:00.000Z',
      },
    ];

    const remoteSketches: SketchItem[] = [
      {
        id: 'sk-1',
        title: 'Finished Sparkle Cat ✨',
        dataUrl: 'data:image/png;base64,remoteUpdated',
        paperStyle: 'cream',
        createdAt: '2026-11-18T10:00:00.000Z',
        updatedAt: '2026-11-18T11:00:00.000Z', // newer
      },
      {
        id: 'sk-2',
        title: 'Matcha Coffee Cup ☕',
        dataUrl: 'data:image/png;base64,coffee',
        paperStyle: 'dots',
        createdAt: '2026-11-18T10:30:00.000Z',
        updatedAt: '2026-11-18T10:30:00.000Z',
      },
    ];

    const merged = mergeItemsById(
      localSketches,
      remoteSketches,
      (s) => new Date(s.updatedAt || s.createdAt || 0).getTime(),
      {}
    );

    expect(merged).toHaveLength(2);
    const cat = merged.find((s) => s.id === 'sk-1');
    expect(cat?.title).toBe('Finished Sparkle Cat ✨');
    expect(cat?.dataUrl).toBe('data:image/png;base64,remoteUpdated');

    const coffee = merged.find((s) => s.id === 'sk-2');
    expect(coffee?.title).toBe('Matcha Coffee Cup ☕');
  });

  it('respects deleted tombstones for sketches', () => {
    const localSketches: SketchItem[] = [
      {
        id: 'sk-deleted',
        title: 'To Be Purged',
        dataUrl: 'data:image/png;base64,trash',
        createdAt: '2026-11-18T10:00:00.000Z',
        updatedAt: '2026-11-18T10:00:00.000Z',
      },
    ];

    const tombstones = { 'sk-deleted': '2026-11-18T12:00:00.000Z' };

    const merged = mergeItemsById(
      localSketches,
      [],
      (s) => new Date(s.updatedAt || s.createdAt || 0).getTime(),
      tombstones
    );

    expect(merged).toHaveLength(0);
  });
});
