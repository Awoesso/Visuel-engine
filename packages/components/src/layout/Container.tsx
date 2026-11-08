import React from 'react';
import { z } from 'zod/v3';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const ContainerPropsSchema = z.object({
  maxWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full', 'none']).default('lg'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  backgroundColor: z.string().optional(),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;
export type ContainerInputProps = z.input<typeof ContainerPropsSchema>;

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: 'var(--dsk-container-sm, 640px)',
  md: 'var(--dsk-container-md, 768px)',
  lg: 'var(--dsk-container-lg, 1024px)',
  xl: 'var(--dsk-container-xl, 1280px)',
  full: '100%',
  none: 'none',
};

const PADDING_MAP: Record<string, string> = {
  none: '0',
  sm: 'var(--dsk-spacing-sm, 8px)',
  md: 'var(--dsk-spacing-md, 16px)',
  lg: 'var(--dsk-spacing-lg, 24px)',
  xl: 'var(--dsk-spacing-xl, 32px)',
};

export const Container: React.FC<RenderComponentProps<ContainerInputProps>> = ({
  props,
  style,
  children,
}) => {
  const safeProps = ContainerPropsSchema.parse(props || {});

  const marginMap: Record<string, string> = {
    left: '0 auto 0 0',
    center: '0 auto',
    right: '0 0 0 auto',
  };

  return (
    <div
      data-dsk-component="core/container"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: MAX_WIDTH_MAP[safeProps.maxWidth] || '1024px',
        margin: marginMap[safeProps.alignment] || '0 auto',
        padding: PADDING_MAP[safeProps.padding] || '16px',
        backgroundColor: safeProps.backgroundColor,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const containerDefinition: ComponentDefinition<ContainerProps> = {
  type: 'core/container',
  version: 1,
  label: 'Container',
  description: 'Conteneur avec largeur maximale, alignement et espacement',
  category: 'layout',
  propsSchema: ContainerPropsSchema,
  defaultProps: {
    maxWidth: 'lg',
    alignment: 'center',
    padding: 'md',
  },
  controls: {
    maxWidth: {
      type: 'select',
      label: 'Largeur maximale',
      category: 'layout',
      options: [
        { label: 'Small (640px)', value: 'sm' },
        { label: 'Medium (768px)', value: 'md' },
        { label: 'Large (1024px)', value: 'lg' },
        { label: 'Extra Large (1280px)', value: 'xl' },
        { label: 'Pleine largeur (100%)', value: 'full' },
        { label: 'Aucune', value: 'none' },
      ],
    },
    alignment: {
      type: 'select',
      label: 'Alignement horizontal',
      category: 'layout',
      options: [
        { label: 'Gauche', value: 'left' },
        { label: 'Centre', value: 'center' },
        { label: 'Droite', value: 'right' },
      ],
    },
    padding: {
      type: 'select',
      label: 'Espacement intérieur',
      category: 'style',
      options: [
        { label: 'Aucun', value: 'none' },
        { label: 'Petit', value: 'sm' },
        { label: 'Moyen', value: 'md' },
        { label: 'Grand', value: 'lg' },
        { label: 'Très grand', value: 'xl' },
      ],
    },
    backgroundColor: {
      type: 'color',
      label: 'Couleur de fond',
      category: 'style',
    },
  },
  canHaveChildren: true,
};
