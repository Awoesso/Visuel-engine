import React from 'react';
import { z } from 'zod/v3';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const SpacerPropsSchema = z.object({
  size: z.number().int().min(4).max(256).default(32),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;
export type SpacerInputProps = z.input<typeof SpacerPropsSchema>;

export const Spacer: React.FC<RenderComponentProps<SpacerInputProps>> = ({ props, style }) => {
  const safeProps = SpacerPropsSchema.parse(props || {});
  return (
    <div
      data-dsk-component="core/spacer"
      role="presentation"
      aria-hidden="true"
      style={{
        width: '100%',
        height: `${safeProps.size}px`,
        minHeight: 4,
        ...style,
      }}
    />
  );
};

export const spacerDefinition: ComponentDefinition<SpacerProps> = {
  type: 'core/spacer',
  version: 1,
  label: 'Spacer',
  description: 'Ajoute un espace vertical ajustable.',
  category: 'basic',
  propsSchema: SpacerPropsSchema,
  defaultProps: { size: 32 },
  controls: {
    size: {
      type: 'number',
      label: 'Hauteur (px)',
      category: 'layout',
      min: 4,
      max: 256,
      step: 4,
    },
  },
  canHaveChildren: false,
};
