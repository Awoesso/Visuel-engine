import { describe, it, expect } from 'vitest';
import { resolveResponsiveStyles, elementStylesToCssProperties } from '../utils/styleResolver';
import type { ResponsiveStyles } from '@dsk/core';

describe('styleResolver', () => {
  const sampleResponsive: ResponsiveStyles = {
    desktop: {
      paddingTop: '20px',
      fontSize: '18px',
      color: '#333333',
    },
    tablet: {
      fontSize: '16px',
    },
    mobile: {
      fontSize: '14px',
      paddingTop: '10px',
    },
  };

  it('should resolve desktop base styles when in desktop mode', () => {
    const resolved = resolveResponsiveStyles(sampleResponsive, 'desktop');
    expect(resolved.fontSize).toBe('18px');
    expect(resolved.paddingTop).toBe('20px');
    expect(resolved.color).toBe('#333333');
  });

  it('should merge tablet overrides onto desktop styles when in tablet mode', () => {
    const resolved = resolveResponsiveStyles(sampleResponsive, 'tablet');
    expect(resolved.fontSize).toBe('16px'); // overridden by tablet
    expect(resolved.paddingTop).toBe('20px'); // inherited from desktop
    expect(resolved.color).toBe('#333333');
  });

  it('should merge mobile overrides when in mobile mode', () => {
    const resolved = resolveResponsiveStyles(sampleResponsive, 'mobile');
    expect(resolved.fontSize).toBe('14px'); // overridden by mobile
    expect(resolved.paddingTop).toBe('10px'); // overridden by mobile
    expect(resolved.color).toBe('#333333');
  });

  it('should convert element styles to React.CSSProperties', () => {
    const css = elementStylesToCssProperties({
      width: '100%',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      gap: '16px',
      custom: {
        '--local-accent': '#ff0000',
      },
    });

    expect(css.width).toBe('100%');
    expect(css.backgroundColor).toBe('#f3f4f6');
    expect(css.display).toBe('flex');
    expect(css.gap).toBe('16px');
    expect((css as Record<string, string>)['--local-accent']).toBe('#ff0000');
  });
});
