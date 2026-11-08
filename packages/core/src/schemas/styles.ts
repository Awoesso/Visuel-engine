import { z } from 'zod/v3';

export const ElementStylesSchema = z.object({
  // Spacing
  marginTop: z.string().optional(),
  marginRight: z.string().optional(),
  marginBottom: z.string().optional(),
  marginLeft: z.string().optional(),
  paddingTop: z.string().optional(),
  paddingRight: z.string().optional(),
  paddingBottom: z.string().optional(),
  paddingLeft: z.string().optional(),

  // Dimensions
  width: z.string().optional(),
  height: z.string().optional(),
  minWidth: z.string().optional(),
  maxWidth: z.string().optional(),
  minHeight: z.string().optional(),
  maxHeight: z.string().optional(),

  // Colors & Backgrounds
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundSize: z.string().optional(),
  backgroundPosition: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),

  // Typography
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  lineHeight: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textDecoration: z.string().optional(),
  letterSpacing: z.string().optional(),

  // Borders
  borderWidth: z.string().optional(),
  borderColor: z.string().optional(),
  borderStyle: z.enum(['none', 'solid', 'dashed', 'dotted', 'double']).optional(),
  borderRadius: z.string().optional(),

  // Shadows
  boxShadow: z.string().optional(),

  // Layout / Flex / Grid
  display: z.enum(['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'none']).optional(),
  flexDirection: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).optional(),
  justifyContent: z
    .enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])
    .optional(),
  alignItems: z.enum(['flex-start', 'flex-end', 'center', 'baseline', 'stretch']).optional(),
  flexWrap: z.enum(['nowrap', 'wrap', 'wrap-reverse']).optional(),
  gap: z.string().optional(),

  // Grid specific
  gridTemplateColumns: z.string().optional(),
  gridTemplateRows: z.string().optional(),

  // Custom safe CSS properties
  custom: z.record(z.string()).optional(),
});

export const ResponsiveStylesSchema = z.object({
  desktop: ElementStylesSchema.default({}),
  tablet: ElementStylesSchema.optional().default({}),
  mobile: ElementStylesSchema.optional().default({}),
});

export type ElementStyles = z.infer<typeof ElementStylesSchema>;
export type ResponsiveStyles = z.infer<typeof ResponsiveStylesSchema>;
export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
