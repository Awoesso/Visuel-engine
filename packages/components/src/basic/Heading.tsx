import React from 'react';
import { z } from 'zod';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const HeadingPropsSchema = z.object({
  text: z.string().default('Heading'),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]).default(2),
  color: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

export const Heading: React.FC<RenderComponentProps<HeadingProps>> = ({
  props,
  style,
}) => {
  const safeProps = HeadingPropsSchema.parse(props || {});
  const Tag = `h${safeProps.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <Tag
      data-dsk-component="core/heading"
      style={{
        fontFamily: 'var(--dsk-font-family-heading, inherit)',
        color: safeProps.color || 'var(--dsk-color-text, inherit)',
        textAlign: safeProps.textAlign,
        margin: '0 0 0.5em 0',
        ...style,
      }}
    >
      {safeProps.text}
    </Tag>
  );
};

export const headingDefinition: ComponentDefinition<HeadingProps> = {
  type: 'core/heading',
  version: 1,
  label: 'Heading',
  description: 'Titre sémantique avec niveaux h1–h6 configurables',
  category: 'basic',
  propsSchema: HeadingPropsSchema,
  defaultProps: {
    text: 'Heading',
    level: 2,
    textAlign: 'left',
  },
  controls: {
    text: {
      type: 'text',
      label: 'Texte du titre',
      category: 'content',
    },
    level: {
      type: 'select',
      label: 'Niveau de titre',
      category: 'content',
      options: [
        { label: 'H1', value: 1 },
        { label: 'H2', value: 2 },
        { label: 'H3', value: 3 },
        { label: 'H4', value: 4 },
        { label: 'H5', value: 5 },
        { label: 'H6', value: 6 },
      ],
    },
    color: {
      type: 'color',
      label: 'Couleur du texte',
      category: 'style',
    },
    textAlign: {
      type: 'select',
      label: 'Alignement',
      category: 'style',
      options: [
        { label: 'Gauche', value: 'left' },
        { label: 'Centre', value: 'center' },
        { label: 'Droite', value: 'right' },
      ],
    },
  },
  canHaveChildren: false,
};
