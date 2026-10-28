// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageRenderer } from '../components/PageRenderer';
import type { ComponentMapping, RenderComponentProps } from '../types';
import { CURRENT_SCHEMA_VERSION, PageDocumentSchema } from '@dsk/core';

// Test mock components
const HeadingComponent: React.FC<RenderComponentProps<{ text: string; level?: number }>> = ({
  props,
}) => {
  return <h1>{props.text}</h1>;
};

const ButtonComponent: React.FC<
  RenderComponentProps<{ label: string; url?: string }>
> = ({ props }) => {
  return (
    <a href={props.url || '#'} data-testid="button-element">
      {props.label}
    </a>
  );
};

const ContainerComponent: React.FC<RenderComponentProps<{ padding?: string }>> = ({
  children,
}) => {
  return <div data-testid="container-wrapper">{children}</div>;
};

const CrashingComponent: React.FC<RenderComponentProps> = () => {
  throw new Error('Simulation of catastrophic runtime component crash');
};

const testRegistry: ComponentMapping = {
  'core/heading': HeadingComponent,
  'core/button': ButtonComponent,
  'core/container': ContainerComponent,
  'test/crash': CrashingComponent,
};

describe('PageRenderer', () => {
  it('should render a valid page document with sections and registered components', () => {
    const validDoc = PageDocumentSchema.parse({
      id: 'doc-home',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: {
        title: 'Home Page',
        slug: '/',
      },
      theme: {
        name: 'default',
        colors: {
          primary: '#2563eb',
        },
      },
      sections: [
        {
          id: 'sec-hero',
          type: 'section',
          name: 'Hero',
          styles: { desktop: { paddingBottom: '32px' } },
          children: [
            {
              id: 'heading-1',
              type: 'core/heading',
              props: { text: 'Welcome to Store' },
            },
            {
              id: 'btn-1',
              type: 'core/button',
              props: { label: 'Explore Catalog', url: 'https://example.com/catalog' },
            },
          ],
        },
      ],
    });

    render(<PageRenderer document={validDoc} registry={testRegistry} />);

    expect(screen.getByText('Welcome to Store')).toBeDefined();
    const button = screen.getByTestId('button-element');
    expect(button.textContent).toBe('Explore Catalog');
    expect(button.getAttribute('href')).toBe('https://example.com/catalog');
  });

  it('should render an informative fallback when encountering unknown component types in preview mode', () => {
    const docWithUnknown = PageDocumentSchema.parse({
      id: 'doc-unknown',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'Unknown test' },
      theme: { name: 'default' },
      sections: [
        {
          id: 'sec-1',
          type: 'section',
          name: 'Main',
          children: [
            {
              id: 'unknown-widget',
              type: 'third-party/carousel',
              props: {},
            },
          ],
        },
      ],
    });

    render(
      <PageRenderer
        document={docWithUnknown}
        registry={testRegistry}
        mode="preview"
      />,
    );

    expect(screen.getByText('Unregistered Component Type')).toBeDefined();
    expect(screen.getByText(/third-party\/carousel/)).toBeDefined();
  });

  it('should isolate component errors with SafeErrorBoundary and not break surrounding nodes', () => {
    const docWithCrash = PageDocumentSchema.parse({
      id: 'doc-crash',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'Crash test' },
      theme: { name: 'default' },
      sections: [
        {
          id: 'sec-1',
          type: 'section',
          name: 'Main',
          children: [
            {
              id: 'heading-alive',
              type: 'core/heading',
              props: { text: 'I am still rendered' },
            },
            {
              id: 'broken-node',
              type: 'test/crash',
              props: {},
            },
          ],
        },
      ],
    });

    render(<PageRenderer document={docWithCrash} registry={testRegistry} />);

    // Heading should render normally despite crash in adjacent sibling
    expect(screen.getByText('I am still rendered')).toBeDefined();
    // Error boundary fallback should appear
    expect(screen.getByText(/Simulation of catastrophic runtime component crash/)).toBeDefined();
  });

  it('should apply theme CSS custom properties on the root main element', () => {
    const docWithTheme = PageDocumentSchema.parse({
      id: 'doc-theme',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'Theme test' },
      theme: {
        name: 'emerald',
        colors: {
          primary: '#10b981',
          background: '#f0fdf4',
        },
      },
      sections: [],
    });

    const { container } = render(
      <PageRenderer document={docWithTheme} registry={testRegistry} />,
    );

    const mainEl = container.querySelector('main');
    expect(mainEl).toBeDefined();
    expect(mainEl?.id).toBe('dsk-page-doc-theme');
    // Check that CSS variable is set on style
    expect(mainEl?.style.getPropertyValue('--dsk-color-primary')).toBe('#10b981');
  });

  it('should render structured validation errors when document is invalid', () => {
    const invalidDoc = {
      id: '', // invalid: empty id
      schemaVersion: 99, // invalid version
      sections: [],
    };

    render(<PageRenderer document={invalidDoc} registry={testRegistry} />);

    expect(screen.getByText('Invalid Page Document')).toBeDefined();
    expect(screen.getByText(/Document ID cannot be empty/)).toBeDefined();
  });

  it('should sanitize dangerous URL schemes in component props (Anti-XSS)', () => {
    const docWithXss = PageDocumentSchema.parse({
      id: 'doc-xss',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'XSS test' },
      theme: { name: 'default' },
      sections: [
        {
          id: 'sec-1',
          type: 'section',
          name: 'Main',
          children: [
            {
              id: 'btn-xss',
              type: 'core/button',
              props: {
                label: 'Malicious Link',
                url: 'javascript:alert(document.cookie)',
              },
            },
          ],
        },
      ],
    });

    render(<PageRenderer document={docWithXss} registry={testRegistry} />);

    const button = screen.getByTestId('button-element');
    // Should be sanitized to safe '#' fallback
    expect(button.getAttribute('href')).toBe('#');
  });

  it('should render nested component hierarchies recursively', () => {
    const nestedDoc = PageDocumentSchema.parse({
      id: 'doc-nested',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: { title: 'Nested test' },
      theme: { name: 'default' },
      sections: [
        {
          id: 'sec-1',
          type: 'section',
          name: 'Main',
          children: [
            {
              id: 'container-outer',
              type: 'core/container',
              props: {},
              children: [
                {
                  id: 'heading-inside',
                  type: 'core/heading',
                  props: { text: 'Deeply Nested Text' },
                },
              ],
            },
          ],
        },
      ],
    });

    render(<PageRenderer document={nestedDoc} registry={testRegistry} />);

    expect(screen.getByTestId('container-wrapper')).toBeDefined();
    expect(screen.getByText('Deeply Nested Text')).toBeDefined();
  });
});
