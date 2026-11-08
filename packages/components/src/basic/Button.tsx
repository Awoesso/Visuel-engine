import React from 'react';
import { z } from 'zod/v3';
import { isSafeUrl, type ComponentDefinition } from '@dsk/core';
import type { RenderComponentProps } from '@dsk/react-renderer';

export const ButtonPropsSchema = z.object({
  label: z.string().min(1, 'Button label is required').default('Button'),
  url: z.string().optional(),
  target: z.enum(['_self', '_blank']).default('_self'),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
  disabled: z.boolean().default(false),
  ariaLabel: z.string().optional(),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;
export type ButtonInputProps = z.input<typeof ButtonPropsSchema>;

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

export const Button: React.FC<RenderComponentProps<ButtonInputProps>> = ({ props, style }) => {
  const safeProps = ButtonPropsSchema.parse(props || {});

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

  // 1. If a URL is configured, inspect its safety
  if (safeProps.url !== undefined && safeProps.url.trim() !== '') {
    const rawUrl = safeProps.url.trim();
    // '#' alone is considered unsafe/placeholder, but hash anchors like '#contact' are allowed
    const isDangerous =
      rawUrl === '#' ||
      !isSafeUrl(rawUrl) ||
      rawUrl.toLowerCase().startsWith('javascript:') ||
      rawUrl.toLowerCase().startsWith('vbscript:');

    // SECURITY GUARANTEE: Never convert an unsafe or malicious URL into an active clickable button or link
    if (isDangerous) {
      return (
        <button
          type="button"
          data-dsk-component="core/button"
          data-dsk-unsafe-url="true"
          disabled={true}
          aria-disabled="true"
          aria-label={safeProps.ariaLabel || safeProps.label}
          style={{
            ...combinedStyle,
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          {safeProps.label}
        </button>
      );
    }

    // Safe URL link
    const isBlank = safeProps.target === '_blank';
    return (
      <a
        href={rawUrl}
        target={safeProps.target}
        rel={isBlank ? 'noopener noreferrer' : undefined}
        data-dsk-component="core/button"
        aria-label={safeProps.ariaLabel || safeProps.label}
        aria-disabled={safeProps.disabled ? 'true' : undefined}
        style={{
          ...combinedStyle,
          ...(safeProps.disabled
            ? { pointerEvents: 'none', cursor: 'not-allowed', opacity: 0.5 }
            : {}),
        }}
      >
        {safeProps.label}
      </a>
    );
  }

  // 2. Standard action button without URL
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
    target: '_self',
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
    target: {
      type: 'select',
      label: 'Cible du lien',
      category: 'content',
      options: [
        { label: 'Même fenêtre (_self)', value: '_self' },
        { label: 'Nouvel onglet (_blank)', value: '_blank' },
      ],
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
