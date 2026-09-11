# openspec-agile-pm

An approval-gated OpenSpec workflow that adds adaptive product discovery, an
owning PRD, capability PRDs, deterministic product approval, requirement
traceability, and archive-time product documentation before implementation.

The package is client-neutral at its core. An optional OpenCode adapter adds the
workflow commands and NanoPM-derived discovery skills.

## Requirements

- Node.js `20.19.0` or newer
- OpenSpec `1.12.0` or a compatible newer release
- OpenCode only when installing the OpenCode adapter

## Install From GitHub

Install from the [codehausau/openspec-agile-pm](https://github.com/codehausau/openspec-agile-pm)
repository. Pin a release tag or commit so every collaborator receives the same
workflow version:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.1.0
npx openspec-agile-pm init --client opencode --dry-run
npx openspec-agile-pm init --client opencode
```

No build or `prepare` step is required; the repository contains executable plain
JavaScript and all install assets.

For only the client-neutral OpenSpec workflow:

```bash
npx openspec-agile-pm init --schema-only
```

## Local Development Install

From another project:

```bash
npm install --save-dev /path/to/openspec-agile-pm
npx openspec-agile-pm init --client opencode --dry-run
npx openspec-agile-pm init --client opencode
```

## What It Installs

Schema assets:

```text
openspec/schemas/agile-pm/
```

Configuration is merged into `openspec/config.yaml`:

- selects `agile-pm` as the project schema
- preserves existing project context
- preserves existing rules and operation guidance
- adds only missing workflow requirements

With `--client opencode`:

```text
.opencode/commands/
.opencode/skills/
```

The installer records owned files, checksums, prior schema selection, and config
entries in `openspec/.agile-pm-install.json`. Commit the installed schema, adapter,
config, and manifest with the consuming project so every collaborator uses the same
workflow version.

It also adds a managed `.nanopm/` entry to the project's `.gitignore`, preserving
all existing ignore rules. Uninstall removes that entry only when this package
added it.

The package does not install sample changes, product-specific specs, generated
`docs/product/` content, or repository instruction files.

## Commands

```bash
openspec-agile-pm init --client opencode
openspec-agile-pm update --dry-run
openspec-agile-pm update
openspec-agile-pm doctor
openspec-agile-pm uninstall --dry-run
openspec-agile-pm uninstall
```

Common options:

```text
--client opencode|none
--schema-only
--cwd <project-path>
--dry-run
--force
```

`init` refuses to overwrite conflicting destination files. `update` replaces an
installed file only when it still matches the previous installed checksum.
`--force` is available for reviewed conflicts; it is never implied.

`uninstall` removes only unchanged package-owned files. Modified files are reported
and preserved. It removes only config entries originally added by the package and
restores the prior schema selection when safe.

## Updating A GitHub Installation

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.2.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

Restart OpenCode after installing or updating its adapter.

## Product Workflow

```text
brainstorm/discovery
  -> product brief
  -> owning PRD + capability PRDs
  -> explicit product approval
  -> proposal + specs + design
  -> tasks
  -> apply
  -> archive and publish approved product documentation
```

The optional `pm-*` skills write only local research under ignored `.nanopm/`.
`/opsx-pm` is the authoritative path into the approval-gated OpenSpec workflow.

## Development

```bash
npm install
npm run check
npm test
npm pack --dry-run
```

## License

MIT. NanoPM-derived skill notices are in `THIRD_PARTY_NOTICES.md`.
