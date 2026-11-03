import React from 'react';
import { SECURITY_LIMITS, sanitizePropsUrls, type ComponentNode } from '@dsk/core';
import { useRenderer } from '../context/useRenderer';
import { SafeErrorBoundary } from './SafeErrorBoundary';
import { UnknownComponentFallback } from './UnknownComponentFallback';
import { resolveResponsiveStyles, elementStylesToCssProperties } from '../utils/styleResolver';
import type { ReactComponentImplementation } from '../types';

export interface NodeRendererProps {
  node: ComponentNode;
  currentDepth?: number;
  inheritedLocked?: boolean;
}

const NodeRendererView: React.FC<NodeRendererProps> = ({
  node,
  currentDepth = 0,
  inheritedLocked = false,
}) => {
  const { registry, viewport, mode, fallbackComponent, renderNode } = useRenderer();

  if (node.hidden) {
    return null;
  }

  // Enforce recursion depth limit for security
  if (currentDepth > SECURITY_LIMITS.MAX_NODE_DEPTH) {
    return (
      <div
        data-dsk-depth-limit={node.id}
        style={{
          padding: '4px 8px',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          fontSize: '11px',
        }}
      >
        Security limit reached: Maximum node nesting depth exceeded.
      </div>
    );
  }

  // Resolve component implementation from registry (supports both Map and Record)
  let ComponentImpl: ReactComponentImplementation | undefined;
  if (registry instanceof Map) {
    ComponentImpl = registry.get(node.type);
  } else if (registry && typeof registry === 'object') {
    ComponentImpl = (registry as Record<string, ReactComponentImplementation>)[node.type];
  }

  if (!ComponentImpl) {
    return <UnknownComponentFallback node={node} mode={mode} />;
  }

  // Sanitize URLs in props (anti-XSS)
  const safeProps = node.props ? sanitizePropsUrls(node.props) : {};

  // Resolve responsive styles for current viewport
  const elementStyles = resolveResponsiveStyles(node.styles, viewport);
  const cssProperties = elementStylesToCssProperties(elementStyles);

  // Recursively render children
  let renderedChildren: React.ReactNode = null;
  if (node.children && node.children.length > 0) {
    const childrenLocked = inheritedLocked || node.locked === true;
    renderedChildren = node.children.map((child) => (
      <React.Fragment key={child.id}>
        {renderNode(child, currentDepth + 1, childrenLocked)}
      </React.Fragment>
    ));
  }

  return (
    <SafeErrorBoundary node={node} fallback={fallbackComponent}>
      <ComponentImpl
        id={node.id}
        type={node.type}
        props={safeProps}
        styles={node.styles}
        style={cssProperties}
        children={renderedChildren}
      />
    </SafeErrorBoundary>
  );
};

export const NodeRenderer = React.memo(NodeRendererView);
