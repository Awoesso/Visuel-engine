# Architecture Decision Records

This document records important technical decisions made during the development of DSK Visuel Engine.

Each decision includes its context, the chosen approach, and the consequences.

## ADR-001: Use a Monorepo

**Status:** Accepted

### Context
The project contains multiple related packages that must evolve together while remaining independently reusable.

### Decision
Use a pnpm workspace monorepo.

### Consequences
- Packages share development tooling.
- Internal dependencies can be tested together.
- Packages retain separate responsibilities.
- Release and dependency boundaries must remain explicit.

## ADR-002: Use TypeScript

**Status:** Accepted

### Context
The engine exposes public APIs and handles complex page and component configurations.

### Decision
Use TypeScript across the project.

### Consequences
- Shared types improve consistency.
- Public interfaces are easier to document.
- Type checking helps detect errors during development.

## ADR-003: Separate Core Logic from React Rendering

**Status:** Accepted

### Context
The configuration model and validation rules should be reusable independently of the rendering interface.

### Decision
Keep `core` independent of React and Next.js. Implement React rendering in `react-renderer`.

### Consequences
- Core schemas can be tested independently.
- Rendering responsibilities remain isolated.
- Framework-specific integrations can evolve separately.

## ADR-004: Store Pages as Validated Configuration Data

**Status:** Accepted

### Context
Users need to save, reload, version, and reuse customized pages.

### Decision
Represent pages as serializable, validated configuration documents.

Do not execute arbitrary JavaScript from page configurations.

### Consequences
- Page documents can be persisted as data.
- Templates can be validated before use.
- Document schemas require versioning and migration support.

## ADR-005: Use a Registered Component System

**Status:** Accepted

### Context
Templates need reusable components with known properties and predictable rendering behavior.

### Decision
Render only components registered through an explicit engine interface.

### Consequences
- Components can declare their settings and validation rules.
- Unknown component types can be handled safely.
- Extensions must follow documented registration contracts.

## ADR-006: Keep SaaS Business Logic Outside the Engine

**Status:** Accepted

### Context
The engine must work with multiple SaaS applications without taking ownership of their business operations.

### Decision
The integrating SaaS remains responsible for authentication, product data, orders, billing, authorization, persistence, and publication.

### Consequences
- The engine uses controlled integration interfaces.
- Business operations remain under the host application's control.
- Each integration must enforce its own server-side security rules.

## ADR-007: Separate Drafts from Published Pages

**Status:** Accepted

### Context
Users need to edit pages without immediately changing the public storefront.

### Decision
Maintain a distinction between editing state, saved drafts, and published configurations.

### Consequences
- Saving does not automatically publish.
- Publication requires an explicit integration action.
- Revision history and restoration can be implemented independently.

## ADR-008: Keep Subscription Billing in the Host SaaS

**Status:** Accepted

### Context
Different SaaS applications may have different subscription plans and billing providers.

### Decision
The engine declares feature requirements and adapts its editor interface to supplied entitlements. The host SaaS controls billing and enforces authorization.

### Consequences
- The engine remains reusable across SaaS products.
- Premium features can be configured by the host.
- Client-side restrictions never replace server-side authorization.

## ADR-009: Use Zod for Schema Validation and Type Inference

**Status:** Accepted

### Context
The engine requires robust, serializable validation of page documents, component properties, templates, and theme tokens at runtime. In TypeScript projects, keeping TypeScript types and runtime validators synchronized manually is error-prone.

### Decision
Adopt Zod as the primary schema validation library in `@dsk/core`. Infer TypeScript definitions directly from Zod schemas using `z.infer<typeof schema>`.

### Consequences
- `@dsk/core` has a single, lightweight runtime dependency for validation.
- Schema definitions and static TypeScript types are always in sync.
- Validation failures produce structured, actionable error paths and messages.
- Page documents can be verified recursively with safe data sanitization before rendering.

## ADR-010: Avoid Circular Dependencies via Inversion of Control for the Component Registry

**Status:** Accepted

### Context
In a modular monorepo, `editor` and `react-renderer` must discover and render registered components, while components declare metadata, settings schemas, and rendering views. Coupling `react-renderer` or `editor` directly to concrete component packages leads to circular dependencies (`editor` <-> `components` or `react-renderer` <-> `components`).

### Decision
Apply Inversion of Control (IoC). `@dsk/core` defines the registration interfaces (`ComponentDefinition`, `ComponentRegistry`). `@dsk/react-renderer` and `@dsk/editor` consume registries injected via props or React Context. `@dsk/components` exports default component implementations without depending on `editor` or `react-renderer`.

### Consequences
- Dependency direction remains strictly unidirectional: `components -> core`, `react-renderer -> core`, `editor -> core, react-renderer`.
- Zero circular dependencies.
- Consuming applications and SaaS hosts can easily extend or override the component registry with custom components without modifying engine internals.

## ADR-011: Use CSS Custom Properties (CSS Variables) for Design Tokens and Theming

**Status:** Accepted

### Context
The visual engine needs to apply global theme tokens (colors, typography, spacing, border-radii) and propagate changes dynamically across all components, both in the visual editor and in the production storefront, without causing full DOM re-renders or CSS conflicts with the host application.

### Decision
Generate and inject scoped CSS Custom Properties (e.g., `--dsk-color-primary`, `--dsk-spacing-md`) at the root container of the rendered page. Components consume these variables directly in their styling.

### Consequences
- Real-time theme updates in the editor occur instantly via DOM style mutation without re-rendering the React component tree.
- Compatible with React Server Components (RSC) and traditional SSR.
- Prevents CSS style collisions with host SaaS applications through a dedicated `--dsk-` namespace.

## Future Decisions

Add a new decision when a significant architectural choice is made.

Each entry should describe the context, the decision, its status, and its consequences.

Potential future topics include:
- Drag-and-drop library selection (`@dnd-kit/core`).
- Editor state management (`zustand`).
- Canvas isolation via sandboxed iframe vs Shadow DOM.
- Persistence adapter contracts.
- Public npm package naming and publishing workflow.
- License selection.
