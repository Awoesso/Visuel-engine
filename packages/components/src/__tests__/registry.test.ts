import { describe, it, expect } from 'vitest';
import {
  createDefaultCoreRegistry,
  defaultRendererRegistry,
  createDefaultRendererMap,
} from '../defaultRegistry';
import {
  ContainerPropsSchema,
  GridPropsSchema,
  HeadingPropsSchema,
  TextPropsSchema,
  ButtonPropsSchema,
  ImagePropsSchema,
} from '..';

describe('Default Registries', () => {
  it('should create a core registry with all 6 standard component definitions', () => {
    const registry = createDefaultCoreRegistry();
    expect(registry.size).toBe(6);
    expect(registry.has('core/container')).toBe(true);
    expect(registry.has('core/grid')).toBe(true);
    expect(registry.has('core/heading')).toBe(true);
    expect(registry.has('core/text')).toBe(true);
    expect(registry.has('core/button')).toBe(true);
    expect(registry.has('core/image')).toBe(true);
  });

  it('should export a renderer registry record with all 6 components', () => {
    expect(Object.keys(defaultRendererRegistry)).toHaveLength(6);
    expect(typeof defaultRendererRegistry['core/container']).toBe('function');
    expect(typeof defaultRendererRegistry['core/grid']).toBe('function');
    expect(typeof defaultRendererRegistry['core/heading']).toBe('function');
    expect(typeof defaultRendererRegistry['core/text']).toBe('function');
    expect(typeof defaultRendererRegistry['core/button']).toBe('function');
    expect(typeof defaultRendererRegistry['core/image']).toBe('function');
  });

  it('should create a Map-based renderer registry', () => {
    const map = createDefaultRendererMap();
    expect(map instanceof Map).toBe(true);
    expect(map.size).toBe(6);
  });
});

describe('Props Schemas — defaults and validation', () => {
  it('ContainerPropsSchema applies correct defaults', () => {
    const parsed = ContainerPropsSchema.parse({});
    expect(parsed.maxWidth).toBe('lg');
    expect(parsed.alignment).toBe('center');
    expect(parsed.padding).toBe('md');
  });

  it('GridPropsSchema applies correct defaults', () => {
    const parsed = GridPropsSchema.parse({});
    expect(parsed.columns).toBe(3);
    expect(parsed.gap).toBe('md');
    expect(parsed.alignItems).toBe('stretch');
  });

  it('GridPropsSchema rejects columns out of range', () => {
    const result = GridPropsSchema.safeParse({ columns: 0 });
    expect(result.success).toBe(false);
    const result2 = GridPropsSchema.safeParse({ columns: 13 });
    expect(result2.success).toBe(false);
  });

  it('HeadingPropsSchema applies correct defaults', () => {
    const parsed = HeadingPropsSchema.parse({});
    expect(parsed.text).toBe('Heading');
    expect(parsed.level).toBe(2);
    expect(parsed.textAlign).toBe('left');
  });

  it('HeadingPropsSchema rejects invalid heading levels', () => {
    const result = HeadingPropsSchema.safeParse({ level: 7 });
    expect(result.success).toBe(false);
  });

  it('TextPropsSchema applies correct defaults', () => {
    const parsed = TextPropsSchema.parse({});
    expect(parsed.content).toBe('');
    expect(parsed.fontSize).toBe('base');
    expect(parsed.fontWeight).toBe('normal');
    expect(parsed.lineHeight).toBe('normal');
  });

  it('ButtonPropsSchema applies correct defaults', () => {
    const parsed = ButtonPropsSchema.parse({});
    expect(parsed.label).toBe('Button');
    expect(parsed.variant).toBe('primary');
    expect(parsed.size).toBe('md');
    expect(parsed.disabled).toBe(false);
  });

  it('ImagePropsSchema applies correct defaults', () => {
    const parsed = ImagePropsSchema.parse({});
    expect(parsed.src).toBe('');
    expect(parsed.alt).toBe('');
    expect(parsed.objectFit).toBe('cover');
    expect(parsed.loading).toBe('lazy');
  });
});
