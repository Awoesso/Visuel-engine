import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PageRenderer } from '@dsk/react-renderer';
import type { ComponentNode, ComponentRegistry, PageDocument } from '@dsk/core';
import { resolveEditorTheme } from '../config';
import {
  useEditorConfiguration,
  useEditorStoreApi,
  useEditorStoreInstance,
} from '../EditorStoreContext';
import { FallbackComponent } from '../fallback';
import {
  MousePointer,
  Square,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Hand,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  Pencil,
} from 'lucide-react';

type DropPosition = 'before' | 'after' | 'inside';
type EditorCanvasProps = {
  preview?: boolean;
  onTogglePreview?: () => void;
  isEditorEventTarget?: (target: EventTarget | null) => boolean;
};
type ContextMenuPosition = { x: number; y: number; nodeId: string | null };
type ZoomAnchor = {
  clientX: number;
  clientY: number;
  canvasX: number;
  canvasY: number;
  stageX: number;
  stageY: number;
};
type DropHint = {
  id: string;
  position: DropPosition;
  axis: 'horizontal' | 'vertical';
  element: HTMLElement;
};

const widthMap = { desktop: 1440, tablet: 768, mobile: 375 } as const;
const MemoizedPageRenderer = React.memo(PageRenderer);

function resolveDropPosition(
  clientX: number,
  clientY: number,
  targetElement: HTMLElement,
  type: string,
  registry: ComponentRegistry,
): { position: DropPosition; axis: 'horizontal' | 'vertical' } {
  const bounds = targetElement.getBoundingClientRect();
  const offsetX = (clientX - bounds.left) / Math.max(bounds.width, 1);
  const offsetY = (clientY - bounds.top) / Math.max(bounds.height, 1);
  const definition = registry.get(type);
  if (
    definition?.canHaveChildren &&
    offsetX >= 0.25 &&
    offsetX <= 0.75 &&
    offsetY >= 0.25 &&
    offsetY <= 0.75
  ) {
    return { position: 'inside', axis: 'vertical' };
  }
  const parent = targetElement.parentElement?.closest<HTMLElement>('.editable-node');
  const parentContent = parent?.firstElementChild;
  const parentStyle = parentContent ? window.getComputedStyle(parentContent) : null;
  const horizontal =
    parentStyle?.display === 'grid' ||
    (parentStyle?.display.includes('flex') && parentStyle.flexDirection.startsWith('row'));
  return {
    position: (horizontal ? offsetX : offsetY) < 0.5 ? 'before' : 'after',
    axis: horizontal ? 'horizontal' : 'vertical',
  };
}

function indexDocumentNodes(
  document: PageDocument,
): Map<string, { node: ComponentNode; locked: boolean }> {
  const index = new Map<string, { node: ComponentNode; locked: boolean }>();
  const visit = (nodes: ComponentNode[], inheritedLocked: boolean) => {
    for (const node of nodes) {
      const locked = inheritedLocked || node.locked === true;
      index.set(node.id, { node, locked });
      visit(node.children, locked);
    }
  };
  for (const section of document.sections) visit(section.children, section.locked === true);
  return index;
}

const EditableNodeFrame: React.FC<{
  node: ComponentNode;
  children: React.ReactNode;
  preview: boolean;
  locked: boolean;
  empty: boolean;
  selectNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => boolean;
  deleteNode: (nodeId: string) => boolean;
  moveNodeBy: (nodeId: string, direction: -1 | 1) => void;
}> = ({
  node,
  children,
  preview,
  locked,
  empty,
  selectNode,
  duplicateNode,
  deleteNode,
  moveNodeBy,
}) => {
  const { registry } = useEditorConfiguration();
  const selected = useEditorStoreInstance((state) => state.selectedNodeId === node.id);
  const definition = registry.definitions.get(node.type);
  const canMove = selected && !locked;

  return (
    <div
      data-node-id={node.id}
      className={[
        'editable-node',
        selected && !preview ? 'selected' : '',
        locked && !preview ? 'is-locked' : '',
        empty && !preview ? 'is-empty' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={!preview && !locked}
      onDragStart={(event) => {
        if (preview || locked) return;
        event.stopPropagation();
        event.dataTransfer.setData('application/x-dsk-node', node.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(event) => {
        if (preview) return;
        event.stopPropagation();
        selectNode(node.id);
      }}
      aria-label={`${definition?.label ?? node.type}${empty ? ', vide' : ''}${locked ? ', verrouillé' : ''}`}
    >
      {children}
      {empty && !preview ? (
        <span className="empty-node-label" aria-hidden="true">
          {emptyNodeLabel(node)}
        </span>
      ) : null}
      {canMove && !preview ? (
        <div
          className="node-actions"
          role="toolbar"
          aria-label={`Actions ${definition?.label ?? node.type}`}
          onClick={(event) => event.stopPropagation()}
          onDragStart={(event) => event.stopPropagation()}
        >
          <span className="node-type-label">{definition?.label ?? node.type}</span>
          <button
            type="button"
            aria-label="Dupliquer"
            title="Dupliquer"
            onClick={() => duplicateNode(node.id)}
          >
            ⧉
          </button>
          <button
            type="button"
            aria-label="Déplacer vers le haut"
            title="Déplacer vers le haut"
            onClick={() => moveNodeBy(node.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Déplacer vers le bas"
            title="Déplacer vers le bas"
            onClick={() => moveNodeBy(node.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Supprimer"
            title="Supprimer"
            onClick={() => {
              if (window.confirm(`Supprimer ${definition?.label ?? 'ce composant'} ?`)) {
                deleteNode(node.id);
              }
            }}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
};

export const EditorCanvas = React.memo((props: EditorCanvasProps) => {
  const { preview = false, onTogglePreview, isEditorEventTarget } = props;
  const { registry, theme } = useEditorConfiguration();
  const store = useEditorStoreApi();
  const document = useEditorStoreInstance((state) => state.document);
  const nodeIndex = useMemo(() => indexDocumentNodes(document), [document]);
  const rendererTheme = useMemo(
    () => resolveEditorTheme(document.theme, theme),
    [document.theme, theme],
  );
  const rendererDocument = useMemo(
    () => ({ ...document, theme: rendererTheme }),
    [document, rendererTheme],
  );
  const selectNode = useEditorStoreInstance((state) => state.selectNode);
  const duplicateNode = useEditorStoreInstance((state) => state.duplicateNode);
  const deleteNode = useEditorStoreInstance((state) => state.deleteNode);
  const moveNodeBy = useEditorStoreInstance((state) => state.moveNodeBy);
  const moveNode = useEditorStoreInstance((state) => state.moveNode);
  const moveNodeToSection = useEditorStoreInstance((state) => state.moveNodeToSection);
  const addComponentAt = useEditorStoreInstance((state) => state.addComponentAt);
  const addComponentToSection = useEditorStoreInstance((state) => state.addComponentToSection);
  const viewport = useEditorStoreInstance((state) => state.viewport);
  const zoom = useEditorStoreInstance((state) => state.zoom);
  const setZoom = useEditorStoreInstance((state) => state.setZoom);
  const selectedNodeId = useEditorStoreInstance((state) => state.selectedNodeId);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const dropHintRef = useRef<DropHint | null>(null);
  const panStartRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const didPanRef = useRef(false);

  const updateDropHint = (next: DropHint | null) => {
    const current = dropHintRef.current;
    if (
      current?.id === next?.id &&
      current?.position === next?.position &&
      current?.axis === next?.axis &&
      current?.element === next?.element
    ) {
      return;
    }
    if (current)
      current.element.classList.remove(`drop-${current.position}`, `drop-${current.axis}`);
    if (next) next.element.classList.add(`drop-${next.position}`, `drop-${next.axis}`);
    dropHintRef.current = next;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateHeight = () => setCanvasHeight(canvas.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const frame = window.requestAnimationFrame(() => {
      stage.scrollLeft = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [viewport]);

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current?.parentElement;
    if (!anchor || !stage || !canvas) return;

    zoomAnchorRef.current = null;
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();
    const canvasContentLeft = canvasBounds.left - stageBounds.left + stage.scrollLeft;
    const canvasContentTop = canvasBounds.top - stageBounds.top + stage.scrollTop;
    stage.scrollLeft = canvasContentLeft + anchor.canvasX * zoom - anchor.stageX;
    stage.scrollTop = canvasContentTop + anchor.canvasY * zoom - anchor.stageY;
  }, [zoom]);

  const addComponent = useEditorStoreInstance((state) => state.addComponent);
  const setViewport = useEditorStoreInstance((state) => state.setViewport);
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer');

  const fitCanvas = React.useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const availableWidth = Math.max(100, stage.clientWidth - 64);
    setZoom(Math.min(1.5, availableWidth / widthMap[viewport]));
  }, [setZoom, viewport]);

  const zoomBy = React.useCallback(
    (amount: number) => setZoom(store.getState().zoom + amount),
    [setZoom, store],
  );

  useEffect(() => {
    const isTextEntry = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEditorEventTarget?.(event.target)) return;
      if (isTextEntry(event.target)) return;
      if (event.key === 'Shift') {
        setShiftHeld(true);
        return;
      }
      if (event.code === 'Space' && !event.repeat) {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('button, [role="menu"]')) return;
        event.preventDefault();
        setSpaceHeld(true);
        return;
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key.toLowerCase() === 'h') setActiveTool('hand');
        else if (event.key.toLowerCase() === 'v') setActiveTool('pointer');
        return;
      }

      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() === 'd' && selectedNodeId) {
        const selected = nodeIndex.get(selectedNodeId);
        if (selected && !selected.locked) {
          event.preventDefault();
          duplicateNode(selectedNodeId);
        }
      } else if (event.key === '+' || event.key === '=' || event.key === 'Add') {
        event.preventDefault();
        zoomBy(0.1);
      } else if (event.key === '-' || event.key === 'Subtract') {
        event.preventDefault();
        zoomBy(-0.1);
      } else if (event.key === '0') {
        event.preventDefault();
        fitCanvas();
      } else if (event.key === '1') {
        event.preventDefault();
        setZoom(1);
      }
      return;
    };

    const onDeleteKeyDown = (event: KeyboardEvent) => {
      if (
        !isEditorEventTarget?.(event.target) ||
        isTextEntry(event.target) ||
        (event.key !== 'Backspace' && event.key !== 'Delete') ||
        !selectedNodeId
      ) {
        return;
      }
      const selected = nodeIndex.get(selectedNodeId);
      if (!selected || selected.locked) return;
      event.preventDefault();
      if (
        window.confirm(
          `Supprimer ${registry.definitions.get(selected.node.type)?.label ?? 'cet élément'} ?`,
        )
      ) {
        deleteNode(selectedNodeId);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!isEditorEventTarget?.(event.target)) return;
      if (event.code === 'Space') setSpaceHeld(false);
      if (event.key === 'Shift') setShiftHeld(false);
    };
    const onWindowBlur = () => {
      setSpaceHeld(false);
      setShiftHeld(false);
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keydown', onDeleteKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keydown', onDeleteKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [
    deleteNode,
    duplicateNode,
    fitCanvas,
    isEditorEventTarget,
    nodeIndex,
    selectedNodeId,
    setZoom,
    zoomBy,
  ]);

  useEffect(() => {
    if (!contextMenu) return;
    const firstItem = contextMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (isEditorEventTarget?.(event.target) && event.key === 'Escape') setContextMenu(null);
    };
    const closeOnOutsideClick = () => setContextMenu(null);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [contextMenu, isEditorEventTarget]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const menu = contextMenuRef.current;
    if (!contextMenu || !stage || !menu) return;

    const visibleLeft = stage.scrollLeft;
    const visibleTop = stage.scrollTop;
    const x = Math.min(
      Math.max(contextMenu.x, visibleLeft + 8),
      Math.max(visibleLeft + 8, visibleLeft + stage.clientWidth - menu.offsetWidth - 8),
    );
    const y = Math.min(
      Math.max(contextMenu.y, visibleTop + 8),
      Math.max(visibleTop + 8, visibleTop + stage.clientHeight - menu.offsetHeight - 8),
    );

    if (x !== contextMenu.x || y !== contextMenu.y) {
      setContextMenu({ ...contextMenu, x, y });
    }
  }, [contextMenu]);

  const openContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const targetNode =
      event.target instanceof Element ? event.target.closest<HTMLElement>('.editable-node') : null;
    const nodeId = targetNode?.dataset.nodeId ?? selectedNodeId;
    if (nodeId && nodeId !== selectedNodeId) selectNode(nodeId);
    const x = event.clientX - bounds.left + stage.scrollLeft;
    const y = event.clientY - bounds.top + stage.scrollTop;
    setContextMenu({ x, y, nodeId });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('button, input, select, textarea, [role="menu"], [role="dialog"]')
    ) {
      return;
    }

    const stage = stageRef.current;
    const canvas = canvasRef.current?.parentElement;
    if (!stage || !canvas) return;

    event.preventDefault();
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();
    const deltaMultiplier =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? stage.clientHeight
          : 1;
    const nextZoom = Math.min(
      1.5,
      Math.max(
        0.25,
        Math.round(zoom * Math.exp((-event.deltaY * deltaMultiplier) / 500) * 100) / 100,
      ),
    );
    if (nextZoom === zoom) {
      zoomAnchorRef.current = null;
      return;
    }

    zoomAnchorRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      canvasX: (event.clientX - canvasBounds.left) / zoom,
      canvasY: (event.clientY - canvasBounds.top) / zoom,
      stageX: event.clientX - stageBounds.left + stage.scrollLeft,
      stageY: event.clientY - stageBounds.top + stage.scrollTop,
    };
    setZoom(nextZoom);
  };

  const beginPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (preview || (event.button !== 0 && event.button !== 1)) return;
    const isMiddleButton = event.button === 1;
    if (!isMiddleButton && !spaceHeld && !shiftHeld && activeTool !== 'hand') return;
    const stage = stageRef.current;
    if (!stage) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(null);
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: stage.scrollLeft,
      scrollTop: stage.scrollTop,
    };
    didPanRef.current = true;
    setIsPanning(true);
    stage.setPointerCapture(event.pointerId);
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = panStartRef.current;
    const stage = stageRef.current;
    if (!start || !stage) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) didPanRef.current = true;
    stage.scrollLeft = start.scrollLeft - deltaX;
    stage.scrollTop = start.scrollTop - deltaY;
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    panStartRef.current = null;
    setIsPanning(false);
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const renderNode = React.useCallback(
    (node: ComponentNode, children: React.ReactNode, inheritedLocked = false) => (
      <EditableNodeFrame
        node={node}
        preview={preview}
        locked={inheritedLocked || node.locked === true}
        empty={isEmptyNode(node)}
        selectNode={selectNode}
        duplicateNode={duplicateNode}
        deleteNode={deleteNode}
        moveNodeBy={moveNodeBy}
      >
        {children}
      </EditableNodeFrame>
    ),
    [deleteNode, duplicateNode, moveNodeBy, preview, selectNode],
  );

  return (
    <div className="editor-canvas-frame">
      <div
        ref={stageRef}
        className={[
          'editor-stage',
          preview ? 'is-preview' : '',
          spaceHeld || shiftHeld || activeTool === 'hand' ? 'is-space-pan-ready' : '',
          isPanning ? 'is-panning' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          if (didPanRef.current) {
            didPanRef.current = false;
            return;
          }
          setContextMenu(null);
          selectNode(null);
        }}
        onContextMenu={preview ? undefined : openContextMenu}
        onPointerDown={beginPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onAuxClick={(event) => {
          if (event.button === 1) event.preventDefault();
        }}
        onWheel={handleCanvasWheel}
        onDragOverCapture={(event) => {
          if (preview) return;
          const isSupportedDrag =
            event.dataTransfer.types.includes('application/x-dsk-component') ||
            event.dataTransfer.types.includes('application/x-dsk-node');
          if (!isSupportedDrag) return;
          event.preventDefault();
          const hit = globalThis.document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest<HTMLElement>('.editable-node');
          const targetId = hit?.dataset.nodeId;
          const targetEntry = targetId ? nodeIndex.get(targetId) : undefined;
          if (targetEntry?.locked) {
            updateDropHint(null);
            setDropMessage((current) =>
              current === 'Cette zone est verrouillée.' ? current : 'Cette zone est verrouillée.',
            );
            return;
          }
          if (hit && targetId && targetEntry) {
            const nextHint = {
              id: targetId,
              ...resolveDropPosition(
                event.clientX,
                event.clientY,
                hit,
                targetEntry.node.type,
                registry.definitions,
              ),
              element: hit,
            };
            updateDropHint(nextHint);
          } else {
            updateDropHint(null);
          }
          setDropMessage(null);
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            updateDropHint(null);
            setDropMessage(null);
          }
        }}
        onDragEndCapture={() => {
          updateDropHint(null);
          setDropMessage(null);
        }}
        onDropCapture={(event) => {
          if (preview) return;
          const componentType = event.dataTransfer.getData('application/x-dsk-component');
          const movingId = event.dataTransfer.getData('application/x-dsk-node');
          if (!componentType && !movingId) return;
          const eventTarget = event.target;
          if (!(eventTarget instanceof Element)) return;
          event.preventDefault();
          event.stopPropagation();
          setDropMessage(null);

          const hitTarget = globalThis.document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest<HTMLElement>('.editable-node');
          const targetElement = hitTarget ?? eventTarget.closest<HTMLElement>('.editable-node');
          const currentHint = dropHintRef.current;
          const targetId = hitTarget?.dataset.nodeId ?? targetElement?.dataset.nodeId;
          if (targetId) {
            const targetNode = targetId ? nodeIndex.get(targetId)?.node : undefined;
            if (!targetId || !targetNode) {
              setDropMessage('La cible de dépôt est introuvable dans le document.');
            } else {
              const { position, axis } =
                currentHint?.id === targetId
                  ? currentHint
                  : targetElement
                    ? resolveDropPosition(
                        event.clientX,
                        event.clientY,
                        targetElement,
                        targetNode.type,
                        registry.definitions,
                      )
                    : { position: 'after' as const, axis: 'vertical' as const };
              if (targetElement)
                updateDropHint({ id: targetId, position, axis, element: targetElement });
              const accepted = componentType
                ? addComponentAt(componentType, targetId, position)
                : moveNode(movingId, targetId, position);
              if (!accepted) {
                setDropMessage(
                  'Placement refusé : vérifiez la hiérarchie et les composants autorisés.',
                );
              }
            }
          } else {
            const onCanvas =
              eventTarget.closest('.canvas-wrapper') !== null || eventTarget === stageRef.current;
            if (onCanvas) {
              const firstSection = document.sections[0];
              const accepted =
                componentType && firstSection
                  ? addComponentToSection(componentType, firstSection.id)
                  : movingId && firstSection
                    ? moveNodeToSection(movingId, firstSection.id)
                    : false;
              if (!accepted) {
                setDropMessage('Impossible de placer le composant à la racine de la section.');
              }
            }
          }
          updateDropHint(null);
        }}
      >
        {!preview ? (
          <div
            className="canvas-tools"
            role="toolbar"
            aria-label="Zoom du canvas"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Zoom arrière"
              title="Zoom arrière"
              onClick={() => setZoom(zoom - 0.1)}
            >
              −
            </button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="Zoom avant"
              title="Zoom avant"
              onClick={() => setZoom(zoom + 0.1)}
            >
              +
            </button>
            <button type="button" onClick={fitCanvas}>
              Fit
            </button>
            {dropMessage ? (
              <span className="canvas-drop-message" role="status">
                {dropMessage}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          className="canvas-viewport"
          style={{ width: widthMap[viewport] * zoom, height: canvasHeight * zoom }}
        >
          <div
            ref={canvasRef}
            className="canvas-wrapper"
            data-editor-viewport={viewport}
            style={{
              width: widthMap[viewport],
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Store ingress and action-specific schemas validate the editor-owned document. */}
            <MemoizedPageRenderer
              document={rendererDocument}
              registry={registry.renderers}
              fallbackComponent={FallbackComponent}
              validate={false}
              viewport={viewport}
              mode={preview ? 'preview' : 'edit'}
              renderNode={renderNode}
            />
          </div>
        </div>

        {contextMenu ? (
          <div
            ref={contextMenuRef}
            className="canvas-context-menu"
            role="menu"
            aria-label="Options du canvas"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onKeyDown={(event) => {
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const items = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
              );
              const currentIndex = items.indexOf(
                globalThis.document.activeElement as HTMLButtonElement,
              );
              const nextIndex =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? items.length - 1
                    : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) %
                      items.length;
              items[nextIndex]?.focus();
            }}
            onClick={(event) => {
              event.stopPropagation();
              setContextMenu(null);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <div className="canvas-context-heading">Canvas</div>
            <button type="button" role="menuitem" onClick={() => zoomBy(-0.1)}>
              <span>Zoom arrière</span>
              <kbd>Ctrl −</kbd>
            </button>
            <button type="button" role="menuitem" onClick={() => zoomBy(0.1)}>
              <span>Zoom avant</span>
              <kbd>Ctrl +</kbd>
            </button>
            <button type="button" role="menuitem" onClick={() => setZoom(1)}>
              <span>Zoom à 100 %</span>
              <kbd>Ctrl 1</kbd>
            </button>
            <button type="button" role="menuitem" onClick={fitCanvas}>
              <span>Ajuster à la fenêtre</span>
              <kbd>Ctrl 0</kbd>
            </button>
            <div className="canvas-context-divider" />
            <button type="button" role="menuitem" onClick={() => addComponent('core/container')}>
              <span>Ajouter un conteneur</span>
            </button>
            <button type="button" role="menuitem" onClick={() => addComponent('core/text')}>
              <span>Ajouter du texte</span>
              <kbd>T</kbd>
            </button>
            <button type="button" role="menuitem" onClick={() => addComponent('core/button')}>
              <span>Ajouter un bouton</span>
            </button>
            {contextMenu.nodeId ? (
              <>
                <div className="canvas-context-divider" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => duplicateNode(contextMenu.nodeId!)}
                >
                  <span>Dupliquer l’élément</span>
                  <kbd>Ctrl/⌘ D</kbd>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={() => {
                    const node = nodeIndex.get(contextMenu.nodeId!)?.node;
                    if (
                      node &&
                      window.confirm(
                        `Supprimer ${registry.definitions.get(node.type)?.label ?? 'cet élément'} ?`,
                      )
                    ) {
                      deleteNode(contextMenu.nodeId!);
                    }
                  }}
                >
                  <span>Supprimer l’élément</span>
                  <kbd>⌫</kbd>
                </button>
              </>
            ) : null}
            <div className="canvas-context-divider" />
            <div className="canvas-context-hints">
              <span>
                <kbd>Espace</kbd> ou <kbd>Maj</kbd> + glisser pour déplacer
              </span>
              <span>
                <kbd>H</kbd> main · <kbd>V</kbd> sélection
              </span>
            </div>
            {onTogglePreview ? (
              <button type="button" role="menuitem" onClick={onTogglePreview}>
                <span>Aperçu</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Floating Bottom Toolbar (Figma Style) */}
      {!preview && (
        <div
          className="figma-floating-toolbar"
          role="toolbar"
          aria-label="Barre d'outils flottante"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tool: Pointer */}
          <button
            type="button"
            className={`figma-floating-tool-btn ${activeTool === 'pointer' ? 'is-active' : ''}`}
            title="Outil Sélection (V)"
            aria-label="Outil Sélection"
            onClick={() => setActiveTool('pointer')}
          >
            <MousePointer size={15} />
          </button>

          {/* Tool: Hand / Pan */}
          <button
            type="button"
            className={`figma-floating-tool-btn ${activeTool === 'hand' ? 'is-active' : ''}`}
            title="Outil Déplacement (H)"
            aria-label="Outil Déplacement"
            onClick={() => setActiveTool('hand')}
          >
            <Hand size={15} />
          </button>

          <div className="figma-floating-divider" />

          {/* Quick Insert: Container */}
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Ajouter un Conteneur / Rectangle (R)"
            aria-label="Ajouter un Conteneur"
            onClick={() => addComponent('core/container')}
          >
            <Square size={15} />
          </button>

          {/* Quick Insert: Text */}
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Ajouter un Texte (T)"
            aria-label="Ajouter un Texte"
            onClick={() => addComponent('core/text')}
          >
            <Type size={15} />
          </button>

          {/* Quick Insert: Button */}
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Ajouter un Bouton"
            aria-label="Ajouter un Bouton"
            onClick={() => addComponent('core/button')}
          >
            <MousePointerClick size={15} />
          </button>

          {/* Quick Insert: Image */}
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Ajouter une Image"
            aria-label="Ajouter une Image"
            onClick={() => addComponent('core/image')}
          >
            <ImageIcon size={15} />
          </button>

          <div className="figma-floating-divider" />

          {/* Responsive Viewports */}
          <button
            type="button"
            className={`figma-floating-tool-btn ${viewport === 'desktop' ? 'is-active' : ''}`}
            title="Mode Ordinateur (Desktop)"
            aria-label="Mode Ordinateur"
            onClick={() => setViewport('desktop')}
          >
            <Monitor size={15} />
          </button>
          <button
            type="button"
            className={`figma-floating-tool-btn ${viewport === 'tablet' ? 'is-active' : ''}`}
            title="Mode Tablette"
            aria-label="Mode Tablette"
            onClick={() => setViewport('tablet')}
          >
            <Tablet size={15} />
          </button>
          <button
            type="button"
            className={`figma-floating-tool-btn ${viewport === 'mobile' ? 'is-active' : ''}`}
            title="Mode Mobile"
            aria-label="Mode Mobile"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone size={15} />
          </button>

          <div className="figma-floating-divider" />

          {/* Zoom controls */}
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Zoom arrière"
            aria-label="Zoom arrière"
            onClick={() => setZoom(zoom - 0.1)}
          >
            <ZoomOut size={14} />
          </button>
          <span className="figma-floating-zoom-label" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Zoom avant"
            aria-label="Zoom avant"
            onClick={() => setZoom(zoom + 0.1)}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="figma-floating-tool-btn"
            title="Ajuster à l'écran (Fit)"
            aria-label="Ajuster à l'écran"
            onClick={fitCanvas}
          >
            <Maximize2 size={13} />
          </button>
          {onTogglePreview ? (
            <button
              type="button"
              className="figma-floating-tool-btn"
              title="Aperçu du document"
              aria-label="Aperçu du document"
              onClick={onTogglePreview}
            >
              <Eye size={14} />
            </button>
          ) : null}
        </div>
      )}
      {preview && onTogglePreview ? (
        <button
          type="button"
          className="canvas-preview-exit"
          title="Quitter l’aperçu"
          onClick={onTogglePreview}
        >
          <Pencil size={14} />
          <span>Modifier</span>
        </button>
      ) : null}
    </div>
  );
});

function isEmptyNode(node: {
  type: string;
  props: Record<string, unknown>;
  children: unknown[];
}): boolean {
  if (node.type === 'core/text') return !String(node.props.content ?? '').trim();
  if (['core/grid', 'core/container', 'core/stack'].includes(node.type))
    return node.children.length === 0;
  return false;
}

function emptyNodeLabel(node: { type: string }): string {
  if (node.type === 'core/text') return 'Text vide — sélectionnez pour modifier';
  const label =
    node.type === 'core/grid' ? 'Grille' : node.type === 'core/stack' ? 'Stack' : 'Container';
  return `${label} vide — sélectionnez pour modifier`;
}
