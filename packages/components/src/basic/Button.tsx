import React from 'react';
import { z } from 'zod';
import { isSafeUrl, type ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const ButtonPropsSchema = z.object({
  label: z.string().min(1, 'Button label is required').default('Button'),
  url: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
  disabled: z.boolean().default(false),
  ariaLabel: z.string().optional(),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--dsk-color-primary, #2563eb)',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--dsk-color-secondary, #475569)',
    color: '#ffffff',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--dsk-color-primary, #2563eb)',
    border: '2px solid var(--dsk-color-primary, #2563eb)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--dsk-color-primary, #2563eb)',
    border: 'none',
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '0.875rem' },
  md: { padding: '10px 20px', fontSize: '1rem' },
  lg: { padding: '14px 28px', fontSize: '1.125rem' },
};

export const Button: React.FC<RenderComponentProps<ButtonProps>> = ({
  props,
  style,
}) => {
  const safeProps = ButtonPropsSchema.parse(props || {});

  const safeUrl =
    safeProps.url && isSafeUrl(safeProps.url) ? safeProps.url : undefined;

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--dsk-radius-md, 6px)',
    fontFamily: 'var(--dsk-font-family, inherit)',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: safeProps.disabled ? 'not-allowed' : 'pointer',
    opacity: safeProps.disabled ? 0.5 : 1,
    width: safeProps.fullWidth ? '100%' : 'auto',
    boxSizing: 'border-box',
    transition: 'opacity 0.15s ease',
    ...(VARIANT_STYLES[safeProps.variant] || VARIANT_STYLES.primary),
    ...(SIZE_STYLES[safeProps.size] || SIZE_STYLES.md),
    ...style,
  };

  if (safeUrl && !safeProps.disabled) {
    return (
      <a
        href={safeUrl}
        data-dsk-component="core/button"
        aria-label={safeProps.ariaLabel || safeProps.label}
        style={combinedStyle}
      >
        {safeProps.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      data-dsk-component="core/button"
      disabled={safeProps.disabled}
      aria-label={safeProps.ariaLabel || safeProps.label}
      style={combinedStyle}
    >
      {safeProps.label}
    </button>
  );
};

export const buttonDefinition: ComponentDefinition<ButtonProps> = {
  type: 'core/button',
  version: 1,
  label: 'Button',
  description: 'Bouton interactif avec variantes visuelles et liens sécurisés',
  category: 'basic',
  propsSchema: ButtonPropsSchema,
  defaultProps: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
  },
  controls: {
    label: {
      type: 'text',
      label: 'Texte du bouton',
      category: 'content',
    },
    url: {
      type: 'url',
      label: 'Lien (URL)',
      description: 'Si défini, le bouton se comporte comme un lien hypertexte',
      category: 'content',
    },
    variant: {
      type: 'select',
      label: 'Variante',
      category: 'style',
      options: [
        { label: 'Primaire', value: 'primary' },
        { label: 'Secondaire', value: 'secondary' },
        { label: 'Contour', value: 'outline' },
        { label: 'Transparent', value: 'ghost' },
      ],
    },
    size: {
      type: 'select',
      label: 'Taille',
      category: 'style',
      options: [
        { label: 'Petit', value: 'sm' },
        { label: 'Moyen', value: 'md' },
        { label: 'Grand', value: 'lg' },
      ],
    },
    fullWidth: {
      type: 'boolean',
      label: 'Pleine largeur',
      category: 'layout',
    },
    disabled: {
      type: 'boolean',
      label: 'Désactivé',
      category: 'content',
    },
    ariaLabel: {
      type: 'text',
      label: 'Label accessible (aria-label)',
      description: "Remplace le label visible pour les lecteurs d'écran",
      category: 'content',
    },
  },
  canHaveChildren: false,
};
