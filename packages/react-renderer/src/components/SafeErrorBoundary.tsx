import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ComponentNode } from '@dsk/core';

interface SafeErrorBoundaryProps {
  node?: ComponentNode;
  fallback?: React.ComponentType<{ node?: ComponentNode; error?: Error }>;
  children: ReactNode;
}

interface SafeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeErrorBoundary extends Component<SafeErrorBoundaryProps, SafeErrorBoundaryState> {
  constructor(props: SafeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Suppress unhandled rejections in testing, log in non-production
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.error(
        `[DSK Renderer] Error rendering component node "${this.props.node?.id || 'unknown'}":`,
        error,
        errorInfo,
      );
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent node={this.props.node} error={this.state.error} />;
      }

      return (
        <div
          data-dsk-error-node={this.props.node?.id}
          style={{
            padding: '8px 12px',
            margin: '4px 0',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#991b1b',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          <strong>Component Error:</strong> {this.state.error?.message || 'Failed to render'} (Node:{' '}
          {this.props.node?.type || 'unknown'})
        </div>
      );
    }

    return this.props.children;
  }
}
