import React, { useMemo, useState } from 'react';
import type { ComponentNode, PageDocument } from '@dsk/core';
import { AVAILABLE_COMPONENTS } from '../constants';
import { getDefaultComponent } from '../constants';
import { useEditorStore } from '../store';
import { SECTION_PRESETS } from '@dsk/templates';

type SidebarTab = 'components' | 'sections' | 'layers';

function nodeLabel(node: ComponentNode): string {
  const definition = getDefaultComponent(node.type);
  const value = node.props.text ?? node.props.content ?? node.props.label ?? node.props.src;
  const detail = typeof value === 'string' && value.trim() ? ` — ${value.trim().slice(0, 24)}` : '';
  return `${definition?.label ?? node.type}${detail}`;
}

function LayerBranch({
  node,
  selectedNodeId,
  onSelect,
  depth = 0,
}: {
  node: ComponentNode;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const definition = getDefaultComponent(node.type);
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const draggableProps = {
    draggable: true,
    onDragStart: (event: React.DragEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.dataTransfer.setData('application/x-dsk-node', node.id);
      event.dataTransfer.effectAllowed = 'move';
    },
  };

  return (
    <li className="layer-item" style={{ '--layer-depth': depth } as React.CSSProperties}>
      {definition?.canHaveChildren ? (
        <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
          <summary
            className={`layer-select${selectedNodeId === node.id ? ' is-selected' : ''}`}
            aria-current={selectedNodeId === node.id ? 'true' : undefined}
            onClick={() => onSelect(node.id)}
            {...draggableProps}
          >
            <span className="layer-type-mark" aria-hidden="true">
              {definition.label.slice(0, 1)}
            </span>
            <span className="layer-name">{nodeLabel(node)}</span>
          </summary>
          {hasChildren ? (
            <ul className="layer-children">
              {node.children.map((child) => (
                <LayerBranch
                  key={child.id}
                  node={child}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              ))}
            </ul>
          ) : (
            <p className="layer-empty">Empty</p>
          )}
        </details>
      ) : (
        <button
          type="button"
          className={`layer-select${selectedNodeId === node.id ? ' is-selected' : ''}`}
          aria-current={selectedNodeId === node.id ? 'true' : undefined}
          onClick={() => onSelect(node.id)}
          {...draggableProps}
        >
          <span className="layer-type-mark" aria-hidden="true">
            {definition?.label.slice(0, 1) ?? '?'}
          </span>
          <span className="layer-name">{nodeLabel(node)}</span>
        </button>
      )}
    </li>
  );
}

export const ComponentSidebar: React.FC = () => {
  const addComponent = useEditorStore((state) => state.addComponent);
  const addSection = useEditorStore((state) => state.addSection);
  const document = useEditorStore((state) => state.document);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);
  const [activeTab, setActiveTab] = useState<SidebarTab>('components');
  const [search, setSearch] = useState('');
  const components = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return AVAILABLE_COMPONENTS.filter(
      (component) =>
        !query ||
        component.label.toLocaleLowerCase().includes(query) ||
        component.category.toLocaleLowerCase().includes(query),
    );
  }, [search]);

  return (
    <aside className="editor-sidebar" aria-label="Bibliothèque et calques">
      <div className="sidebar-tabs" role="tablist" aria-label="Panneau latéral">
        <button
          type="button"
          role="tab"
          id="tab-components"
          aria-selected={activeTab === 'components'}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button
          type="button"
          role="tab"
          id="tab-sections"
          aria-selected={activeTab === 'sections'}
          onClick={() => setActiveTab('sections')}
        >
          Sections
        </button>
        <button
          type="button"
          role="tab"
          id="tab-layers"
          aria-selected={activeTab === 'layers'}
          onClick={() => setActiveTab('layers')}
        >
          Layers
        </button>
      </div>
      {activeTab === 'components' ? (
        <section role="tabpanel" aria-labelledby="tab-components">
          <div className="sidebar-heading">
            <span className="panel-eyebrow">LIBRARY</span>
            <h2>Components</h2>
            <p>Ajoutez un élément à la page.</p>
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
          {(['layout', 'basic'] as const).map((category) => {
            const categoryComponents = components.filter(
              (component) => component.category === category,
            );
            if (categoryComponents.length === 0) return null;
            return (
              <section className="component-category" key={category}>
                <h3>{category === 'layout' ? 'Layout' : 'Basic'}</h3>
                <ul>
                  {categoryComponents.map((component) => (
                    <li key={component.type}>
                      <button
                        className="component-add"
                        type="button"
                        aria-label={`Ajouter ${component.label}`}
                        onClick={() => addComponent(component.type)}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/x-dsk-component', component.type);
                          event.dataTransfer.effectAllowed = 'copy';
                        }}
                      >
                        <span className="component-icon" aria-hidden="true">
                          {component.label.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="component-label">{component.label}</span>
                        <span className="component-add-mark" aria-hidden="true">
                          +
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {components.length === 0 ? <p className="panel-empty">Aucun composant trouvé.</p> : null}
        </section>
      ) : activeTab === 'sections' ? (
        <section role="tabpanel" aria-labelledby="tab-sections">
          <div className="sidebar-heading">
            <span className="panel-eyebrow">STARTER BLOCKS</span>
            <h2>Sections</h2>
            <p>Ajoutez des structures prêtes à personnaliser.</p>
          </div>
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
        </section>
      ) : (
        <section role="tabpanel" aria-labelledby="tab-layers">
          <div className="sidebar-heading">
            <span className="panel-eyebrow">DOCUMENT</span>
            <h2>Layers</h2>
            <p>Structure réelle du document.</p>
          </div>
          <LayerTree document={document} selectedNodeId={selectedNodeId} onSelect={selectNode} />
        </section>
      )}
    </aside>
  );
};

function LayerTree({
  document,
  selectedNodeId,
  onSelect,
}: {
  document: PageDocument;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="layer-tree">
      {document.sections.map((section) => (
        <li key={section.id} className="layer-section">
          <div className="layer-section-title">{section.name}</div>
          <ul>
            {section.children.map((node) => (
              <LayerBranch
                key={node.id}
                node={node}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
