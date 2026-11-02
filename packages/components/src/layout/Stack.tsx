import React from 'react';
import { z } from 'zod';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const StackPropsSchema = z.object({
  direction: z.enum(['row', 'column']).default('column'),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  alignItems: z.enum(['stretch', 'flex-start', 'center', 'flex-end']).default('stretch'),
  justifyContent: z
    .enum(['flex-start', 'center', 'flex-end', 'space-between'])
    .default('flex-start'),
  wrap: z.boolean().default(false),
});

export type StackProps = z.infer<typeof StackPropsSchema>;
export type StackInputProps = z.input<typeof StackPropsSchema>;

const GAP_MAP: Record<StackProps['gap'], string> = {
  none: '0',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const Stack: React.FC<RenderComponentProps<StackInputProps>> = ({
  props,
  style,
  children,
}) => {
  const safeProps = StackPropsSchema.parse(props || {});
  return (
    <div
      data-dsk-component="core/stack"
      style={{
        display: 'flex',
        flexDirection: safeProps.direction,
        flexWrap: safeProps.wrap ? 'wrap' : 'nowrap',
        alignItems: safeProps.alignItems,
        justifyContent: safeProps.justifyContent,
        gap: GAP_MAP[safeProps.gap],
        width: '100%',
        minHeight: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const stackDefinition: ComponentDefinition<StackProps> = {
  type: 'core/stack',
  version: 1,
  label: 'Stack',
  description: 'Arrange les éléments avec Flexbox et un espacement régulier.',
  category: 'layout',
  propsSchema: StackPropsSchema,
  defaultProps: {
    direction: 'column',
    gap: 'md',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    wrap: false,
  },
  controls: {
    direction: {
      type: 'select',
      label: 'Direction',
      category: 'layout',
      options: [
        { label: 'Vertical', value: 'column' },
        { label: 'Horizontal', value: 'row' },
      ],
    },
    gap: {
      type: 'select',
      label: 'Espacement',
      category: 'layout',
      options: [
        { label: 'Aucun', value: 'none' },
        { label: 'Petit', value: 'sm' },
        { label: 'Moyen', value: 'md' },
        { label: 'Grand', value: 'lg' },
        { label: 'Très grand', value: 'xl' },
      ],
    },
    alignItems: {
      type: 'select',
      label: 'Aligner les éléments',
      category: 'layout',
      options: [
        { label: 'Étirer', value: 'stretch' },
        { label: 'Début', value: 'flex-start' },
        { label: 'Centre', value: 'center' },
        { label: 'Fin', value: 'flex-end' },
      ],
    },
    justifyContent: {
      type: 'select',
      label: 'Répartition',
      category: 'layout',
      options: [
        { label: 'Début', value: 'flex-start' },
        { label: 'Centre', value: 'center' },
        { label: 'Fin', value: 'flex-end' },
        { label: 'Espace entre', value: 'space-between' },
      ],
    },
    wrap: { type: 'boolean', label: 'Retour à la ligne', category: 'layout' },
  },
  canHaveChildren: true,
};
