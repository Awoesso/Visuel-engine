import type { ComponentNode, SectionNode } from '../schemas/node';

export const SECURITY_LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_NODE_DEPTH: 32,
  MAX_TOTAL_NODES: 2000,
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
 */
export function sanitizePropsUrls(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...props };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('url') ||
        lowerKey.includes('href') ||
        lowerKey.includes('link') ||
        lowerKey.includes('src')
      ) {
        if (!isSafeUrl(value)) {
          sanitized[key] = '#';
        }
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizePropsUrls(value as Record<string, unknown>);
    }
  }

  return sanitized;
}

/**
 * Calculates total node count and maximum depth of a section hierarchy.
 */
export function inspectTreeMetrics(sections: SectionNode[]): {
  totalNodes: number;
  maxDepth: number;
} {
  let totalNodes = 0;
  let maxDepth = 0;

  function traverse(node: ComponentNode, depth: number) {
    totalNodes += 1;
    if (depth > maxDepth) {
      maxDepth = depth;
    }
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  for (const section of sections) {
    totalNodes += 1; // Count the section itself
    if (section.children && section.children.length > 0) {
      for (const child of section.children) {
        traverse(child, 1);
      }
    }
  }

  return { totalNodes, maxDepth };
}
