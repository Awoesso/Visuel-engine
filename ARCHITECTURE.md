# Architecture — DSK Visuel Engine

## 1. Purpose

This document defines the technical architecture of DSK Visuel Engine, a reusable visual page builder and template system built with TypeScript and React.

The architecture must support modular development, reuse across multiple SaaS applications, secure configuration rendering, and long-term extensibility.

## 2. Architectural Principles

- Separation of concerns.
- Explicit and validated interfaces.
- Reusable packages with clear responsibilities.
- Configuration-driven rendering.
- No arbitrary user-provided JavaScript execution.
- Backward compatibility through versioning and migrations.
- Host SaaS control over business logic, persistence, and authorization.
- Testable modules with minimal unnecessary dependencies.

## 3. Monorepo Structure

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

The repository uses pnpm workspaces to manage the application and packages together.

## 4. Package Responsibilities

### 4.1 `core`

The foundational package.

Responsibilities:

- Shared TypeScript types.
- Page document definitions.
- Component configuration schemas.
- Theme and design-token types.
- Template metadata and definitions.
- Configuration validation.
- Version compatibility checks.
- Page document migrations.
- Shared editor-independent utilities.

Constraints:

- Must not depend on React.
- Must not depend on Next.js.
- Must not contain UI components.
- Must not contain SaaS-specific business logic.

### 4.2 `react-renderer`

Responsible for rendering validated page documents into React interfaces.

Responsibilities:

- Resolve registered component types.
- Render page and section hierarchies.
- Apply theme tokens.
- Apply supported layout and responsive styles.
- Handle missing or incompatible components safely.
- Provide controlled integration points for data-dependent components.

Constraints:

- Must not own subscription billing.
- Must not access the host application's database directly.
- Must not execute arbitrary code from page documents.
- Must remain separate from editor-specific UI.

### 4.3 `editor`

Responsible for the visual page-building experience.

Responsibilities:

- Editor layout and toolbar.
- Canvas and component selection.
- Drag-and-drop interactions.
- Component insertion, removal, and reordering.
- Properties and style panels.
- Responsive editing controls.
- Undo and redo.
- Draft-state management interfaces.
- Preview integration.
- Save-status presentation.

The editor should use shared document types and validation rules from `core`.

### 4.4 `components`

Provides reusable registered components and sections.

Responsibilities:

- Basic elements.
- Layout elements.
- Prebuilt page sections.
- Component metadata.
- Editable property definitions.
- Default values and validation.
- Settings-panel definitions.
- Responsive capabilities.
- Component-specific rendering implementations.

Components must follow the registration and validation contracts established by `core`.

### 4.5 `templates`

Provides predefined templates and theme presets.

Responsibilities:

- Template definitions.
- Initial page structures.
- Default content and configuration.
- Theme presets.
- Template categories and metadata.
- Template version information.
- Compatibility declarations.

Templates should use registered components rather than embed arbitrary executable code.

### 4.6 `apps/playground`

A development application used to test the packages together.

Responsibilities:

- Display sample storefronts.
- Test the editor and renderer.
- Preview template changes.
- Test responsive behavior.
- Test component registration.
- Demonstrate integrations with mock SaaS data.

The playground is a development tool, not the production backend of the integrating SaaS.

## 5. Dependency Rules

The intended dependency direction is:

```text
core
 ↑
 ├── react-renderer
 ├── components
 ├── templates
 └── editor
```

More precisely:

- `core` is independent of the other project packages.
- `react-renderer` depends on `core`.
- `components` depends on `core` and the rendering interfaces it needs.
- `templates` depends on `core` and uses registered component identifiers.
- `editor` depends on `core`, the renderer, and the component metadata needed for editing.
- `playground` integrates the packages for testing.

The exact package dependencies must be checked during implementation to avoid circular dependencies.

## 6. Page Document Model

A page is represented as structured, serializable data.

Conceptually:

```text
PageDocument
├── id
├── schemaVersion
├── metadata
├── theme
└── children[]
    └── Section
        ├── id
        ├── type
        ├── props
        ├── styles
        └── children[]
```

Each component node should contain, where applicable:

- A stable identifier.
- A registered component type.
- A component configuration version.
- Validated properties.
- Supported style overrides.
- Child nodes when nesting is allowed.

The exact schema will be defined in `core`.

## 7. Configuration-Driven Rendering

The renderer receives a validated page document and resolves each node through a registry of approved components.

Conceptual flow:

1. Receive a page document.
2. Validate its structure and schema version.
3. Resolve the registered component type.
4. Validate component properties.
5. Resolve theme tokens and responsive settings.
6. Render the corresponding React component.
7. Handle unsupported or invalid nodes safely.

Page configuration is data, not executable application code.

## 8. Component Registration

Every renderable component must have a registered definition.

A definition should describe:

- A unique component type.
- Its version.
- Its default properties.
- Its property schema.
- Its supported child structure.
- Its editor settings.
- Its responsive capabilities.
- Its rendering implementation.
- Any required feature declarations.

The registration API will be finalized before the component system is implemented.

## 9. Template Registration

Each template should declare:

- A unique identifier.
- A version.
- Display metadata.
- A compatible document schema version.
- Required component types.
- Its initial page or storefront configuration.
- Its default theme.
- Optional feature requirements.

The engine must validate templates before making them available for use.

New templates should be addable without changing the renderer's core implementation, provided they use supported schemas and registered components.

## 10. Data Integration

The engine must not directly access the integrating SaaS database.

Instead, the host application supplies controlled interfaces for data and business actions.

Examples include:

- Product data.
- Category data.
- Price and stock information.
- Product search.
- Cart actions.
- Links to product details.

Data-dependent components receive only the information and actions they need.

The host SaaS remains responsible for data retrieval, access control, price validation, inventory rules, checkout, and order processing.

## 11. Editor State and Persistence

The editor manages the current working document and its editing history.

The architecture distinguishes:

- Current in-memory editing state.
- Saved draft.
- Published document.
- Historical revisions.

The editor exposes integration interfaces for saving and loading documents. The host SaaS implements persistence, authentication, authorization, and publication.

Undo and redo operate on editing state. Version restoration creates a controlled transition to a previous saved document.

## 12. Subscription Integration

The engine declares feature requirements and presents the appropriate editor state.

The host SaaS supplies the user's effective permissions and subscription entitlements through a defined integration interface.

The host SaaS must enforce authorization on the server. Client-side feature restrictions are only a user-interface measure.

The engine does not process subscription payments or manage billing accounts.

## 13. Validation and Security Boundaries

All external page documents and imported templates are treated as untrusted input.

Validation must cover:

- Document structure.
- Schema versions.
- Component identifiers.
- Component properties.
- Child and nesting rules.
- Supported style values.
- Resource limits.
- External references where applicable.

The renderer must not execute arbitrary scripts contained in configurations.

Integrations must validate permissions and business operations independently of editor state.

## 14. Versioning and Migrations

The architecture distinguishes package versions from document schema versions.

When a document format changes:

1. Introduce the new schema version.
2. Define compatibility rules.
3. Provide migrations where possible.
4. Validate the migrated document.
5. Preserve the original document until the migration is safely completed.

Incompatible templates or components must be reported clearly rather than silently misrendered.

## 15. Testing Strategy

### Unit Tests
- Schema validation.
- Component property validation.
- Theme token resolution.
- Migration logic.
- Registry behavior.

### Integration Tests
- Rendering complete page documents.
- Combining templates and registered components.
- Editor operations and history.
- Data-provider integrations.
- Feature-restricted editor behavior.

### End-to-End Tests
- Select a template.
- Edit and reorder components.
- Save a draft.
- Preview responsive layouts.
- Restore a previous version.
- Publish through a test host application.

Security and accessibility tests should be included throughout development.

## 16. Build and Distribution

Packages will be developed in a pnpm monorepo and prepared for independent npm distribution where appropriate.

The release process should include:

- Type checking.
- Automated tests.
- Production builds.
- Package export validation.
- Dependency compatibility checks.
- Version and changelog updates.

The exact build tools and package export formats will be selected during implementation.

## 17. Architectural Decision Status

This document defines the intended architecture.

Package APIs, component registration contracts, document schemas, dependency versions, and persistence interfaces remain subject to implementation review and testing.

Changes should be recorded in `docs/DECISIONS.md` when they materially affect the architecture.
