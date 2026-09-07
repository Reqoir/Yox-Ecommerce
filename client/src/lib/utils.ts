import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optimizeCloudinaryUrl(url?: string | null, width = 800): string {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || url.includes('/w_')) return url;
  return url.replace('/image/upload/', `/image/upload/w_${width},c_limit,q_auto,f_auto/`);
}

/**
 * Extracts a human-readable, specific error message from an API error response.
 * Inspects field-level errors array and message properties.
 */
export function getApiErrorMessage(error: any, fallback = 'Something went wrong. Please check your information.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  // 1. If backend provided detailed field errors array, join their messages
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const errorMessages = data.errors
      .map((e: any) => (typeof e === 'string' ? e : e?.message))
      .filter(Boolean);
    if (errorMessages.length > 0) {
      return errorMessages.join(', ');
    }
  }

  // 2. If message is present and not the generic 'Validation failed. Please check the request data.'
  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  return error?.message || fallback;
}

