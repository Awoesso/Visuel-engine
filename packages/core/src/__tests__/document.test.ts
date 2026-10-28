import { describe, it, expect } from 'vitest';
import { validatePageDocument } from '../validation/validate';
import { CURRENT_SCHEMA_VERSION } from '../schemas/document';

describe('validatePageDocument', () => {
  it('should successfully validate a complete minimal page document', () => {
    const validDoc = {
      id: 'doc-123',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: {
        title: 'My Storefront Home',
        slug: '/',
      },
      theme: {
        name: 'modern-blue',
        colors: {
          primary: '#0066cc',
        },
      },
      sections: [
        {
          id: 'sec-hero',
          type: 'section',
          name: 'Hero Section',
          children: [
            {
              id: 'btn-cta',
              type: 'core/button',
              props: {
                label: 'Shop Now',
                url: 'https://example.com/shop',
              },
            },
          ],
        },
      ],
    };

    const result = validatePageDocument(validDoc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('doc-123');
      expect(result.data.sections).toHaveLength(1);
      expect(result.data.sections[0]?.children).toHaveLength(1);
      expect(result.data.sections[0]?.children[0]?.id).toBe('btn-cta');
      // Verify default applied
      expect(result.data.theme.colors.secondary).toBe('#475569');
    }
  });

  it('should reject documents missing an id', () => {
    const invalidDoc = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [],
    };

    const result = validatePageDocument(invalidDoc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.path.includes('id'))).toBe(true);
    }
  });

  it('should reject documents with incorrect schemaVersion', () => {
    const invalidDoc = {
      id: 'doc-invalid-version',
      schemaVersion: 999,
      sections: [],
    };

    const result = validatePageDocument(invalidDoc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.path.includes('schemaVersion'))).toBe(true);
    }
  });

  it('should detect duplicate IDs across sections and component nodes', () => {
    const docWithDuplicates = {
      id: 'doc-duplicate',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      sections: [
        {
          id: 'item-1',
          name: 'Section 1',
          children: [
            {
              id: 'item-1', // duplicate ID!
              type: 'core/text',
              props: { content: 'Duplicate' },
            },
          ],
        },
      ],
    };

    const result = validatePageDocument(docWithDuplicates);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes('Duplicate node ID detected'))).toBe(true);
    }
  });
});
