import {
  buttonDefinition,
  containerDefinition,
  gridDefinition,
  headingDefinition,
  imageDefinition,
  spacerDefinition,
  dividerDefinition,
  stackDefinition,
  textDefinition,
} from '@dsk/components';
import type { ComponentDefinition } from '@dsk/core';

export const AVAILABLE_COMPONENTS: ComponentDefinition[] = [
  containerDefinition,
  gridDefinition,
  stackDefinition,
  headingDefinition,
  textDefinition,
  buttonDefinition,
  imageDefinition,
  spacerDefinition,
  dividerDefinition,
];

const componentsById = new Map(
  AVAILABLE_COMPONENTS.map((definition) => [definition.type, definition]),
);

export function getDefaultComponent(type: string): ComponentDefinition | undefined {
  return componentsById.get(type);
}
