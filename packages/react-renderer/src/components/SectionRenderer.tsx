import React from 'react';
import type { SectionNode } from '@dsk/core';
import { useRenderer } from '../context/useRenderer';
import { SafeErrorBoundary } from './SafeErrorBoundary';
import { resolveResponsiveStyles, elementStylesToCssProperties } from '../utils/styleResolver';

export interface SectionRendererProps {
  section: SectionNode;
  index: number;
}

const SectionRendererView: React.FC<SectionRendererProps> = ({ section, index: _index }) => {
  const { viewport, fallbackComponent, renderNode } = useRenderer();

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
              <React.Fragment key={child.id}>
                {renderNode(child, 1, section.locked === true)}
              </React.Fragment>
            ))
          : null}
      </section>
    </SafeErrorBoundary>
  );
};

export const SectionRenderer = React.memo(SectionRendererView);
