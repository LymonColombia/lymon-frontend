/** Public placeholder shown when an entity has no media yet (empty mediaUrls). */
export const MEDIA_FALLBACK_IMAGE = '/images/suite2.avif';

/**
 * Cover image by convention = the first public media URL, with a placeholder
 * for the empty case (an entity with no photos yet).
 */
export const coverImageOf = (mediaUrls?: readonly string[]): string =>
  mediaUrls?.[0] ?? MEDIA_FALLBACK_IMAGE;
