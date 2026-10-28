import type { ComponentNode, SectionNode } from '../schemas/node';

export const SECURITY_LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_NODE_DEPTH: 32,
  MAX_TOTAL_NODES: 2000,
  MAX_SECTIONS: 100,
} as const;

const DANGEROUS_URL_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];

/**
 * Checks if a given URL is safe to render in href or src attributes.
 * Rejects dangerous URI schemes such as javascript:, vbscript:, data:text/html.
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();

  // Relative URLs, anchor links, mailto and tel are safe
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return true;
  }

  // Check dangerous protocols
  for (const protocol of DANGEROUS_URL_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return false;
    }
  }

  // Disallow general data: URLs unless safe images
  if (trimmed.startsWith('data:')) {
    return trimmed.startsWith('data:image/');
  }

  // Reject anything containing null bytes or encoded javascript:
  if (trimmed.includes('\0') || trimmed.includes('&#')) {
    return false;
  }

  return true;
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
