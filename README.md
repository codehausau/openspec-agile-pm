# openspec-agile-pm

An OpenSpec product workflow with saved PRD brainstorming, adaptive discovery,
change-scoped capability PRDs, one cohesive living master PRD, deterministic
product approval, and requirement traceability before implementation.

The package is client-neutral at its core. An optional OpenCode adapter adds the
workflow commands and NanoPM-derived discovery skills.

## Current Release

**[v0.3.0](https://github.com/codehausau/openspec-agile-pm/tree/v0.3.0)** adds saved
PRD brainstorming with `/opsx-pm --shape` and an explicit draft-to-delivery handoff.
It retains the single approved master, schema version 5, and approval format 2.
See the [release notes](CHANGELOG.md#030), [upgrade commands](#updating-a-github-installation),
and [migration guide](#migrating-existing-installations-and-prds).

## Requirements

- Node.js `20.19.0` or newer
- OpenSpec `1.12.0` or a compatible newer release
- OpenCode only when installing the OpenCode adapter

## Install From GitHub

Install from the [codehausau/openspec-agile-pm](https://github.com/codehausau/openspec-agile-pm)
repository. Pin a release tag or commit so every collaborator receives the same
workflow version:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.3.0
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

The schema bundle also includes the client-neutral product-shaping contract at
`openspec/schemas/agile-pm/workflows/product-shaping.md` and its draft template.

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

Run these commands in the consuming project to upgrade to `v0.3.0`. Updating the
dependency alone does not replace the installed workflow assets; the `update`
step applies the new schema, commands, and managed configuration rules.

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.3.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

Verify `npx openspec-agile-pm --version` reports `0.3.0`, then restart OpenCode
after installing or updating its adapter. Commit the dependency/lockfile changes
and the updated workflow assets and install manifest in the consuming project.
Upgrading from `v0.2.0` adds the shaping resources without changing approval format;
existing valid format-2 approvals need no renewal solely for this upgrade. Legacy
PRDs from `v0.1.0` require the [migration steps](#migrating-existing-installations-and-prds)
below before they can publish a master.

## Product Workflow

Choose the conversation you need:

| Entry point | Outcome |
| --- | --- |
| `/pm-brainstorm <topic>` | Informal discussion; optional local research notes |
| `/opsx-pm --shape <draft-id> [topic]` | A saved, evolving PRD draft with no delivery increment required |
| `/opsx-pm --from-draft <draft-id>` | Explicitly begin selecting an increment from a saved draft |
| `/opsx-pm <idea-or-change>` | Shape and approve a delivery increment and the resulting master revision |

The shaping and draft-handoff modes are available in `v0.3.0`. For a project with an
existing installation manifest, follow [Updating A GitHub Installation](#updating-a-github-installation)
to install the new command and shared shaping resources, then restart OpenCode.

```text
brainstorm / saved PRD shaping (may continue indefinitely)
  -> explicit decision to scope a delivery increment
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

### Brainstorm A Living PRD

Start a named draft, or resume it in another session with the same command:

```text
/opsx-pm --shape product-vision
/opsx-pm --shape product-vision Explore what collaboration should feel like
```

The agent maintains `openspec/product-drafts/product-vision.md` as the discussion
develops. This is one cohesive working PRD, with vision, users, desired experiences,
candidate capabilities, evidence, alternatives, open questions, and a short resume
note. Partial sections and unresolved choices are welcome. Saving the draft does
not require selecting an MVP, assigning priorities, resolving acceptance criteria,
or deciding architecture and tasks.

The draft is always marked **Draft — unapproved**. It lives outside the delivery
change graph and can be committed and shared; it is not stored in ignored `.nanopm/`
research. The published `docs/product/prd.md` remains the approved master. Shaping
does not create a change, alter existing approvals, or publish product intent.
Accepting an idea or saying "looks good" continues the conversation without
triggering a handoff. Useful saved thinking is a successful stopping point.

On resume, the agent reads the saved draft, preserves your edits and parked ideas,
and continues from its open questions. If the approved master has changed, it
identifies the difference and reconciles affected ideas with you. It does not
discard your draft or silently rewrite the master.

When you explicitly want to choose delivery work:

```text
/opsx-pm --from-draft product-vision
```

This starts a conversation about which outcomes and capabilities to select. It
does not approve the draft or commit its whole contents to delivery. The normal
brief, capture, and PRD approval gates still apply. The product brief records the
draft path and content hash; subsequent brainstorming does not silently change
an approved increment. The draft remains available for further exploration.

`--shape` and `--from-draft` are interpreted by the agent's `/opsx-pm` command, not
by the OpenSpec CLI. Draft IDs are a single lowercase kebab-case name, such as
`product-vision`, not paths or filenames. Natural-language requests for saved PRD
brainstorming also select shaping; ambiguous mode switches prompt a question.

For another agent client, follow
`openspec/schemas/agile-pm/workflows/product-shaping.md` in the selected planning
home. Schema-only installation includes this contract and the template. For stores,
drafts live under the CLI-resolved planning home rather than the current checkout.

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
openspec/product-drafts/<draft>.md   # Exploratory, unapproved PRD (optional)
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

1. Install `v0.3.0`, then update the consuming project's bundle:

   ```bash
   npm install --save-dev github:codehausau/openspec-agile-pm#v0.3.0
   npx openspec-agile-pm update --dry-run
   npx openspec-agile-pm update
   npx openspec-agile-pm doctor
   ```

   Managed configuration contributions are replaced during update; user-owned
   rules and modified files are preserved or reported as conflicts. Review any
   custom repository instructions that still require archive-time PRD copies and
   align them with approval-time master publication. The installer does not edit
   repository instruction files or existing product documentation.

2. Quit and restart OpenCode after updating its adapter. If upgrading from `v0.2.0`
   with valid format-2 approvals, migration is complete. The remaining steps apply
   to legacy approvals or projects without a consolidated approved master.
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

With the `v0.3.0` bundle installed, start `/opsx-pm --shape product-vision`,
discuss a capability, and pause with a meaningful question still open. Confirm the
saved draft is marked unapproved and no delivery change or published master was
created. Start a fresh session with the same command and check that the agent
resumes the saved thinking rather than starting a new PRD. Accept an idea with
"looks good" and verify it continues shaping. Use `--from-draft product-vision`
and verify it asks what increment to select before creating delivery artifacts.
Repeat with an existing approved master and confirm shaping leaves its bytes and
approval record intact. These are agent-workflow smoke checks, not native CLI
approval enforcement.

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
