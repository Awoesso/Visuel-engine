import React from 'react';
import type { SectionNode } from '@dsk/core';
import { useRenderer } from '../context/useRenderer';
import { NodeRenderer } from './NodeRenderer';
import { SafeErrorBoundary } from './SafeErrorBoundary';
import {
  resolveResponsiveStyles,
  elementStylesToCssProperties,
} from '../utils/styleResolver';

export interface SectionRendererProps {
  section: SectionNode;
  index: number;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  index: _index,
}) => {
  const { viewport, fallbackComponent } = useRenderer();

  if (section.hidden) {
    return null;
  }

  const elementStyles = resolveResponsiveStyles(section.styles, viewport);
  const sectionStyles = elementStylesToCssProperties(elementStyles);

  return (
    <SafeErrorBoundary
      fallback={fallbackComponent}
      node={{
        id: section.id,
        type: section.type,
        version: 1,
        name: section.name,
        props: {},
        styles: section.styles || { desktop: {} },
        children: section.children,
        locked: section.locked ?? false,
        hidden: section.hidden ?? false,
      }}
    >
      <section
        id={section.id}
        data-dsk-section-id={section.id}
        data-dsk-section-name={section.name}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          position: 'relative',
          ...sectionStyles,
        }}
      >
        {section.children && section.children.length > 0
          ? section.children.map((child) => (
              <NodeRenderer key={child.id} node={child} currentDepth={1} />
            ))
          : null}
      </section>
    </SafeErrorBoundary>
  );
};
