import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optimizeCloudinaryUrl(url?: string | null, width = 1600): string {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || url.includes('/w_')) return url;
  return url.replace('/image/upload/', `/image/upload/w_${width},c_limit,q_auto:best,f_auto/`);
}
