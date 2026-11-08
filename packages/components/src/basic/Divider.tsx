import React from 'react';
import { z } from 'zod/v3';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const DividerPropsSchema = z.object({
  color: z.string().default('#e2e8f0'),
  thickness: z.number().int().min(1).max(8).default(1),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
});

export type DividerProps = z.infer<typeof DividerPropsSchema>;
export type DividerInputProps = z.input<typeof DividerPropsSchema>;

export const Divider: React.FC<RenderComponentProps<DividerInputProps>> = ({ props, style }) => {
  const safeProps = DividerPropsSchema.parse(props || {});
  return (
    <hr
      data-dsk-component="core/divider"
      style={{
        width: '100%',
        minHeight: 1,
        border: 0,
        borderTop: `${safeProps.thickness}px ${safeProps.style} ${safeProps.color}`,
        ...style,
      }}
    />
  );
};

export const dividerDefinition: ComponentDefinition<DividerProps> = {
  type: 'core/divider',
  version: 1,
  label: 'Divider',
  description: 'Séparateur visuel horizontal.',
  category: 'basic',
  propsSchema: DividerPropsSchema,
  defaultProps: { color: '#e2e8f0', thickness: 1, style: 'solid' },
  controls: {
    color: { type: 'color', label: 'Couleur', category: 'style' },
    thickness: { type: 'number', label: 'Épaisseur (px)', category: 'style', min: 1, max: 8 },
    style: {
      type: 'select',
      label: 'Style de trait',
      category: 'style',
      options: [
        { label: 'Continu', value: 'solid' },
        { label: 'Tirets', value: 'dashed' },
        { label: 'Pointillé', value: 'dotted' },
      ],
    },
  },
  canHaveChildren: false,
};
