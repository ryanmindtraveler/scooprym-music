import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  if (!text) return 'song';

  let slug = text
    .toString()
    .normalize('NFKD')
    .trim()
    .toLowerCase();

  // Strip combining marks after normalization so accented characters become stable ASCII-friendly slugs.
  slug = slug.replace(/[\u0300-\u036f]/g, '');

  // Normalize common unicode quotes/apostrophes that otherwise cause self-redirect loops in canonical slugs.
  slug = slug.replace(/[\u2018\u2019\u201B\u0060\u00B4\u2032\u2035\u0022\u201C\u201D\u201E\u201F\u2033]/g, '');

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
