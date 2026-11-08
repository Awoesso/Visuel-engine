import type React from 'react';
import type { ElementStyles, ResponsiveStyles, ViewportMode } from '@dsk/core';

/**
 * Merges element styles according to the current active viewport.
 * Desktop is base; Tablet overrides Desktop; Mobile overrides Tablet & Desktop.
 */
export function resolveResponsiveStyles(
  responsive?: ResponsiveStyles,
  viewport: ViewportMode = 'desktop',
): ElementStyles {
  if (!responsive) return {};

  const desktop = responsive.desktop || {};
  if (viewport === 'desktop') {
    return { ...desktop };
  }

  const tablet = responsive.tablet || {};
  if (viewport === 'tablet') {
    return { ...desktop, ...tablet };
  }

  const mobile = responsive.mobile || {};
  return { ...desktop, ...tablet, ...mobile };
}

/**
 * Transforms an ElementStyles configuration into safe React.CSSProperties.
 * Prevents arbitrary code execution and restricts keys to standard CSS properties.
 */
export function elementStylesToCssProperties(styles?: ElementStyles): React.CSSProperties {
  if (!styles) return {};

  const css: React.CSSProperties = {};

  // Spacing
  if (styles.marginTop) css.marginTop = styles.marginTop;
  if (styles.marginRight) css.marginRight = styles.marginRight;
  if (styles.marginBottom) css.marginBottom = styles.marginBottom;
  if (styles.marginLeft) css.marginLeft = styles.marginLeft;
  if (styles.paddingTop) css.paddingTop = styles.paddingTop;
  if (styles.paddingRight) css.paddingRight = styles.paddingRight;
  if (styles.paddingBottom) css.paddingBottom = styles.paddingBottom;
  if (styles.paddingLeft) css.paddingLeft = styles.paddingLeft;

  // Dimensions
  if (styles.width) css.width = styles.width;
  if (styles.height) css.height = styles.height;
  if (styles.minWidth) css.minWidth = styles.minWidth;
  if (styles.maxWidth) css.maxWidth = styles.maxWidth;
  if (styles.minHeight) css.minHeight = styles.minHeight;
  if (styles.maxHeight) css.maxHeight = styles.maxHeight;

  // Colors & Background
  if (styles.color) css.color = styles.color;
  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.backgroundImage) css.backgroundImage = styles.backgroundImage;
  if (styles.backgroundSize) css.backgroundSize = styles.backgroundSize;
  if (styles.backgroundPosition) css.backgroundPosition = styles.backgroundPosition;
  if (typeof styles.opacity === 'number') css.opacity = styles.opacity;

  // Typography
  if (styles.fontSize) css.fontSize = styles.fontSize;
  if (styles.fontWeight) css.fontWeight = styles.fontWeight;
  if (styles.lineHeight) css.lineHeight = styles.lineHeight;
  if (styles.textAlign) css.textAlign = styles.textAlign;
  if (styles.textDecoration) css.textDecoration = styles.textDecoration;
  if (styles.letterSpacing) css.letterSpacing = styles.letterSpacing;

  // Borders
  if (styles.borderWidth) css.borderWidth = styles.borderWidth;
  if (styles.borderColor) css.borderColor = styles.borderColor;
  if (styles.borderStyle) css.borderStyle = styles.borderStyle;
  if (styles.borderRadius) css.borderRadius = styles.borderRadius;

  // Shadow
  if (styles.boxShadow) css.boxShadow = styles.boxShadow;

  // Layout & Flexbox / Grid
  if (styles.display) css.display = styles.display;
  if (styles.flexDirection) css.flexDirection = styles.flexDirection;
  if (styles.justifyContent) css.justifyContent = styles.justifyContent;
  if (styles.alignItems) css.alignItems = styles.alignItems;
  if (styles.flexWrap) css.flexWrap = styles.flexWrap;
  if (styles.gap) css.gap = styles.gap;
  if (styles.gridTemplateColumns) css.gridTemplateColumns = styles.gridTemplateColumns;
  if (styles.gridTemplateRows) css.gridTemplateRows = styles.gridTemplateRows;

  // Safe custom properties (CSS variables only, e.g. --custom-prop)
  if (styles.custom) {
    for (const [key, val] of Object.entries(styles.custom)) {
      if (key.startsWith('--') && typeof val === 'string') {
        (css as Record<string, string>)[key] = val;
      }
    }
  }

  return css;
}
