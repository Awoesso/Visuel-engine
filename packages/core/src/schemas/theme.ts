import { z } from 'zod/v3';

export const ThemeColorsSchema = z.object({
  primary: z.string().default('#2563eb'),
  secondary: z.string().default('#475569'),
  accent: z.string().default('#f59e0b'),
  background: z.string().default('#ffffff'),
  surface: z.string().default('#f8fafc'),
  text: z.string().default('#0f172a'),
  textMuted: z.string().default('#64748b'),
  border: z.string().default('#e2e8f0'),
  error: z.string().default('#ef4444'),
  success: z.string().default('#22c55e'),
  custom: z.record(z.string()).optional().default({}),
});

export const ThemeTypographySchema = z.object({
  fontFamily: z.string().default('system-ui, -apple-system, sans-serif'),
  headingFontFamily: z.string().default('inherit'),
  baseFontSize: z.string().default('16px'),
  scaleRatio: z.number().positive().default(1.25),
  lineHeight: z.string().default('1.5'),
});

export const ThemeSpacingSchema = z.object({
  unit: z.string().default('4px'),
  xs: z.string().default('4px'),
  sm: z.string().default('8px'),
  md: z.string().default('16px'),
  lg: z.string().default('24px'),
  xl: z.string().default('32px'),
  '2xl': z.string().default('48px'),
});

export const ThemeBorderRadiusSchema = z.object({
  none: z.string().default('0px'),
  sm: z.string().default('2px'),
  md: z.string().default('6px'),
  lg: z.string().default('12px'),
  full: z.string().default('9999px'),
});

export const ThemeShadowsSchema = z.object({
  none: z.string().default('none'),
  sm: z.string().default('0 1px 2px 0 rgb(0 0 0 / 0.05)'),
  md: z.string().default('0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'),
  lg: z.string().default('0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'),
});

export const ThemeContainerWidthSchema = z.object({
  sm: z.string().default('640px'),
  md: z.string().default('768px'),
  lg: z.string().default('1024px'),
  xl: z.string().default('1280px'),
  full: z.string().default('100%'),
});

export const ThemeTokensSchema = z.object({
  name: z.string().default('default'),
  colors: ThemeColorsSchema.default({}),
  typography: ThemeTypographySchema.default({}),
  spacing: ThemeSpacingSchema.default({}),
  borderRadius: ThemeBorderRadiusSchema.default({}),
  shadows: ThemeShadowsSchema.default({}),
  containerWidth: ThemeContainerWidthSchema.default({}),
});

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeTypography = z.infer<typeof ThemeTypographySchema>;
export type ThemeSpacing = z.infer<typeof ThemeSpacingSchema>;
export type ThemeBorderRadius = z.infer<typeof ThemeBorderRadiusSchema>;
export type ThemeShadows = z.infer<typeof ThemeShadowsSchema>;
export type ThemeContainerWidth = z.infer<typeof ThemeContainerWidthSchema>;
export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

/**
 * Transforms ThemeTokens into a dictionary of CSS custom properties (variables)
 * Namespaced with `--dsk-` to prevent collisions with host application styles.
 */
export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {
    '--dsk-color-primary': theme.colors.primary,
    '--dsk-color-secondary': theme.colors.secondary,
    '--dsk-color-accent': theme.colors.accent,
    '--dsk-color-background': theme.colors.background,
    '--dsk-color-surface': theme.colors.surface,
    '--dsk-color-text': theme.colors.text,
    '--dsk-color-text-muted': theme.colors.textMuted,
    '--dsk-color-border': theme.colors.border,
    '--dsk-color-error': theme.colors.error,
    '--dsk-color-success': theme.colors.success,

    '--dsk-font-family': theme.typography.fontFamily,
    '--dsk-font-family-heading': theme.typography.headingFontFamily,
    '--dsk-font-size-base': theme.typography.baseFontSize,
    '--dsk-line-height': theme.typography.lineHeight,

    '--dsk-spacing-unit': theme.spacing.unit,
    '--dsk-spacing-xs': theme.spacing.xs,
    '--dsk-spacing-sm': theme.spacing.sm,
    '--dsk-spacing-md': theme.spacing.md,
    '--dsk-spacing-lg': theme.spacing.lg,
    '--dsk-spacing-xl': theme.spacing.xl,
    '--dsk-spacing-2xl': theme.spacing['2xl'],

    '--dsk-radius-none': theme.borderRadius.none,
    '--dsk-radius-sm': theme.borderRadius.sm,
    '--dsk-radius-md': theme.borderRadius.md,
    '--dsk-radius-lg': theme.borderRadius.lg,
    '--dsk-radius-full': theme.borderRadius.full,

    '--dsk-shadow-none': theme.shadows.none,
    '--dsk-shadow-sm': theme.shadows.sm,
    '--dsk-shadow-md': theme.shadows.md,
    '--dsk-shadow-lg': theme.shadows.lg,

    '--dsk-container-sm': theme.containerWidth.sm,
    '--dsk-container-md': theme.containerWidth.md,
    '--dsk-container-lg': theme.containerWidth.lg,
    '--dsk-container-xl': theme.containerWidth.xl,
    '--dsk-container-full': theme.containerWidth.full,
  };

  if (theme.colors.custom) {
    for (const [key, value] of Object.entries(theme.colors.custom)) {
      vars[`--dsk-color-custom-${key}`] = value;
    }
  }

  return vars;
}
