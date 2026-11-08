import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { themeToCssVariables } from '@dsk/core';
import { EditorCanvas } from './components/EditorCanvas';
import { ComponentSidebar } from './components/ComponentSidebar';
import { PropertyPanel } from './components/PropertyPanel';
import {
  EditorConfigurationProvider,
  EditorStoreProvider,
  useEditorConfiguration,
  useEditorStoreApi,
  useEditorStoreInstance,
} from './EditorStoreContext';
import { DEFAULT_EDITOR_OPTIONS, resolveEditorTheme } from './config';
import type { EditorAppProps, EditorCallbacks } from './config';
import { createDefaultComponentRegistry, defaultEditorRegistry } from './constants';
import { createEditorStore, initialDocument } from './store';
import { DocumentAutosave, restoreDocument, scheduleDocumentChange } from './persistence';
import type { SaveState } from './persistence';
import {
  Undo2,
  Redo2,
  Pencil,
  Eye,
  Save,
  Share2,
  Play,
  MoreHorizontal,
  Layers,
  Boxes,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import './components/styles.css';

const PanelResizeHandle = React.memo(
  ({
    label,
    value,
    onResize,
    min,
    max,
    growDirection,
  }: {
    label: string;
    value: number;
    onResize: (width: number) => void;
    min: number;
    max: number;
    growDirection: 'left' | 'right';
  }) => {
    const dragStart = useRef<{ x: number; width: number } | null>(null);
    const resizeBy = (delta: number) => onResize(Math.min(max, Math.max(min, value + delta)));

    return (
      <div
        className="panel-resize-handle"
        role="separator"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault();
          dragStart.current = { x: event.clientX, width: value };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = dragStart.current;
          if (!start) return;
          const direction = growDirection === 'left' ? 1 : -1;
          onResize(
            Math.min(max, Math.max(min, start.width + (event.clientX - start.x) * direction)),
          );
        }}
        onPointerUp={() => {
          dragStart.current = null;
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
        onLostPointerCapture={() => {
          dragStart.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const grows =
            (growDirection === 'left' && event.key === 'ArrowRight') ||
            (growDirection === 'right' && event.key === 'ArrowLeft');
          resizeBy(grows ? 20 : -20);
        }}
      />
    );
  },
);

const EMPTY_CALLBACKS: EditorCallbacks = {};

const EditorWorkspace: React.FC = () => {
  const { registry, theme, options, callbacks } = useEditorConfiguration();
  const store = useEditorStoreApi();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const autosaveRef = useRef<DocumentAutosave | null>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const document = useEditorStoreInstance((state) => state.document);
  const viewport = useEditorStoreInstance((state) => state.viewport);
  const saveState = useEditorStoreInstance((state) => state.saveState);
  const setViewport = useEditorStoreInstance((state) => state.setViewport);
  const setSaveState = useEditorStoreInstance((state) => state.setSaveState);
  const resetDemo = useEditorStoreInstance((state) => state.resetDemo);
  const undo = useEditorStoreInstance((state) => state.undo);
  const redo = useEditorStoreInstance((state) => state.redo);
  const canUndo = useEditorStoreInstance((state) => state.pastDocuments.length > 0);
  const canRedo = useEditorStoreInstance((state) => state.futureDocuments.length > 0);
  const updateDocumentTitle = useEditorStoreInstance((state) => state.updateDocumentTitle);
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [renamingDocument, setRenamingDocument] = useState(false);
  const [documentTitleDraft, setDocumentTitleDraft] = useState(document.metadata.title);
  const [documentTitleError, setDocumentTitleError] = useState<string | null>(null);
  const skipTitleBlurCommit = useRef(false);
  const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsed((current) => !current), []);
  const toggleInspectorCollapsed = useCallback(
    () => setInspectorCollapsed((current) => !current),
    [],
  );
  const isEditorEventTarget = useCallback(
    (target: EventTarget | null) =>
      target instanceof Node && editorRootRef.current?.contains(target) === true,
    [],
  );

  const reportSaveState = useCallback(
    (nextSaveState: SaveState) => {
      setSaveState(nextSaveState);
      if (nextSaveState.status === 'saved' && nextSaveState.lastSavedAt) {
        callbacksRef.current.onSave?.(store.getState().document, nextSaveState.lastSavedAt);
      }
    },
    [setSaveState, store],
  );

  useEffect(() => {
    store.getState().setComponentRegistry(registry.definitions);
  }, [registry.definitions, store]);

  useEffect(() => {
    const autosave = new DocumentAutosave(() => window.localStorage, reportSaveState);
    autosaveRef.current = autosave;
    const restored = restoreDocument(() => window.localStorage);

    if (restored.status === 'restored') {
      store.getState().replaceDocument(restored.document);
      autosave.setLastSavedAt(restored.lastSavedAt);
      if (restored.needsRewrite) {
        autosave.saveNow(restored.document);
      } else {
        setSaveState({
          status: 'saved',
          lastSavedAt: restored.lastSavedAt,
          error: null,
        });
      }
    } else if (restored.status === 'error') {
      setSaveState({ status: 'error', lastSavedAt: null, error: restored.error });
    } else {
      setSaveState({ status: 'idle', lastSavedAt: null, error: null });
    }

    const unsubscribe = store.subscribe((state, previousState) => {
      scheduleDocumentChange(state, previousState, autosave);
      if (state.document !== previousState.document) {
        callbacksRef.current.onChange?.(state.document);
      }
      if (state.selectedNodeId !== previousState.selectedNodeId) {
        callbacksRef.current.onSelectionChange?.(state.selectedNodeId);
      }
    });
    const flushPendingSave = () => {
      autosave.flushIfPending(store.getState().document);
    };
    window.addEventListener('pagehide', flushPendingSave);

    return () => {
      window.removeEventListener('pagehide', flushPendingSave);
      unsubscribe();
      autosave.dispose();
      autosaveRef.current = null;
    };
  }, [reportSaveState, store]);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (!isEditorEventTarget(target)) return;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [isEditorEventTarget, redo, undo]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const updateCompactLayout = () => setCompactLayout(media.matches);
    updateCompactLayout();
    media.addEventListener('change', updateCompactLayout);
    return () => media.removeEventListener('change', updateCompactLayout);
  }, []);

  const commitDocumentTitle = () => {
    const title = documentTitleDraft.trim();
    if (!title) {
      setDocumentTitleError('Le nom du document ne peut pas être vide.');
      return;
    }
    updateDocumentTitle(title);
    setDocumentTitleDraft(title);
    setDocumentTitleError(null);
    setRenamingDocument(false);
  };

  const beginRenameDocument = useCallback(() => {
    setDocumentTitleDraft(document.metadata.title);
    setDocumentTitleError(null);
    setRenamingDocument(true);
  }, [document.metadata.title]);

  const workspaceColumns = previewMode
    ? 'minmax(0, 1fr)'
    : compactLayout
      ? 'minmax(0, 1fr)'
      : [
          ...(options.showSidebar
            ? [
                sidebarCollapsed ? '44px' : `${sidebarWidth}px`,
                ...(sidebarCollapsed ? [] : ['6px']),
              ]
            : []),
          'minmax(0, 1fr)',
          ...(options.showInspector
            ? [
                ...(inspectorCollapsed ? [] : ['6px']),
                inspectorCollapsed ? '44px' : `${inspectorWidth}px`,
              ]
            : []),
        ].join(' ');

  const editorTheme = useMemo(
    () => resolveEditorTheme(document.theme, theme),
    [document.theme, theme],
  );
  const editorStyle = useMemo(
    () =>
      ({
        ...themeToCssVariables(editorTheme),
        '--dsk-font-family': "'Geist'",
        '--dsk-panel-background': editorTheme.colors.surface,
        '--dsk-workspace-background': editorTheme.colors.background,
        fontFamily: "'Geist', Arial, sans-serif",
      }) as React.CSSProperties,
    [editorTheme],
  );

  const saveStatusLabel = {
    idle: 'Not saved',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error',
  }[saveState.status];

  const lastSavedLabel =
    saveState.lastSavedAt === null
      ? null
      : new Date(saveState.lastSavedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

  return (
    <div
      ref={editorRootRef}
      className={`editor-root${previewMode ? ' preview-mode' : ''}`}
      style={editorStyle}
    >
      <header className="editor-toolbar">
        <div className="editor-brand">
          <span className="editor-brand-mark" aria-hidden="true">
            D
          </span>
          <div>
            <h1>DSK Visual Engine</h1>
            <p>Éditeur visuel</p>
          </div>
        </div>
        <div className="editor-document">
          <span className="document-label">DOCUMENT</span>
          {renamingDocument ? (
            <div className="document-rename">
              <input
                autoFocus
                aria-label="Nom du document"
                aria-invalid={documentTitleError !== null}
                aria-describedby={documentTitleError ? 'document-title-error' : undefined}
                value={documentTitleDraft}
                onChange={(event) => {
                  setDocumentTitleDraft(event.target.value);
                  setDocumentTitleError(null);
                }}
                onBlur={() => {
                  if (skipTitleBlurCommit.current) {
                    skipTitleBlurCommit.current = false;
                    return;
                  }
                  commitDocumentTitle();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitDocumentTitle();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    skipTitleBlurCommit.current = true;
                    event.currentTarget.blur();
                    setDocumentTitleDraft(document.metadata.title);
                    setDocumentTitleError(null);
                    setRenamingDocument(false);
                  }
                }}
              />
              {documentTitleError ? (
                <span id="document-title-error" className="document-rename-error" role="alert">
                  {documentTitleError}
                </span>
              ) : null}
            </div>
          ) : (
            <button
              className="document-name-button"
              type="button"
              title="Renommer le document"
              aria-label={`Renommer le document : ${document.metadata.title}`}
              onClick={beginRenameDocument}
            >
              <strong>{document.metadata.title}</strong>
              <Pencil size={12} className="document-rename-icon" />
            </button>
          )}
        </div>
        <div className="editor-toolbar-center">
          <div className="viewport-switcher" role="group" aria-label="Aperçu responsive">
            {(
              [
                ['desktop', 'Desktop'],
                ['tablet', 'Tablet'],
                ['mobile', 'Mobile'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewport === mode}
                onClick={() => setViewport(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="editor-toolbar-actions">
          <div className="history-actions" role="group" aria-label="Historique du document">
            <button
              className="toolbar-button"
              type="button"
              aria-label="Annuler"
              title="Annuler (Ctrl/Cmd+Z)"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 size={14} />
            </button>
            <button
              className="toolbar-button"
              type="button"
              aria-label="Rétablir"
              title="Rétablir (Ctrl/Cmd+Shift+Z)"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 size={14} />
            </button>
          </div>
          <div
            className="save-indicator"
            role="status"
            aria-live="polite"
            data-status={saveState.status}
          >
            <span className="save-indicator-dot" aria-hidden="true" />
            <span title={saveState.error ?? undefined}>{saveStatusLabel}</span>
            {lastSavedLabel ? (
              <time dateTime={saveState.lastSavedAt ?? undefined}>à {lastSavedLabel}</time>
            ) : null}
          </div>
          {options.showSaveButton ? (
            <button
              className="toolbar-button toolbar-button-primary"
              type="button"
              title="Enregistrer maintenant"
              onClick={() => {
                autosaveRef.current?.saveNow(store.getState().document);
              }}
            >
              <Save size={13} />
              <span>Enregistrer</span>
            </button>
          ) : null}
          {options.showPreviewButton ? (
            <button
              className={`toolbar-button${previewMode ? ' toolbar-button-primary' : ''}`}
              type="button"
              aria-pressed={previewMode}
              title="Aperçu du document"
              onClick={() => setPreviewMode((current) => !current)}
            >
              {previewMode ? <Play size={13} /> : <Eye size={13} />}
              <span>{previewMode ? 'Quitter' : 'Aperçu'}</span>
            </button>
          ) : null}
          <button
            className="figma-share-pill-btn"
            type="button"
            title="Partager le document"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Lien du document copié dans le presse-papier !');
            }}
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
          <details className="toolbar-menu">
            <summary aria-label="Autres actions" title="Autres actions">
              <MoreHorizontal size={14} />
            </summary>
            <div className="toolbar-menu-popover">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm('Réinitialiser la démo et perdre les modifications actuelles ?')
                  ) {
                    resetDemo();
                  }
                }}
              >
                Réinitialiser la démo
              </button>
            </div>
          </details>
        </div>
      </header>
      <div className="figma-app-body">
        {/* Leftmost Vertical Navigation Rail (Figma Style) */}
        {!previewMode && options.showSidebar && (
          <nav className="figma-left-rail" aria-label="Navigation principale">
            <div className="figma-rail-top">
              <button
                type="button"
                className={`figma-rail-btn ${!sidebarCollapsed ? 'is-active' : ''}`}
                title="Calques & Pages (Alt+1)"
                aria-label="Calques & Pages"
                onClick={toggleSidebarCollapsed}
              >
                <Layers size={17} />
              </button>
              <button
                type="button"
                className="figma-rail-btn"
                title="Bibliothèque de composants (Alt+2)"
                aria-label="Composants"
                onClick={() => {
                  if (sidebarCollapsed) toggleSidebarCollapsed();
                }}
              >
                <Boxes size={17} />
              </button>
            </div>
            <div className="figma-rail-bottom">
              <button
                type="button"
                className="figma-rail-btn"
                title={sidebarCollapsed ? 'Afficher la sidebar' : 'Masquer la sidebar'}
                aria-label="Basculer la sidebar"
                onClick={toggleSidebarCollapsed}
              >
                {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <button
                type="button"
                className="figma-rail-btn"
                title="Aide & Raccourcis"
                aria-label="Aide"
                onClick={() =>
                  alert(
                    'DSK Visual Engine - Raccourcis :\n• Ctrl+Z : Annuler\n• Ctrl+Shift+Z : Rétablir\n• Double-clic sur calque : Renommer',
                  )
                }
              >
                <HelpCircle size={16} />
              </button>
            </div>
          </nav>
        )}
        <div
          className={`editor-workspace${compactLayout ? ' is-compact' : ''}`}
          style={{ gridTemplateColumns: workspaceColumns }}
        >
          {!previewMode && options.showSidebar ? (
            <ComponentSidebar
              collapsed={sidebarCollapsed}
              onToggleCollapsed={toggleSidebarCollapsed}
              onRenameDocument={beginRenameDocument}
            />
          ) : null}
          {!previewMode && options.showSidebar && !compactLayout && !sidebarCollapsed ? (
            <PanelResizeHandle
              label="Redimensionner le panneau de gauche"
              value={sidebarWidth}
              min={240}
              max={570}
              growDirection="left"
              onResize={setSidebarWidth}
            />
          ) : null}
          <EditorCanvas
            preview={previewMode}
            onTogglePreview={() => setPreviewMode((value) => !value)}
            isEditorEventTarget={isEditorEventTarget}
          />
          {!previewMode && options.showInspector && !compactLayout && !inspectorCollapsed ? (
            <PanelResizeHandle
              label="Redimensionner l’inspecteur"
              value={inspectorWidth}
              min={300}
              max={670}
              growDirection="right"
              onResize={setInspectorWidth}
            />
          ) : null}
          {!previewMode && options.showInspector ? (
            <PropertyPanel
              collapsed={inspectorCollapsed}
              onToggleCollapsed={toggleInspectorCollapsed}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const EditorApp: React.FC<EditorAppProps> = ({
  initialDocument: initialDocumentProp,
  registry: registryProp,
  theme,
  options: optionsProp,
  callbacks = EMPTY_CALLBACKS,
  store: externalStore,
}) => {
  const [instanceDefaultRegistry] = useState(() => ({
    definitions: createDefaultComponentRegistry(),
    renderers: defaultEditorRegistry.renderers,
  }));
  const registry = registryProp ?? instanceDefaultRegistry;
  const [internalStore] = useState(() =>
    createEditorStore({
      document: initialDocumentProp ?? initialDocument,
      registry: registry.definitions,
    }),
  );
  const store = externalStore ?? internalStore;
  const options = useMemo(
    () => ({ ...DEFAULT_EDITOR_OPTIONS, ...optionsProp }),
    [
      optionsProp?.showSidebar,
      optionsProp?.showInspector,
      optionsProp?.showSaveButton,
      optionsProp?.showPreviewButton,
    ],
  );
  const configuration = useMemo(
    () => ({ registry, theme, options, callbacks }),
    [registry, theme, options, callbacks],
  );

  return (
    <EditorStoreProvider store={store}>
      <EditorConfigurationProvider configuration={configuration}>
        <EditorWorkspace />
      </EditorConfigurationProvider>
    </EditorStoreProvider>
  );
};

export type {
  EditorAppProps,
  EditorCallbacks,
  EditorOptions,
  EditorRegistry,
  EditorTheme,
} from './config';
export { createDefaultComponentRegistry, defaultEditorRegistry } from './constants';
export { createEditorStore, initialDocument, useEditorStore } from './store';
export type { EditorStoreApi, EditorStoreOptions } from './store';
export {
  AUTOSAVE_DEBOUNCE_MS,
  DocumentAutosave,
  EDITOR_STORAGE_KEY,
  restoreDocument,
  saveDocument,
} from './persistence';
export type {
  RestoreResult,
  SaveState,
  SaveStatus,
  StorageLike,
  StorageProvider,
} from './persistence';
