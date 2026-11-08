import { describe, it, expect } from 'vitest';
import { z } from 'zod/v3';
import {
  createComponentRegistry,
  registerComponent,
  getComponentDefinition,
  validateComponentProps,
} from '../registry';
import type { ComponentDefinition } from '../schemas/registry';

describe('Component Registry System', () => {
  const ButtonPropsSchema = z.object({
    label: z.string().min(1, 'Button label is required'),
    variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
    disabled: z.boolean().default(false),
  });

  const buttonDefinition: ComponentDefinition<z.infer<typeof ButtonPropsSchema>> = {
    type: 'core/button',
    version: 1,
    label: 'Button',
    description: 'Interactive button component',
    category: 'basic',
    propsSchema: ButtonPropsSchema,
    defaultProps: {
      label: 'Click me',
      variant: 'primary',
      disabled: false,
    },
    controls: {
      label: {
        type: 'text',
        label: 'Button Label',
        category: 'content',
      },
      variant: {
        type: 'select',
        label: 'Style Variant',
        category: 'style',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Outline', value: 'outline' },
        ],
      },
    },
    canHaveChildren: false,
  };

  it('should register and retrieve component definitions', () => {
    const registry = createComponentRegistry();
    expect(registry.size).toBe(0);

    registerComponent(registry, buttonDefinition);
    expect(registry.size).toBe(1);

    const retrieved = getComponentDefinition(registry, 'core/button');
    expect(retrieved).toBeDefined();
    expect(retrieved?.label).toBe('Button');
  });

  it('should validate component props successfully', () => {
    const result = validateComponentProps(buttonDefinition, {
      label: 'Submit Order',
      variant: 'primary',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe('Submit Order');
      expect(result.data.disabled).toBe(false); // default applied
    }
  });

  it('should fail with meaningful errors when component props are invalid', () => {
    const result = validateComponentProps(buttonDefinition, {
      label: '', // fails min(1)
      variant: 'invalid-variant',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((err) => err.includes('label'))).toBe(true);
    }
  });
});
