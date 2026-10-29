import React from 'react';
import { z } from 'zod';
import type { ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const TextPropsSchema = z.object({
  content: z.string().default(''),
  fontSize: z.enum(['xs', 'sm', 'base', 'lg', 'xl', '2xl']).default('base'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
  color: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  lineHeight: z.enum(['tight', 'normal', 'relaxed']).default('normal'),
});

export type TextProps = z.infer<typeof TextPropsSchema>;
export type TextInputProps = z.input<typeof TextPropsSchema>;

const FONT_SIZE_MAP: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
};

const FONT_WEIGHT_MAP: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const LINE_HEIGHT_MAP: Record<string, string> = {
  tight: '1.25',
  normal: 'var(--dsk-line-height, 1.5)',
  relaxed: '1.75',
};

export const Text: React.FC<RenderComponentProps<TextInputProps>> = ({
  props,
  style,
}) => {
  const safeProps = TextPropsSchema.parse(props || {});

  return (
    <p
      data-dsk-component="core/text"
      style={{
        fontFamily: 'var(--dsk-font-family, inherit)',
        fontSize: FONT_SIZE_MAP[safeProps.fontSize] || '1rem',
        fontWeight: FONT_WEIGHT_MAP[safeProps.fontWeight] || 400,
        lineHeight: LINE_HEIGHT_MAP[safeProps.lineHeight] || '1.5',
        color: safeProps.color || 'var(--dsk-color-text, inherit)',
        textAlign: safeProps.textAlign,
        margin: '0 0 1em 0',
        ...style,
      }}
    >
      {safeProps.content}
    </p>
  );
};

export const textDefinition: ComponentDefinition<TextProps> = {
  type: 'core/text',
  version: 1,
  label: 'Text',
  description: 'Paragraphe de texte avec typographie contrôlée',
  category: 'basic',
  propsSchema: TextPropsSchema,
  defaultProps: {
    content: '',
    fontSize: 'base',
    fontWeight: 'normal',
    textAlign: 'left',
    lineHeight: 'normal',
  },
  controls: {
    content: {
      type: 'textarea',
      label: 'Contenu',
      category: 'content',
    },
    fontSize: {
      type: 'select',
      label: 'Taille du texte',
      category: 'style',
      options: [
        { label: 'Très petit', value: 'xs' },
        { label: 'Petit', value: 'sm' },
        { label: 'Normal', value: 'base' },
        { label: 'Grand', value: 'lg' },
        { label: 'Très grand', value: 'xl' },
        { label: 'Double', value: '2xl' },
      ],
    },
    fontWeight: {
      type: 'select',
      label: 'Épaisseur',
      category: 'style',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Medium', value: 'medium' },
        { label: 'Semi-gras', value: 'semibold' },
        { label: 'Gras', value: 'bold' },
      ],
    },
    color: {
      type: 'color',
      label: 'Couleur',
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
        { label: 'Justifié', value: 'justify' },
      ],
    },
    lineHeight: {
      type: 'select',
      label: 'Interligne',
      category: 'style',
      options: [
        { label: 'Serré', value: 'tight' },
        { label: 'Normal', value: 'normal' },
        { label: 'Aéré', value: 'relaxed' },
      ],
    },
  },
  canHaveChildren: false,
};
