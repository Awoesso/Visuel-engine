import React from 'react';
import { z } from 'zod';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const GridPropsSchema = z.object({
  columns: z.number().int().min(1).max(12).default(3),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  alignItems: z.enum(['stretch', 'start', 'center', 'end']).default('stretch'),
  minChildWidth: z.string().optional(),
});

export type GridProps = z.infer<typeof GridPropsSchema>;

const GAP_MAP: Record<string, string> = {
  none: '0',
  sm: 'var(--dsk-spacing-sm, 8px)',
  md: 'var(--dsk-spacing-md, 16px)',
  lg: 'var(--dsk-spacing-lg, 24px)',
  xl: 'var(--dsk-spacing-xl, 32px)',
};

export const Grid: React.FC<RenderComponentProps<GridProps>> = ({
  props,
  style,
  children,
}) => {
  const safeProps = GridPropsSchema.parse(props || {});

  const templateColumns = safeProps.minChildWidth
    ? `repeat(auto-fill, minmax(${safeProps.minChildWidth}, 1fr))`
    : `repeat(${safeProps.columns}, 1fr)`;

  return (
    <div
      data-dsk-component="core/grid"
      role="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gap: GAP_MAP[safeProps.gap] || '16px',
        alignItems: safeProps.alignItems,
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const gridDefinition: ComponentDefinition<GridProps> = {
  type: 'core/grid',
  version: 1,
  label: 'Grid',
  description: 'Grille responsive configurable avec colonnes et espacement',
  category: 'layout',
  propsSchema: GridPropsSchema,
  defaultProps: {
    columns: 3,
    gap: 'md',
    alignItems: 'stretch',
  },
  controls: {
    columns: {
      type: 'number',
      label: 'Nombre de colonnes',
      category: 'layout',
      min: 1,
      max: 12,
      step: 1,
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
      label: 'Alignement vertical',
      category: 'layout',
      options: [
        { label: 'Étirer', value: 'stretch' },
        { label: 'Haut', value: 'start' },
        { label: 'Centre', value: 'center' },
        { label: 'Bas', value: 'end' },
      ],
    },
    minChildWidth: {
      type: 'text',
      label: 'Largeur minimale des enfants',
      description: 'Si défini, utilise auto-fill au lieu du nombre de colonnes fixe (ex: 200px)',
      category: 'layout',
      placeholder: '200px',
    },
  },
  canHaveChildren: true,
};
