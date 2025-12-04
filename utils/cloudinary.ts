/**
 * Cloudinary utility functions for image URL transformations
 */

const CLOUDINARY_CLOUD_NAME = 'doihs4i87';

/**
 * Generate Cloudinary URL with transformations
 * @param publicId - Cloudinary public ID (without extension)
 * @param options - Transformation options
 * @returns Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    aspectRatio?: string; // e.g., "16:9"
    crop?: string; // e.g., "fill", "fit", "crop"
    quality?: number; // 1-100
    format?: string; // "auto", "jpg", "png", "webp"
  } = {}
): string {
  if (!publicId) {
    return '';
  }

  // If it's already a full URL (not Cloudinary), return as is
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    // Check if it's a Cloudinary URL
    if (publicId.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL and rebuild with transformations
      const match = publicId.match(/\/upload\/(?:[^\/]+\/)*([^\/]+)$/);
      if (match) {
        const extractedPublicId = match[1].replace(/\.[^.]+$/, ''); // Remove extension
        return getCloudinaryUrl(extractedPublicId, options);
      }
    }
    // Not a Cloudinary URL, return as is
    return publicId;
  }

  // Remove leading slash if present
  const cleanPublicId = publicId.startsWith('/') ? publicId.slice(1) : publicId;

  // Build transformation string
  const transformations: string[] = [];

  if (options.aspectRatio) {
    transformations.push(`ar_${options.aspectRatio.replace(':', ':')}`);
  }

  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  } else if (options.aspectRatio) {
    transformations.push('c_fill'); // Default to fill when aspect ratio is specified
  }

  if (options.width) {
    transformations.push(`w_${options.width}`);
  }

  if (options.height) {
    transformations.push(`h_${options.height}`);
  }

  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  } else {
    transformations.push('q_auto'); // Auto quality
  }

  if (options.format) {
    transformations.push(`f_${options.format}`);
  } else {
    transformations.push('f_auto'); // Auto format
  }

  const transformationString = transformations.join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${cleanPublicId}`;
}

/**
 * Get event card image URL (16:9 aspect ratio, fill by width)
 * @param publicId - Cloudinary public ID
 * @param width - Desired width (default: 800)
 * @returns Cloudinary URL optimized for event cards
 */
export function getEventCardImageUrl(publicId: string, width: number = 800): string {
  return getCloudinaryUrl(publicId, {
    aspectRatio: '16:9',
    crop: 'fill',
    width: width,
    quality: 80,
    format: 'auto',
  });
}

/**
 * Get event detail image URL (16:9 aspect ratio, larger size)
 * @param publicId - Cloudinary public ID
 * @param width - Desired width (default: 1200)
 * @returns Cloudinary URL optimized for event detail screens
 */
export function getEventDetailImageUrl(publicId: string, width: number = 1200): string {
  return getCloudinaryUrl(publicId, {
    aspectRatio: '16:9',
    crop: 'fill',
    width: width,
    quality: 85,
    format: 'auto',
  });
}

/**
 * Get club image URL (square aspect ratio, fill by width)
 * @param publicId - Cloudinary public ID
 * @param width - Desired width (default: 400)
 * @returns Cloudinary URL optimized for club images
 */
export function getClubImageUrl(publicId: string, width: number = 400): string {
  return getCloudinaryUrl(publicId, {
    aspectRatio: '1:1',
    crop: 'fill',
    width: width,
    quality: 80,
    format: 'auto',
  });
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Full Cloudinary URL
 * @returns Public ID or original URL if not a Cloudinary URL
 */
export function extractPublicId(url: string): string {
  if (!url) return '';
  
  // If it's already a public ID (no http), return as is
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // Extract public ID from Cloudinary URL
  const match = url.match(/\/upload\/(?:[^\/]+\/)*([^\/]+)$/);
  if (match) {
    return match[1].replace(/\.[^.]+$/, ''); // Remove extension
  }

  return url; // Return original if not a Cloudinary URL
}

