import type { SectionNode } from '../schemas/node';

export const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:'] as const;

export const SECURITY_LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_NODE_DEPTH: 20,
  MAX_TOTAL_NODES: 500,
  MAX_SECTIONS: 100,
} as const;

/**
 * Checks if a given URL is safe to render in href or src attributes.
 * Uses a positive allowlist of safe protocols (http, https, mailto, tel, safe data:image/)
 * and relative URLs, while strictly rejecting evasion techniques, control characters,
 * protocol-relative URLs (//), and dangerous schemes (javascript:, vbscript:, etc.).
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // Clean URL by stripping internal whitespace and control characters for scheme inspection
  // eslint-disable-next-line no-control-regex
  const clean = trimmed.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '').toLowerCase();

  // Reject null bytes, encoded null bytes, and HTML entity escapes
  if (clean.includes('\0') || clean.includes('%00') || clean.includes('&#')) {
    return false;
  }

  // Reject protocol-relative URLs (//attacker.com) to prevent open redirect vectors
  if (clean.startsWith('//')) {
    return false;
  }

  // Safe relative paths and internal hash anchors
  if (
    clean.startsWith('/') ||
    clean.startsWith('./') ||
    clean.startsWith('../') ||
    clean.startsWith('#')
  ) {
    return true;
  }

  // Safe data: URLs (images only)
  if (clean.startsWith('data:')) {
    return clean.startsWith('data:image/');
  }

  // Parse absolute URLs and enforce strict protocol allowlist
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    return (
      protocol === 'http:' ||
      protocol === 'https:' ||
      protocol === 'mailto:' ||
      protocol === 'tel:'
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
        if (!isSafeUrl(value)) {
          sanitized[key] = '#';
        }
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          if (isUrlKey || item.trim().toLowerCase().startsWith('javascript:')) {
            return isSafeUrl(item) ? item : '#';
          }
          return item;
        } else if (item && typeof item === 'object') {
          return sanitizePropsUrls(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizePropsUrls(value as Record<string, unknown>);
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
