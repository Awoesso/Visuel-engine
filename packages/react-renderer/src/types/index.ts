import type React from 'react';
import type {
  PageDocument,
  ComponentNode,
  SectionNode,
  ThemeTokens,
  ResponsiveStyles,
  ViewportMode,
} from '@dsk/core';

export interface RenderComponentProps<T = Record<string, unknown>> {
  id: string;
  type: string;
  props: T;
  styles?: ResponsiveStyles;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export type ReactComponentImplementation<T = Record<string, unknown>> = React.ComponentType<
  RenderComponentProps<T>
>;

export type ComponentMapping =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Map<string, ReactComponentImplementation<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Record<string, ReactComponentImplementation<any>>;

export type RendererMode = 'render' | 'preview' | 'edit';

export interface RendererContextValue {
  registry: ComponentMapping;
  theme: ThemeTokens;
  viewport: ViewportMode;
  mode: RendererMode;
  renderNode: (
    node: ComponentNode,
    currentDepth: number,
    inheritedLocked?: boolean,
  ) => React.ReactNode;
  renderSection: (section: SectionNode, index: number) => React.ReactNode;
  fallbackComponent?: React.ComponentType<{ node?: ComponentNode; error?: Error }>;
}

export interface PageRendererProps {
  document: PageDocument | unknown;
  registry: ComponentMapping;
  validate?: boolean;
  viewport?: ViewportMode;
  mode?: RendererMode;
  renderNode?: (
    node: ComponentNode,
    renderedNode: React.ReactNode,
    inheritedLocked?: boolean,
  ) => React.ReactNode;
  fallbackComponent?: React.ComponentType<{ node?: ComponentNode; error?: Error }>;
  className?: string;
  style?: React.CSSProperties;
}
