import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convert a hex color to RGB triple (0-255).
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const v = hex.replace('#', '').trim();
  const m = v.length === 3
    ? v.split('').map((c) => c + c).join('')
    : v;
  if (!/^([0-9a-fA-F]{6})$/.test(m)) return null;
  const n = parseInt(m, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Relative luminance (WCAG-ish) for choosing readable foreground.
 */
export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const srgb = [r, g, b].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Choose black or white text on a given hex background for good legibility.
 */
export function readableTextOn(hexBg: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(hexBg);
  if (!rgb) return '#ffffff';
  const L = relativeLuminance(rgb);
  return L > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Simple darken/lighten using linear blend.
 */
export function mix(hex: string, amountToBlack: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amt = Math.max(0, Math.min(100, amountToBlack)) / 100;
  const r = Math.round(rgb.r * (1 - amt));
  const g = Math.round(rgb.g * (1 - amt));
  const b = Math.round(rgb.b * (1 - amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Apply accent to CSS variables on the document root.
 */
export function applyAccent(hexAccent: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  const accent = hexAccent;
  const fg = readableTextOn(accent);
  root.setProperty('--accent', accent);
  root.setProperty('--accent-foreground', fg);
  root.setProperty('--primary', accent);
  root.setProperty('--primary-foreground', fg);
}
