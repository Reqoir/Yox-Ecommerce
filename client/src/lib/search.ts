import { Product } from '@/types/product';

/**
 * Normalizes text for e-commerce search:
 * - Lowercases text
 * - Normalizes brand aliases like "h and m", "h & m" into "h&m"
 * - Converts slashes, hyphens, and punctuation into spaces
 * - Collapses repeated whitespace
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\bh\s*(?:and|&)\s*m\b/gi, 'h&m')
    .replace(/[^a-z0-9&]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes a user's search query into individual search terms:
 * - Converts "h and m" or "h & m" into a single token "h&m"
 * - Strips punctuation and splits into whitespace-separated keywords
 */
export function tokenizeSearchQuery(query: string): string[] {
  if (!query || !query.trim()) return [];

  // Normalize "h and m" or "h & m" to "h&m" first so it doesn't get split into "h", "and", "m"
  const normalized = query
    .toLowerCase()
    .replace(/\bh\s*(?:and|&)\s*m\b/gi, 'h&m');

  return normalized
    .replace(/[^a-z0-9&]/gi, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Checks if an individual query token matches within the target searchable text:
 * Supports:
 * - Direct substring inclusion
 * - Singular/plural flexibility (e.g. "shirt" <-> "shirts", "pant" <-> "pants")
 * - Brand aliases ("h&m" matches "hm", "handm", "h&m")
 */
function tokenMatches(token: string, targetText: string): boolean {
  if (!token || !targetText) return false;

  // 1. Direct inclusion
  if (targetText.includes(token)) {
    return true;
  }

  // 2. Brand alias matching (e.g. "h&m", "hm", "h and m")
  if (token === 'h&m' || token === 'hm') {
    if (
      targetText.includes('h&m') ||
      targetText.includes('hm') ||
      targetText.includes('h and m')
    ) {
      return true;
    }
  }

  // 3. Singular form if query token is plural (e.g. "shirts" -> "shirt", "jeans" -> "jean")
  if (token.length > 3 && token.endsWith('s')) {
    const singular = token.slice(0, -1);
    if (targetText.includes(singular)) {
      return true;
    }
  }

  // 4. Plural form if query token is singular (e.g. "shirt" matches "shirts")
  if (token.length >= 3) {
    const plural = token + 's';
    if (targetText.includes(plural)) {
      return true;
    }
  }

  return false;
}

/**
 * Assembles all searchable attributes of a product into a single normalized searchable string.
 * Includes name, brand (with aliases), category, subCategory, currentColor, all colors, fit, tag, and description.
 */
export function getProductSearchableText(product: Product): string {
  const parts: string[] = [
    product.name || '',
    product.brand || '',
    product.category || '',
    product.subCategory || '',
    product.currentColor || '',
    ...(product.colors || []),
    product.fit || '',
    product.tag || '',
    product.description || '',
  ];

  // Add brand-specific aliases for H&M
  if (product.brand && /h\s*&?\s*m/i.test(product.brand)) {
    parts.push('h&m', 'h and m', 'hm', 'handm');
  }

  return normalizeSearchText(parts.join(' '));
}

/**
 * Evaluates whether a product matches a user search query.
 * Multi-token AND logic: EVERY keyword/token in the query must be matched in the product's attributes.
 *
 * Example:
 * Query "light blue shirt":
 * - "light" -> matches in color "Light blue/Striped"
 * - "blue"  -> matches in color "Light blue/Striped"
 * - "shirt" -> matches in name "Regular Fit Oxford shirt" or category "Shirts"
 * => Returns TRUE
 *
 * Query "h and m blue shirt":
 * - "h&m"   -> matches brand
 * - "blue"  -> matches color
 * - "shirt" -> matches name/category
 * => Returns TRUE
 */
export function matchesProductSearch(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true;

  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return true;

  const searchableText = getProductSearchableText(product);

  // Every token in the query must match
  return tokens.every(token => tokenMatches(token, searchableText));
}
