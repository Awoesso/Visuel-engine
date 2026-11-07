import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEditorStore,
  assertValidDocument,
} from '../store';
import { CURRENT_SCHEMA_VERSION, PageDocumentSchema, type PageDocument, type ComponentNode } from '@dsk/core';

/**
 * Helper to build a valid, realistic PageDocument containing an exact number of total nodes.
 */
function createDocumentWithNodes(targetNodeCount: number): PageDocument {
  // A document has 1 section (counts as 1 node).
  // The remaining targetNodeCount - 1 nodes are distributed into containers and child elements.
  const nodesToCreate = targetNodeCount - 1;
  const children: ComponentNode[] = [];

  let created = 0;
  let containerIndex = 0;

  while (created < nodesToCreate) {
    const containerId = `bench-container-${containerIndex++}`;
    const containerChildren: ComponentNode[] = [];
    created++; // Count the container

    // Add up to 4 children inside each container
    for (let c = 0; c < 4 && created < nodesToCreate; c++) {
      const childId = `bench-text-${containerIndex}-${c}`;
      containerChildren.push({
        id: childId,
        type: 'core/text',
        version: 1,
        props: { content: `Item text ${childId}` },
        styles: { desktop: {}, tablet: {}, mobile: {} },
        children: [],
        locked: false,
        hidden: false,
      });
      created++;
    }

    children.push({
      id: containerId,
      type: 'core/container',
      version: 1,
      props: { padding: 'md' },
      styles: { desktop: {}, tablet: {}, mobile: {} },
      children: containerChildren,
      locked: false,
      hidden: false,
    });
  }

  return PageDocumentSchema.parse({
    id: `bench-doc-${targetNodeCount}`,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      title: `Benchmark Document ${targetNodeCount} Nodes`,
      description: 'Benchmark performance test document',
      slug: `/bench-${targetNodeCount}`,
    },
    theme: {},
    sections: [
      {
        id: 'section-bench',
        name: 'Benchmark Section',
        type: 'section',
        children,
        styles: { desktop: {}, tablet: {}, mobile: {} },
        locked: false,
        hidden: false,
      },
    ],
  });
}

describe('Store Performance & Optimization Benchmarks', () => {
  beforeEach(() => {
    // Reset store before each benchmark run
    useEditorStore.getState().resetDemo();
  });

  const SIZES = [70, 100, 300, 500];

  for (const nodeCount of SIZES) {
    it(`benchmarks 100 style updates on ${nodeCount} nodes (before vs after optimization)`, () => {
      const testDoc = createDocumentWithNodes(nodeCount);
      // Validate the test document structurally first
      assertValidDocument(testDoc);

      const targetNodeId = 'bench-text-1-0';
      const ITERATIONS = 100;

      // 1. Measure UNOPTIMIZED baseline (full assertValidDocument called after each update)
      useEditorStore.getState().replaceDocument(JSON.parse(JSON.stringify(testDoc)));
      const startBefore = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        // Trigger style update
        useEditorStore.getState().updateNodeStyles(targetNodeId, 'desktop', {
          paddingTop: `${i + 1}px`,
        });
        // Simulate unoptimized commit that ran assertValidDocument on every single op
        assertValidDocument(useEditorStore.getState().document);
      }
      const timeBeforeMs = performance.now() - startBefore;

      // Verify undo on the unoptimized document
      useEditorStore.getState().undo();

      // 2. Measure OPTIMIZED path (local schema validation with skipFullValidation: true)
      useEditorStore.getState().replaceDocument(JSON.parse(JSON.stringify(testDoc)));
      const startAfter = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        useEditorStore.getState().updateNodeStyles(targetNodeId, 'desktop', {
          paddingTop: `${i + 1}px`,
        });
      }
      const timeAfterMs = performance.now() - startAfter;

      // Assert correctness: final style matches exactly
      const finalDoc = useEditorStore.getState().document;
      const targetNode = finalDoc.sections[0]?.children[0]?.children[0];
      expect(targetNode?.styles.desktop?.paddingTop).toBe(`${ITERATIONS}px`);

      // Verify undo and redo work perfectly on the optimized document
      useEditorStore.getState().undo();
      const undoneDoc = useEditorStore.getState().document;
      const targetNodeUndone = undoneDoc.sections[0]?.children[0]?.children[0];
      expect(targetNodeUndone?.styles.desktop?.paddingTop).toBeUndefined();

      useEditorStore.getState().redo();
      const redoneDoc = useEditorStore.getState().document;
      const targetNodeRedone = redoneDoc.sections[0]?.children[0]?.children[0];
      expect(targetNodeRedone?.styles.desktop?.paddingTop).toBe(`${ITERATIONS}px`);

      // Assert that optimization yields a measurable performance improvement
      expect(timeAfterMs).toBeLessThan(timeBeforeMs);

      // Log exact benchmark measurements for verifiable reporting
      const speedupPercent = Math.round(((timeBeforeMs - timeAfterMs) / timeBeforeMs) * 100);
      console.log(
        `[BENCHMARK] ${nodeCount} nodes | 100 style updates: Before = ${timeBeforeMs.toFixed(
          2,
        )}ms | After = ${timeAfterMs.toFixed(2)}ms | Gain = +${speedupPercent}% speedup`,
      );
    });
  }
});
