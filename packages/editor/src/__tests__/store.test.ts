import { beforeEach, describe, expect, it } from 'vitest';
import { initialDocument, useEditorStore } from '../store';
import { SECTION_PRESETS } from '@dsk/templates';
import { validatePageDocument } from '@dsk/core';

function getNodeIds(nodes: (typeof initialDocument.sections)[number]['children']): string[] {
  return nodes.flatMap((node) => [node.id, ...getNodeIds(node.children)]);
}

function findTestNode(
  nodes: (typeof initialDocument.sections)[number]['children'],
  nodeId: string,
): (typeof initialDocument.sections)[number]['children'][number] | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findTestNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

function resetStore(): void {
  useEditorStore
    .getState()
    .replaceDocument(JSON.parse(JSON.stringify(initialDocument)) as typeof initialDocument);
}

describe('editor document actions', () => {
  beforeEach(resetStore);

  it('renames the document and supports undo and redo', () => {
    const originalTitle = useEditorStore.getState().document.metadata.title;
    useEditorStore.getState().updateDocumentTitle('Landing page');

    expect(useEditorStore.getState().document.metadata.title).toBe('Landing page');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.metadata.title).toBe(originalTitle);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document.metadata.title).toBe('Landing page');
  });

  it('rejects an empty document title', () => {
    const originalDocument = useEditorStore.getState().document;
    expect(() => useEditorStore.getState().updateDocumentTitle('   ')).toThrow(
      'Document title cannot be empty.',
    );
    expect(useEditorStore.getState().document).toBe(originalDocument);
  });

  it('renames, hides, and locks nodes while preventing edits through locked ancestors', () => {
    const store = useEditorStore.getState();
    expect(store.updateNodeName('demo-heading', 'Hero title')).toBe(true);
    expect(store.setNodeHidden('demo-heading', true)).toBe(true);
    expect(
      findTestNode(useEditorStore.getState().document.sections[0]!.children, 'demo-heading'),
    ).toMatchObject({ name: 'Hero title', hidden: true });

    expect(store.setNodeLocked('demo-container', true)).toBe(true);
    expect(store.addComponentAt('core/text', 'demo-heading', 'after')).toBe(false);
    expect(store.updateNodeName('demo-heading', 'Updated title')).toBe(false);
    expect(store.setNodeHidden('demo-heading', false)).toBe(false);
    expect(store.setNodeLocked('demo-heading', false)).toBe(false);
    expect(store.duplicateNode('demo-heading')).toBe(false);
    expect(store.deleteNode('demo-heading')).toBe(false);
    expect(store.moveNode('demo-heading', 'demo-intro', 'after')).toBe(false);
    expect(() => store.updateNodeProps('demo-heading', { text: 'Locked edit' })).toThrow(
      'Cannot update locked component "demo-heading".',
    );
    expect(() => store.updateNodeStyles('demo-heading', 'desktop', { color: '#000000' })).toThrow(
      'Cannot update styles for locked component "demo-heading".',
    );

    expect(store.setNodeLocked('demo-container', false)).toBe(true);
    expect(store.updateNodeName('demo-heading', 'Updated title')).toBe(true);
  });

  it('renames sections and prevents edits inside locked sections', () => {
    const store = useEditorStore.getState();
    expect(store.updateSectionName('section-demo', 'Hero area')).toBe(true);
    expect(store.setSectionHidden('section-demo', true)).toBe(true);
    expect(store.setSectionLocked('section-demo', true)).toBe(true);
    expect(store.addComponentToSection('core/text', 'section-demo')).toBe(false);
    expect(store.setNodeLocked('demo-heading', true)).toBe(false);
    expect(store.updateSectionName('section-demo', 'Locked area')).toBe(false);
    expect(useEditorStore.getState().document.sections[0]).toMatchObject({
      name: 'Hero area',
      hidden: true,
      locked: true,
    });
    expect(store.setSectionLocked('section-demo', false)).toBe(true);
  });

  it('inserts a component into a selected container and selects it', () => {
    const store = useEditorStore.getState();
    store.selectNode('demo-container');
    store.addComponent('core/grid');

    const state = useEditorStore.getState();
    const container = state.document.sections[0]?.children[0];
    const grid = container?.children.at(-1);
    expect(grid?.type).toBe('core/grid');
    expect(state.selectedNodeId).toBe(grid?.id);
  });

  it('duplicates a nested subtree with fresh ids and deletes the selection', () => {
    const original = useEditorStore.getState().document;
    useEditorStore.getState().duplicateNode('demo-container');

    let state = useEditorStore.getState();
    const roots = state.document.sections[0]?.children ?? [];
    expect(roots).toHaveLength(2);
    expect(roots[1]?.children).toHaveLength(4);
    const allIds = getNodeIds(roots);
    expect(allIds).toHaveLength(28);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(original.sections[0]?.children).toHaveLength(1);
    expect(state.selectedNodeId).toBe(roots[1]?.id);

    state.deleteNode(roots[1]!.id);
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children).toHaveLength(1);
    expect(state.selectedNodeId).toBeNull();
  });

  it('reorders siblings while rejecting invalid nesting and cycles', () => {
    const before = useEditorStore.getState().document;
    expect(useEditorStore.getState().moveNode('demo-button', 'demo-heading', 'before')).toBe(true);
    let container = useEditorStore.getState().document.sections[0]?.children[0];
    expect(container?.children[0]?.id).toBe('demo-button');
    expect(before.sections[0]?.children[0]?.children[0]?.id).toBe('demo-heading');

    expect(useEditorStore.getState().moveNode('demo-container', 'demo-heading', 'inside')).toBe(
      false,
    );
    expect(useEditorStore.getState().moveNode('demo-button', 'demo-heading', 'inside')).toBe(false);
    expect(useEditorStore.getState().moveNode('demo-heading', 'demo-grid', 'inside')).toBe(true);
    container = useEditorStore.getState().document.sections[0]?.children[0];
    expect(container?.children.find((node) => node.id === 'demo-grid')?.children.at(-1)?.id).toBe(
      'demo-heading',
    );
  });

  it('groups property edits into one undo step and supports redo', () => {
    const store = useEditorStore.getState();
    store.updateNodeProps('demo-heading', { text: 'First edit' });
    useEditorStore.getState().updateNodeProps('demo-heading', { text: 'Final edit' });

    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Final edit');
    useEditorStore.getState().undo();
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Bienvenue dans DSK Visual Engine');
    useEditorStore.getState().redo();
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.props.text,
    ).toBe('Final edit');
  });

  it('rejects invalid properties without changing the document', () => {
    const before = useEditorStore.getState().document;
    expect(() => useEditorStore.getState().updateNodeProps('demo-heading', { level: 99 })).toThrow(
      'Invalid properties',
    );
    expect(useEditorStore.getState().document).toBe(before);
  });

  it('keeps viewport out of history and stores responsive style overrides in the document', () => {
    const store = useEditorStore.getState();
    store.setViewport('mobile');
    store.updateNodeStyles('demo-heading', 'mobile', { fontSize: '24px' });

    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBe('24px');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().viewport).toBe('mobile');
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBeUndefined();
  });

  it('adds a validated reusable section with fresh ids and selects its first node', () => {
    const preset = SECTION_PRESETS[0];
    expect(preset).toBeDefined();
    useEditorStore.getState().addSection(preset!);

    const state = useEditorStore.getState();
    const section = state.document.sections.at(-1);
    expect(section?.name).toBe('Hero');
    expect(state.selectedNodeId).toBe(section?.children[0]?.id);
    expect(validatePageDocument(state.document).success).toBe(true);

    const ids = state.document.sections.flatMap((item) => [item.id, ...getNodeIds(item.children)]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(section?.children[0]?.id).not.toBe(preset?.section.children[0]?.id);
  });

  it('moves a node to a section root without changing its id or losing the document structure', () => {
    const store = useEditorStore.getState();
    store.addSection(SECTION_PRESETS[1]!);
    const targetSection = useEditorStore.getState().document.sections.at(-1);
    expect(targetSection).toBeDefined();

    expect(useEditorStore.getState().moveNodeToSection('demo-button', targetSection!.id)).toBe(
      true,
    );
    const state = useEditorStore.getState();
    expect(
      state.document.sections[0]?.children[0]?.children.some((node) => node.id === 'demo-button'),
    ).toBe(false);
    expect(state.document.sections.at(-1)?.children.at(-1)?.id).toBe('demo-button');
    expect(validatePageDocument(state.document).success).toBe(true);
  });

  it('inserts dragged components at an explicit before, after, inside, or section-root position', () => {
    expect(useEditorStore.getState().addComponentAt('core/text', 'demo-grid', 'inside')).toBe(true);
    let state = useEditorStore.getState();
    const grid = state.document.sections[0]?.children[0]?.children.find(
      (node) => node.id === 'demo-grid',
    );
    expect(grid?.children.at(-1)?.type).toBe('core/text');
    expect(state.selectedNodeId).toBe(grid?.children.at(-1)?.id);

    expect(useEditorStore.getState().addComponentAt('core/button', 'demo-heading', 'before')).toBe(
      true,
    );
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children[0]?.children[0]?.type).toBe('core/button');
    expect(useEditorStore.getState().addComponentAt('core/text', 'demo-heading', 'inside')).toBe(
      false,
    );

    expect(useEditorStore.getState().addComponentToSection('core/divider', 'section-demo')).toBe(
      true,
    );
    state = useEditorStore.getState();
    expect(state.document.sections[0]?.children.at(-1)?.type).toBe('core/divider');
    expect(validatePageDocument(state.document).success).toBe(true);
  });

  it('reorders children within a Flex stack while preserving the original parent', () => {
    useEditorStore.getState().addSection(SECTION_PRESETS[0]!);
    const section = useEditorStore.getState().document.sections.at(-1)!;
    const container = section.children[0]!;
    const stack = container.children[0]!;
    const text = stack.children[1]!;
    const button = stack.children[2]!;

    expect(useEditorStore.getState().moveNode(text.id, button.id, 'after')).toBe(true);
    const updatedSection = useEditorStore.getState().document.sections.at(-1)!;
    const updatedStack = updatedSection.children[0]!.children[0]!;
    expect(updatedStack.children.map((node) => node.id)).toEqual([
      stack.children[0]!.id,
      button.id,
      text.id,
    ]);
  });

  it('keeps canvas zoom out of document history and clears responsive style overrides', () => {
    const store = useEditorStore.getState();
    store.updateNodeStyles('demo-heading', 'mobile', { fontSize: '24px' });
    const historyCount = useEditorStore.getState().pastDocuments.length;
    useEditorStore.getState().setZoom(0.8);
    expect(useEditorStore.getState().zoom).toBe(0.8);
    expect(useEditorStore.getState().pastDocuments).toHaveLength(historyCount);

    useEditorStore.getState().updateNodeStyles('demo-heading', 'mobile', { fontSize: '' });
    expect(
      useEditorStore.getState().document.sections[0]?.children[0]?.children[0]?.styles.mobile
        .fontSize,
    ).toBeUndefined();
  });
});
