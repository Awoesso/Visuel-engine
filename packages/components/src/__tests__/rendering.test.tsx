// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageRenderer } from '@dsk/react-renderer';
import { PageDocumentSchema, CURRENT_SCHEMA_VERSION } from '@dsk/core';
import { defaultRendererRegistry } from '../defaultRegistry';
import { Button } from '../basic/Button';

describe('Component Rendering via PageRenderer', () => {
  const makeDoc = (children: unknown[]) =>
    PageDocumentSchema.parse({
      id: 'test-doc',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'Component render test' },
      theme: { name: 'default' },
      sections: [
        {
          id: 'sec-1',
          type: 'section',
          name: 'Main',
          children,
        },
      ],
    });

  it('should render a Heading with correct semantic tag', () => {
    const doc = makeDoc([
      { id: 'h-1', type: 'core/heading', props: { text: 'Main Title', level: 1 } },
      { id: 'h-3', type: 'core/heading', props: { text: 'Subtitle', level: 3 } },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const h1 = screen.getByText('Main Title');
    expect(h1.tagName).toBe('H1');
    const h3 = screen.getByText('Subtitle');
    expect(h3.tagName).toBe('H3');
  });

  it('should render Text with content', () => {
    const doc = makeDoc([
      { id: 'txt-1', type: 'core/text', props: { content: 'Hello paragraph world' } },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const p = screen.getByText('Hello paragraph world');
    expect(p.tagName).toBe('P');
    expect(p.getAttribute('data-dsk-component')).toBe('core/text');
  });

  it('should render Button as link when url is safe', () => {
    const doc = makeDoc([
      {
        id: 'btn-link',
        type: 'core/button',
        props: { label: 'Go to Shop', url: 'https://shop.example.com' },
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const el = screen.getByText('Go to Shop');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('https://shop.example.com');
  });

  it('should render Button with rel="noopener noreferrer" when target="_blank"', () => {
    const doc = makeDoc([
      {
        id: 'btn-blank',
        type: 'core/button',
        props: { label: 'External Link', url: 'https://external.example.com', target: '_blank' },
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const el = screen.getByText('External Link');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should render Button as link with valid hash anchor', () => {
    const doc = makeDoc([
      {
        id: 'btn-anchor',
        type: 'core/button',
        props: { label: 'Jump to Section', url: '#pricing-table' },
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const el = screen.getByText('Jump to Section');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('#pricing-table');
  });

  it('should render Button as <button> when url is missing', () => {
    const doc = makeDoc([
      { id: 'btn-no-url', type: 'core/button', props: { label: 'Click Me' } },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const el = screen.getByText('Click Me');
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('should NEVER convert a dangerous URL into an active link or active button', () => {
    const doc = makeDoc([
      {
        id: 'btn-xss',
        type: 'core/button',
        props: { label: 'Malicious Button', url: 'javascript:alert(1)' },
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    const el = screen.getByText('Malicious Button');
    // Security check: Must render as a disabled button, never an active <a> or active button
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('href')).toBeNull();
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-dsk-unsafe-url')).toBe('true');
  });

  it('should render Button as disabled even when invoked directly with malicious URL (defense-in-depth)', () => {
    render(
      <Button
        id="btn-direct-xss"
        type="core/button"
        props={{ label: 'Direct Attack', url: 'javascript:alert(document.cookie)' }}
      />,
    );

    const el = screen.getByText('Direct Attack');
    expect(el.tagName).toBe('BUTTON');
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-dsk-unsafe-url')).toBe('true');
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should render Image with safe src', () => {
    const doc = makeDoc([
      {
        id: 'img-1',
        type: 'core/image',
        props: { src: 'https://images.example.com/photo.jpg', alt: 'Product photo' },
      },
    ]);

    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );

    const img = container.querySelector('img[data-dsk-component="core/image"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://images.example.com/photo.jpg');
    expect(img?.getAttribute('alt')).toBe('Product photo');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  it('should render Image with safe data:image URL', () => {
    const doc = makeDoc([
      {
        id: 'img-data',
        type: 'core/image',
        props: { src: 'data:image/png;base64,iVBORw0KGgo...', alt: 'Inline base64 image' },
      },
    ]);

    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );

    const img = container.querySelector('img[data-dsk-component="core/image"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo...');
  });

  it('should render Image placeholder when src is empty', () => {
    const doc = makeDoc([
      { id: 'img-empty', type: 'core/image', props: { alt: 'Missing image' } },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    expect(screen.getByText('Missing image')).toBeDefined();
  });

  it('should render Image placeholder when src is a dangerous URL', () => {
    const doc = makeDoc([
      {
        id: 'img-xss',
        type: 'core/image',
        props: { src: 'javascript:alert(1)', alt: 'Bad image' },
      },
    ]);

    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );
    const img = container.querySelector('img[data-dsk-component="core/image"]');
    expect(img).toBeNull();
    expect(screen.getByText('Bad image')).toBeDefined();
  });

  it('should render Image placeholder when src is protocol-relative // URL', () => {
    const doc = makeDoc([
      {
        id: 'img-proto-rel',
        type: 'core/image',
        props: { src: '//evil.com/phish.jpg', alt: 'Protocol relative' },
      },
    ]);

    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );
    const img = container.querySelector('img[data-dsk-component="core/image"]');
    expect(img).toBeNull();
    expect(screen.getByText('Protocol relative')).toBeDefined();
  });

  it('should render Container with children', () => {
    const doc = makeDoc([
      {
        id: 'container-1',
        type: 'core/container',
        props: { maxWidth: 'md', alignment: 'center' },
        children: [
          { id: 'inner-h', type: 'core/heading', props: { text: 'Inside Container' } },
        ],
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    expect(screen.getByText('Inside Container')).toBeDefined();
    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );
    const containerEl = container.querySelector('[data-dsk-component="core/container"]');
    expect(containerEl).not.toBeNull();
  });

  it('should render Grid with children and WITHOUT unnecessary role="grid"', () => {
    const doc = makeDoc([
      {
        id: 'grid-1',
        type: 'core/grid',
        props: { columns: 2, gap: 'lg' },
        children: [
          { id: 'g-txt-1', type: 'core/text', props: { content: 'Cell 1' } },
          { id: 'g-txt-2', type: 'core/text', props: { content: 'Cell 2' } },
        ],
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    expect(screen.getByText('Cell 1')).toBeDefined();
    expect(screen.getByText('Cell 2')).toBeDefined();

    const { container } = render(
      <PageRenderer document={doc} registry={defaultRendererRegistry} />,
    );
    const gridEl = container.querySelector<HTMLElement>('[data-dsk-component="core/grid"]');
    expect(gridEl).not.toBeNull();
    expect(gridEl?.style.display).toBe('grid');
    // Accessibility check: Pure CSS layout grid must NOT have role="grid"
    expect(gridEl?.getAttribute('role')).toBeNull();
  });

  it('should render a full storefront-like page with multiple component types', () => {
    const doc = makeDoc([
      {
        id: 'hero-container',
        type: 'core/container',
        props: { maxWidth: 'xl', padding: 'lg' },
        children: [
          { id: 'hero-title', type: 'core/heading', props: { text: 'Welcome', level: 1 } },
          {
            id: 'hero-desc',
            type: 'core/text',
            props: { content: 'Discover our products', fontSize: 'lg' },
          },
          {
            id: 'hero-btn',
            type: 'core/button',
            props: { label: 'Browse', url: '/catalog', variant: 'primary' },
          },
          {
            id: 'hero-img',
            type: 'core/image',
            props: { src: 'https://cdn.example.com/hero.jpg', alt: 'Hero banner' },
          },
        ],
      },
      {
        id: 'products-grid',
        type: 'core/grid',
        props: { columns: 3, gap: 'md' },
        children: [
          { id: 'prod-1', type: 'core/text', props: { content: 'Product A' } },
          { id: 'prod-2', type: 'core/text', props: { content: 'Product B' } },
          { id: 'prod-3', type: 'core/text', props: { content: 'Product C' } },
        ],
      },
    ]);

    render(<PageRenderer document={doc} registry={defaultRendererRegistry} />);

    expect(screen.getByText('Welcome')).toBeDefined();
    expect(screen.getByText('Discover our products')).toBeDefined();
    expect(screen.getByText('Browse')).toBeDefined();
    expect(screen.getByText('Product A')).toBeDefined();
    expect(screen.getByText('Product B')).toBeDefined();
    expect(screen.getByText('Product C')).toBeDefined();
  });
});
