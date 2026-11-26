/**
 * @file html-escape.ts
 * @description Shared frontend security utilities for HTML escaping, URL sanitization,
 * and safe external window handling.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/**
 * Escapes untrusted values before interpolating them into HTML strings or attributes.
 * Handles null, undefined, numbers, booleans, and unexpected object types safely.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = typeof value === 'string' ? value : String(value);
  return str.replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export interface SanitizeUrlOptions {
  allowRelative?: boolean;
  allowHttp?: boolean;
}

/**
 * Validates a URL using the standard URL API.
 * - Rejects javascript:, data:, vbscript:, file:, protocol-relative (//), and malformed URLs.
 * - Allows https: (and http: when allowHttp is true, default true for external http/https links).
 * - Allows safe single-slash internal relative paths (e.g. /products/abc) when allowRelative is true.
 */
export function sanitizeHttpUrl(
  rawUrl: unknown,
  options: SanitizeUrlOptions = {}
): string | null {
  if (typeof rawUrl !== 'string') {
    return null;
  }

  const { allowRelative = false, allowHttp = true } = options;

  // Strip ASCII control characters and surrounding whitespace to defeat protocol obfuscation
  const cleaned = rawUrl.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) {
    return null;
  }

  // Reject protocol-relative URLs (e.g. //evil.com)
  if (cleaned.startsWith('//')) {
    return null;
  }

  // Allow safe internal relative paths if explicitly enabled
  if (allowRelative && cleaned.startsWith('/') && !cleaned.startsWith('//')) {
    // Ensure no backslash or weird scheme-like prefix
    if (cleaned.includes('\\')) {
      return null;
    }
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:') {
      return parsed.href;
    }
    if (allowHttp && protocol === 'http:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Opens a validated external URL safely in a new tab with noopener,noreferrer
 * to prevent reverse-tabnabbing.
 */
export function openSafeExternalUrl(rawUrl: unknown): boolean {
  const safeUrl = sanitizeHttpUrl(rawUrl, { allowRelative: false, allowHttp: true });
  if (!safeUrl || typeof window === 'undefined') {
    return false;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
}
