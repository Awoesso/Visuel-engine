import React from 'react';
import { z } from 'zod';
import { isSafeUrl, type ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const ImagePropsSchema = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  width: z.string().optional(),
  height: z.string().optional(),
  objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).default('cover'),
  borderRadius: z.string().optional(),
  loading: z.enum(['lazy', 'eager']).default('lazy'),
});

export type ImageProps = z.infer<typeof ImagePropsSchema>;

export const Image: React.FC<RenderComponentProps<ImageProps>> = ({
  props,
  style,
}) => {
  const safeProps = ImagePropsSchema.parse(props || {});

  // Reject dangerous src URLs or sanitized placeholder '#'
  const isRealSrc = Boolean(
    safeProps.src && safeProps.src !== '#' && isSafeUrl(safeProps.src),
  );
  const safeSrc = isRealSrc ? safeProps.src : '';

  if (!safeSrc) {
    return (
      <div
        data-dsk-component="core/image"
        role="img"
        aria-label={safeProps.alt || 'Image placeholder'}
        style={{
          width: safeProps.width || '100%',
          height: safeProps.height || '200px',
          backgroundColor: 'var(--dsk-color-surface, #f8fafc)',
          border: '1px dashed var(--dsk-color-border, #e2e8f0)',
          borderRadius: safeProps.borderRadius || 'var(--dsk-radius-md, 6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dsk-color-text-muted, #94a3b8)',
          fontSize: '0.875rem',
          ...style,
        }}
      >
        {safeProps.alt || 'No image source'}
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={safeProps.alt}
      loading={safeProps.loading}
      data-dsk-component="core/image"
      style={{
        display: 'block',
        width: safeProps.width || '100%',
        height: safeProps.height || 'auto',
        objectFit: safeProps.objectFit,
        borderRadius: safeProps.borderRadius || 'var(--dsk-radius-md, 6px)',
        ...style,
      }}
    />
  );
};

export const imageDefinition: ComponentDefinition<ImageProps> = {
  type: 'core/image',
  version: 1,
  label: 'Image',
  description: 'Image avec texte alternatif, dimensions et sécurité URL',
  category: 'basic',
  propsSchema: ImagePropsSchema,
  defaultProps: {
    src: '',
    alt: '',
    objectFit: 'cover',
    loading: 'lazy',
  },
  controls: {
    src: {
      type: 'image',
      label: "Source de l'image",
      category: 'content',
    },
    alt: {
      type: 'text',
      label: 'Texte alternatif',
      description: "Description de l'image pour l'accessibilité",
      category: 'content',
    },
    width: {
      type: 'text',
      label: 'Largeur',
      category: 'layout',
      placeholder: '100%',
    },
    height: {
      type: 'text',
      label: 'Hauteur',
      category: 'layout',
      placeholder: 'auto',
    },
    objectFit: {
      type: 'select',
      label: 'Ajustement',
      category: 'style',
      options: [
        { label: 'Couvrir', value: 'cover' },
        { label: 'Contenir', value: 'contain' },
        { label: 'Remplir', value: 'fill' },
        { label: 'Aucun', value: 'none' },
        { label: 'Réduire', value: 'scale-down' },
      ],
    },
    borderRadius: {
      type: 'text',
      label: 'Rayon de bordure',
      category: 'style',
      placeholder: '6px',
    },
    loading: {
      type: 'select',
      label: 'Chargement',
      description: "Stratégie de chargement de l'image",
      category: 'content',
      options: [
        { label: 'Différé (lazy)', value: 'lazy' },
        { label: 'Immédiat (eager)', value: 'eager' },
      ],
    },
  },
  canHaveChildren: false,
};
