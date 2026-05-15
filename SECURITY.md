# Security Policy

Report security issues to **security@labmgm.org**. Default disclosure window: 90 days. Please do not open public GitHub issues for security reports.

## Threat model

`@labmgm/cli` is a Node.js CLI. The relevant supply-chain surface is:

- **Registry fetch.** `ds add` issues HTTPS requests to the configured `DS_REGISTRY_URL`. We honour the registry's TLS certificate and reject responses that aren't `200`. Path-traversal guards refuse to write outside the consumer's `cwd`.
- **Install commands.** `ds init` and `ds add` shell out to the consumer's package manager via `execa`. We never use shell strings — only argv arrays — so command injection from variable interpolation is structurally impossible.
- **Templates.** Bundled Next.js templates are static files rendered through a single-purpose mustache substitution that throws on unknown vars (no arbitrary expressions).
