# Design Document — DSK Visuel Engine

## 1. Vision

DSK Visuel Engine aims to provide a powerful, intuitive, and reusable visual website builder for SaaS platforms.

Users should be able to create professional storefronts by selecting templates, arranging components, customizing styles, and previewing their changes without writing code.

The product must combine ease of use for beginners with advanced customization capabilities.

## 2. Target Users

- Vendors who want to customize their online stores.
- SaaS platforms that need a reusable storefront builder.
- Developers who want to integrate a page builder into React or Next.js applications.
- Platform administrators who manage templates, components, and subscription features.

## 3. Core User Experience

The main workflow is:

1. Select a template from the catalog.
2. Preview the template.
3. Apply it to a store.
4. Customize pages, sections, and components.
5. Preview the result across devices.
6. Save the configuration as a reusable model if desired.
7. Publish the changes through the integrating SaaS.

Changing templates must not silently destroy existing work. The editor should warn users when an operation may replace or affect their current configuration.

## 4. Editor Layout

The editor interface is divided into four main areas.

### 4.1 Component Panel

The left panel contains:

- Basic elements.
- Layout components.
- Prebuilt sections.
- SaaS-connected components.
- Available templates and saved models.
- A search function for finding components.

Premium components may appear with a lock icon and an explanation of the required subscription.

### 4.2 Canvas

The central canvas displays the page being edited.

Users can:

- Select components.
- Drag and drop elements.
- Reorder sections.
- Move elements within supported containers.
- Resize supported components.
- Add or remove sections.
- Preview the page at different viewport sizes.

Selection indicators and drop zones must make editing actions clear.

### 4.3 Properties Panel

The right panel displays settings for the selected component.

Settings are organized into three categories:

- **Content:** text, images, links, labels, and component-specific content.
- **Style:** colors, typography, backgrounds, borders, and visual effects.
- **Layout:** alignment, dimensions, spacing, positioning, and responsive behavior.

Only properties explicitly supported by a component may be edited.

### 4.4 Top Toolbar

The toolbar provides:

- Undo and redo.
- Draft save status.
- Manual save.
- Preview mode.
- Desktop, tablet, and mobile viewport selection.
- Template switching.
- Publish action, when provided by the integrating SaaS.

## 5. Page Structure

Pages use a hierarchical structure:

Page → Sections → Containers and Layouts → Components.

A page may contain multiple sections. Sections may contain nested layout elements and registered components, subject to the rules of each component.

Every editable node must have a stable identifier so that the editor can track selection, changes, and history.

## 6. Template System

Templates define the initial structure, component arrangement, content defaults, and theme configuration of a page or storefront.

The catalog must support:

- Template previews.
- Categories and search.
- Template versions.
- Compatibility checks.
- Premium access rules.
- Registration of new templates without changing the engine core.

Applying a template must be a deliberate action. The editor should preserve existing work where possible and provide a clear warning before destructive replacement.

Users may save a customized storefront configuration as a reusable model.

## 7. Customization Rules

The editor allows users to customize supported content, styles, and layouts.

Each component must define:

- Editable properties.
- Default values.
- Validation rules.
- Available settings.
- Supported responsive options.
- Structural restrictions.
- Required permissions or subscription features, if applicable.

Essential business operations, such as checkout and payment processing, must remain controlled by the integrating SaaS.

The editor must not allow ordinary configuration changes to bypass business rules or security restrictions.

## 8. Responsive Design

The editor supports desktop, tablet, and mobile previews.

Responsive behavior should work automatically by default. Users may override supported settings for individual viewport sizes.

The system must provide sensible defaults so that a template remains usable on smaller screens without requiring extensive manual adjustments.

## 9. Design System

The engine provides centralized design tokens for:

- Colors and color palettes.
- Font families, sizes, and weights.
- Spacing.
- Border radii.
- Shadows.
- Layout widths.
- Other shared visual properties.

Components referencing a global token should update when that token changes.

Explicit component-level overrides must remain possible where supported.

## 10. Saving and History

The editor must support:

- Automatic draft saving.
- Manual saving.
- Clear save-status feedback.
- Undo and redo.
- Previous-version history.
- Restoration of a previous saved version.

Saving and publishing are separate operations.

A saved draft must not become publicly visible until the integrating SaaS publishes it.

The host application is responsible for persistent storage and access control.

## 11. Preview and Publishing

Preview mode displays the current draft without making it public.

Publishing must be an explicit action handled through the integrating SaaS.

The integration must determine:

- Who is allowed to publish.
- How published versions are stored.
- How publication failures are reported.
- How the previous published version can be restored.

The editor must communicate errors and success states clearly.

## 12. Subscription-Based Features

The engine must support configurable feature declarations.

Depending on the integrating SaaS, features may be restricted by subscription plan or usage limits.

When a user cannot access a feature, the interface should:

- Display a lock indicator where appropriate.
- Explain the restriction.
- Identify the required access level when known.
- Offer an upgrade action supplied by the host application.

The SaaS must enforce permissions on the server. Hiding or disabling a button in the editor is not sufficient security.

## 13. Accessibility and Usability

The editor should aim to provide:

- Clear labels and understandable controls.
- Keyboard-accessible interactions where practical.
- Visible focus indicators.
- Sufficient contrast.
- Helpful validation messages.
- Confirmation for destructive actions.
- Consistent behavior across the interface.

Drag-and-drop must not be the only way to reorder or move components when an accessible alternative is feasible.

## 14. Performance

The editor should remain responsive when working with complex pages.

The design should account for:

- Efficient rendering of component trees.
- Avoiding unnecessary updates.
- Lazy loading where appropriate.
- Controlled image sizes.
- Efficient history and draft updates.
- Large page configurations.

Performance targets will be defined and measured during implementation.

## 15. Security

The engine must:

- Render only registered components.
- Validate configuration data.
- Avoid executing arbitrary user-provided JavaScript.
- Sanitize untrusted content where necessary.
- Keep authentication, payment processing, and authorization under the host SaaS.
- Treat imported templates and configurations as untrusted input.

## 16. Design Success Criteria

The design will be considered successful when users can:

- Create a storefront from a template.
- Customize sections and nested components.
- Adapt a page to different screen sizes.
- Save drafts and recover previous versions.
- Preview changes before publishing.
- Reuse saved storefront models.
- Use subscription-restricted features with clear feedback.
- Complete these tasks without writing application code.

## 17. Scope Boundaries

DSK Visuel Engine is responsible for page configuration, visual editing, template management, rendering, and editor-level feature declarations.

The integrating SaaS remains responsible for vendor accounts, business data, billing, payment processing, authorization, persistent storage, and publication infrastructure.

This separation keeps the engine reusable across different applications.
