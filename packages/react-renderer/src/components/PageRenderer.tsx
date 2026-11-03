import React, { useCallback, useMemo, useRef } from 'react';
import {
  validatePageDocument,
  themeToCssVariables,
  type ComponentNode,
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
  renderNode,
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
  return (
    <ValidatedPageRenderer
      document={validationResult.data}
      registry={registry}
      viewport={viewport}
      mode={mode}
      renderNode={renderNode}
      fallbackComponent={fallbackComponent}
      className={className}
      style={style}
    />
  );
};

const ValidatedPageRenderer: React.FC<
  Omit<PageRendererProps, 'document' | 'validate'> & { document: PageDocument }
> = ({
  document,
  registry,
  viewport = 'desktop',
  mode = 'render',
  renderNode,
  fallbackComponent,
  className,
  style,
}) => {
  const renderNodeRef = useRef(renderNode);
  renderNodeRef.current = renderNode;
  const renderNodeWithLatestCallback = useCallback(
    (node: ComponentNode, depth: number, inheritedLocked = false) => {
      const renderedNode = (
        <NodeRenderer node={node} currentDepth={depth} inheritedLocked={inheritedLocked} />
      );
      const callback = renderNodeRef.current;
      return callback ? callback(node, renderedNode, inheritedLocked) : renderedNode;
    },
    [],
  );
  const themeCssVariables = useMemo(() => themeToCssVariables(document.theme), [document.theme]);
  const contextValue: RendererContextValue = useMemo(
    () => ({
      registry,
      theme: document.theme,
      viewport,
      mode,
      renderNode: renderNodeWithLatestCallback,
      renderSection: (section, index) => (
        <SectionRenderer key={section.id} section={section} index={index} />
      ),
      fallbackComponent,
    }),
    [registry, document.theme, viewport, mode, renderNodeWithLatestCallback, fallbackComponent],
  );

  return (
    <RendererContext.Provider value={contextValue}>
      <main
        id={`dsk-page-${document.id}`}
        data-dsk-page-id={document.id}
        data-dsk-schema-version={document.schemaVersion}
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
        {document.sections.map((section, index) => (
          <SectionRenderer key={section.id} section={section} index={index} />
        ))}
      </main>
    </RendererContext.Provider>
  );
};
