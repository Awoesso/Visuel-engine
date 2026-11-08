# DSK Visuel Engine

A reusable, extensible DSK Visuel Engine and visual page builder built with React, Next.js, and TypeScript.

## 1. Project Overview

DSK Visuel Engine is a modular toolkit that enables SaaS platforms to offer customizable website templates and a powerful visual page builder to their users.

The primary goal is to allow vendors to create, customize, preview, save, and publish professional storefronts without writing code.

The engine is designed to be reusable across multiple SaaS applications, especially multi-vendor e-commerce platforms.

## 2. Project Goals

- Provide ready-to-use website templates.
- Offer a visual drag-and-drop page builder.
- Support customization of sections, components, layouts, and styles.
- Allow users to save and reuse customized templates.
- Support responsive layouts for desktop, tablet, and mobile.
- Provide a centralized design system for colors, typography, spacing, and other design tokens.
- Integrate safely with external SaaS data and business logic.
- Support subscription-based feature restrictions.
- Allow new templates and components to be added without rewriting the engine.
- Maintain security, performance, and backward compatibility.

## 3. Core Features

### Template Management

- Browse available templates.
- Preview a template before applying it.
- Switch templates without losing existing work.
- Save customized storefront configurations as reusable models.
- Support template versions and compatibility checks.

### Visual Page Builder

- Drag and drop sections and elements.
- Reorder, resize, and nest supported components.
- Edit content, styles, and responsive settings.
- Undo and redo changes.
- Preview pages before publishing.
- Automatically save drafts and support manual saving.

### Component System

The engine supports several component families:

- **Basic elements:** text, headings, images, buttons, videos, icons, and separators.
- **Layout elements:** containers, columns, grids, tabs, and accordions.
- **Prebuilt sections:** hero banners, product grids, category grids, testimonials, FAQs, and newsletter sections.
- **SaaS-connected components:** product details, prices, stock information, search, categories, and cart actions.

### Design System

- Global color palettes.
- Typography settings.
- Spacing and layout tokens.
- Border radius and other visual properties.
- Responsive styling.
- Shared styles that update components using the corresponding design tokens.

### Subscription Features

- Configurable feature availability.
- Usage limits based on subscription plans.
- Locked premium features with explanations and upgrade prompts.
- Server-side authorization handled by the integrating SaaS.

### Publishing and Versioning

- Draft and published configurations.
- Preview before publication.
- Version history and restoration.
- Validated configuration migrations.

## 4. Technology Stack

- **Language:** TypeScript
- **UI framework:** React
- **Integration target:** Next.js
- **Package management:** pnpm
- **Validation:** schema-based validation
- **Testing:** automated unit and integration tests
- **Distribution:** npm packages

Specific libraries will be selected and documented during implementation.

## 5. Project Structure

```text
template-engine/
├── apps/
│   └── playground/
├── packages/
│   ├── core/
│   ├── react-renderer/
│   ├── editor/
│   ├── components/
│   └── templates/
├── docs/
├── README.md
├── DESIGN.md
├── ARCHITECTURE.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Package Responsibilities

- `core`: shared types, schemas, validation, and configuration migrations.
- `react-renderer`: renders validated page configurations into React interfaces.
- `editor`: provides the visual editing experience.
- `components`: contains registered, reusable components and sections.
- `templates`: contains predefined templates, layouts, and theme presets.
- `apps/playground`: provides a development environment for testing the engine.

## 6. Editor Integration

`EditorApp` can be mounted without configuration for the built-in demonstration experience:

```tsx
import { EditorApp } from '@dsk/editor';

export function PageBuilder() {
  return <EditorApp />;
}
```

Each mounted editor creates its own Zustand store. `initialDocument` seeds that store on its first
mount; changing the prop later does not replace edited content. Theme, registry, options, and
callbacks can be changed without recreating the store. A supplied `store` takes precedence over
`initialDocument`. The legacy `useEditorStore` export remains available for existing integrations.

The registry pairs Core component definitions used by editing actions with React implementations
used by the canvas. Start from the built-in definitions and replace or extend them for an
application-specific library:

```tsx
import { EditorApp, createDefaultComponentRegistry } from '@dsk/editor';
import { defaultRendererRegistry } from '@dsk/components';
import type { ComponentMapping } from '@dsk/react-renderer';

const definitions = createDefaultComponentRegistry();
const heading = definitions.get('core/heading');
if (heading) definitions.set('core/heading', { ...heading, label: 'Apex heading' });

const registry = {
  definitions,
  renderers: defaultRendererRegistry satisfies ComponentMapping,
};

export function ApexPageBuilder() {
  return (
    <EditorApp
      registry={registry}
      theme={{ colors: { primary: '#176b5b' } }}
      options={{ showInspector: true, showSidebar: true }}
      callbacks={{ onChange: (document) => console.log(document.metadata.title) }}
    />
  );
}
```

Theme tokens are partial overrides of the active document theme; defaults come from Core and the
editor keeps Geist as its interface font. `onChange` reports active-document edits,
`onSelectionChange` reports selection changes, and `onSave` runs after an editor save succeeds.
Options currently control visibility of the sidebar, inspector, save button, and preview button.

## 7. Design Principles

- **Modularity:** keep responsibilities separated.
- **Reusability:** make the engine usable in different SaaS products.
- **Extensibility:** allow new templates and components to be registered.
- **Security:** never execute arbitrary vendor-provided JavaScript as part of a page configuration.
- **Validation:** validate page documents and component properties before rendering.
- **Responsive design:** support multiple screen sizes.
- **Compatibility:** version templates, components, and page documents.
- **Separation of concerns:** keep storefront presentation separate from business logic.

## 8. Data and Security

Pages will be represented by validated, serializable configuration documents rather than arbitrary executable code.

The engine will render registered components using these configurations.

The integrating SaaS remains responsible for:

- User authentication and permissions.
- Vendor accounts and product ownership.
- Product, inventory, and order data.
- Cart and checkout business logic.
- Subscription billing and payment processing.
- Server-side authorization.

The engine will provide controlled interfaces for accessing the data and actions exposed by the SaaS.

## 9. Development Roadmap

### Phase 1 — Foundation

- Establish the monorepo.
- Define shared types and page document schemas.
- Implement configuration validation.
- Establish component registration.

### Phase 2 — Rendering

- Build the React renderer.
- Support nested page structures.
- Implement theme tokens and responsive styles.

### Phase 3 — Visual Editor

- Implement the editor interface.
- Add drag-and-drop functionality.
- Add component settings and responsive controls.
- Implement undo, redo, and draft persistence interfaces.

### Phase 4 — Templates and Integrations

- Create initial storefront templates.
- Add reusable sections and components.
- Define controlled SaaS data integration interfaces.
- Implement subscription feature declarations.

### Phase 5 — Reliability

- Add automated tests.
- Implement versioning and migrations.
- Review accessibility, performance, and security.
- Test compatibility with supported Next.js applications.

### Phase 6 — Release

- Document the public API.
- Prepare npm package builds.
- Configure versioning and release workflows.
- Publish stable packages when the project is ready.

## 10. Documentation

Additional technical documentation will be maintained in the `docs/` directory.

- `DESIGN.md`: product vision, user experience, and design principles.
- `ARCHITECTURE.md`: technical architecture and package relationships.
- `ROADMAP.md`: detailed development milestones.
- `docs/COMPONENTS.md`: component specifications.
- `docs/TEMPLATES.md`: template definitions and registration.
- `docs/PAGE_BUILDER.md`: editor behavior and interactions.
- `docs/THEMING.md`: design tokens and theme customization.
- `docs/DATA_INTEGRATION.md`: SaaS integration contracts.
- `docs/SUBSCRIPTIONS.md`: feature entitlements and usage limits.
- `docs/VERSIONING.md`: compatibility and migrations.
- `docs/DECISIONS.md`: significant technical decisions.

## 11. Project Status

**Status:** Active MVP development.

The repository includes the core document model, React renderer, nine standard
components, and ten reusable section presets for headers, hero banners, feature
and product grids, testimonials, FAQs, newsletters, calls to action, and footers.
Add these blocks from the editor's Sections library, then edit their nested
components and responsive styles. Decorative product artwork is a placeholder;
the editor does not yet include an uploaded-asset library. The Playground editor stores its
current document in browser `localStorage` with debounced autosave and restore.
This is local draft persistence only; it is not a substitute for host-app
storage, publishing, or cross-device synchronization. The editor now also
supports a document-backed Layers tree, nested selection, component
duplication/deletion/reordering, explicit before/after/inside drag-and-drop
with registry parent constraints, responsive layout and appearance controls,
canvas zoom/fit, and grouped undo/redo. Its preview uses the local Geist font
package. The editor remains an MVP: persistence is browser-local, drag-and-drop
is limited to the supported component tree, and whole-page template selection,
publishing, collaboration, and direct canvas resizing are not included.

## 12. License

The project's license will be selected before public distribution.
