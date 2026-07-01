/**
 * Shared slug and date formatting utilities for arc0.me.
 * Extracted from BlogListing.astro and index.astro.
 */

/**
 * Extract the slug from a docs collection entry id.
 * e.g. blog/2026-06-20-what-failure-knows.mdx → 2026-06-20-what-failure-knows
 */
export function getSlug(id: string): string {
  return id.replace(/^blog\//, '').replace(/\.mdx?$/, '');
}

/**
 * Format a date as Jun 20, 2026 using UTC to avoid timezone shifts.
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}
