import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageDocumentSchema, validatePageDocument } from '@dsk/core';
import { PageRenderer } from '@dsk/react-renderer';
import { defaultRendererRegistry } from '@dsk/components';
import { SECTION_PRESETS } from '@dsk/templates';
import { initialDocument } from '../store';

function getDocumentNodeTypes(): string[] {
  return initialDocument.sections.flatMap((section) => {
    const collect = (nodes: typeof section.children): string[] =>
      nodes.flatMap((node) => [node.type, ...collect(node.children)]);
    return collect(section.children);
  });
}

describe('editor demo document', () => {
  it('passes the core document validator', () => {
    const result = validatePageDocument(initialDocument);
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(result.errors.map((error) => `${error.path}: ${error.message}`).join('\n'));
    }

    expect(result.data.id).toBe('dsk-editor-demo');
    expect(result.data.schemaVersion).toBe(1);
    expect(result.data.sections[0]?.children.length).toBeGreaterThan(0);
  });

  it('resolves registered document component IDs and renders them', () => {
    const componentTypes = getDocumentNodeTypes();
    expect(componentTypes.length).toBeGreaterThan(5);
    for (const componentType of componentTypes) {
      expect(
        defaultRendererRegistry[componentType],
        `${componentType} must be registered`,
      ).toBeDefined();
    }

    const result = validatePageDocument(initialDocument);
    if (!result.success) {
      throw new Error(result.errors.map((error) => `${error.path}: ${error.message}`).join('\n'));
    }

    const markup = renderToStaticMarkup(
      <PageRenderer
        document={result.data}
        registry={defaultRendererRegistry}
        mode="edit"
        renderNode={(node, renderedNode) => <div data-editor-node-id={node.id}>{renderedNode}</div>}
      />,
    );

    expect(markup).toContain('<h1');
    expect(markup).toContain('Bienvenue dans DSK Visual Engine');
    expect(markup).toContain('Composez une page avec les composants enregistrés');
    expect(markup).toContain('Découvrir les composants');
    expect(markup.match(/data-dsk-component=/g)?.length).toBeGreaterThan(10);
    expect(markup.match(/data-editor-node-id=/g)?.length).toBe(componentTypes.length);
    expect(markup).not.toContain('data-dsk-unknown-node');
  });

  it('uses the document responsive grid styles at each viewport', () => {
    const expectedColumns = [
      ['desktop', 'repeat(3, minmax(0, 1fr))'],
      ['tablet', 'repeat(2, minmax(0, 1fr))'],
      ['mobile', 'minmax(0, 1fr)'],
    ] as const;

    for (const [viewport, columns] of expectedColumns) {
      const markup = renderToStaticMarkup(
        <PageRenderer
          document={initialDocument}
          registry={defaultRendererRegistry}
          viewport={viewport}
        />,
      );
      expect(markup).toContain(`grid-template-columns:${columns}`);
    }
  });

  it('renders the added layout and spacing components through the public registry', () => {
    const document = PageDocumentSchema.parse({
      ...initialDocument,
      sections: [
        {
          id: 'section-layout-test',
          name: 'Layout test',
          children: [
            {
              id: 'stack-layout-test',
              type: 'core/stack',
              props: { direction: 'row', gap: 'lg' },
              children: [
                { id: 'spacer-layout-test', type: 'core/spacer', props: { size: 40 } },
                { id: 'divider-layout-test', type: 'core/divider', props: { color: '#334155' } },
              ],
            },
          ],
        },
      ],
    });
    const markup = renderToStaticMarkup(
      <PageRenderer document={document} registry={defaultRendererRegistry} />,
    );

    expect(markup).toContain('data-dsk-component="core/stack"');
    expect(markup).toContain('data-dsk-component="core/spacer"');
    expect(markup).toContain('height:40px');
    expect(markup).toContain('data-dsk-component="core/divider"');
    expect(markup).toContain('border-top:1px solid #334155');
  });

  it('includes every reusable section preset with valid renderer component identifiers', () => {
    expect(SECTION_PRESETS.map((preset) => preset.id)).toEqual(
      expect.arrayContaining([
        'header',
        'hero',
        'hero-editorial',
        'feature-grid',
        'product-collection',
        'testimonials',
        'faq',
        'newsletter',
        'call-to-action',
        'footer',
      ]),
    );

    for (const preset of SECTION_PRESETS) {
      const doc = PageDocumentSchema.parse({
        ...initialDocument,
        sections: [preset.section],
      });
      expect(validatePageDocument(doc).success).toBe(true);

      const collect = (nodes: (typeof doc.sections)[number]['children']): string[] =>
        nodes.flatMap((node) => [node.type, ...collect(node.children)]);
      for (const type of collect(preset.section.children)) {
        expect(
          defaultRendererRegistry[type],
          `${preset.name} uses registered ${type}`,
        ).toBeDefined();
      }

      for (const viewport of ['desktop', 'tablet', 'mobile'] as const) {
        const markup = renderToStaticMarkup(
          <PageRenderer document={doc} registry={defaultRendererRegistry} viewport={viewport} />,
        );
        expect(markup, `${preset.name} should render on ${viewport}`).not.toContain(
          'data-dsk-unknown-node',
        );
      }
    }
  });
});
