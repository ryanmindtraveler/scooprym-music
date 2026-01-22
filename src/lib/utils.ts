import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  if (!text) return 'song';

  let slug = text.toString().trim().toLowerCase();

  // Replace common punctuation with empty string (keeping alphanumeric + unicode chars)
  // We use a blacklist approach to be safe with CJK/Unicode names.
  slug = slug.replace(/[.,/#!$%^&*;:{}=_`~()"'[\]<>?@\\|]/g, '');

  // Replace whitespace with dashes
  slug = slug.replace(/\s+/g, '-');

  // Clean up dashes (repeats and leading/trailing)
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  return slug || 'song';
}

/**
 * Extract usage ID from a slugified URL string.
 * Supports legacy formats (UUID only) and new SEO formats (title-uuid).
 *
 * @param slug - The URL slug parameter (e.g. "my-song-uuid" or "uuid")
 * @returns The extracted UUID or the original slug if extraction fails validation
 */
export function getIdFromSlug(slug: string): string {
  if (!slug) return '';
  // Check if slug is just a UUID (legacy support)
  if (/^[0-9a-fA-F-]{36}$/.test(slug)) return slug;

  // Strategy: Try to extract the last 36 characters.
  const potentialId = slug.slice(-36);
  if (/^[0-9a-fA-F-]{36}$/.test(potentialId)) {
    return potentialId;
  }
  return slug; // Fallback to treating whole slug as ID
}
