# Contributing Guide — DSK Visuel Engine

## 1. Purpose

This document defines the development standards and contribution workflow for DSK Visuel Engine.

All contributions should preserve modularity, security, maintainability, accessibility, and compatibility.

## 2. Development Setup

Before contributing:

1. Install a supported Node.js LTS version.
2. Install pnpm.
3. Clone the repository.
4. Install dependencies with `pnpm install`.
5. Run the configured checks.
6. Start the playground application when available.

The exact supported tool versions will be documented in the project setup guide.

## 3. Code Standards

- Use TypeScript for application and package source code.
- Prefer explicit types for public APIs.
- Avoid `any` unless there is a documented justification.
- Use clear and descriptive names.
- Keep functions and modules focused on a single responsibility.
- Prefer reusable utilities over duplicated logic.
- Handle errors explicitly.
- Avoid unnecessary dependencies.
- Follow the repository's formatter and linter configuration.

## 4. Naming Conventions

Use the following conventions unless a package has a documented reason to differ:

- Files and folders: `kebab-case`.
- React components and TypeScript types: `PascalCase`.
- Variables and functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` when appropriate.
- Boolean variables: descriptive names such as `isValid` or `hasAccess`.
- Component identifiers: stable, unique strings.

Public names must be consistent across packages and documentation.

## 5. Package Boundaries

Each package must respect its defined responsibility.

- `core` must remain independent of React and Next.js.
- `react-renderer` handles rendering validated documents.
- `editor` handles visual editing interactions.
- `components` contains registered component implementations and metadata.
- `templates` contains predefined template configurations.
- `playground` demonstrates and tests package integration.

Avoid circular dependencies.

Do not move SaaS-specific authentication, billing, payment processing, or database logic into the engine.

## 6. Component Contributions

Every new component should provide, where applicable:

- A unique component identifier.
- A TypeScript definition.
- A property schema.
- Valid default values.
- A rendering implementation.
- Editable property metadata.
- Responsive behavior declarations.
- Tests.
- Documentation.
- Accessibility considerations.

Components must use the approved registration system.

Never execute arbitrary JavaScript supplied by a page configuration.

## 7. Template Contributions

Every new template should include:

- A unique identifier.
- A template version.
- Display metadata.
- A compatible document schema version.
- Required component identifiers.
- A valid initial page configuration.
- Theme defaults where needed.
- A preview or representative example.
- Validation tests.

Templates must use registered components and supported configuration formats.

## 8. Testing Requirements

Before submitting a change:

- Run relevant unit tests.
- Run type checking.
- Run linting and formatting checks.
- Add tests for new behavior.
- Add regression tests for fixed bugs.
- Test compatibility when shared schemas or public APIs change.

Changes to validation, rendering, migrations, permissions, or package interfaces require particular care.

## 9. Documentation Requirements

Update the relevant documentation whenever a change affects:

- Public APIs.
- Component properties.
- Page document schemas.
- Template formats.
- Package dependencies.
- Installation or integration steps.
- Security boundaries.
- Supported framework versions.

Significant architectural decisions should be recorded in `docs/DECISIONS.md`.

## 10. Security Requirements

Contributions must not:

- Execute arbitrary scripts from page documents.
- Bypass host application authorization.
- Expose secrets or credentials.
- Trust imported template data without validation.
- Treat client-side subscription restrictions as sufficient authorization.
- Introduce unsafe handling of untrusted content.

Report security concerns privately through the process defined in `SECURITY.md`.

## 11. Git Workflow

Use descriptive branch names, for example:

- `feat/component-registry`
- `feat/template-preview`
- `fix/document-validation`
- `docs/architecture-guide`

Write clear commit messages that describe the change.

Suggested commit format:

`type(scope): short description`

Examples:

- `feat(core): add page document schema`
- `feat(editor): add component selection`
- `fix(renderer): handle unknown component types`
- `docs(readme): clarify project setup`

## 12. Pull Request Checklist

Before a change is considered ready, verify:

- [ ] The purpose of the change is clear.
- [ ] Package boundaries are respected.
- [ ] TypeScript checks pass.
- [ ] Relevant tests pass.
- [ ] Formatting and linting checks pass.
- [ ] Public APIs are documented.
- [ ] Security implications have been considered.
- [ ] Compatibility implications have been considered.
- [ ] No unrelated changes are included.

## 13. Dependency Changes

Before adding a dependency:

1. Confirm that it is necessary.
2. Check maintenance and compatibility.
3. Consider bundle size and security.
4. Avoid duplicating existing functionality.
5. Document important architectural implications.

Dependencies used by published packages should be declared correctly.

## 14. Contribution Status

The contribution workflow will be refined as repository tooling, CI checks, branch protection, and release automation are implemented.
