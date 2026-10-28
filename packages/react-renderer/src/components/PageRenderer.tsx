import React, { useMemo } from 'react';
import {
  validatePageDocument,
  themeToCssVariables,
  type PageDocument,
} from '@dsk/core';
import { RendererContext } from '../context/RendererContext';
import { SectionRenderer } from './SectionRenderer';
import { NodeRenderer } from './NodeRenderer';
import type { PageRendererProps, RendererContextValue } from '../types';

export const PageRenderer: React.FC<PageRendererProps> = ({
  document,
  registry,
  validate = true,
  viewport = 'desktop',
  mode = 'render',
  fallbackComponent,
  className,
  style,
}) => {
  // Validate document if validation is not explicitly disabled
  const validationResult = useMemo(() => {
    if (!validate) {
      return { success: true, data: document as PageDocument } as const;
    }
    return validatePageDocument(document);
  }, [document, validate]);

  // If document validation failed, display structured, non-destructive error feedback
  if (!validationResult.success) {
    return (
      <div
        data-dsk-invalid-document="true"
        style={{
          padding: '24px',
          margin: '16px auto',
          maxWidth: '800px',
          backgroundColor: '#fef2f2',
          border: '1px solid #f87171',
          borderRadius: '8px',
          fontFamily: 'system-ui, sans-serif',
          color: '#991b1b',
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
          Invalid Page Document
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#b91c1c' }}>
          The page document failed validation and cannot be safely rendered:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
          {validationResult.errors.map((err, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>
              <code>{err.path}</code>: {err.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const validDoc = validationResult.data;

  // Convert theme tokens to scoped CSS variables
  const themeCssVariables = useMemo(() => {
    return themeToCssVariables(validDoc.theme);
  }, [validDoc.theme]);

  // Context value for nested section and node renderers
  const contextValue: RendererContextValue = useMemo(
    () => ({
      registry,
      theme: validDoc.theme,
      viewport,
      mode,
      renderNode: (node, depth) => <NodeRenderer node={node} currentDepth={depth} />,
      renderSection: (section, index) => (
        <SectionRenderer key={section.id} section={section} index={index} />
      ),
      fallbackComponent,
    }),
    [registry, validDoc.theme, viewport, mode, fallbackComponent],
  );

  return (
    <RendererContext.Provider value={contextValue}>
      <main
        id={`dsk-page-${validDoc.id}`}
        data-dsk-page-id={validDoc.id}
        data-dsk-schema-version={validDoc.schemaVersion}
        data-dsk-viewport={viewport}
        className={className}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'var(--dsk-color-background, #ffffff)',
          color: 'var(--dsk-color-text, #0f172a)',
          fontFamily: 'var(--dsk-font-family, system-ui, sans-serif)',
          ...(themeCssVariables as React.CSSProperties),
          ...style,
        }}
      >
        {validDoc.sections.map((section, index) => (
          <SectionRenderer key={section.id} section={section} index={index} />
        ))}
      </main>
    </RendererContext.Provider>
  );
};
