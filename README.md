# openspec-agile-pm

Human-led product discovery, saved PRD shaping, requirements elicitation/review, and
approval-gated delivery for OpenSpec. The core workflow is client-neutral; an
optional OpenCode adapter supplies commands and NanoPM-derived research skills.

## Current Release

**[v0.7.0](https://github.com/codehausau/openspec-agile-pm/tree/v0.7.0)**
adds a per-task review loop to `/opsx-apply`: every task ends in a mandatory
independent agent review and a human prompt, and is checked off only once accepted.
It retains **schema version 6 / approval format 3**, with the reviewed product handbook
and MkDocs navigation published at archive time. See the [release notes](CHANGELOG.md#070) and
[migration guide](#migrating-existing-installations-and-prds).

## Requirements

- Node.js 20.19.0 or newer
- OpenSpec 1.12.0 or a compatible newer release
- OpenCode only for the optional adapter
- The consuming project's MkDocs toolchain for documentation build verification;
  it is not required to install this package and is not installed implicitly

## Install This Checkout

From the consuming project:

```bash
npm install --save-dev /path/to/openspec-agile-pm
npx openspec-agile-pm init --client opencode --dry-run
npx openspec-agile-pm init --client opencode
npx openspec-agile-pm doctor
```

For an existing managed installation, use `update`, not `init`:

```bash
npm install --save-dev /path/to/openspec-agile-pm
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

Quit and restart OpenCode after updating its commands/skills. Review the
[migration guide](#migrating-existing-installations-and-prds) before continuing an
existing approved change. No build or package `prepare` step is required.

## Install A Tagged GitHub Release

Pin a release tag or commit for reproducible installations. For a new installation:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.7.0
npx openspec-agile-pm init --client opencode --dry-run
npx openspec-agile-pm init --client opencode
```

For an existing managed installation:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.7.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Verify the version is `0.7.0` and restart OpenCode. Existing v0.5.0 and v0.6.0 drafts
and format-3 approvals need no migration; follow the migration guide for older approvals.
v0.4.0 and older tags retain their historical workflows.

## What It Installs

```text
openspec/schemas/agile-pm/          # Schema, templates, shared workflows, examples
.opencode/commands/                # Optional OpenCode adapter
.opencode/skills/                  # Optional PM research skills
openspec/.agile-pm-install.json    # Owned paths, checksums, config contributions
```

The installer merges `openspec/config.yaml`: selects `agile-pm`, preserves consumer
context/rules/operation guidance, and adds missing workflow contributions. Updates
replace unchanged package-owned files and previously owned config contributions.
Modified files are conflicts; `--force` is available only after review, never implied.
Uninstall preserves modified or consumer-owned files and restores prior config
where safe. A managed `.nanopm/` ignore entry keeps optional research local.

Commit the dependency lockfile, installed bundle, config, and manifest in the
consuming repository. Installation does **not** create or migrate product PRDs,
approvals, published pages, a project MkDocs config, or repository instruction files.

```bash
npx openspec-agile-pm init --schema-only
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm doctor
npx openspec-agile-pm uninstall --dry-run
```

Common options: `--client opencode|none`, `--schema-only`, `--cwd <project-path>`,
`--dry-run`, and `--force`.

## Product Workflow

| Step | Result | Publication behavior |
| --- | --- | --- |
| **PM** | Review the increment and complete proposed product-document changes | Candidate files live in the change |
| **Approval** | Approve requirements, proposed pages, navigation, and publication plan | Only the approval record is written |
| **Delivery** | Reconcile implementation/acceptance learning and reapprove when needed | Published handbook stays intact |
| **Archive** | Verify reviewed bytes and current baseline; publish pages/navigation; archive history | Exact approved files update the cumulative handbook |

```text
idea -> product shaping -> living PRD with journeys / flows / capabilities
     -> requirements elicitation and analysis -> requirements quality review
     -> optional architecture note (offered, never assumed)
     -> explicit delivery scoping -> product brief -> increment PRDs
     -> product-docs + publication-plan
     -> explicit approval -> proposal -> specs + design -> tasks -> apply
     -> delivery/acceptance reconciliation and reapproval if needed
     -> archive: verify baseline -> publish product set and MkDocs -> preserve history
```

Exploration and review can repeat at the human's pace; direct delivery planning is
still supported. A reviewed exploratory draft is neither an increment nor approval.

### Per-Task Review During Apply

Each task ends in a mandatory independent agent review: a fresh, read-only reviewer
checks the task against its cited PRD requirements, spec scenarios, design, and stated
verification. Blocking findings are fixed and re-reviewed, at most three rounds, until
it passes or escalates. The human is then prompted to accept, accept and stop
prompting for the rest of the run, review it themselves, or request changes. A task
is checked off in `tasks.md` only once accepted. Agent review cannot be waived; human
prompts can. See
[`workflows/task-review.md`](assets/openspec/schemas/agile-pm/workflows/task-review.md).
This is a prompt-level contract, like the rest of the workflow, not CLI enforcement.

The authoritative client-neutral contract is
[`workflows/product-publication.md`](assets/openspec/schemas/agile-pm/workflows/product-publication.md).
It defines paths, approval digests, baseline checks, navigation preservation,
publication/rollback, and migration. The OpenCode commands adapt that same contract.
Native OpenSpec file-existence status is not an approval or publication validator;
its bare archive command does not execute this custom transaction.

## Product Handbook Structure

```text
mkdocs.yml                         # Or the project's existing mkdocs.yaml
docs/product/
  README.md                        # Stable entry link and historical catalog
  prd.md                           # High-level product opening and exact indexes
  capabilities/
    invitations.md                 # User-facing behavior, requirements, flows
  system-capabilities/
    access-control.md              # Shared/enabling behavior and constraints
  .publication.json                # Derived provenance for the published set
```

`prd.md` explains vision, users, outcomes, boundaries, and relationships. Detailed
requirements, acceptance outcomes, journeys, Mermaid flows/text equivalents,
dependencies, and exclusions live in indexed capability pages. System capabilities
use the same product-oriented detail for cross-cutting behavior; they are not
component architecture documents or a dumping ground for every NFR. Either category
may be empty. Product-wide journeys may remain in the overview.

Each increment revises stable product-wide pages, retaining unaffected requirements
and their qualified IDs. It does not publish a dated duplicate or make readers
assemble separate increments. Archive completion is not proof of deployment:
availability and acceptance evidence must remain explicit.

### Review Artifacts

```text
openspec/changes/<change>/
  prd.md                           # This increment and its capability index
  prd/capabilities/**/*.md          # Increment requirements, including system kind
  product-docs/
    prd.md                         # Complete proposed product overview
    capabilities/**/*.md
    system-capabilities/**/*.md
    README.md
    mkdocs.yml                     # Full proposed config; never the live config
  product-publication.yaml         # Complete baseline, mappings, explicit removals
  product-approval.md               # Approval format 3
  product-history/<digest>/         # Prior approved manifest files and records
```

The increment index records each capability's kind and product page. Existing
`<change>#<capability-path>/FR-001` or NFR identities survive page reclassification.
Carried-forward requirements do not become new work for this increment. Both
increment and cumulative pages are reviewed together before approval.

### Approval And Baseline Protection

Format 3 approves a deterministic raw-byte manifest: increment `prd.md`, indexed
capability PRDs in bytewise order, `product-publication.yaml`, then all plan-mapped
sources in bytewise order (including the staged MkDocs config). The approval records
the digest/count, plan hash, and full baseline-manifest digest. The baseline includes
all current and proposed managed targets, removals, MkDocs, and provenance, using
hashes or explicit `absent` entries.

Any change to approved content, diagrams, paths, navigation, or the plan requires
history preservation and reapproval. Concurrent archives, externally edited pages,
or even unrelated MkDocs changes cause baseline drift: reconcile/rebase with the
human and obtain renewed approval rather than silently overwriting newer work.

### Archive Publication And MkDocs

Archive verifies delivery/acceptance claims, approval, the complete baseline, and
normal spec reconciliation. It acquires a planning-home lock, journals recoverable
previous state, stages and checks approved pages, publishes exact bytes, writes
derived provenance, then moves/verifies the change/history. Failure restores the
previous product files, config, and change location; incomplete recovery retains
its journal. No unreviewed rewriting or status promotion happens at archive.

The staged MkDocs configuration preserves existing site settings, plugins, custom
tags, comments, and unrelated navigation. Only the reviewed Product subtree/setup
changes. Navigation honors `docs_dir`; conflicting layouts or config filenames need
human resolution. Build the proposed site using the consuming project's toolchain:

```bash
mkdocs build --strict -f <staged-config>
```

Missing tooling is disclosed and needs an explicit closeout decision; broken links
or actual build failures require correction/reapproval. The workflow does not
implicitly install MkDocs themes or plugins. Mermaid syntax checks and rendered
layout checks are reported separately.

## Conversation Entry Points

| Command | Outcome |
| --- | --- |
| `/pm-brainstorm <topic>` | Informal exploration; optional local research |
| `/opsx-pm --shape <draft-id> [topic]` | Saved exploratory PRD without selecting delivery work |
| `/opsx-pm --requirements <draft-id>` | Elicit and quality-review candidate requirements in an existing draft |
| `/opsx-pm --from-draft <draft-id>` | Explicitly start selecting an increment from a draft |
| `/opsx-pm <idea-or-change>` | Review and approve an increment and proposed documentation set |
| `/opsx-propose <change>` | Engineering planning from the approved set |
| `/opsx-update <change>` | Reconcile existing engineering artifacts after reapproval |
| `/opsx-apply <change>` | Implement approved tasks with a per-task agent review and human prompt; return product discoveries for review |
| `/opsx-archive <change>` | Publish the reconciled approved product set and archive history |

PM research skills (`pm-discovery`, `pm-opportunities`, `pm-solutions`,
`pm-challenge-me`) write optional local research under ignored `.nanopm/`. Research
selection is never product-owner approval.

### Saved PRD Shaping And User Flows

Shaping maintains `openspec/product-drafts/<draft-id>.md` as **Draft — unapproved**.
The draft can remain partial indefinitely. It does not require priorities, an MVP,
architecture, tasks, or a delivery increment. Resume the same command to continue
from its open questions; accepting an idea or saying "looks good" does not select
delivery work. The shared contract is
[`workflows/product-shaping.md`](assets/openspec/schemas/agile-pm/workflows/product-shaping.md).

```text
/opsx-pm --shape product-vision Map the journey of an invited writer joining a project
/opsx-pm --shape product-vision Explore accepting, declining, and invalid-invitation recovery
/opsx-pm --requirements product-vision
/opsx-pm --from-draft product-vision
```

### Optional Architecture Note

Sometimes the artifact you want after a shaping session is the technical sketch, not
a delivery increment. At the end of a session shaping offers — once, and only when
the draft has enough shape — to write `docs/architecture/<note-id>.md`: the technical
question, candidate approaches, trade-offs, and the unknowns that would decide
between them. Declining is the default; silence or "looks good" is not consent.

The note is Markdown with embedded Mermaid — `flowchart`, `sequenceDiagram`, or
`stateDiagram-v2` for component boundaries, interaction sequences, topology, or
lifecycle state — and a text equivalent after each diagram. Structurally different
approaches get their own diagram, and a diagram never introduces a component or
behavior the prose does not state.

The note is **Exploratory — unapproved**. It is not a `design.md`, never enters the
PRD-set manifest or any approval digest, and authorizes no code. It is evidence for a
later `design.md`, which still requires the approved PRD set and the normal
engineering gates.

Journey tables describe goals/stages/touchpoints/evidence; inline Mermaid flows
describe task decisions, alternatives, failure, and recovery with text equivalents.
Do not invent research or let diagrams introduce scope. During delivery, the views
move into the corresponding detailed capability/system-capability page and are
covered by approval. See the [worked journey example](assets/openspec/schemas/agile-pm/examples/user-journeys.md)
and [multi-file publication example](assets/openspec/schemas/agile-pm/examples/publication/README.md).

### Requirements Elicitation And Quality Review

Use `/opsx-pm --requirements <draft-id>` on an existing living draft. It acts as an
AI-assisted requirements analyst: choose a capability, journey, or uncertainty with
the human, elicit observable behavior, then perform a distinct quality-review pass.
To review first, invoke the same mode and ask “Review the existing invitation
requirements for ambiguities, conflicts, and gaps.” Resume the command to continue
from the saved focus. These mode flags are mutually exclusive agent arguments,
not installer or OpenSpec CLI flags; `--requirements` requires an existing draft ID.

The same `openspec/product-drafts/<draft-id>.md` holds:

- **Candidate Requirements** by capability: behavioral statement, rationale,
  source/journey, proposed acceptance evidence, exploratory status, and open questions.
- **Cross-Cutting Requirements** where relevant, including security, performance,
  reliability, accessibility, data/retention, interoperability, and operating context.
- **Requirements Analysis**: ambiguities, conflicts, missing information, unverified
  assumptions, gaps, and a review summary with coverage and remaining questions.

For example, “The system SHALL display valid geospatial records on the map” expresses
behavior; validity and acceptance evidence may still need clarification. Frameworks,
components, APIs, and implementation tasks belong to later engineering work. Unknown
thresholds stay unknown; empty categories need no invented requirements. Sources and
inferences remain distinct. `Human-confirmed intent` means an expressed preference,
not approval, and SHALL wording does not make a candidate binding.

Requirements analysis retains **Draft — unapproved** and `Mode: product-shaping`.
It selects no MVP or increment, assigns no final change-scoped requirement IDs, and
creates no delivery change, approval, published pages, or engineering artifacts.
The shared contract is
[`workflows/requirements-analysis.md`](assets/openspec/schemas/agile-pm/workflows/requirements-analysis.md);
see the [fictional partial draft and review](assets/openspec/schemas/agile-pm/examples/requirements-analysis.md).
Schema-only clients can follow that installed contract directly.

Only an explicit delivery-scoping request, such as `/opsx-pm --from-draft <draft-id>`,
starts selection. Review selected candidates and applicable shared constraints,
dependencies, evidence, and open findings. Material scope/acceptance questions must
be resolved before PRD approval. Capture the draft path/hash and selected headings;
assign formal FR/NFR IDs in the detailed increment PRDs. Unselected ideas remain
exploratory. Normal capture, pursue, full-set approval, and engineering handoff gates
still apply, with publication at archive time.

Existing drafts gain useful sections on resume, preserving their content. A managed
bundle update installs the workflow/template/example without rewriting drafts or
approval records. This additive workflow retains schema 6 and approval format 3.

## Migrating Existing Installations And PRDs

This is a workflow migration, not a silent reinterpretation of earlier approvals.

1. Install v0.7.0 (or this checkout) and run the
   managed `update --dry-run`, `update`, and `doctor` commands. Restart OpenCode.
2. Review custom repository instructions/configuration that still require a single
   master or immediate publication. The installer replaces its own contributions,
   preserving/reporting consumer-owned content rather than rewriting it silently.
3. For an active legacy change, use `/opsx-pm <change>`. Preserve its original
   approved files and record in `product-history/`, verifying its original digest.
   Reconcile the overview, capability/system classification, detailed requirements,
   navigation, and publication plan with the human; obtain explicit **format-3**
   approval for archive-time publication.
4. Retain implementation and existing engineering artifacts. Reconcile affected
   artifacts after approval; product learning does not force a phase restart.
5. Publish the new layout only when the migration change archives. If only archived
   records exist, create a consolidation change. Preserve single-master publication
   and dated history until then; never edit old approval records to claim format 3.

Format-2 approvals from v0.2.0–v0.4.0 and earlier approvals remain historical
evidence, not authority for the new publication contract. A docs-only consolidation
can use `skip_specs: true` only if its change-scoped PRDs contain zero Must
requirements; unaffected requirements carried into the handbook are product context.

## Workflow Smoke Test

In a disposable consuming project:

```text
/opsx-pm --shape invitation-vision Explore an invited writer deciding whether to join
/opsx-pm --requirements invitation-vision
Review the invitation candidates for ambiguities, conflicts, missing evidence, and gaps.
```

Confirm only the living draft was saved, still unapproved. Leave validity or a
performance threshold unknown; verify the review records the question without
inventing an answer. Say “looks good”, then resume `--requirements`: it should
continue analysis without creating a change, final IDs, approval, or publication.
Try a missing draft and combined mode flags; both should stop before writes.
Use `/opsx-pm --from-draft invitation-vision` explicitly, then select a subset with
the human. Verify shared constraints and unresolved findings are reviewed and
unselected candidates stay exploratory. Continue with the delivery smoke test:

1. Create an increment with one user capability and one system capability. Review
   overview/detail separation, journeys/flows, stable IDs, and complete navigation.
2. Approve the full set. Confirm published pages and live MkDocs remain unchanged
   (or absent for the first increment), and engineering preflight accepts this.
3. Revise a product outcome during delivery. Verify previous approved bytes are
   preserved and the new pages/navigation require reapproval.
4. Archive after closeout. Verify mapped target bytes equal the approved source
   files, links/build checks pass, historical/unrelated content is preserved, and
   `.publication.json` resolves to the archived approval.
5. Prepare two changes against the same baseline. Archive one; the other's archive
   must require rebase/reapproval. Exercise a retired page and interrupted publication
   recovery without losing the previous handbook or moving the change prematurely.

Automated asset tests check graph/contracts, installed resources, preservation,
example links/navigation, and Mermaid syntax. They do not execute an agent's
publication transaction or establish real delivery/acceptance outcomes.

## Development

```bash
npm install
npm run check
npm test
npm run test:diagrams
npm pack --dry-run
```

Mermaid/JSDOM are development-only dependencies. Parsing verifies syntax, not
visual layout or product consistency. Installer tests use disposable projects.
The example's strict MkDocs build runs when `python3 -m mkdocs` is available, or
when `MKDOCS_PYTHON` names a Python environment containing MkDocs. For example:

```bash
MKDOCS_PYTHON=/path/to/venv/bin/python npm test
```

Without MkDocs, that one optional build test reports a skip; example mapping,
navigation, link checks, and Mermaid syntax checks still run.

### Releasing

Align package and lockfile versions, release notes, and install examples. Run the
checks above and commit/tag only as part of an explicitly requested release.
GitHub installs resolve the selected tag; updating a branch does not change it.

## License

MIT. NanoPM-derived notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
