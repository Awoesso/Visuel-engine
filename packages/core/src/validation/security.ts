import type { SectionNode } from '../schemas/node';
import { MAX_DOCUMENT_SIZE } from '../constants';

export const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

export const SECURITY_LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: MAX_DOCUMENT_SIZE,
  MAX_NODE_DEPTH: 20,
  MAX_TOTAL_NODES: 500,
  MAX_SECTIONS: 100,
} as const;

export interface SafeUrlOptions {
  allowDataImages?: boolean;
}

const RELATIVE_URL_BASE = 'https://dsk.invalid';
const ENCODED_AMBIGUOUS_CHARACTERS = /%(?:0[0-9a-f]|1[0-9a-f]|2f|5c|7f)/i;
const INVALID_PERCENT_ENCODING = /%(?![0-9a-f]{2})/i;
const SAFE_DATA_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,/i;

/**
 * Checks if a given URL is safe to render in href or src attributes.
 * Allows HTTP(S), mailto/tel, same-origin relative URLs, and optionally raster data images.
 * Ambiguous URL forms and unapproved schemes are rejected.
 */
export function isSafeUrl(url: string | undefined | null, options: SafeUrlOptions = {}): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  if (
    /[\s\\\p{Cc}]/u.test(trimmed) ||
    trimmed.includes('&#') ||
    ENCODED_AMBIGUOUS_CHARACTERS.test(trimmed) ||
    INVALID_PERCENT_ENCODING.test(trimmed)
  ) {
    return false;
  }

  if (trimmed.startsWith('//')) {
    return false;
  }

  if (/^data:/i.test(trimmed)) {
    return options.allowDataImages === true && SAFE_DATA_IMAGE_PREFIX.test(trimmed);
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  try {
    const parsed = new URL(trimmed, RELATIVE_URL_BASE);
    if (!hasScheme) {
      return parsed.origin === RELATIVE_URL_BASE;
    }

    return (
      ALLOWED_PROTOCOLS.includes(parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number]) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes URLs in a props dictionary to prevent XSS.
 * Replaces dangerous URLs with safe fallback '#'.
 * Recursively inspects nested objects and arrays.
 */
export function sanitizePropsUrls(
  props: Record<string, unknown>,
  options: SafeUrlOptions = {},
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...props };

  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();
    const isUrlKey =
      lowerKey.includes('url') ||
      lowerKey.includes('href') ||
      lowerKey.includes('link') ||
      lowerKey.includes('src');

    if (typeof value === 'string') {
      if (isUrlKey) {
        if (!isSafeUrl(value, options)) {
          sanitized[key] = '#';
        }
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          if (isUrlKey || item.trim().toLowerCase().startsWith('javascript:')) {
            return isSafeUrl(item, options) ? item : '#';
          }
          return item;
        } else if (item && typeof item === 'object') {
          return sanitizePropsUrls(item as Record<string, unknown>, options);
        }
        return item;
      });
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizePropsUrls(value as Record<string, unknown>, options);
    }
  }

  return sanitized;
}

/**
 * Calculates total node count and maximum depth of a section hierarchy.
 * Supports both typed SectionNode[] and untrusted raw JSON objects.
 */
export function inspectTreeMetrics(sections: SectionNode[] | unknown): {
  totalNodes: number;
  maxDepth: number;
} {
  let totalNodes = 0;
  let maxDepth = 0;

  if (!Array.isArray(sections)) {
    return { totalNodes, maxDepth };
  }

  function traverse(node: unknown, depth: number) {
    if (!node || typeof node !== 'object') return;
    totalNodes += 1;
    if (depth > maxDepth) {
      maxDepth = depth;
    }
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children) && children.length > 0) {
      for (const child of children) {
        traverse(child, depth + 1);
      }
    }
  }

  for (const section of sections) {
    if (!section || typeof section !== 'object') continue;
    totalNodes += 1; // Count the section itself
    const children = (section as { children?: unknown }).children;
    if (Array.isArray(children) && children.length > 0) {
      for (const child of children) {
        traverse(child, 1);
      }
    }
  }

  return { totalNodes, maxDepth };
}
