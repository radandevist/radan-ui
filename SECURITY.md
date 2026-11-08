# Security Policy

## Supported Versions

Only the latest minor release of `@radandevist/radan-ui` receives security fixes. A fix lands as a patch release on
that line; older minors are not backported.

| Version             | Supported |
| ------------------- | --------- |
| latest minor        | yes       |
| older minor lines   | no        |

## Reporting a Vulnerability

Do not open a public issue for a vulnerability. Use GitHub's **"Report a vulnerability"** button on the repository's
Security tab, which opens a private vulnerability report:
<https://github.com/radandevist/radan-ui/security/advisories/new>.

Include the affected version, a description of the issue, the impact on consumers, and a minimal reproduction. The
report stays private until a fix is released and the advisory is published.

## Response

We acknowledge a report within **7 days**, confirm whether it is in scope, and keep the reporter updated while the fix
is prepared. Once the patched version is published, the advisory is published with credit to the reporter unless they
prefer to stay anonymous.

Because the package is public and consumed by several apps, a security fix goes through the same gates as any other
change: a patch changeset, green CI, a "Version packages" PR, and a release from GitHub Actions with npm provenance.
No long-lived npm token is stored in this repository or in CI.
