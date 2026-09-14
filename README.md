# openspec-agile-pm

An approval-gated OpenSpec workflow that adds adaptive product discovery,
change-scoped capability PRDs, one cohesive living master PRD, deterministic
product approval, and requirement traceability before implementation.

The package is client-neutral at its core. An optional OpenCode adapter adds the
workflow commands and NanoPM-derived discovery skills.

## Current Release

**[v0.2.0](https://github.com/codehausau/openspec-agile-pm/tree/v0.2.0)** introduces
the single living master PRD and approval-time publication (schema version 5,
approval format 2). See the [release notes](CHANGELOG.md#020) and
[migration guide](#migrating-existing-installations-and-prds) when upgrading from
`v0.1.0`.

## Requirements

- Node.js `20.19.0` or newer
- OpenSpec `1.12.0` or a compatible newer release
- OpenCode only when installing the OpenCode adapter

## Install From GitHub

Install from the [codehausau/openspec-agile-pm](https://github.com/codehausau/openspec-agile-pm)
repository. Pin a release tag or commit so every collaborator receives the same
workflow version:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.2.0
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

Run these commands in the consuming project to upgrade to `v0.2.0`. Updating the
dependency alone does not replace the installed workflow assets; the `update`
step applies the new schema, commands, and managed configuration rules.

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.2.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

Verify `npx openspec-agile-pm --version` reports `0.2.0`, then restart OpenCode
after installing or updating its adapter. Commit the dependency/lockfile changes
and the updated workflow assets and install manifest in the consuming project.
Existing approved PRDs require the [migration steps](#migrating-existing-installations-and-prds)
below before they can publish a master under the new workflow.

## Product Workflow

```text
brainstorm/discovery
  -> product brief
  -> change-scoped PRD + capability PRDs
  -> full proposed master PRD revision + baseline diff
  -> explicit product approval and immediate master publication
  -> proposal + specs + design
  -> tasks
  -> apply
  -> archive the change and its approval history
```

The optional `pm-*` skills write only local research under ignored `.nanopm/`.
`/opsx-pm` is the authoritative path into the approval-gated OpenSpec workflow.

### One Enduring Product PRD

`docs/product/prd.md` is the single, self-contained document for current approved
product intent. It includes the product vision, users, outcomes, boundaries, and
detailed requirements grouped by capability. New increments revise this document:
they integrate additions, replace changed requirements, retire removed requirements,
and reconcile exclusions and dependencies while preserving unaffected content.

```text
docs/product/
  README.md                         # Stable link to the master
  prd.md                            # Current approved full product document
openspec/changes/<change>/
  prd.md                            # This increment's engineering scope
  prd/capabilities/**/*.md           # This increment's detailed requirements
  master-prd.md                      # Full proposed/approved product revision
  product-approval.md                # Approval of both increment and master
  product-history/<prd-set-digest>/  # Prior approvals revised within this change
openspec/changes/archive/<target>/   # The entire change after archive
```

The agent prepares `master-prd.md` from the current master and the proposed
increment **before approval**, then presents the full result and its baseline diff.
Approval publishes that exact file's bytes to `docs/product/prd.md` immediately;
archive preserves history and does not publish another product copy. Requirement
identities and historical approval records provide traceability without making
readers assemble a product description from separate increments.

The master describes **approved intent**, not necessarily shipped functionality.
New or changed requirements are marked delivery pending; availability claims need
evidence. Unaffected requirements carried forward in the master are not new tasks
for the increment. The master is revised through approval, not edited directly.

Schema version 5 uses approval format 2. Its deterministic PRD-set manifest orders
`prd.md` first, indexed capability files in bytewise lexical path order next, and
`master-prd.md` last. The approval also records raw-byte SHA-256 hashes for the
master and its baseline (`absent` for first publication). A changed baseline requires
rebasing and renewed human review, preventing one pending change from overwriting
another approved increment. Publication is serialized with a planning-home lock,
staged, verified, and rolled back on failure. Later approved descendant revisions
are valid during archive; archiving an older change never restores its older master.

These are client-neutral schema and agent workflow contracts, including explicit
filesystem actions at approval. The OpenCode adapter follows the same contract.
OpenSpec's native file-existence status alone does not enforce approval, publication,
or semantic reconciliation; agents must execute the prescribed preflights.

### Migrating Existing Installations And PRDs

1. Install `v0.2.0`, then update the consuming project's bundle:

   ```bash
   npm install --save-dev github:codehausau/openspec-agile-pm#v0.2.0
   npx openspec-agile-pm update --dry-run
   npx openspec-agile-pm update
   npx openspec-agile-pm doctor
   ```

   Managed configuration contributions are replaced during update; user-owned
   rules and modified files are preserved or reported as conflicts. Review any
   custom repository instructions that still require archive-time PRD copies and
   align them with approval-time master publication. The installer does not edit
   repository instruction files or existing product documentation.

2. Quit and restart OpenCode after updating its adapter.
3. For an active change, run `/opsx-pm <change-name>`. Older approvals must be
   preserved in `product-history/`, then replaced by explicit format-2 approval of
   the increment and full master revision. A legacy digest alone does not approve
   consolidation or immediate publication.
4. If only archived changes remain, start a new `/opsx-pm` consolidation change.
   Review the relevant historical approved PRDs together, resolve contradictions
   with the product owner, and approve the resulting master. Do not assume the
   latest increment contains the whole product. A documentation-only consolidation
   can use `skip_specs: true` when its change-scoped PRDs contain zero Must
   requirements; existing Must requirements in the master remain product context.

Existing `docs/product/<archive-target>/` directories and catalog rows remain
historical records. The first master approval adds a stable master link to the
README while preserving those records. Drafting, rejection, or withdrawal of an
unapproved revision leaves the last approved master intact. Reversing published
intent requires a new reviewed revision of the current master.

### Workflow Smoke Test

In a disposable consuming project with the updated bundle, use `/opsx-pm` to approve
an initial product increment. Before `/opsx-apply` or archive, verify that
`docs/product/prd.md` exists and is byte-identical to that change's `master-prd.md`:

```bash
CHANGE=your-change-name
cmp docs/product/prd.md "openspec/changes/$CHANGE/master-prd.md"
```

Approve another increment that adds a capability and modifies an existing one.
Review that the master retains unaffected requirements, replaces old wording,
and reconciles any conflicting exclusions. Draft two changes from the same baseline
and approve one: the other must require rebase and review before publication.
Archive the earlier change and confirm it does not overwrite the newer master or
create a new dated product directory. For stores, run filesystem checks at the
resolved planning-home root.

## Development

```bash
npm install
npm run check
npm test
npm pack --dry-run
```

### Releasing

Keep `package.json`, the root package versions in `package-lock.json`, the README
install/upgrade examples, and `CHANGELOG.md` aligned before releasing. Run the
development checks above, commit the release changes, and create an annotated
`v<package-version>` tag on that commit. Push both the release commit and tag;
verify the remote tag points to the release commit before announcing it. GitHub
installations resolve the tag, so pushing `main` alone does not update a pinned
installation.

## License

MIT. NanoPM-derived skill notices are in `THIRD_PARTY_NOTICES.md`.
