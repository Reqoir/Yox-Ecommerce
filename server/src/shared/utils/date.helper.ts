/**
 * @file date.helper.ts
 * @layer Shared › Utils
 *
 * Date utility helpers. Uses native Date — no external date library required.
 */

/**
 * Format a Date object to a human-readable string.
 * @param date - The date to format
 * @param locale - BCP 47 locale string (default: 'en-US')
 */
export const formatDate = (date: Date, locale = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a Date to ISO 8601 string (UTC).
 */
export const toISOString = (date: Date): string => date.toISOString();

/**
 * Add a number of days to a date and return a new Date.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add a number of hours to a date.
 */
export const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

/**
 * Add a number of minutes to a date.
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

/**
 * Check whether a given date is in the past (expired).
 */
export const isExpired = (date: Date): boolean => date < new Date();

/**
 * Check whether a given date is in the future.
 */
export const isFuture = (date: Date): boolean => date > new Date();

/**
 * Calculate the difference in seconds between two dates.
 */
export const diffInSeconds = (from: Date, to: Date = new Date()): number => {
  return Math.floor((to.getTime() - from.getTime()) / 1000);
};

/**
 * Calculate the difference in days between two dates.
 */
export const diffInDays = (from: Date, to: Date = new Date()): number => {
  return Math.floor(diffInSeconds(from, to) / 86400);
};

/**
 * Get the start of today (midnight UTC).
 */
export const startOfToday = (): Date => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Convert seconds to a Date from now.
 */
export const secondsFromNow = (seconds: number): Date => {
  return new Date(Date.now() + seconds * 1000);
};
