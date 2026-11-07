import React, { useMemo, useState, useRef } from 'react';
import type { ComponentNode } from '@dsk/core';
import { AVAILABLE_COMPONENTS, getDefaultComponent } from '../constants';
import { useEditorStore } from '../store';
import {
  FileText,
  Layers,
  Boxes,
  Image as ImageIcon,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Pencil,
  Copy,
  Trash2,
  Type,
  Square,
  Box,
  MousePointerClick,
  LayoutGrid,
  Hash,
  Minus,
} from 'lucide-react';

type SidebarTab = 'layers' | 'components' | 'assets';
type DropPosition = 'before' | 'after' | 'inside';

// Helper pour associer la bonne icône selon le type de calque
export function getNodeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'core/heading':
    case 'core/text':
      return <Type size={13} className="figma-layer-icon-svg" />;
    case 'core/button':
      return <MousePointerClick size={13} className="figma-layer-icon-svg" />;
    case 'core/image':
      return <ImageIcon size={13} className="figma-layer-icon-svg" />;
    case 'core/container':
      return <Box size={13} className="figma-layer-icon-svg" />;
    case 'core/grid':
      return <LayoutGrid size={13} className="figma-layer-icon-svg" />;
    case 'core/divider':
      return <Minus size={13} className="figma-layer-icon-svg" />;
    case 'section':
      return <Hash size={13} className="figma-layer-icon-svg" />;
    default:
      return <Square size={13} className="figma-layer-icon-svg" />;
  }
}

function nodeLabel(node: ComponentNode): string {
  const definition = getDefaultComponent(node.type);
  const value = node.props.text ?? node.props.content ?? node.props.label ?? node.props.src;
  const detail = typeof value === 'string' && value.trim() ? ` — ${value.trim().slice(0, 20)}` : '';
  return node.name?.trim() || `${definition?.label ?? node.type}${detail}`;
}

const LayerBranch = React.memo(function LayerBranch({
  node,
  inheritedLocked,
  onSelect,
  onRename,
  onSetLocked,
  onSetHidden,
  onDuplicate,
  onDelete,
  onMove,
  depth = 0,
}: {
  node: ComponentNode;
  inheritedLocked: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
  onSetLocked: (id: string, locked: boolean) => boolean;
  onSetHidden: (id: string, hidden: boolean) => boolean;
  onDuplicate: (id: string) => boolean;
  onDelete: (id: string) => boolean;
  onMove: (id: string, targetId: string, position: DropPosition) => boolean;
  depth?: number;
}) {
  const definition = getDefaultComponent(node.type);
  const selected = useEditorStore((state) => state.selectedNodeId === node.id);
  const hasChildren = node.children.length > 0;
  const effectivelyLocked = inheritedLocked || node.locked;
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(node.name ?? '');
  const skipRenameBlur = useRef(false);

  const commitName = () => {
    if (onRename(node.id, draftName)) setRenaming(false);
  };

  const dropPosition = (event: React.DragEvent<HTMLLIElement>): DropPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
    if (definition?.canHaveChildren && ratio >= 0.25 && ratio <= 0.75) return 'inside';
    return ratio < 0.5 ? 'before' : 'after';
  };

  return (
    <li
      className={`figma-layer-item ${effectivelyLocked ? 'is-locked' : ''}`}
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
      onDragOver={(event) => {
        if (effectivelyLocked || !event.dataTransfer.types.includes('application/x-dsk-node')) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={(event) => {
        const movingId = event.dataTransfer.getData('application/x-dsk-node');
        if (!movingId || effectivelyLocked) return;
        event.preventDefault();
        event.stopPropagation();
        onMove(movingId, node.id, dropPosition(event));
      }}
    >
      <div className={`figma-layer-row ${selected ? 'is-selected' : ''}`}>
        {/* Disclosure arrow */}
        <button
          type="button"
          className="figma-layer-chevron"
          aria-label={`${expanded ? 'Réduire' : 'Développer'} ${nodeLabel(node)}`}
          disabled={!hasChildren}
          onClick={() => setExpanded((curr) => !curr)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="figma-chevron-placeholder" />
          )}
        </button>

        {/* Layer Icon */}
        <span className="figma-layer-type-icon">{getNodeIcon(node.type)}</span>

        {/* Layer Name or Input */}
        {renaming ? (
          <input
            autoFocus
            className="figma-layer-rename-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              if (skipRenameBlur.current) {
                skipRenameBlur.current = false;
                return;
              }
              commitName();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitName();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                skipRenameBlur.current = true;
                e.currentTarget.blur();
                setDraftName(node.name ?? '');
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="figma-layer-title-btn"
            onClick={() => onSelect(node.id)}
            onDoubleClick={() => {
              setDraftName(node.name ?? '');
              setRenaming(true);
            }}
            draggable={!effectivelyLocked}
            onDragStart={(event) => {
              if (effectivelyLocked) return;
              event.stopPropagation();
              event.dataTransfer.setData('application/x-dsk-node', node.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
          >
            <span className="figma-layer-name">{nodeLabel(node)}</span>
          </button>
        )}

        {/* Hover / Active Actions */}
        <div className="figma-layer-hover-actions">
          <button
            type="button"
            className="figma-layer-mini-btn"
            title={node.hidden ? 'Afficher' : 'Masquer'}
            aria-label={node.hidden ? 'Afficher' : 'Masquer'}
            disabled={inheritedLocked}
            onClick={() => onSetHidden(node.id, !node.hidden)}
          >
            {node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>

          <button
            type="button"
            className="figma-layer-mini-btn"
            title={node.locked ? 'Déverrouiller' : 'Verrouiller'}
            aria-label={node.locked ? 'Déverrouiller' : 'Verrouiller'}
            disabled={inheritedLocked}
            onClick={() => onSetLocked(node.id, !node.locked)}
          >
            {node.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>

          <button
            type="button"
            className="figma-layer-mini-btn"
            title="Dupliquer"
            aria-label="Dupliquer"
            disabled={effectivelyLocked}
            onClick={() => onDuplicate(node.id)}
          >
            <Copy size={12} />
          </button>

          <button
            type="button"
            className="figma-layer-mini-btn figma-danger-btn"
            title="Supprimer"
            aria-label="Supprimer"
            disabled={effectivelyLocked}
            onClick={() => onDelete(node.id)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="figma-layer-children-list">
          {node.children.map((child) => (
            <LayerBranch
              key={child.id}
              node={child}
              inheritedLocked={effectivelyLocked}
              onSelect={onSelect}
              onRename={onRename}
              onSetLocked={onSetLocked}
              onSetHidden={onSetHidden}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onMove={onMove}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

export const ComponentSidebar = React.memo(
  ({
    collapsed = false,
    onToggleCollapsed,
  }: {
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
    onRenameDocument?: () => void;
  }) => {
    const document = useEditorStore((state) => state.document);
    const pages = useEditorStore((state) => state.pages);
    const activePageId = useEditorStore((state) => state.activePageId);
    const createPage = useEditorStore((state) => state.createPage);
    const switchPage = useEditorStore((state) => state.switchPage);
    const duplicatePage = useEditorStore((state) => state.duplicatePage);
    const deletePage = useEditorStore((state) => state.deletePage);
    const renamePage = useEditorStore((state) => state.renamePage);

    const addComponent = useEditorStore((state) => state.addComponent);
    const selectNode = useEditorStore((state) => state.selectNode);
    const updateNodeName = useEditorStore((state) => state.updateNodeName);
    const setNodeLocked = useEditorStore((state) => state.setNodeLocked);
    const setNodeHidden = useEditorStore((state) => state.setNodeHidden);
    const setSectionLocked = useEditorStore((state) => state.setSectionLocked);
    const setSectionHidden = useEditorStore((state) => state.setSectionHidden);
    const duplicateNode = useEditorStore((state) => state.duplicateNode);
    const deleteNode = useEditorStore((state) => state.deleteNode);
    const moveNode = useEditorStore((state) => state.moveNode);

    const [activeTab, setActiveTab] = useState<SidebarTab>('layers');
    const [pageSearchOpen, setPageSearchOpen] = useState(false);
    const [pageSearch, setPageSearch] = useState('');
    const [componentSearch, setComponentSearch] = useState('');
    const [pagesSectionOpen, setPagesSectionOpen] = useState(true);
    const [editingPageId, setEditingPageId] = useState<string | null>(null);
    const [editingPageTitle, setEditingPageTitle] = useState('');

    const filteredPages = useMemo(() => {
      if (!pageSearch.trim()) return pages;
      const q = pageSearch.toLowerCase();
      return pages.filter((p) => p.metadata.title.toLowerCase().includes(q));
    }, [pages, pageSearch]);

    const filteredComponents = useMemo(() => {
      const q = componentSearch.trim().toLowerCase();
      if (!q) return AVAILABLE_COMPONENTS;
      return AVAILABLE_COMPONENTS.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }, [componentSearch]);

    if (collapsed) {
      return (
        <aside className="editor-sidebar is-collapsed figma-sidebar-collapsed">
          <button
            type="button"
            className="panel-expand-button"
            title="Développer la sidebar"
            onClick={onToggleCollapsed}
          >
            ›
          </button>
        </aside>
      );
    }

    return (
      <aside className="editor-sidebar figma-left-sidebar" id="editor-left-panel">
        {/* Header: Project / Document Title */}
        <div className="figma-sidebar-header">
          <div className="figma-sidebar-header-title">
            <span className="figma-brand-square">D</span>
            <div className="figma-header-info">
              <strong className="figma-header-name">{document.metadata.title}</strong>
              <small className="figma-header-badge">DSK Engine</small>
            </div>
          </div>
          <button
            type="button"
            className="figma-icon-btn"
            title="Réduire la sidebar"
            aria-label="Réduire la sidebar"
            onClick={onToggleCollapsed}
          >
            <ChevronRight size={14} className="figma-flip-h" />
          </button>
        </div>

        {/* Tab switcher: Layers / Components / Assets */}
        <div className="figma-subnav-tabs">
          <button
            type="button"
            className={`figma-subnav-btn ${activeTab === 'layers' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            <Layers size={13} />
            <span>Layers</span>
          </button>
          <button
            type="button"
            className={`figma-subnav-btn ${activeTab === 'components' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            <Boxes size={13} />
            <span>Components</span>
          </button>
          <button
            type="button"
            className={`figma-subnav-btn ${activeTab === 'assets' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <ImageIcon size={13} />
            <span>Assets</span>
          </button>
        </div>

        {/* TAB 1: LAYERS (Pages + Layer Tree) */}
        {activeTab === 'layers' && (
          <div className="figma-layers-container">
            {/* SECTION PAGES (Figma-style) */}
            <div className="figma-pages-section">
              <div className="figma-section-header">
                <button
                  type="button"
                  className="figma-section-title-btn"
                  onClick={() => setPagesSectionOpen((p) => !p)}
                >
                  {pagesSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>Pages</span>
                </button>
                <div className="figma-section-actions">
                  <button
                    type="button"
                    className="figma-icon-btn"
                    title="Rechercher une page"
                    onClick={() => setPageSearchOpen((p) => !p)}
                  >
                    <Search size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-icon-btn"
                    title="Ajouter une page"
                    onClick={() => createPage()}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {pageSearchOpen && (
                <div className="figma-page-search-bar">
                  <input
                    type="search"
                    className="figma-compact-input"
                    placeholder="Filtrer les pages..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                  />
                </div>
              )}

              {pagesSectionOpen && (
                <ul className="figma-pages-list">
                  {filteredPages.map((page) => {
                    const isCurrent = page.id === activePageId;
                    const isRenaming = editingPageId === page.id;

                    return (
                      <li
                        key={page.id}
                        className={`figma-page-item ${isCurrent ? 'is-active' : ''}`}
                      >
                        {isRenaming ? (
                          <input
                            autoFocus
                            className="figma-layer-rename-input"
                            value={editingPageTitle}
                            onChange={(e) => setEditingPageTitle(e.target.value)}
                            onBlur={() => {
                              renamePage(page.id, editingPageTitle);
                              setEditingPageId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renamePage(page.id, editingPageTitle);
                                setEditingPageId(null);
                              } else if (e.key === 'Escape') {
                                setEditingPageId(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className="figma-page-btn"
                            onClick={() => switchPage(page.id)}
                            onDoubleClick={() => {
                              setEditingPageId(page.id);
                              setEditingPageTitle(page.metadata.title);
                            }}
                          >
                            <FileText size={13} />
                            <span>{page.metadata.title}</span>
                          </button>
                        )}

                        <div className="figma-page-actions">
                          <button
                            type="button"
                            className="figma-layer-mini-btn"
                            title="Renommer"
                            onClick={() => {
                              setEditingPageId(page.id);
                              setEditingPageTitle(page.metadata.title);
                            }}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            className="figma-layer-mini-btn"
                            title="Dupliquer la page"
                            onClick={() => duplicatePage(page.id)}
                          >
                            <Copy size={11} />
                          </button>
                          {pages.length > 1 && (
                            <button
                              type="button"
                              className="figma-layer-mini-btn figma-danger-btn"
                              title="Supprimer la page"
                              onClick={() => deletePage(page.id)}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="figma-sidebar-divider" />

            {/* SECTION LAYERS TREE */}
            <div className="figma-tree-section">
              <div className="figma-section-header">
                <span className="figma-section-title">Layers</span>
              </div>

              <div className="figma-tree-scrollable">
                <ul className="figma-root-layer-list">
                  {document.sections.map((section) => (
                    <li key={section.id} className="figma-section-node-item">
                      <div className="figma-section-row">
                        <span className="figma-section-icon">
                          <Hash size={13} />
                        </span>
                        <strong className="figma-section-name">{section.name}</strong>
                        <div className="figma-layer-hover-actions">
                          <button
                            type="button"
                            className="figma-layer-mini-btn"
                            title={section.hidden ? 'Afficher' : 'Masquer'}
                            onClick={() => setSectionHidden(section.id, !section.hidden)}
                          >
                            {section.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            type="button"
                            className="figma-layer-mini-btn"
                            title={section.locked ? 'Déverrouiller' : 'Verrouiller'}
                            onClick={() => setSectionLocked(section.id, !section.locked)}
                          >
                            {section.locked ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                        </div>
                      </div>

                      {section.children.length > 0 && (
                        <ul className="figma-layer-children-list">
                          {section.children.map((child) => (
                            <LayerBranch
                              key={child.id}
                              node={child}
                              inheritedLocked={section.locked}
                              onSelect={selectNode}
                              onRename={updateNodeName}
                              onSetLocked={setNodeLocked}
                              onSetHidden={setNodeHidden}
                              onDuplicate={duplicateNode}
                              onDelete={deleteNode}
                              onMove={moveNode}
                              depth={0}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPONENTS (Bibliothèque) */}
        {activeTab === 'components' && (
          <div className="figma-components-container">
            <div className="figma-component-search-wrap">
              <Search size={13} />
              <input
                type="search"
                className="figma-compact-input"
                placeholder="Rechercher des composants..."
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
              />
            </div>

            <div className="figma-components-grid">
              {filteredComponents.map((component) => (
                <button
                  key={component.type}
                  type="button"
                  className="figma-component-card"
                  title={component.description}
                  onClick={() => addComponent(component.type)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-dsk-component', component.type);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <span className="figma-component-card-icon">
                    {getNodeIcon(component.type)}
                  </span>
                  <div className="figma-component-card-info">
                    <strong>{component.label}</strong>
                    <small>{component.description}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ASSETS */}
        {activeTab === 'assets' && (
          <div className="figma-assets-container">
            <p className="figma-empty-note">
              Ressources et images intégrées dans le projet actif.
            </p>
          </div>
        )}
      </aside>
    );
  }
);
