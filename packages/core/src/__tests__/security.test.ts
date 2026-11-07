import { describe, it, expect } from 'vitest';
import { isSafeUrl, sanitizePropsUrls, SECURITY_LIMITS } from '../validation/security';
import { validatePageDocument } from '../validation/validate';
import { CURRENT_SCHEMA_VERSION } from '../schemas/document';

describe('Security Limits & URL Validation', () => {
  it('should verify defined security limits conform to specifications', () => {
    expect(SECURITY_LIMITS.MAX_NODE_DEPTH).toBe(20);
    expect(SECURITY_LIMITS.MAX_TOTAL_NODES).toBe(500);
  });

  it('should accept safe URLs', () => {
    expect(isSafeUrl('https://example.com/products')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('/products/123')).toBe(true);
    expect(isSafeUrl('./relative/path')).toBe(true);
    expect(isSafeUrl('../parent/path')).toBe(true);
    expect(isSafeUrl('#section-features')).toBe(true);
    expect(isSafeUrl('mailto:support@example.com')).toBe(true);
    expect(isSafeUrl('tel:+1234567890')).toBe(true);
    expect(isSafeUrl('data:image/png;base64,iVBORw0KGgo...')).toBe(true);
    expect(isSafeUrl('data:image/svg+xml;utf8,<svg></svg>')).toBe(true);
    expect(isSafeUrl('')).toBe(true);
    expect(isSafeUrl(undefined)).toBe(true);
    expect(isSafeUrl(null)).toBe(true);
  });

  it('should reject dangerous URI schemes and evasion attempts', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl('java\nscript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('data:application/javascript;base64,YWxlcnQoMSk=')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('blob:https://example.com/uuid')).toBe(false);
    expect(isSafeUrl('//evil.com/phishing')).toBe(false);
    expect(isSafeUrl('jav&#x61;script:alert(1)')).toBe(false);
    expect(isSafeUrl('https://example.com\0evil')).toBe(false);
  });

  it('should sanitize unsafe URLs in props objects, arrays and nested structures', () => {
    const rawProps = {
      label: 'Click me',
      targetUrl: 'javascript:alert(1)',
      imageUrl: 'https://images.unsplash.com/photo',
      safeDataUrl: 'data:image/png;base64,abc123',
      unsafeDataUrl: 'data:text/html;base64,bad',
      galleryUrls: [
        'https://example.com/1.jpg',
        'javascript:alert("xss")',
        '/local/2.jpg',
      ],
      actions: [
        { label: 'Action 1', link: 'javascript:evil()' },
        { label: 'Action 2', link: 'https://example.com/ok' },
      ],
      nested: {
        href: 'data:text/html;base64,bad',
        deep: {
          src: 'javascript:void(0)',
          safeSrc: '/assets/logo.png',
        },
      },
    };

    const sanitized = sanitizePropsUrls(rawProps);
    expect(sanitized.targetUrl).toBe('#');
    expect(sanitized.imageUrl).toBe('https://images.unsplash.com/photo');
    expect(sanitized.safeDataUrl).toBe('data:image/png;base64,abc123');
    expect(sanitized.unsafeDataUrl).toBe('#');

    // Array of URLs
    const gallery = sanitized.galleryUrls as string[];
    expect(gallery[0]).toBe('https://example.com/1.jpg');
    expect(gallery[1]).toBe('#');
    expect(gallery[2]).toBe('/local/2.jpg');

    // Array of objects
    const actions = sanitized.actions as Array<Record<string, unknown>>;
    expect(actions[0]?.link).toBe('#');
    expect(actions[1]?.link).toBe('https://example.com/ok');

    // Nested objects
    const nested = sanitized.nested as Record<string, unknown>;
    expect(nested.href).toBe('#');
    const deep = nested.deep as Record<string, unknown>;
    expect(deep.src).toBe('#');
    expect(deep.safeSrc).toBe('/assets/logo.png');
  });

  it('should reject documents exceeding max node depth limit of 20 before Zod parsing', () => {
    // Generate an excessively nested node tree (> 20 levels, e.g. 23 levels)
    let innermost: Record<string, unknown> = {
      id: 'leaf',
      type: 'core/text',
      props: {},
      children: [],
    };

    for (let depth = 22; depth >= 1; depth--) {
      innermost = {
        id: `node-depth-${depth}`,
        type: 'core/container',
        props: {},
        children: [innermost],
      };
    }

    const deeplyNestedDoc = {
      id: 'doc-overflow-depth',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: 'sec-1',
          name: 'Section 1',
          children: [innermost],
        },
      ],
    };

    const result = validatePageDocument(deeplyNestedDoc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes('Tree depth'))).toBe(true);
      expect(result.errors.some((e) => e.message.includes('exceeds maximum limit of 20'))).toBe(true);
    }
  });

  it('should accept documents within node depth limit of 20', () => {
    // Generate a valid nested node tree of exactly 5 levels
    let current: Record<string, unknown> = {
      id: 'leaf',
      type: 'core/text',
      props: { content: 'Deep' },
      children: [],
    };

    for (let depth = 5; depth >= 1; depth--) {
      current = {
        id: `node-valid-${depth}`,
        type: 'core/container',
        props: {},
        children: [current],
      };
    }

    const doc = {
      id: 'doc-valid-depth',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: 'sec-1',
          name: 'Section 1',
          children: [current],
        },
      ],
    };

    const result = validatePageDocument(doc);
    expect(result.success).toBe(true);
  });

  it('should reject documents exceeding max total node count limit of 500', () => {
    // Generate 520 nodes across sections
    const children: Record<string, unknown>[] = [];
    for (let i = 0; i < 510; i++) {
      children.push({
        id: `btn-${i}`,
        type: 'core/button',
        props: { label: `Button ${i}` },
        children: [],
      });
    }

    const hugeDoc = {
      id: 'doc-overflow-nodes',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: 'sec-huge',
          name: 'Huge Section',
          children,
        },
      ],
    };

    const result = validatePageDocument(hugeDoc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes('Total node count'))).toBe(true);
      expect(result.errors.some((e) => e.message.includes('exceeds maximum limit of 500'))).toBe(true);
    }
  });

  it('should accept legitimate documents with multiple components under 500 nodes', () => {
    const children: Record<string, unknown>[] = [];
    for (let i = 0; i < 50; i++) {
      children.push({
        id: `card-${i}`,
        type: 'core/container',
        props: {},
        children: [
          {
            id: `title-${i}`,
            type: 'core/heading',
            props: { text: `Title ${i}`, level: 3 },
            children: [],
          },
          {
            id: `desc-${i}`,
            type: 'core/text',
            props: { content: `Description ${i}` },
            children: [],
          },
        ],
      });
    }

    const realisticDoc = {
      id: 'doc-realistic',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: 'sec-realistic',
          name: 'Realistic Section',
          children,
        },
      ],
    };

    const result = validatePageDocument(realisticDoc);
    expect(result.success).toBe(true);
  });
});
