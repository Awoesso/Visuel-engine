import { describe, it, expect } from 'vitest';
import { isSafeUrl, sanitizePropsUrls } from '../validation/security';
import { validatePageDocument } from '../validation/validate';
import { CURRENT_SCHEMA_VERSION } from '../schemas/document';

describe('Security Limits & URL Validation', () => {
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
    expect(isSafeUrl('')).toBe(true);
    expect(isSafeUrl(undefined)).toBe(true);
  });

  it('should reject dangerous URI schemes and evasion attempts', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl('java\nscript:alert(1)')).toBe(false);
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('blob:https://example.com/uuid')).toBe(false);
    expect(isSafeUrl('//evil.com/phishing')).toBe(false);
    expect(isSafeUrl('jav&#x61;script:alert(1)')).toBe(false);
    expect(isSafeUrl('https://example.com\0evil')).toBe(false);
  });

  it('should sanitize unsafe URLs in props objects', () => {
    const rawProps = {
      label: 'Click me',
      targetUrl: 'javascript:alert(1)',
      imageUrl: 'https://images.unsplash.com/photo',
      nested: {
        href: 'data:text/html;base64,bad',
      },
    };

    const sanitized = sanitizePropsUrls(rawProps);
    expect(sanitized.targetUrl).toBe('#');
    expect(sanitized.imageUrl).toBe('https://images.unsplash.com/photo');
    expect((sanitized.nested as Record<string, unknown>).href).toBe('#');
  });

  it('should reject documents exceeding max node depth limit of 32', () => {
    // Generate an excessively nested node tree (> 32 levels)
    let innermost: Record<string, unknown> = {
      id: 'leaf',
      type: 'core/text',
      props: {},
      children: [],
    };

    for (let depth = 35; depth >= 1; depth--) {
      innermost = {
        id: `node-depth-${depth}`,
        type: 'core/container',
        props: {},
        children: [innermost],
      };
    }

    const deeplyNestedDoc = {
      id: 'doc-overflow',
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
    }
  });
});
