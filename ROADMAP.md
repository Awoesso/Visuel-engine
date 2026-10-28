# Development Roadmap — DSK Visuel Engine

## 1. Objective

Build a reusable, secure, extensible DSK Visuel Engine and visual page builder for React and Next.js applications.

Development will proceed incrementally. Each phase must establish a working foundation before the next major layer is added.

## 2. Development Principles

- Build the smallest working version first.
- Keep packages modular.
- Validate configurations at system boundaries.
- Test each important feature before expanding it.
- Document public APIs and architectural decisions.
- Avoid premature optimization.
- Keep SaaS business logic outside the engine.
- Do not publish unstable packages as production-ready.

## 3. Phase 1 — Project Foundation

### Tasks
- [x] Initialize the Git repository.
- [x] Configure pnpm workspaces.
- [x] Configure TypeScript.
- [x] Establish the package directory structure.
- [x] Add linting and formatting tools.
- [x] Add the initial test framework.
- [x] Create package-level development scripts.
- [x] Document package naming and dependency rules.

### Completion Criteria
- The workspace installs successfully.
- TypeScript checks run successfully.
- All initial packages build or pass their configured checks.
- The repository has a consistent development workflow.

## 4. Phase 2 — Core Data Model

### Tasks
- [x] Define page document types.
- [x] Define component node types.
- [x] Define section and layout structures.
- [x] Define theme and design-token types.
- [x] Define template metadata.
- [x] Define component property schemas.
- [x] Implement configuration validation.
- [x] Add document schema versioning.
- [x] Define migration interfaces.

### Completion Criteria
- A valid page document can be represented as serializable data.
- Invalid documents are rejected with useful errors.
- Nested structures are validated.
- Schema versions are explicit.
- Core functionality does not depend on React.

## 5. Phase 3 — Component Registry

### Tasks
- [ ] Define component registration contracts.
- [ ] Register basic elements.
- [ ] Register layout components.
- [ ] Define editable property metadata.
- [ ] Define default component properties.
- [ ] Validate component configurations.
- [ ] Handle unknown component types safely.

### Initial Components
- Text and headings.
- Images.
- Buttons.
- Separators.
- Containers.
- Columns.
- Grids.

### Completion Criteria
- Components can be registered through a defined interface.
- Default properties and validation work consistently.
- Invalid or unknown component types do not crash the entire application.

## 6. Phase 4 — React Renderer

### Tasks
- [x] Implement the document renderer.
- [x] Render registered components.
- [x] Support nested sections and layouts.
- [x] Apply theme tokens.
- [x] Apply responsive styles.
- [x] Handle invalid and missing components.
- [x] Add renderer unit and integration tests.

### Completion Criteria
- A validated page document renders as a React interface.
- Nested components render correctly.
- Theme and responsive settings are applied.
- Rendering does not execute arbitrary configuration code.

## 7. Phase 5 — Initial Templates

### Tasks
- [ ] Define the template registration format.
- [ ] Create the template catalog.
- [ ] Add an initial storefront template.
- [ ] Add template previews.
- [ ] Add template compatibility checks.
- [ ] Add template switching safeguards.
- [ ] Define how customized templates are exported and reused.

### Completion Criteria
- Users can select and preview a template.
- A compatible template can initialize a page.
- Switching templates does not silently overwrite existing work.
- New templates can be registered without modifying the core renderer.

## 8. Phase 6 — Visual Editor MVP

### Tasks
- [ ] Build the editor layout.
- [ ] Implement component selection.
- [ ] Add the component library panel.
- [ ] Add the properties panel.
- [ ] Implement component insertion and deletion.
- [ ] Implement drag-and-drop reordering.
- [ ] Implement supported nested layouts.
- [ ] Add undo and redo.
- [ ] Add draft save-status indicators.
- [ ] Add responsive preview controls.

### Completion Criteria
- A user can build and edit a simple page visually.
- Changes update the preview.
- Supported components can be reordered and configured.
- Undo and redo work reliably.
- The editor can produce a valid page document.

## 9. Phase 7 — Advanced Editing

### Tasks
- [ ] Add advanced layout controls.
- [ ] Add supported component resizing.
- [ ] Improve nested component editing.
- [ ] Add responsive property overrides.
- [ ] Add global design-token editing.
- [ ] Add reusable sections from the predefined library.
- [ ] Add keyboard-accessible alternatives to drag-and-drop.
- [ ] Improve editor performance for larger pages.

### Completion Criteria
- Complex layouts can be edited within documented constraints.
- Responsive overrides behave predictably.
- Global design-token changes update dependent components.
- The editor remains usable with larger documents.

## 10. Phase 8 — Saving and Version History

### Tasks
- [ ] Define document persistence interfaces.
- [ ] Implement draft loading and saving integration.
- [ ] Add autosave.
- [ ] Add manual save.
- [ ] Handle save failures and retry opportunities.
- [ ] Define revision metadata.
- [ ] Add version history interfaces.
- [ ] Add safe restoration of previous revisions.
- [ ] Separate draft and published documents.

### Completion Criteria
- The host application can persist and retrieve drafts.
- Saving failures are clearly reported.
- Previous revisions can be restored through a controlled workflow.
- Saving a draft does not automatically publish it.

## 11. Phase 9 — SaaS Integration

### Tasks
- [ ] Define the storefront data-provider interface.
- [ ] Integrate product and category data.
- [ ] Add price and stock display components.
- [ ] Define controlled search and cart actions.
- [ ] Define feature entitlement interfaces.
- [ ] Add subscription-aware editor states.
- [ ] Define publication integration contracts.
- [ ] Test with a mock multi-vendor SaaS application.

### Completion Criteria
- Components can consume authorized host-provided data.
- Business operations remain under host application control.
- Feature restrictions are communicated clearly.
- The host application independently enforces permissions.

## 12. Phase 10 — Quality and Security

### Tasks
- [ ] Expand automated test coverage.
- [ ] Test malformed configurations.
- [ ] Test invalid component properties.
- [ ] Review resource limits and nested structures.
- [ ] Audit untrusted content handling.
- [ ] Review accessibility.
- [ ] Measure rendering and editor performance.
- [ ] Test supported React and Next.js versions.
- [ ] Test document migrations.

### Completion Criteria
- Critical workflows have automated tests.
- Security boundaries are documented and verified.
- Errors are handled predictably.
- Supported environments are clearly identified.

## 13. Phase 11 — npm Release

### Tasks
- [ ] Finalize package names.
- [ ] Define public exports.
- [ ] Configure production builds.
- [ ] Verify package contents.
- [ ] Define semantic versioning rules.
- [ ] Complete installation and integration documentation.
- [ ] Configure release automation.
- [ ] Publish an initial release when quality criteria are met.

### Completion Criteria
- Packages can be installed independently where intended.
- Public APIs are documented.
- Builds and tests pass in the release workflow.
- Consumers can follow a working integration example.

## 14. Minimum Viable Product

The first MVP should include only:

- One basic storefront template.
- A small set of registered components.
- A working React renderer.
- Component selection and property editing.
- Drag-and-drop reordering.
- Basic responsive preview.
- Validated page configuration.
- Draft save and reload integration.

Advanced template catalogs, extensive version history, complex subscription controls, and a large component library can follow after the MVP is stable.

## 15. Current Status

**Current stage:** Planning and documentation.

No phase should be marked complete until its completion criteria have been verified.

The immediate next milestone is Phase 1: establish the repository, workspace configuration, TypeScript settings, and initial development tooling.
