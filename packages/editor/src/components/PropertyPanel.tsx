import React, { useEffect, useState } from 'react';
import type { ComponentNode, ElementStyles, PropertyControl } from '@dsk/core';
import { getDefaultComponent } from '../constants';
import { useEditorStore, type ViewportMode } from '../store';

function findNode(nodes: ComponentNode[], nodeId: string): ComponentNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const childMatch = findNode(node.children, nodeId);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
}

function PropertyInput({
  name,
  control,
  value,
  onChange,
}: {
  name: string;
  control: PropertyControl;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputId = `property-${name}`;
  const stringValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const [numberDraft, setNumberDraft] = useState(stringValue);
  const [numberError, setNumberError] = useState<string | null>(null);

  useEffect(() => {
    setNumberDraft(stringValue);
    setNumberError(null);
  }, [stringValue]);

  let input: React.ReactNode;
  switch (control.type) {
    case 'textarea':
      input = (
        <textarea
          id={inputId}
          value={stringValue}
          placeholder={control.placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
        />
      );
      break;
    case 'select':
      input = (
        <select
          id={inputId}
          value={stringValue}
          onChange={(event) => {
            const option = control.options?.find(
              (candidate) => String(candidate.value) === event.target.value,
            );
            onChange(option?.value ?? event.target.value);
          }}
        >
          {(control.options ?? []).map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'boolean':
      input = (
        <input
          id={inputId}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
      );
      break;
    case 'number':
      input = (
        <input
          id={inputId}
          type="number"
          value={numberDraft}
          min={control.min}
          max={control.max}
          step={control.step}
          placeholder={control.placeholder}
          aria-invalid={numberError !== null}
          aria-describedby={numberError ? `${inputId}-error` : undefined}
          onChange={(event) => {
            const draft = event.target.value;
            setNumberDraft(draft);
            if (draft === '') {
              setNumberError(null);
              return;
            }

            const numericValue = Number(draft);
            const inRange =
              Number.isFinite(numericValue) &&
              (control.min === undefined || numericValue >= control.min) &&
              (control.max === undefined || numericValue <= control.max);
            const matchesStep =
              control.step === undefined ||
              Number.isInteger((numericValue - (control.min ?? 0)) / control.step);
            if (inRange && matchesStep) {
              setNumberError(null);
              onChange(numericValue);
            } else {
              setNumberError('Saisissez une valeur numérique valide.');
            }
          }}
          onBlur={() => {
            if (numberDraft === '' || numberError !== null) {
              setNumberDraft(stringValue);
              setNumberError(null);
            }
          }}
        />
      );
      break;
    case 'color':
      input = (
        <input
          id={inputId}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(stringValue) ? stringValue : '#000000'}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case 'image':
    case 'url':
      input = (
        <input
          id={inputId}
          type="url"
          value={stringValue}
          placeholder={control.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case 'icon':
    case 'text':
      input = (
        <input
          id={inputId}
          type="text"
          value={stringValue}
          placeholder={control.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
  }

  return (
    <label className="property-field" htmlFor={inputId}>
      <span>{control.label}</span>
      {input}
      {control.type === 'number' && numberError ? (
        <small className="property-error" id={`${inputId}-error`} role="alert">
          {numberError}
        </small>
      ) : null}
      {control.description ? <small>{control.description}</small> : null}
    </label>
  );
}

type StyleFieldKey = Exclude<keyof ElementStyles, 'custom' | 'opacity'>;

const SPACING_FIELDS = [
  ['width', 'Width'],
  ['height', 'Height'],
  ['minWidth', 'Min width'],
  ['maxWidth', 'Max width'],
  ['minHeight', 'Min height'],
  ['maxHeight', 'Max height'],
  ['paddingTop', 'Padding top'],
  ['paddingRight', 'Padding right'],
  ['paddingBottom', 'Padding bottom'],
  ['paddingLeft', 'Padding left'],
  ['marginTop', 'Margin top'],
  ['marginRight', 'Margin right'],
  ['marginBottom', 'Margin bottom'],
  ['marginLeft', 'Margin left'],
  ['gap', 'Gap'],
] as const satisfies readonly (readonly [StyleFieldKey, string])[];

const TYPOGRAPHY_FIELDS = [
  ['fontSize', 'Font size'],
  ['fontWeight', 'Font weight'],
  ['lineHeight', 'Line height'],
  ['letterSpacing', 'Letter spacing'],
  ['textAlign', 'Text alignment'],
  ['textDecoration', 'Text decoration'],
  ['color', 'Text color'],
] as const satisfies readonly (readonly [StyleFieldKey, string])[];

const APPEARANCE_FIELDS = [
  ['backgroundColor', 'Background color'],
  ['borderWidth', 'Border width'],
  ['borderColor', 'Border color'],
  ['borderStyle', 'Border style'],
  ['borderRadius', 'Border radius'],
  ['boxShadow', 'Box shadow'],
] as const satisfies readonly (readonly [StyleFieldKey, string])[];

const LAYOUT_FIELDS = [
  ['display', 'Display'],
  ['flexDirection', 'Flex direction'],
  ['justifyContent', 'Justify content'],
  ['alignItems', 'Align items'],
  ['flexWrap', 'Flex wrap'],
  ['gridTemplateColumns', 'Grid columns'],
  ['gridTemplateRows', 'Grid rows'],
] as const satisfies readonly (readonly [StyleFieldKey, string])[];

const SELECT_OPTIONS: Partial<Record<StyleFieldKey, readonly { label: string; value: string }[]>> =
  {
    textAlign: [
      { label: 'Inherit', value: '' },
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
      { label: 'Justify', value: 'justify' },
    ],
    textDecoration: [
      { label: 'None', value: 'none' },
      { label: 'Underline', value: 'underline' },
      { label: 'Line through', value: 'line-through' },
    ],
    display: [
      { label: 'Inherit', value: '' },
      { label: 'Block', value: 'block' },
      { label: 'Inline block', value: 'inline-block' },
      { label: 'Flex', value: 'flex' },
      { label: 'Inline flex', value: 'inline-flex' },
      { label: 'Grid', value: 'grid' },
      { label: 'None', value: 'none' },
    ],
    flexDirection: [
      { label: 'Row', value: 'row' },
      { label: 'Row reverse', value: 'row-reverse' },
      { label: 'Column', value: 'column' },
      { label: 'Column reverse', value: 'column-reverse' },
    ],
    justifyContent: [
      { label: 'Start', value: 'flex-start' },
      { label: 'End', value: 'flex-end' },
      { label: 'Center', value: 'center' },
      { label: 'Space between', value: 'space-between' },
      { label: 'Space around', value: 'space-around' },
      { label: 'Space evenly', value: 'space-evenly' },
    ],
    alignItems: [
      { label: 'Stretch', value: 'stretch' },
      { label: 'Start', value: 'flex-start' },
      { label: 'End', value: 'flex-end' },
      { label: 'Center', value: 'center' },
      { label: 'Baseline', value: 'baseline' },
    ],
    flexWrap: [
      { label: 'No wrap', value: 'nowrap' },
      { label: 'Wrap', value: 'wrap' },
      { label: 'Wrap reverse', value: 'wrap-reverse' },
    ],
    borderStyle: [
      { label: 'None', value: 'none' },
      { label: 'Solid', value: 'solid' },
      { label: 'Dashed', value: 'dashed' },
      { label: 'Dotted', value: 'dotted' },
      { label: 'Double', value: 'double' },
    ],
  };

function isValidStyleValue(key: StyleFieldKey, value: string): boolean {
  if (value === '') return true;
  if (key === 'lineHeight') return /^(?:\d+(?:\.\d+)?|[\d.]+(?:px|rem|em|%))$/.test(value);
  if (key === 'fontWeight') return /^(?:[1-9]00|normal|bold|lighter|bolder)$/.test(value);
  if (key === 'boxShadow') return !/[;{}]|url\s*\(/i.test(value);
  if (key === 'gridTemplateColumns' || key === 'gridTemplateRows') {
    return !/[;{}]|url\s*\(/i.test(value);
  }
  return /^(?:0|auto|min-content|max-content|fit-content|(?:-?(?:\d+|\d*\.\d+)(?:px|rem|em|%|vw|vh|dvh|svh|ch|fr)))$/.test(
    value,
  );
}

function StyleTextField({
  name,
  label,
  value,
  onCommit,
  placeholder,
}: {
  name: StyleFieldKey;
  label: string;
  value: string;
  onCommit: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
    setError(null);
  }, [value]);

  const commit = () => {
    if (draft.trim() === value) {
      setError(null);
      return;
    }
    if (!isValidStyleValue(name, draft.trim())) {
      setError('Saisissez une valeur CSS prise en charge.');
      return;
    }
    setError(null);
    onCommit(draft.trim());
  };

  return (
    <label className="property-field" htmlFor={`style-${name}`}>
      <span>{label}</span>
      <input
        id={`style-${name}`}
        type="text"
        value={draft}
        placeholder={placeholder}
        aria-invalid={error !== null}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? (
        <small className="property-error" role="alert">
          {error}
        </small>
      ) : null}
    </label>
  );
}

function ResponsiveStyleFields({
  node,
  viewport,
  fields,
  onChange,
}: {
  node: ComponentNode;
  viewport: ViewportMode;
  fields: readonly (readonly [StyleFieldKey, string])[];
  onChange: (styles: Partial<ElementStyles>) => void;
}) {
  const styles = node.styles[viewport];
  return (
    <>
      {fields.map(([key, label]) => {
        const value = styles?.[key];
        const update = (nextValue: string) => updateResponsiveStyle(key, nextValue, onChange);
        const options = SELECT_OPTIONS[key];
        const fieldOptions = options
          ? options.some((option) => option.value === '')
            ? options
            : [{ label: 'Inherit', value: '' }, ...options]
          : undefined;
        return (
          <React.Fragment key={key}>
            {fieldOptions ? (
              <label className="property-field">
                <span>{label}</span>
                <select
                  value={String(value ?? '')}
                  onChange={(event) => update(event.target.value)}
                >
                  {fieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : key === 'color' || key === 'backgroundColor' || key === 'borderColor' ? (
              <label className="property-field">
                <span>{label}</span>
                <input
                  type="color"
                  aria-label={label}
                  value={
                    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'
                  }
                  onChange={(event) => update(event.target.value)}
                />
                {value !== undefined ? (
                  <button type="button" className="property-reset" onClick={() => update('')}>
                    Reset
                  </button>
                ) : null}
              </label>
            ) : (
              <StyleTextField
                name={key}
                label={label}
                value={typeof value === 'string' ? value : ''}
                placeholder={viewport === 'desktop' ? 'e.g. 24px' : 'Inherits Desktop'}
                onCommit={update}
              />
            )}
          </React.Fragment>
        );
      })}
      {viewport !== 'desktop' ? (
        <p className="responsive-help">
          Empty values inherit Desktop. Changes apply only to the {viewport} preview.
        </p>
      ) : null}
    </>
  );
}

function updateResponsiveStyle(
  key: StyleFieldKey,
  value: string,
  onChange: (styles: Partial<ElementStyles>) => void,
): void {
  onChange({ [key]: value });
}

export const PropertyPanel: React.FC = () => {
  const document = useEditorStore((state) => state.document);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps);
  const updateNodeStyles = useEditorStore((state) => state.updateNodeStyles);
  const viewport = useEditorStore((state) => state.viewport);
  const selectedNode = selectedNodeId
    ? document.sections
        .map((section) => findNode(section.children, selectedNodeId))
        .find((node) => node !== undefined)
    : undefined;
  const definition = selectedNode ? getDefaultComponent(selectedNode.type) : undefined;

  return (
    <aside className="editor-properties" aria-label="Panneau de propriétés">
      <div className="panel-heading">
        <span className="panel-eyebrow">INSPECTEUR</span>
        <h2>Propriétés</h2>
      </div>
      {!selectedNode ? (
        <p className="panel-empty">
          Sélectionnez un composant sur le canvas pour modifier ses propriétés.
        </p>
      ) : (
        <>
          <div className="selected-component">
            <strong>{definition?.label ?? selectedNode.type}</strong>
            <code>{selectedNode.id}</code>
          </div>
          {definition ? (
            <>
              {(['content', 'layout', 'style'] as const).map((category) => {
                const controls = Object.entries(definition.controls).filter(
                  ([, control]) => control.category === category,
                );
                if (controls.length === 0) return null;
                const title =
                  category === 'content'
                    ? 'Content'
                    : category === 'layout'
                      ? 'Layout'
                      : 'Appearance';
                return (
                  <details className="property-group" key={category} open>
                    <summary>{title}</summary>
                    {controls.map(([name, control]) => (
                      <PropertyInput
                        key={name}
                        name={name}
                        control={control}
                        value={selectedNode.props[name] ?? control.defaultValue ?? ''}
                        onChange={(value) => updateNodeProps(selectedNode.id, { [name]: value })}
                      />
                    ))}
                  </details>
                );
              })}
              <details className="property-group" open>
                <summary>Layout · {viewport}</summary>
                <ResponsiveStyleFields
                  node={selectedNode}
                  viewport={viewport}
                  fields={LAYOUT_FIELDS}
                  onChange={(styles) => updateNodeStyles(selectedNode.id, viewport, styles)}
                />
              </details>
              <details className="property-group" open>
                <summary>Spacing · {viewport}</summary>
                <ResponsiveStyleFields
                  node={selectedNode}
                  viewport={viewport}
                  fields={SPACING_FIELDS}
                  onChange={(styles) => updateNodeStyles(selectedNode.id, viewport, styles)}
                />
              </details>
              <details className="property-group">
                <summary>Typography</summary>
                <ResponsiveStyleFields
                  node={selectedNode}
                  viewport={viewport}
                  fields={TYPOGRAPHY_FIELDS}
                  onChange={(styles) => updateNodeStyles(selectedNode.id, viewport, styles)}
                />
              </details>
              <details className="property-group">
                <summary>Appearance · {viewport}</summary>
                <ResponsiveStyleFields
                  node={selectedNode}
                  viewport={viewport}
                  fields={APPEARANCE_FIELDS}
                  onChange={(styles) => updateNodeStyles(selectedNode.id, viewport, styles)}
                />
                <label className="property-field">
                  <span>Opacity</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedNode.styles[viewport].opacity ?? 1}
                    onChange={(event) =>
                      updateNodeStyles(selectedNode.id, viewport, {
                        opacity: Number(event.target.value),
                      })
                    }
                  />
                  {selectedNode.styles[viewport].opacity !== undefined ? (
                    <button
                      type="button"
                      className="property-reset"
                      onClick={() =>
                        updateNodeStyles(selectedNode.id, viewport, { opacity: undefined })
                      }
                    >
                      Reset
                    </button>
                  ) : null}
                </label>
              </details>
              <details className="property-group">
                <summary>Advanced</summary>
                <p className="advanced-node-id">
                  Node ID <code>{selectedNode.id}</code>
                </p>
              </details>
            </>
          ) : (
            <p className="panel-empty">
              Aucun panneau de propriétés n’est défini pour ce composant.
            </p>
          )}
        </>
      )}
    </aside>
  );
};
