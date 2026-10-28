import { describe, it, expect } from 'vitest';
import { ThemeTokensSchema, themeToCssVariables } from '../schemas/theme';

describe('Theme Tokens and CSS Custom Properties', () => {
  it('should parse theme tokens and apply sensible defaults', () => {
    const parsed = ThemeTokensSchema.parse({
      name: 'sunset',
      colors: {
        primary: '#ff5500',
      },
    });

    expect(parsed.name).toBe('sunset');
    expect(parsed.colors.primary).toBe('#ff5500');
    expect(parsed.colors.secondary).toBe('#475569'); // default
    expect(parsed.typography.baseFontSize).toBe('16px');
    expect(parsed.spacing.md).toBe('16px');
  });

  it('should generate namespaced --dsk- CSS variables correctly', () => {
    const theme = ThemeTokensSchema.parse({
      name: 'ocean',
      colors: {
        primary: '#0ea5e9',
        custom: {
          highlight: '#38bdf8',
        },
      },
    });

    const cssVars = themeToCssVariables(theme);
    expect(cssVars['--dsk-color-primary']).toBe('#0ea5e9');
    expect(cssVars['--dsk-color-custom-highlight']).toBe('#38bdf8');
    expect(cssVars['--dsk-font-size-base']).toBe('16px');
    expect(cssVars['--dsk-radius-md']).toBe('6px');
  });
});
