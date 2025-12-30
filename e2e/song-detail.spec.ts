import { expect, test } from '@playwright/test';

test.describe('Homepage Gallery & Song Detail', () => {
  test('should open song detail modal from trending gallery', async ({ page }) => {
    // 1. Navigate to Homepage
    await page.goto('/');

    // 2. Scroll to "Trending Tracks" (Gallery Section)
    const gallerySection = page.getByText('Trending Tracks', { exact: false });
    await expect(gallerySection).toBeVisible();
    await gallerySection.scrollIntoViewIfNeeded();

    // 3. Find the first song card link (assuming "Rolling in Luxury" or similar exists, or just first link)
    // We target the link specifically inside the gallery to ensure we are testing the right flow
    // Using a more generic selector to be robust to song data changes: Look for a link inside the gallery grid
    const songLink = page.locator('a[href*="/songs/"]').first();

    // Ensure it's visible
    await expect(songLink).toBeVisible();

    // Capture the href to verify URL update later
    const songHref = await songLink.getAttribute('href');
    const songId = songHref?.split('/').pop();

    console.log(`Testing Song ID: ${songId}`);

    // 4. Click the song
    await songLink.click();

    // 5. Verify URL update (Intercepting route should still show URL change)
    await expect(page).toHaveURL(new RegExp(`/songs/${songId}`));

    // 6. Verify Modal Content
    // Check for "AI Generated" badge which is presentin SongDetailClient
    const modalBadge = page.getByText('AI Generated');
    await expect(modalBadge).toBeVisible({ timeout: 10000 });

    // Check for "Scooprym Music" text
    await expect(page.getByText('Scooprym Music')).toBeVisible();

    // 7. Verify NO Crash
    // Ensure "Application error" or generic Next.js error overlay is NOT present
    const errorOverlay = page.locator('nextjs-portal');
    await expect(errorOverlay).toBeHidden();
    await expect(page.getByText('Application error')).not.toBeVisible();
  });
});
