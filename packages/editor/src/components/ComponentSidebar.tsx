import React, { useMemo, useState } from 'react';
import type { ComponentNode, PageDocument, SectionNode } from '@dsk/core';
import { AVAILABLE_COMPONENTS } from '../constants';
import { getDefaultComponent } from '../constants';
import { useEditorStore } from '../store';
import { SECTION_PRESETS } from '@dsk/templates';

type SidebarTab = 'pages' | 'layers' | 'assets' | 'components';
type DropPosition = 'before' | 'after' | 'inside';

function nodeLabel(node: ComponentNode): string {
  const definition = getDefaultComponent(node.type);
  const value = node.props.text ?? node.props.content ?? node.props.label ?? node.props.src;
  const detail = typeof value === 'string' && value.trim() ? ` — ${value.trim().slice(0, 24)}` : '';
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
  const skipRenameBlur = React.useRef(false);

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
      className={`layer-item${effectivelyLocked ? ' is-locked' : ''}`}
      style={{ '--layer-depth': depth } as React.CSSProperties}
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
      <div className={`layer-row${selected ? ' is-selected' : ''}`}>
        <button
          type="button"
          className="layer-disclosure"
          aria-label={`${expanded ? 'Réduire' : 'Développer'} ${nodeLabel(node)}`}
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={!hasChildren}
          onClick={() => setExpanded((current) => !current)}
        >
          {hasChildren ? (expanded ? '⌄' : '›') : '·'}
        </button>
        {renaming ? (
          <input
            autoFocus
            className="layer-rename-input"
            aria-label={`Nom du calque ${nodeLabel(node)}`}
            placeholder="Nom personnalisé"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={() => {
              if (skipRenameBlur.current) {
                skipRenameBlur.current = false;
                return;
              }
              commitName();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitName();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                skipRenameBlur.current = true;
                event.currentTarget.blur();
                setDraftName(node.name ?? '');
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={`layer-select${selected ? ' is-selected' : ''}${node.hidden ? ' is-hidden' : ''}`}
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(node.id)}
            draggable={!effectivelyLocked}
            onDragStart={(event) => {
              if (effectivelyLocked) return;
              event.stopPropagation();
              event.dataTransfer.setData('application/x-dsk-node', node.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
            title={nodeLabel(node)}
          >
            <span className="layer-type-mark" aria-hidden="true">
              {definition?.icon ?? definition?.label.slice(0, 1) ?? '?'}
            </span>
            <span className="layer-name">{nodeLabel(node)}</span>
          </button>
        )}
        <div className="layer-actions" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label={node.hidden ? `Afficher ${nodeLabel(node)}` : `Masquer ${nodeLabel(node)}`}
            aria-pressed={node.hidden}
            title={node.hidden ? 'Afficher' : 'Masquer'}
            disabled={inheritedLocked}
            onClick={() => onSetHidden(node.id, !node.hidden)}
          >
            {node.hidden ? '◉' : '◌'}
          </button>
          <button
            type="button"
            aria-label={
              node.locked ? `Déverrouiller ${nodeLabel(node)}` : `Verrouiller ${nodeLabel(node)}`
            }
            aria-pressed={node.locked}
            title={node.locked ? 'Déverrouiller' : 'Verrouiller'}
            disabled={inheritedLocked}
            onClick={() => onSetLocked(node.id, !node.locked)}
          >
            {node.locked ? '▣' : '▢'}
          </button>
          <button
            type="button"
            aria-label={`Renommer ${nodeLabel(node)}`}
            title="Renommer"
            disabled={effectivelyLocked}
            onClick={() => {
              onSelect(node.id);
              setDraftName(node.name ?? '');
              setRenaming(true);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            aria-label={`Dupliquer ${nodeLabel(node)}`}
            title="Dupliquer"
            disabled={effectivelyLocked}
            onClick={() => onDuplicate(node.id)}
          >
            ⧉
          </button>
          <button
            type="button"
            aria-label={`Supprimer ${nodeLabel(node)}`}
            title="Supprimer"
            disabled={effectivelyLocked}
            onClick={() => onDelete(node.id)}
          >
            ×
          </button>
        </div>
      </div>
      {hasChildren && expanded ? (
        <ul className="layer-children">
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
      ) : null}
    </li>
  );
});

export const ComponentSidebar = React.memo(
  ({
    collapsed = false,
    onToggleCollapsed,
    onRenameDocument,
  }: {
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
    onRenameDocument?: () => void;
  }) => {
    const addComponent = useEditorStore((state) => state.addComponent);
    const addSection = useEditorStore((state) => state.addSection);
    const document = useEditorStore((state) => state.document);
    const selectNode = useEditorStore((state) => state.selectNode);
    const updateNodeName = useEditorStore((state) => state.updateNodeName);
    const setNodeLocked = useEditorStore((state) => state.setNodeLocked);
    const setNodeHidden = useEditorStore((state) => state.setNodeHidden);
    const updateSectionName = useEditorStore((state) => state.updateSectionName);
    const setSectionLocked = useEditorStore((state) => state.setSectionLocked);
    const setSectionHidden = useEditorStore((state) => state.setSectionHidden);
    const duplicateNode = useEditorStore((state) => state.duplicateNode);
    const deleteNode = useEditorStore((state) => state.deleteNode);
    const moveNode = useEditorStore((state) => state.moveNode);
    const [activeTab, setActiveTab] = useState<SidebarTab>('components');
    const [search, setSearch] = useState('');
    const imageAssets = useMemo(() => collectImageAssets(document), [document]);
    const components = useMemo(() => {
      const query = search.trim().toLocaleLowerCase();
      return AVAILABLE_COMPONENTS.filter(
        (component) =>
          !query ||
          component.label.toLocaleLowerCase().includes(query) ||
          component.description.toLocaleLowerCase().includes(query) ||
          component.category.toLocaleLowerCase().includes(query),
      );
    }, [search]);

    if (collapsed) {
      return (
        <aside className="editor-sidebar is-collapsed" aria-label="Bibliothèque et calques">
          <button
            type="button"
            className="panel-expand-button"
            aria-label="Développer le panneau Bibliothèque et calques"
            title="Développer le panneau"
            onClick={onToggleCollapsed}
          >
            ›
          </button>
        </aside>
      );
    }

    return (
      <aside className="editor-sidebar" aria-label="Bibliothèque et calques" id="editor-left-panel">
        <div className="panel-control-row">
          <span className="panel-eyebrow">ESPACE DE TRAVAIL</span>
          <button
            type="button"
            className="panel-collapse-button"
            aria-label="Réduire le panneau Bibliothèque et calques"
            title="Réduire le panneau"
            onClick={onToggleCollapsed}
          >
            ‹
          </button>
        </div>
        <div className="sidebar-tabs" role="tablist" aria-label="Espaces du projet">
          {(
            [
              ['pages', 'Pages', 'P'],
              ['layers', 'Layers', 'L'],
              ['assets', 'Assets', 'A'],
              ['components', 'Components', 'C'],
            ] as const
          ).map(([tab, label, icon]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-${tab}`}
              aria-controls={`panel-${tab}`}
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              <span className="sidebar-tab-icon" aria-hidden="true">
                {icon}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {activeTab === 'pages' ? (
          <section id="panel-pages" role="tabpanel" aria-labelledby="tab-pages">
            <div className="sidebar-heading">
              <span className="panel-eyebrow">DOCUMENT</span>
              <h2>Pages</h2>
              <p>Page active de ce document.</p>
            </div>
            <div className="pages-list" role="list" aria-label="Pages du document">
              <div className="page-entry is-current" role="listitem" aria-current="page">
                <span className="page-entry-icon" aria-hidden="true">
                  ▤
                </span>
                <span className="page-entry-details">
                  <strong>{document.metadata.title}</strong>
                  <small>{document.metadata.slug}</small>
                </span>
                <button
                  type="button"
                  aria-label={`Renommer ${document.metadata.title}`}
                  title="Renommer la page"
                  onClick={onRenameDocument}
                >
                  ✎
                </button>
              </div>
            </div>
            <p className="workspace-note">
              Le modèle actuel gère une page par document. Ajouter, dupliquer, supprimer et naviguer
              entre plusieurs pages ne sont pas encore pris en charge.
            </p>
          </section>
        ) : activeTab === 'layers' ? (
          <section id="panel-layers" role="tabpanel" aria-labelledby="tab-layers">
            <div className="sidebar-heading">
              <span className="panel-eyebrow">DOCUMENT</span>
              <h2>Layers</h2>
              <p>Structure réelle du document.</p>
            </div>
            <LayerTree
              document={document}
              onSelect={selectNode}
              onRename={updateNodeName}
              onSetLocked={setNodeLocked}
              onSetHidden={setNodeHidden}
              onRenameSection={updateSectionName}
              onSetSectionLocked={setSectionLocked}
              onSetSectionHidden={setSectionHidden}
              onDuplicate={duplicateNode}
              onDelete={deleteNode}
              onMove={moveNode}
            />
          </section>
        ) : activeTab === 'assets' ? (
          <section id="panel-assets" role="tabpanel" aria-labelledby="tab-assets">
            <div className="sidebar-heading">
              <span className="panel-eyebrow">PROJECT RESOURCES</span>
              <h2>Assets</h2>
              <p>Ressources réellement référencées dans cette page.</p>
            </div>
            {imageAssets.length > 0 ? (
              <ul className="asset-list">
                {imageAssets.map((asset) => (
                  <li key={asset.src}>
                    <button
                      type="button"
                      className="asset-entry"
                      title={asset.src}
                      onClick={() => selectNode(asset.nodeIds[0] ?? null)}
                    >
                      <span className="asset-icon" aria-hidden="true">
                        IMG
                      </span>
                      <span className="asset-details">
                        <strong>{asset.src}</strong>
                        <small>
                          Image · {asset.nodeIds.length} référence
                          {asset.nodeIds.length > 1 ? 's' : ''}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-empty">Aucune image n’est référencée dans ce document.</p>
            )}
            <p className="workspace-note">
              L’import et la bibliothèque partagée de ressources ne sont pas disponibles dans le
              modèle actuel. Aucune importation n’est simulée.
            </p>
          </section>
        ) : (
          <section id="panel-components" role="tabpanel" aria-labelledby="tab-components">
            <div className="sidebar-heading">
              <span className="panel-eyebrow">LIBRARY</span>
              <h2>Components</h2>
              <p>Ajoutez des composants et sections disponibles.</p>
            </div>
            <label className="component-search">
              <span className="visually-hidden">Rechercher un composant</span>
              <input
                type="search"
                value={search}
                placeholder="Rechercher..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {(['layout', 'basic', 'ecommerce', 'section', 'custom'] as const).map((category) => {
              const categoryComponents = components.filter(
                (component) => component.category === category,
              );
              if (categoryComponents.length === 0) return null;
              return (
                <section className="component-category" key={category}>
                  <details open={category === 'layout' || Boolean(search)}>
                    <summary>
                      <span>{categoryLabel(category)}</span>
                      <small>{categoryComponents.length}</small>
                    </summary>
                    <ul>
                      {categoryComponents.map((component) => (
                        <li key={component.type}>
                          <button
                            className="component-add"
                            type="button"
                            aria-label={`Ajouter ${component.label}`}
                            title={component.description}
                            onClick={() => addComponent(component.type)}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                'application/x-dsk-component',
                                component.type,
                              );
                              event.dataTransfer.effectAllowed = 'copy';
                            }}
                          >
                            <span className="component-icon" aria-hidden="true">
                              {component.icon ?? component.label.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="component-copy">
                              <span className="component-label">{component.label}</span>
                              <small>{component.description}</small>
                            </span>
                            <span className="component-add-mark" aria-hidden="true">
                              +
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                </section>
              );
            })}
            {components.length === 0 ? (
              <p className="panel-empty">Aucun composant trouvé.</p>
            ) : null}
            <details className="component-category section-library">
              <summary>
                <span>Sections préconstruites</span>
                <small>{SECTION_PRESETS.length}</small>
              </summary>
              <p className="section-library-description">
                Blocs réutilisables, séparés de la bibliothèque de composants.
              </p>
              <ul className="section-preset-list">
                {SECTION_PRESETS.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      className="section-preset"
                      aria-label={`Ajouter la section ${preset.name}`}
                      onClick={() => addSection(preset)}
                    >
                      <span
                        className={`section-preset-preview section-preset-${preset.id}`}
                        aria-hidden="true"
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <strong>{preset.name}</strong>
                      <small>{preset.description}</small>
                      <span className="component-add-mark" aria-hidden="true">
                        +
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}
      </aside>
    );
  },
);

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    layout: 'Layout',
    basic: 'Basic',
    ecommerce: 'E-commerce',
    section: 'Sections',
    custom: 'Custom',
  };
  return labels[category] ?? category;
}

interface ImageAssetReference {
  src: string;
  nodeIds: string[];
}

function collectImageAssets(document: PageDocument): ImageAssetReference[] {
  const assets = new Map<string, string[]>();
  const visit = (nodes: ComponentNode[]) => {
    for (const node of nodes) {
      const source = node.type === 'core/image' ? node.props.src : undefined;
      if (typeof source === 'string' && source.trim()) {
        const nodeIds = assets.get(source) ?? [];
        nodeIds.push(node.id);
        assets.set(source, nodeIds);
      }
      visit(node.children);
    }
  };
  document.sections.forEach((section) => visit(section.children));
  return Array.from(assets, ([src, nodeIds]) => ({ src, nodeIds }));
}

function LayerTree({
  document,
  onSelect,
  onRename,
  onSetLocked,
  onSetHidden,
  onRenameSection,
  onSetSectionLocked,
  onSetSectionHidden,
  onDuplicate,
  onDelete,
  onMove,
}: {
  document: PageDocument;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
  onSetLocked: (id: string, locked: boolean) => boolean;
  onSetHidden: (id: string, hidden: boolean) => boolean;
  onRenameSection: (id: string, name: string) => boolean;
  onSetSectionLocked: (id: string, locked: boolean) => boolean;
  onSetSectionHidden: (id: string, hidden: boolean) => boolean;
  onDuplicate: (id: string) => boolean;
  onDelete: (id: string) => boolean;
  onMove: (id: string, targetId: string, position: DropPosition) => boolean;
}) {
  return (
    <ul className="layer-tree">
      {document.sections.map((section) => (
        <li
          key={section.id}
          className={`layer-section${section.hidden ? ' is-hidden' : ''}${section.locked ? ' is-locked' : ''}`}
        >
          <LayerSectionHeader
            section={section}
            onRename={onRenameSection}
            onSetLocked={onSetSectionLocked}
            onSetHidden={onSetSectionHidden}
          />
          <ul className="layer-section-children">
            {section.children.map((node) => (
              <LayerBranch
                key={node.id}
                node={node}
                inheritedLocked={section.locked}
                onSelect={onSelect}
                onRename={onRename}
                onSetLocked={onSetLocked}
                onSetHidden={onSetHidden}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function LayerSectionHeader({
  section,
  onRename,
  onSetLocked,
  onSetHidden,
}: {
  section: SectionNode;
  onRename: (id: string, name: string) => boolean;
  onSetLocked: (id: string, locked: boolean) => boolean;
  onSetHidden: (id: string, hidden: boolean) => boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(section.name);
  const skipRenameBlur = React.useRef(false);

  return (
    <div className="layer-section-header">
      <span className="layer-section-mark" aria-hidden="true">
        ▤
      </span>
      {renaming ? (
        <input
          autoFocus
          className="layer-rename-input"
          aria-label={`Nom de la section ${section.name}`}
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => {
            if (skipRenameBlur.current) {
              skipRenameBlur.current = false;
              return;
            }
            if (onRename(section.id, draftName)) setRenaming(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (onRename(section.id, draftName)) setRenaming(false);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              skipRenameBlur.current = true;
              event.currentTarget.blur();
              setDraftName(section.name);
              setRenaming(false);
            }
          }}
        />
      ) : (
        <strong className="layer-section-title">{section.name}</strong>
      )}
      <div className="layer-actions">
        <button
          type="button"
          aria-label={section.hidden ? `Afficher ${section.name}` : `Masquer ${section.name}`}
          aria-pressed={section.hidden}
          title={section.hidden ? 'Afficher' : 'Masquer'}
          onClick={() => onSetHidden(section.id, !section.hidden)}
        >
          {section.hidden ? '◉' : '◌'}
        </button>
        <button
          type="button"
          aria-label={
            section.locked ? `Déverrouiller ${section.name}` : `Verrouiller ${section.name}`
          }
          aria-pressed={section.locked}
          title={section.locked ? 'Déverrouiller' : 'Verrouiller'}
          onClick={() => onSetLocked(section.id, !section.locked)}
        >
          {section.locked ? '▣' : '▢'}
        </button>
        <button
          type="button"
          aria-label={`Renommer ${section.name}`}
          title="Renommer"
          disabled={section.locked}
          onClick={() => {
            setDraftName(section.name);
            setRenaming(true);
          }}
        >
          ✎
        </button>
      </div>
    </div>
  );
}
