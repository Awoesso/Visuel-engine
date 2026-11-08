// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRendererRegistry } from '@dsk/components';
import type { RenderComponentProps } from '@dsk/react-renderer';
import { EditorApp } from '../index';
import { EditorStoreProvider, useEditorStoreInstance } from '../EditorStoreContext';
import type { EditorRegistry } from '../config';
import { createDefaultComponentRegistry } from '../constants';
import { createEditorStore, initialDocument, useEditorStore } from '../store';

const TestResizeObserver = class {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
};

function EditorTitleProbe(): React.ReactElement {
  const title = useEditorStoreInstance((state) => state.document.metadata.title);
  return <span>{title}</span>;
}

const CustomHeading: React.FC<RenderComponentProps<{ text: string }>> = ({ props }) => (
  <h1>Custom renderer: {props.text}</h1>
);

function makeCustomRegistry(label = 'Brand Heading'): EditorRegistry {
  const definitions = createDefaultComponentRegistry();
  const heading = definitions.get('core/heading');
  if (!heading) throw new Error('Expected the default heading definition.');
  definitions.set('core/heading', { ...heading, label });
  return {
    definitions,
    renderers: { ...defaultRendererRegistry, 'core/heading': CustomHeading },
  };
}

function renameEditorDocument(root: HTMLElement, currentTitle: string, nextTitle: string): void {
  fireEvent.click(
    within(root).getByRole('button', { name: `Renommer le document : ${currentTitle}` }),
  );
  const input = within(root).getByRole('textbox', { name: 'Nom du document' });
  fireEvent.change(input, { target: { value: nextTitle } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('editor store context', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'matchMedia',
      vi.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    useEditorStore.getState().resetDemo();
  });

  afterEach(() => {
    cleanup();
    useEditorStore.getState().resetDemo();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('isolates two mounted editors, selection, history, and the legacy singleton', () => {
    useEditorStore.getState().updateDocumentTitle('Legacy singleton');

    const { container } = render(
      <StrictMode>
        <>
          <EditorApp />
          <EditorApp />
        </>
      </StrictMode>,
    );
    const editors = container.querySelectorAll('.editor-root');
    expect(editors).toHaveLength(2);
    const firstEditor = editors[0] as HTMLElement;
    const secondEditor = editors[1] as HTMLElement;
    const originalTitle = initialDocument.metadata.title;
    const renameButtonName = `Renommer le document : ${originalTitle}`;

    expect(within(firstEditor).getByRole('button', { name: renameButtonName })).toBeDefined();
    expect(within(secondEditor).getByRole('button', { name: renameButtonName })).toBeDefined();

    fireEvent.click(within(firstEditor).getByRole('button', { name: renameButtonName }));
    const titleInput = within(firstEditor).getByRole('textbox', { name: 'Nom du document' });
    fireEvent.change(titleInput, { target: { value: 'Instance A' } });
    fireEvent.keyDown(titleInput, { key: 'Enter' });

    expect(
      within(firstEditor).getByRole('button', { name: 'Renommer le document : Instance A' }),
    ).toBeDefined();
    expect(within(secondEditor).getByRole('button', { name: renameButtonName })).toBeDefined();
    expect(useEditorStore.getState().document.metadata.title).toBe('Legacy singleton');

    fireEvent.click(firstEditor.querySelector('[data-node-id="demo-heading"]')!);
    expect(
      firstEditor.querySelector('[data-node-id="demo-heading"]')?.classList.contains('selected'),
    ).toBe(true);
    expect(
      secondEditor.querySelector('[data-node-id="demo-heading"]')?.classList.contains('selected'),
    ).toBe(false);

    fireEvent.keyDown(firstEditor, { key: 'z', ctrlKey: true });
    expect(within(firstEditor).getByRole('button', { name: renameButtonName })).toBeDefined();
    expect(within(secondEditor).getByRole('button', { name: renameButtonName })).toBeDefined();

    fireEvent.keyDown(firstEditor, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(
      within(firstEditor).getByRole('button', { name: 'Renommer le document : Instance A' }),
    ).toBeDefined();
    expect(within(secondEditor).getByRole('button', { name: renameButtonName })).toBeDefined();
  });

  it('throws an explicit error when the instance hook is used without its provider', () => {
    expect(() => renderToStaticMarkup(<EditorTitleProbe />)).toThrow(
      'Editor store context is missing. Wrap this component in EditorStoreProvider.',
    );
  });

  it('releases Zustand subscriptions through Strict Mode and remounts', () => {
    const store = createEditorStore();
    const subscribe = store.subscribe.bind(store);
    let activeSubscriptions = 0;
    vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
      const unsubscribe = subscribe(listener);
      activeSubscriptions += 1;
      return () => {
        activeSubscriptions -= 1;
        unsubscribe();
      };
    });

    const tree = (
      <StrictMode>
        <EditorStoreProvider store={store}>
          <EditorTitleProbe />
        </EditorStoreProvider>
      </StrictMode>
    );
    const firstMount = render(tree);
    expect(activeSubscriptions).toBe(1);
    firstMount.unmount();
    expect(activeSubscriptions).toBe(0);

    const secondMount = render(tree);
    expect(activeSubscriptions).toBe(1);
    secondMount.unmount();
    expect(activeSubscriptions).toBe(0);
  });

  it('uses the default configuration and accepts an initial document and UI options', () => {
    const hostDocument = {
      ...initialDocument,
      metadata: { ...initialDocument.metadata, title: 'Apex initial page' },
    };
    const { container, rerender } = render(<EditorApp initialDocument={hostDocument} />);
    const root = container.querySelector('.editor-root') as HTMLElement;

    expect(
      within(root).getByRole('button', { name: 'Renommer le document : Apex initial page' }),
    ).toBeDefined();
    expect(within(root).getByRole('button', { name: 'Enregistrer' })).toBeDefined();
    expect(within(root).getByRole('button', { name: 'Aperçu' })).toBeDefined();

    rerender(
      <EditorApp
        initialDocument={hostDocument}
        options={{ showSidebar: false, showInspector: false, showSaveButton: false }}
      />,
    );
    expect(root.querySelector('.editor-sidebar')).toBeNull();
    expect(root.querySelector('.editor-properties')).toBeNull();
    expect(within(root).queryByRole('button', { name: 'Enregistrer' })).toBeNull();
    expect(within(root).getByRole('button', { name: 'Aperçu' })).toBeDefined();
  });

  it('updates registry, theme, and callbacks without recreating or clearing its store', () => {
    const firstChange = vi.fn();
    const latestChange = vi.fn();
    const firstSelection = vi.fn();
    const latestSelection = vi.fn();
    const latestSave = vi.fn();
    const hostDocument = {
      ...initialDocument,
      metadata: { ...initialDocument.metadata, title: 'Hosted document' },
    };
    const { container, rerender } = render(
      <EditorApp
        initialDocument={hostDocument}
        registry={makeCustomRegistry()}
        theme={{ colors: { primary: '#008a76' } }}
        callbacks={{ onChange: firstChange, onSelectionChange: firstSelection }}
      />,
    );
    const root = container.querySelector('.editor-root') as HTMLElement;

    expect(root.style.getPropertyValue('--dsk-color-primary')).toBe('#008a76');
    expect(
      within(root).getByText('Custom renderer: Bienvenue dans DSK Visual Engine'),
    ).toBeDefined();
    fireEvent.click(root.querySelector('[data-node-id="demo-heading"]')!);
    expect(firstSelection).toHaveBeenCalledWith('demo-heading');
    renameEditorDocument(root, 'Hosted document', 'Edited document');
    expect(firstChange).toHaveBeenCalledTimes(1);

    const replacementInitialDocument = {
      ...hostDocument,
      metadata: { ...hostDocument.metadata, title: 'Replacement initial document' },
    };
    rerender(
      <EditorApp
        initialDocument={replacementInitialDocument}
        registry={makeCustomRegistry('Afrishop Heading')}
        theme={{ colors: { primary: '#c53b50' }, spacing: { md: '20px' } }}
        callbacks={{
          onChange: latestChange,
          onSelectionChange: latestSelection,
          onSave: latestSave,
        }}
      />,
    );

    expect(root.style.getPropertyValue('--dsk-color-primary')).toBe('#c53b50');
    expect(
      within(root).getByRole('button', { name: 'Renommer le document : Edited document' }),
    ).toBeDefined();
    expect(
      within(root).getByText('Custom renderer: Bienvenue dans DSK Visual Engine'),
    ).toBeDefined();
    fireEvent.click(within(root).getByRole('button', { name: 'Components' }));
    fireEvent.click(within(root).getByRole('button', { name: /Afrishop Heading/ }));
    expect(within(root).getByText('Custom renderer: Heading')).toBeDefined();

    fireEvent.click(root.querySelector('.editor-stage')!);
    expect(latestSelection).toHaveBeenCalledWith(null);
    renameEditorDocument(root, 'Edited document', 'Edited after reconfiguration');
    expect(firstChange).toHaveBeenCalledTimes(1);
    expect(latestChange).toHaveBeenCalledTimes(2);
    fireEvent.click(within(root).getByRole('button', { name: 'Enregistrer' }));
    expect(latestSave).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ title: 'Edited after reconfiguration' }),
      }),
      expect.any(String),
    );
  });

  it('keeps configuration and state isolated between differently configured instances', () => {
    const firstDocument = {
      ...initialDocument,
      metadata: { ...initialDocument.metadata, title: 'Apex editor' },
    };
    const secondDocument = {
      ...initialDocument,
      id: 'afrishop-editor',
      metadata: { ...initialDocument.metadata, title: 'Afrishop editor' },
    };
    const { container } = render(
      <>
        <EditorApp
          initialDocument={firstDocument}
          registry={makeCustomRegistry('Apex Heading')}
          theme={{ colors: { primary: '#005b4f' } }}
          options={{ showInspector: false }}
        />
        <EditorApp
          initialDocument={secondDocument}
          registry={makeCustomRegistry('Afrishop Heading')}
          theme={{ colors: { primary: '#bd334d' } }}
          options={{ showSidebar: false }}
        />
      </>,
    );
    const editors = container.querySelectorAll<HTMLElement>('.editor-root');

    expect(editors).toHaveLength(2);
    expect(editors[0]?.style.getPropertyValue('--dsk-color-primary')).toBe('#005b4f');
    expect(editors[1]?.style.getPropertyValue('--dsk-color-primary')).toBe('#bd334d');
    fireEvent.click(within(editors[0]!).getByRole('button', { name: 'Components' }));
    expect(within(editors[0]!).getByRole('button', { name: /Apex Heading/ })).toBeDefined();
    expect(within(editors[1]!).queryByRole('button', { name: /Afrishop Heading/ })).toBeNull();
    expect(
      within(editors[1]!).getByRole('button', { name: 'Renommer le document : Afrishop editor' }),
    ).toBeDefined();
  });

  it('uses the supplied store and keeps the historical singleton export usable', () => {
    const externalStore = createEditorStore({
      document: {
        ...initialDocument,
        metadata: { ...initialDocument.metadata, title: 'External store document' },
      },
    });
    const { container } = render(<EditorApp store={externalStore} />);
    const root = container.querySelector('.editor-root') as HTMLElement;

    expect(
      within(root).getByRole('button', { name: 'Renommer le document : External store document' }),
    ).toBeDefined();
    expect(typeof useEditorStore.getState().updateDocumentTitle).toBe('function');
    expect(useEditorStore.getState().document.metadata.title).toBe(
      'Bienvenue dans DSK Visual Engine',
    );
  });
});
