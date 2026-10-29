import {
  createComponentRegistry,
  registerComponent,
  type ComponentRegistry,
} from '@dsk/core';
import type { ComponentMapping, ReactComponentImplementation } from '@dsk/react-renderer';

// Layout components
import { Container, containerDefinition } from './layout/Container';
import { Grid, gridDefinition } from './layout/Grid';

// Basic components
import { Heading, headingDefinition } from './basic/Heading';
import { Text, textDefinition } from './basic/Text';
import { Button, buttonDefinition } from './basic/Button';
import { Image, imageDefinition } from './basic/Image';

// All component definitions for @dsk/core ComponentRegistry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allDefinitions: any[] = [
  containerDefinition,
  gridDefinition,
  headingDefinition,
  textDefinition,
  buttonDefinition,
  imageDefinition,
];

/**
 * Creates a @dsk/core ComponentRegistry populated with all standard components.
 * Useful for schema validation and editor metadata.
 */
export function createDefaultCoreRegistry(): ComponentRegistry {
  const registry = createComponentRegistry();
  for (const def of allDefinitions) {
    registerComponent(registry, def);
  }
  return registry;
}

/**
 * A ComponentMapping (Record) for @dsk/react-renderer.
 * Maps component type identifiers to their React rendering implementations.
 * Pass this directly to <PageRenderer registry={defaultRendererRegistry} />.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultRendererRegistry: Record<string, ReactComponentImplementation<any>> = {
  'core/container': Container,
  'core/grid': Grid,
  'core/heading': Heading,
  'core/text': Text,
  'core/button': Button,
  'core/image': Image,
};

/**
 * Convenience: creates a Map-based ComponentMapping from the default record.
 */
export function createDefaultRendererMap(): ComponentMapping {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = new Map<string, ReactComponentImplementation<any>>();
  for (const [type, impl] of Object.entries(defaultRendererRegistry)) {
    map.set(type, impl);
  }
  return map;
}
