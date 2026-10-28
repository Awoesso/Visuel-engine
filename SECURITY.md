# Security Policy — DSK Visuel Engine

## 1. Purpose

Security is a core requirement of DSK Visuel Engine.

The engine processes page configurations, templates, component properties, and data provided by external applications. All external input must be treated as potentially untrusted.

This policy defines the security principles that guide development and vulnerability reporting.

## 2. Security Objectives

- Prevent arbitrary code execution through page configurations.
- Validate imported templates and page documents.
- Protect the integrity of rendered pages.
- Prevent unauthorized access to restricted features.
- Keep sensitive business logic under the control of the integrating SaaS.
- Minimize exposure to cross-site scripting (XSS).
- Avoid leaking credentials, secrets, or private data.
- Maintain secure dependencies and release processes.

## 3. Untrusted Input

The following inputs must be treated as untrusted:

- Imported templates.
- Saved page documents.
- Component properties.
- User-provided text and links.
- External image and media references.
- Data returned by integrations.
- Documents created by older engine versions.

All relevant inputs must be validated before they are used.

Validation must include structural rules, property types, supported component identifiers, and applicable resource limits.

## 4. No Arbitrary Code Execution

Page documents must contain structured data, not executable application code.

The engine must not evaluate arbitrary JavaScript supplied through:

- Template configurations.
- Component properties.
- Imported page documents.
- Vendor customization fields.

Only registered and approved component implementations may be rendered.

If custom extensions are introduced in the future, they must use an explicit, reviewed extension mechanism with appropriate security boundaries.

## 5. Rendering and Content Safety

The renderer and components must handle untrusted content safely.

Requirements include:

- Avoid unsafe HTML injection.
- Sanitize HTML when rich-text support requires it.
- Validate URLs used for links and media.
- Restrict dangerous URL schemes where appropriate.
- Avoid unsafe DOM manipulation.
- Validate component properties before rendering.
- Handle unknown component types safely.

Security checks must be implemented at the appropriate boundaries rather than relying solely on the editor interface.

## 6. Authentication and Authorization

DSK Visuel Engine does not own the authentication system of the integrating SaaS.

The host application is responsible for:

- Authenticating users.
- Verifying vendor ownership.
- Enforcing access to saved documents.
- Authorizing publication.
- Protecting administrative operations.
- Enforcing subscription entitlements on the server.

The engine may display or disable interface features according to supplied permissions, but client-side restrictions must never be treated as the security boundary.

## 7. SaaS Data Integration

Components that display products, prices, inventory, or other business data must use controlled integration interfaces.

The engine must not access the host application's database directly.

The host application remains responsible for validating sensitive operations, including cart changes, checkout, pricing, inventory updates, and order creation.

Client-provided values must not be trusted for business-critical decisions.

## 8. Secrets and Sensitive Data

- Never commit API keys, passwords, tokens, or private credentials.
- Use environment variables or an appropriate secrets-management system.
- Do not expose server-only secrets to browser code.
- Avoid logging authentication tokens or sensitive customer data.
- Keep private configuration separate from public page documents.

Example environment files must contain placeholders rather than real credentials.

## 9. Resource Limits

Page documents and imported templates can be malformed or excessively large.

The implementation should enforce appropriate limits for:

- Document size.
- Nesting depth.
- Number of nodes.
- Component property sizes.
- Imported resource counts.
- Processing time where applicable.

Limits must prevent unreasonable resource consumption without unnecessarily restricting legitimate pages.

## 10. Dependencies and Supply Chain

Dependencies must be reviewed for maintenance, compatibility, and known vulnerabilities.

The project should:

- Keep dependencies updated.
- Use a lockfile.
- Run dependency security checks.
- Review new dependencies before adoption.
- Remove unnecessary packages.
- Protect the release process and package credentials.

Published packages must contain only intended files and artifacts.

## 11. Security Testing

Security testing should cover:

- Invalid page configurations.
- Unknown component identifiers.
- Unsafe URLs and HTML content.
- Unexpected property types.
- Excessive document nesting.
- Unauthorized publication attempts in host integrations.
- Feature entitlement bypass attempts.
- Vulnerable dependencies.

Security regressions should receive automated tests where practical.

## 12. Vulnerability Reporting

Do not publish details of an unpatched vulnerability in a public issue.

Report security concerns privately to the repository maintainers through a designated private reporting channel.

A public security contact will be documented here before the first public release.

Reports should include:

- A description of the issue.
- Affected package or version.
- Steps to reproduce the issue, when safe to provide.
- Potential impact.
- Suggested remediation, if known.

Do not include real customer secrets or private data in a report.

## 13. Response and Disclosure

Maintainers should assess reported vulnerabilities, determine their impact, and prepare fixes where necessary.

Affected users should receive appropriate information when a vulnerability is confirmed and a disclosure is safe.

The response process and supported security-update policy will be formalized before stable public distribution.

## 14. Current Status

This policy describes the intended security requirements.

Security controls, automated checks, reporting channels, and release procedures must be implemented and verified before the project is considered production-ready.
