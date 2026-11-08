import React, { useState } from 'react';
import type { ComponentNode, ElementStyles } from '@dsk/core';
import { useEditorConfiguration, useEditorStoreInstance } from '../EditorStoreContext';
import { isNodeEffectivelyLocked } from '../store';
import { FillEditor } from './ui/FillEditor';
import { SpacingBox } from './ui/SpacingBox';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
} from 'lucide-react';

function findNode(nodes: ComponentNode[], nodeId: string): ComponentNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const childMatch = findNode(node.children, nodeId);
    if (childMatch) return childMatch;
  }
  return undefined;
}

function parsePx(val?: string): string {
  if (!val) return '';
  const num = val.replace(/px$/, '').trim();
  return isNaN(Number(num)) ? '' : num;
}

export const PropertyPanel = React.memo(
  ({
    collapsed = false,
    onToggleCollapsed,
    selectedNodeId: controlledSelectedNodeId,
  }: {
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
    selectedNodeId?: string | null;
  }) => {
    const { registry } = useEditorConfiguration();
    const document = useEditorStoreInstance((state) => state.document);
    const storeSelectedNodeId = useEditorStoreInstance((state) => state.selectedNodeId);
    const selectedNodeId =
      controlledSelectedNodeId !== undefined ? controlledSelectedNodeId : storeSelectedNodeId;
    const updateNodeProps = useEditorStoreInstance((state) => state.updateNodeProps);
    const updateNodeStyles = useEditorStoreInstance((state) => state.updateNodeStyles);
    const viewport = useEditorStoreInstance((state) => state.viewport);
    const [inspectorTab, setInspectorTab] = useState<'design' | 'prototype'>('design');

    // Section collapse states
    const [openSections, setOpenSections] = useState({
      position: true,
      layout: true,
      typography: true,
      appearance: true,
      fill: true,
      stroke: true,
      effects: false,
      props: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
      setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const selectedNode = selectedNodeId
      ? document.sections
          .map((section) => findNode(section.children, selectedNodeId))
          .find((node) => node !== undefined)
      : undefined;

    const definition = selectedNode ? registry.definitions.get(selectedNode.type) : undefined;
    const selectedNodeLocked = selectedNode
      ? isNodeEffectivelyLocked(document, selectedNode.id)
      : false;

    if (collapsed) {
      return (
        <aside className="editor-properties is-collapsed" aria-label="Inspecteur">
          <button
            type="button"
            className="panel-expand-button"
            aria-label="Développer l’inspecteur"
            title="Développer l’inspecteur"
            onClick={onToggleCollapsed}
          >
            ‹
          </button>
        </aside>
      );
    }

    if (!selectedNode) {
      return (
        <aside
          className="editor-properties figma-properties"
          aria-label="Panneau de propriétés"
          id="editor-right-panel"
        >
          <div className="figma-inspector-tabs">
            <button
              type="button"
              className={`figma-tab-btn ${inspectorTab === 'design' ? 'is-active' : ''}`}
              onClick={() => setInspectorTab('design')}
            >
              Design
            </button>
            <button
              type="button"
              className={`figma-tab-btn ${inspectorTab === 'prototype' ? 'is-active' : ''}`}
              onClick={() => setInspectorTab('prototype')}
            >
              Prototype
            </button>
          </div>
          <div className="figma-empty-inspector">
            <div className="figma-empty-icon">
              <Layers size={28} />
            </div>
            <strong>Aucun élément sélectionné</strong>
            <p>
              Sélectionnez un composant sur le canvas ou dans les calques pour inspecter et modifier
              ses propriétés.
            </p>
          </div>
        </aside>
      );
    }

    const currentStyles: ElementStyles = selectedNode.styles[viewport] ?? {};

    const isTextComponent =
      selectedNode.type === 'core/heading' ||
      selectedNode.type === 'core/text' ||
      selectedNode.type === 'core/button' ||
      Boolean(selectedNode.props.text || selectedNode.props.content || selectedNode.props.label);

    const isLayoutComponent =
      selectedNode.type === 'core/container' ||
      selectedNode.type === 'core/grid' ||
      Boolean(definition?.canHaveChildren);

    const showAutoLayout = Boolean(
      isLayoutComponent ||
      currentStyles.display ||
      currentStyles.flexDirection ||
      currentStyles.gridTemplateColumns ||
      currentStyles.gap,
    );

    const showAppearance = Boolean(
      !isTextComponent ||
      currentStyles.opacity !== undefined ||
      currentStyles.borderRadius !== undefined ||
      currentStyles.boxShadow ||
      currentStyles.display,
    );

    const showFill = Boolean(
      !isTextComponent ||
      currentStyles.backgroundColor ||
      currentStyles.backgroundImage ||
      selectedNode.type === 'core/button' ||
      selectedNode.type === 'core/container' ||
      selectedNode.type === 'core/grid',
    );

    const showStroke = Boolean(
      !isTextComponent ||
      currentStyles.borderColor ||
      currentStyles.borderWidth ||
      currentStyles.borderStyle,
    );

    const handleStyleChange = (patch: Partial<ElementStyles>) => {
      updateNodeStyles(selectedNode.id, viewport, patch);
    };

    const hasSpecificProps = definition && Object.keys(definition.controls).length > 0;

    return (
      <aside
        className="editor-properties figma-properties"
        aria-label="Panneau de propriétés"
        id="editor-right-panel"
      >
        {/* Top Header / Tabs */}
        <div className="figma-inspector-header">
          <div className="figma-inspector-tabs">
            <button
              type="button"
              className={`figma-tab-btn ${inspectorTab === 'design' ? 'is-active' : ''}`}
              onClick={() => setInspectorTab('design')}
            >
              Design
            </button>
            <button
              type="button"
              className={`figma-tab-btn ${inspectorTab === 'prototype' ? 'is-active' : ''}`}
              onClick={() => setInspectorTab('prototype')}
            >
              Prototype
            </button>
          </div>
          <button
            type="button"
            className="figma-icon-btn"
            title="Réduire l'inspecteur"
            aria-label="Réduire l'inspecteur"
            onClick={onToggleCollapsed}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Selected Component Header */}
        <div className="figma-node-header">
          <div className="figma-node-badge">
            <Box size={14} />
            <strong>{selectedNode.name || definition?.label || selectedNode.type}</strong>
          </div>
          <span className="figma-node-id">{selectedNode.id}</span>
        </div>

        {selectedNodeLocked && (
          <div className="figma-locked-banner" role="status">
            Élément verrouillé. Déverrouillez-le pour modifier ses propriétés.
          </div>
        )}

        <fieldset className="figma-controls-fieldset" disabled={selectedNodeLocked}>
          {/* SECTION 1: POSITION & DIMENSIONS */}
          <div className="figma-section-group">
            <button
              type="button"
              className="figma-accordion-header"
              onClick={() => toggleSection('position')}
            >
              <div className="figma-accordion-title">
                {openSections.position ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span>Position</span>
              </div>
            </button>

            {openSections.position && (
              <div className="figma-accordion-body">
                {/* 6 Alignment quick buttons */}
                <div className="figma-align-toolbar">
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Aligner à gauche"
                    onClick={() => handleStyleChange({ marginLeft: '0px', marginRight: 'auto' })}
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Centrer horizontalement"
                    onClick={() => handleStyleChange({ marginLeft: 'auto', marginRight: 'auto' })}
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Aligner à droite"
                    onClick={() => handleStyleChange({ marginLeft: 'auto', marginRight: '0px' })}
                  >
                    <AlignRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Aligner en haut"
                    onClick={() => handleStyleChange({ marginTop: '0px', marginBottom: 'auto' })}
                  >
                    <AlignVerticalJustifyStart size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Centrer verticalement"
                    onClick={() => handleStyleChange({ marginTop: 'auto', marginBottom: 'auto' })}
                  >
                    <AlignVerticalJustifyCenter size={13} />
                  </button>
                  <button
                    type="button"
                    className="figma-align-btn"
                    title="Aligner en bas"
                    onClick={() => handleStyleChange({ marginTop: 'auto', marginBottom: '0px' })}
                  >
                    <AlignVerticalJustifyEnd size={13} />
                  </button>
                </div>

                {/* Dimensions grid: W and H */}
                <div className="figma-fields-grid-2">
                  <div className="figma-field-compact">
                    <span className="figma-field-label">W</span>
                    <input
                      type="text"
                      className="figma-compact-input"
                      placeholder="Auto"
                      value={currentStyles.width ?? ''}
                      onChange={(e) =>
                        handleStyleChange({ width: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                  <div className="figma-field-compact">
                    <span className="figma-field-label">H</span>
                    <input
                      type="text"
                      className="figma-compact-input"
                      placeholder="Auto"
                      value={currentStyles.height ?? ''}
                      onChange={(e) =>
                        handleStyleChange({ height: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                </div>

                {/* Min / Max bounds */}
                <div className="figma-fields-grid-2">
                  <div className="figma-field-compact">
                    <span className="figma-field-label">Min W</span>
                    <input
                      type="text"
                      className="figma-compact-input"
                      placeholder="None"
                      value={currentStyles.minWidth ?? ''}
                      onChange={(e) =>
                        handleStyleChange({ minWidth: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                  <div className="figma-field-compact">
                    <span className="figma-field-label">Max W</span>
                    <input
                      type="text"
                      className="figma-compact-input"
                      placeholder="None"
                      value={currentStyles.maxWidth ?? ''}
                      onChange={(e) =>
                        handleStyleChange({ maxWidth: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: AUTO LAYOUT (Flex & Grid) */}
          {showAutoLayout && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('layout')}
              >
                <div className="figma-accordion-title">
                  {openSections.layout ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Auto Layout</span>
                </div>
              </button>

              {openSections.layout && (
                <div className="figma-accordion-body">
                  {/* Direction buttons */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Direction</span>
                    <div className="figma-button-toggle-group">
                      <button
                        type="button"
                        className={`figma-toggle-btn ${currentStyles.flexDirection === 'row' ? 'is-active' : ''}`}
                        title="Horizontal"
                        onClick={() =>
                          handleStyleChange({
                            display: 'flex',
                            flexDirection: 'row',
                          })
                        }
                      >
                        <ArrowRight size={13} />
                        <span>Horiz</span>
                      </button>
                      <button
                        type="button"
                        className={`figma-toggle-btn ${currentStyles.flexDirection === 'column' ? 'is-active' : ''}`}
                        title="Vertical"
                        onClick={() =>
                          handleStyleChange({
                            display: 'flex',
                            flexDirection: 'column',
                          })
                        }
                      >
                        <ArrowDown size={13} />
                        <span>Vert</span>
                      </button>
                    </div>
                  </div>

                  {/* Alignment & Justify */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Aligner</span>
                    <select
                      className="figma-select"
                      value={currentStyles.alignItems ?? 'stretch'}
                      onChange={(e) =>
                        handleStyleChange({
                          alignItems: e.target.value as ElementStyles['alignItems'],
                        })
                      }
                    >
                      <option value="stretch">Étirer (Stretch)</option>
                      <option value="flex-start">Début (Start)</option>
                      <option value="center">Centré (Center)</option>
                      <option value="flex-end">Fin (End)</option>
                    </select>
                  </div>

                  <div className="figma-control-row">
                    <span className="figma-control-label">Distribuer</span>
                    <select
                      className="figma-select"
                      value={currentStyles.justifyContent ?? 'flex-start'}
                      onChange={(e) =>
                        handleStyleChange({
                          justifyContent: e.target.value as ElementStyles['justifyContent'],
                        })
                      }
                    >
                      <option value="flex-start">Au début</option>
                      <option value="center">Au centre</option>
                      <option value="flex-end">À la fin</option>
                      <option value="space-between">Espacer (Between)</option>
                      <option value="space-around">Autour (Around)</option>
                    </select>
                  </div>

                  {/* Gap */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Gap</span>
                    <div className="figma-unit-input-wrap">
                      <input
                        type="number"
                        className="figma-compact-input"
                        placeholder="0"
                        value={parsePx(currentStyles.gap)}
                        onChange={(e) =>
                          handleStyleChange({
                            gap: e.target.value ? `${e.target.value}px` : undefined,
                          })
                        }
                      />
                      <span className="figma-unit">px</span>
                    </div>
                  </div>

                  {/* Padding via SpacingBox */}
                  <SpacingBox
                    label="Padding"
                    top={currentStyles.paddingTop}
                    right={currentStyles.paddingRight}
                    bottom={currentStyles.paddingBottom}
                    left={currentStyles.paddingLeft}
                    onChange={(vals) =>
                      handleStyleChange({
                        paddingTop: vals.top,
                        paddingRight: vals.right,
                        paddingBottom: vals.bottom,
                        paddingLeft: vals.left,
                      })
                    }
                  />

                  {/* Margin via SpacingBox */}
                  <SpacingBox
                    label="Margin"
                    top={currentStyles.marginTop}
                    right={currentStyles.marginRight}
                    bottom={currentStyles.marginBottom}
                    left={currentStyles.marginLeft}
                    onChange={(vals) =>
                      handleStyleChange({
                        marginTop: vals.top,
                        marginRight: vals.right,
                        marginBottom: vals.bottom,
                        marginLeft: vals.left,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: TYPOGRAPHY (Contextuelle) */}
          {isTextComponent && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('typography')}
              >
                <div className="figma-accordion-title">
                  {openSections.typography ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Typography</span>
                </div>
              </button>

              {openSections.typography && (
                <div className="figma-accordion-body">
                  {/* Font Size & Weight */}
                  <div className="figma-fields-grid-2">
                    <div className="figma-field-compact">
                      <span className="figma-field-label">Taille</span>
                      <input
                        type="text"
                        className="figma-compact-input"
                        placeholder="16px"
                        value={currentStyles.fontSize ?? ''}
                        onChange={(e) =>
                          handleStyleChange({ fontSize: e.target.value.trim() || undefined })
                        }
                      />
                    </div>
                    <div className="figma-field-compact">
                      <span className="figma-field-label">Graisse</span>
                      <select
                        className="figma-compact-select"
                        value={currentStyles.fontWeight ?? 'normal'}
                        onChange={(e) =>
                          handleStyleChange({ fontWeight: e.target.value || undefined })
                        }
                      >
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semibold (600)</option>
                        <option value="700">Bold (700)</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Align buttons */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Alignement</span>
                    <div className="figma-button-toggle-group">
                      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          className={`figma-toggle-btn ${currentStyles.textAlign === align ? 'is-active' : ''}`}
                          title={`Aligner ${align}`}
                          onClick={() => handleStyleChange({ textAlign: align })}
                        >
                          {align === 'left' ? (
                            <AlignLeft size={13} />
                          ) : align === 'center' ? (
                            <AlignCenter size={13} />
                          ) : (
                            <AlignRight size={13} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Couleur texte</span>
                    <div className="figma-color-input-row">
                      <input
                        type="color"
                        className="figma-mini-color"
                        value={
                          typeof currentStyles.color === 'string' &&
                          /^#[0-9a-f]{6}$/i.test(currentStyles.color)
                            ? currentStyles.color
                            : '#172033'
                        }
                        onChange={(e) => handleStyleChange({ color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="figma-compact-input"
                        placeholder="#172033"
                        value={currentStyles.color ?? ''}
                        onChange={(e) =>
                          handleStyleChange({ color: e.target.value.trim() || undefined })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: APPEARANCE (Opacity & Corner Radius) */}
          {showAppearance && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('appearance')}
              >
                <div className="figma-accordion-title">
                  {openSections.appearance ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Appearance</span>
                </div>
              </button>

              {openSections.appearance && (
                <div className="figma-accordion-body">
                  {/* Opacity */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Opacité</span>
                    <div className="figma-slider-input-group">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        className="figma-range-slider"
                        value={currentStyles.opacity ?? 1}
                        onChange={(e) => handleStyleChange({ opacity: Number(e.target.value) })}
                      />
                      <span className="figma-slider-val">
                        {Math.round((currentStyles.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Corner Radius */}
                  <div className="figma-control-row">
                    <span className="figma-control-label">Rayon (Radius)</span>
                    <div className="figma-unit-input-wrap">
                      <input
                        type="number"
                        className="figma-compact-input"
                        placeholder="0"
                        value={parsePx(currentStyles.borderRadius)}
                        onChange={(e) =>
                          handleStyleChange({
                            borderRadius: e.target.value ? `${e.target.value}px` : undefined,
                          })
                        }
                      />
                      <span className="figma-unit">px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: FILL (Système de remplissage Figma) */}
          {showFill && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('fill')}
              >
                <div className="figma-accordion-title">
                  {openSections.fill ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Fill</span>
                </div>
              </button>

              {openSections.fill && (
                <div className="figma-accordion-body">
                  <FillEditor
                    styles={currentStyles}
                    onChange={handleStyleChange}
                    disabled={selectedNodeLocked}
                  />
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: STROKE (Contour / Bordure) */}
          {showStroke && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('stroke')}
              >
                <div className="figma-accordion-title">
                  {openSections.stroke ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Stroke</span>
                </div>
              </button>

              {openSections.stroke && (
                <div className="figma-accordion-body">
                  <div className="figma-control-row">
                    <span className="figma-control-label">Couleur</span>
                    <div className="figma-color-input-row">
                      <input
                        type="color"
                        className="figma-mini-color"
                        value={
                          typeof currentStyles.borderColor === 'string' &&
                          /^#[0-9a-f]{6}$/i.test(currentStyles.borderColor)
                            ? currentStyles.borderColor
                            : '#e2e8f0'
                        }
                        onChange={(e) => handleStyleChange({ borderColor: e.target.value })}
                      />
                      <input
                        type="text"
                        className="figma-compact-input"
                        placeholder="#E2E8F0"
                        value={currentStyles.borderColor ?? ''}
                        onChange={(e) =>
                          handleStyleChange({ borderColor: e.target.value.trim() || undefined })
                        }
                      />
                    </div>
                  </div>

                  <div className="figma-fields-grid-2">
                    <div className="figma-field-compact">
                      <span className="figma-field-label">Largeur</span>
                      <input
                        type="text"
                        className="figma-compact-input"
                        placeholder="0px"
                        value={currentStyles.borderWidth ?? ''}
                        onChange={(e) =>
                          handleStyleChange({ borderWidth: e.target.value.trim() || undefined })
                        }
                      />
                    </div>
                    <div className="figma-field-compact">
                      <span className="figma-field-label">Style</span>
                      <select
                        className="figma-compact-select"
                        value={currentStyles.borderStyle ?? 'solid'}
                        onChange={(e) =>
                          handleStyleChange({
                            borderStyle: e.target.value as ElementStyles['borderStyle'],
                          })
                        }
                      >
                        <option value="none">Aucun</option>
                        <option value="solid">Solide</option>
                        <option value="dashed">Tirets</option>
                        <option value="dotted">Points</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: COMPONENT SPECIFIC PROPS */}
          {hasSpecificProps && (
            <div className="figma-section-group">
              <button
                type="button"
                className="figma-accordion-header"
                onClick={() => toggleSection('props')}
              >
                <div className="figma-accordion-title">
                  {openSections.props ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>Propriétés du composant</span>
                </div>
              </button>

              {openSections.props && (
                <div className="figma-accordion-body">
                  {Object.entries(definition.controls).map(([name, control]) => (
                    <div className="figma-prop-item" key={name}>
                      <span className="figma-prop-label">{control.label}</span>
                      {control.type === 'textarea' ? (
                        <textarea
                          className="figma-textarea"
                          rows={3}
                          value={String(selectedNode.props[name] ?? control.defaultValue ?? '')}
                          onChange={(e) =>
                            updateNodeProps(selectedNode.id, { [name]: e.target.value })
                          }
                        />
                      ) : control.type === 'select' ? (
                        <select
                          className="figma-select"
                          value={String(selectedNode.props[name] ?? control.defaultValue ?? '')}
                          onChange={(e) =>
                            updateNodeProps(selectedNode.id, { [name]: e.target.value })
                          }
                        >
                          {(control.options ?? []).map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : control.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          className="figma-checkbox"
                          checked={selectedNode.props[name] === true}
                          onChange={(e) =>
                            updateNodeProps(selectedNode.id, { [name]: e.target.checked })
                          }
                        />
                      ) : (
                        <input
                          type={control.type === 'number' ? 'number' : 'text'}
                          className="figma-compact-input"
                          value={String(selectedNode.props[name] ?? control.defaultValue ?? '')}
                          placeholder={control.placeholder}
                          onChange={(e) =>
                            updateNodeProps(selectedNode.id, {
                              [name]:
                                control.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </aside>
    );
  },
);
