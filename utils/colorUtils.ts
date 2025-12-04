/**
 * Color utility functions for converting hex to rgba
 */

/**
 * Convert hex color to rgba string
 * @param hex - Hex color (e.g., '#9B59B6' or '9B59B6')
 * @param alpha - Alpha value 0-1 (default: 1)
 * @returns rgba string (e.g., 'rgba(155, 89, 182, 0.3)')
 */
export function hexToRgba(hex: string | undefined | null, alpha: number = 1): string {
  // Handle null/undefined/empty
  if (!hex || typeof hex !== 'string' || hex.trim() === '') {
    console.warn('hexToRgba: hex color is undefined, null, or empty, returning transparent');
    return `rgba(0, 0, 0, ${alpha})`;
  }

  // Handle rgba strings - return as is if already rgba
  if (typeof hex === 'string' && (hex.startsWith('rgba(') || hex.startsWith('rgb('))) {
    return hex;
  }

  // Remove # if present
  const cleanHex = hex.replace('#', '').trim();
  
  // Validate hex length
  if (cleanHex.length !== 6) {
    console.warn(`hexToRgba: Invalid hex color "${hex}", returning transparent`);
    return `rgba(0, 0, 0, ${alpha})`;
  }
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Validate parsed values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn(`hexToRgba: Failed to parse hex color "${hex}", returning transparent`);
    return `rgba(0, 0, 0, ${alpha})`;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Add alpha to an existing rgba string
 * @param rgba - rgba string (e.g., 'rgba(255,255,255,0.1)')
 * @param alpha - New alpha value 0-1
 * @returns rgba string with new alpha
 */
export function setRgbaAlpha(rgba: string, alpha: number): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }
  return rgba;
}

