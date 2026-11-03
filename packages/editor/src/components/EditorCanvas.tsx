import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageRenderer } from '@dsk/react-renderer';
import { defaultRendererRegistry } from '@dsk/components';
import type { ComponentNode, PageDocument } from '@dsk/core';
import { getDefaultComponent } from '../constants';
import { useEditorStore } from '../store';
import { FallbackComponent } from '../fallback';

type DropPosition = 'before' | 'after' | 'inside';
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
): { position: DropPosition; axis: 'horizontal' | 'vertical' } {
  const bounds = targetElement.getBoundingClientRect();
  const offsetX = (clientX - bounds.left) / Math.max(bounds.width, 1);
  const offsetY = (clientY - bounds.top) / Math.max(bounds.height, 1);
  const definition = getDefaultComponent(type);
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
  const selected = useEditorStore((state) => state.selectedNodeId === node.id);
  const definition = getDefaultComponent(node.type);
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

export const EditorCanvas = React.memo(({ preview = false }: { preview?: boolean }) => {
  const document = useEditorStore((state) => state.document);
  const nodeIndex = useMemo(() => indexDocumentNodes(document), [document]);
  const selectNode = useEditorStore((state) => state.selectNode);
  const duplicateNode = useEditorStore((state) => state.duplicateNode);
  const deleteNode = useEditorStore((state) => state.deleteNode);
  const moveNodeBy = useEditorStore((state) => state.moveNodeBy);
  const moveNode = useEditorStore((state) => state.moveNode);
  const moveNodeToSection = useEditorStore((state) => state.moveNodeToSection);
  const addComponentAt = useEditorStore((state) => state.addComponentAt);
  const addComponentToSection = useEditorStore((state) => state.addComponentToSection);
  const viewport = useEditorStore((state) => state.viewport);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dropHintRef = useRef<DropHint | null>(null);

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

  const fitCanvas = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const availableWidth = Math.max(100, stage.clientWidth - 64);
    setZoom(Math.min(1.5, availableWidth / widthMap[viewport]));
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
    <div
      ref={stageRef}
      className={`editor-stage${preview ? ' is-preview' : ''}`}
      onClick={() => selectNode(null)}
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
            ...resolveDropPosition(event.clientX, event.clientY, hit, targetEntry.node.type),
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
        const targetId =
          hitTarget?.dataset.nodeId ?? currentHint?.id ?? targetElement?.dataset.nodeId;
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
            document={document}
            registry={defaultRendererRegistry}
            fallbackComponent={FallbackComponent}
            validate={false}
            viewport={viewport}
            mode={preview ? 'preview' : 'edit'}
            renderNode={renderNode}
          />
        </div>
      </div>
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
