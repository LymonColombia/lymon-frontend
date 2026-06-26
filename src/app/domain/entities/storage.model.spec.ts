import { describe, expect, it } from 'vitest';

import { keyFromMediaUrl } from './storage.model';

describe('keyFromMediaUrl', () => {
  it('strips the host, leaving the object key', () => {
    expect(keyFromMediaUrl('https://pub-abc.r2.dev/experiences/photo.jpg')).toBe(
      'experiences/photo.jpg',
    );
  });

  it('is domain-independent (key survives a domain change)', () => {
    expect(keyFromMediaUrl('https://cdn.example.com/units/abc/123.webp')).toBe(
      'units/abc/123.webp',
    );
  });

  it('drops query strings and keeps only the path', () => {
    expect(keyFromMediaUrl('https://pub-abc.r2.dev/units/a.png?v=2')).toBe('units/a.png');
  });

  it('handles deeply nested three-segment key paths', () => {
    expect(
      keyFromMediaUrl('https://pub-abc.r2.dev/experiences/2024/summer/beach.jpg'),
    ).toBe('experiences/2024/summer/beach.jpg');
  });

  it('strips URL hash fragments, returning only the path', () => {
    // Hash fragments never form part of the R2 key; confirm they are silently dropped.
    expect(keyFromMediaUrl('https://cdn.r2.dev/units/room.webp#preview')).toBe('units/room.webp');
  });
});
