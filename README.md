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

## 6. Design Principles

- **Modularity:** keep responsibilities separated.
- **Reusability:** make the engine usable in different SaaS products.
- **Extensibility:** allow new templates and components to be registered.
- **Security:** never execute arbitrary vendor-provided JavaScript as part of a page configuration.
- **Validation:** validate page documents and component properties before rendering.
- **Responsive design:** support multiple screen sizes.
- **Compatibility:** version templates, components, and page documents.
- **Separation of concerns:** keep storefront presentation separate from business logic.

## 7. Data and Security

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

## 8. Development Roadmap

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

## 9. Documentation

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

## 10. Project Status

**Status:** Planning and initial design.

The architecture, public APIs, dependencies, and implementation details will be finalized progressively before the first stable release.

## 11. License

The project's license will be selected before public distribution.
