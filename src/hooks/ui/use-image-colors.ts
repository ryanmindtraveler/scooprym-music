'use client';

import { useEffect, useState } from 'react';

export interface ImageColors {
  primary: string; // Most vibrant/dominant color
  secondary: string; // Second dominant color
  muted: string; // Softer background color
  darkMuted: string; // Dark variant for text backgrounds
  lightMuted: string; // Light variant
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_COLORS: Omit<ImageColors, 'isLoading' | 'error'> = {
  primary: '#64748b', // Slate-500 (Neutral Blue-Grey)
  secondary: '#475569', // Slate-600
  muted: '#1e293b', // Slate-800
  darkMuted: '#020617', // Slate-950 (Deepest Midnight)
  lightMuted: '#94a3b8', // Slate-400
};

/**
 * useImageColors - Extracts dominant colors from an image URL
 *
 * Uses node-vibrant to analyze the image and extract a color palette.
 * Returns loading state while processing, with fallback colors on error.
 *
 * @param imageUrl - URL of the image to extract colors from
 * @returns ImageColors object with extracted palette
 */
export function useImageColors(imageUrl: string | null | undefined): ImageColors {
  const [colors, setColors] = useState<ImageColors>({
    ...DEFAULT_COLORS,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!imageUrl) {
      setColors({
        ...DEFAULT_COLORS,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isCancelled = false;

    async function extractColors() {
      try {
        // Dynamic import to ensure it only loads in browser
        const { Vibrant } = await import('node-vibrant/browser');

        // node-vibrant can extract from URL directly
        const palette = await Vibrant.from(imageUrl!).getPalette();

        if (isCancelled) return;

        // Extract colors with fallbacks
        const primary = palette.Vibrant?.hex || palette.DarkVibrant?.hex || DEFAULT_COLORS.primary;
        const secondary = palette.LightVibrant?.hex || palette.Vibrant?.hex || DEFAULT_COLORS.secondary;
        const muted = palette.Muted?.hex || palette.DarkMuted?.hex || DEFAULT_COLORS.muted;
        const darkMuted = palette.DarkMuted?.hex || DEFAULT_COLORS.darkMuted;
        const lightMuted = palette.LightMuted?.hex || DEFAULT_COLORS.lightMuted;

        setColors({
          primary,
          secondary,
          muted,
          darkMuted,
          lightMuted,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (isCancelled) return;

        console.warn('[useImageColors] Failed to extract colors:', err);
        setColors({
          ...DEFAULT_COLORS,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to extract colors',
        });
      }
    }

    setColors((prev) => ({ ...prev, isLoading: true, error: null }));
    extractColors();

    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);

  return colors;
}
