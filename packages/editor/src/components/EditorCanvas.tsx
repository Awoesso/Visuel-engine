import React, { useEffect, useRef, useState } from 'react';
import { PageRenderer } from '@dsk/react-renderer';
import { defaultRendererRegistry } from '@dsk/components';
import type { ComponentNode, PageDocument } from '@dsk/core';
import { getDefaultComponent } from '../constants';
import { useEditorStore } from '../store';
import { FallbackComponent } from '../fallback';

type DropPosition = 'before' | 'after' | 'inside';

export const EditorCanvas: React.FC<{ preview?: boolean }> = ({ preview = false }) => {
  const document = useEditorStore((state) => state.document);
  const selectedId = useEditorStore((state) => state.selectedNodeId);
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
  const [dropHint, setDropHint] = useState<{
    id: string;
    position: DropPosition;
    axis: 'horizontal' | 'vertical';
  } | null>(null);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateHeight = () => setCanvasHeight(canvas.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [viewport, document]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const frame = window.requestAnimationFrame(() => {
      stage.scrollLeft = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [viewport]);

  const widthMap = { desktop: 1440, tablet: 768, mobile: 375 } as const;
  const resolveDropPosition = (
    clientX: number,
    clientY: number,
    targetElement: HTMLElement,
    type: string,
  ): { position: DropPosition; axis: 'horizontal' | 'vertical' } => {
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
  };

  const fitCanvas = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const availableWidth = Math.max(100, stage.clientWidth - 64);
    setZoom(Math.min(1.5, availableWidth / widthMap[viewport]));
  };

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
        const targetNode = targetId ? findDocumentNode(document, targetId) : undefined;
        if (hit && targetId && targetNode) {
          setDropHint({
            id: targetId,
            ...resolveDropPosition(event.clientX, event.clientY, hit, targetNode.type),
          });
        } else {
          setDropHint(null);
        }
        setDropMessage(null);
      }}
      onDragOver={(event) => {
        if (
          event.dataTransfer.types.includes('application/x-dsk-component') ||
          event.dataTransfer.types.includes('application/x-dsk-node')
        )
          event.preventDefault();
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
        const targetId = hitTarget?.dataset.nodeId ?? dropHint?.id ?? targetElement?.dataset.nodeId;
        if (targetId) {
          const targetNode = targetId ? findDocumentNode(document, targetId) : undefined;
          if (!targetId || !targetNode) {
            setDropMessage('La cible de dépôt est introuvable dans le document.');
          } else {
            const { position, axis } =
              dropHint?.id === targetId
                ? dropHint
                : targetElement
                  ? resolveDropPosition(
                      event.clientX,
                      event.clientY,
                      targetElement,
                      targetNode.type,
                    )
                  : { position: 'after' as const, axis: 'vertical' as const };
            setDropHint({ id: targetId, position, axis });
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
        setDropHint(null);
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
          <PageRenderer
            document={document}
            registry={defaultRendererRegistry}
            fallbackComponent={FallbackComponent}
            viewport={viewport}
            mode={preview ? 'preview' : 'edit'}
            renderNode={(node, children) => {
              const definition = getDefaultComponent(node.type);
              const empty = isEmptyNode(node);
              const canMove = selectedId === node.id;
              return (
                <div
                  data-node-id={node.id}
                  className={[
                    'editable-node',
                    selectedId === node.id && !preview ? 'selected' : '',
                    empty && !preview ? 'is-empty' : '',
                    dropHint?.id === node.id ? `drop-${dropHint.position}` : '',
                    dropHint?.id === node.id ? `drop-${dropHint.axis}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  draggable={!preview}
                  onDragStart={(event) => {
                    if (preview) return;
                    event.stopPropagation();
                    event.dataTransfer.setData('application/x-dsk-node', node.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    const nodeDrag = event.dataTransfer.types.includes('application/x-dsk-node');
                    const componentDrag = event.dataTransfer.types.includes(
                      'application/x-dsk-component',
                    );
                    if (preview || (!nodeDrag && !componentDrag)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDropHint({
                      id: node.id,
                      ...resolveDropPosition(
                        event.clientX,
                        event.clientY,
                        event.currentTarget,
                        node.type,
                      ),
                    });
                    setDropMessage(null);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDropHint((current) => (current?.id === node.id ? null : current));
                    }
                  }}
                  onClick={(event) => {
                    if (preview) return;
                    event.stopPropagation();
                    selectNode(node.id);
                  }}
                  aria-label={`${definition?.label ?? node.type}${empty ? ', vide' : ''}`}
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
                          if (
                            window.confirm(`Supprimer ${definition?.label ?? 'ce composant'} ?`)
                          ) {
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
            }}
          />
        </div>
      </div>
    </div>
  );
};

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

function findDocumentNode(document: PageDocument, nodeId: string): ComponentNode | undefined {
  const find = (nodes: ComponentNode[]): ComponentNode | undefined => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      const nested = find(node.children);
      if (nested) return nested;
    }
    return undefined;
  };
  for (const section of document.sections) {
    const match = find(section.children);
    if (match) return match;
  }
  return undefined;
}
