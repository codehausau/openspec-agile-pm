# Changelog

## 0.10.0

### Added

- `/opsx-architect <note-id> [topic]` starts an architecture discussion directly, with
  no product draft, change, or approved PRD set required — the case that previously had
  no entry point at all. Resumable by id, and it validates the id before any write.
- `workflows/architecture-notes.md`, the extracted client-neutral contract for the
  step. It now has three entry points: `/opsx-architect`, the end of a shaping session,
  and the delivery PM handoff. Previously the step lived inside
  `workflows/product-shaping.md`, which made sense for one offer point and not for three.
- The discussion contract is explicit about grounding: check the human's stated stack
  against the repository before reasoning from it, say when the code disagrees or a
  claim could not be verified, start with the decision whose answer most constrains the
  rest, and name what would resolve each unknown — a spike, a measurement, an external
  limit, or a human decision.

### Changed

- `/opsx-propose` now stops after `design.md` and before `tasks` for `agile-pm`,
  presenting Context, Decisions with alternatives, Risks / Trade-offs, Migration Plan,
  Open Questions, and whether an architecture note informed it. Tasks are derived from
  design, so a correction costs far less before they exist. Silence is not acceptance.
  The stock spec-driven flow is unaffected.
- `design.md` cites `workflows/architecture-notes.md` when reading a saved note.
- `workflows/product-shaping.md` and both `/opsx-pm` offer points delegate to the
  extracted contract instead of inlining it.

### Compatibility

- Schema version 6, approval format 3, and the artifact graph are unchanged;
  `design.requires` is untouched and a note remains an input, never a dependency.
  Existing drafts, changes, approvals, and published records are unaffected. Restart
  OpenCode after updating to pick up the new command.

### Upgrade From 0.9.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.10.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

## 0.9.0

### Added

- The optional architecture step is now offered in **delivery mode**, at the PM
  handoff in `/opsx-pm` step 9: after Approved product set preflight passes and
  before the handoff to `/opsx-propose`. In 0.8.x it existed only at the end of a
  `/opsx-pm --shape` session, so a delivery-mode run never reached it. Step 9 also
  names `/opsx-explore` for deeper free-form investigation.
- `design.md` reads an existing `docs/architecture/` note as prior discussion,
  carrying forward its approaches, technologies, trade-offs, and constraints and
  citing its path in Context. The note is input, not a dependency: the artifact graph
  and `design.requires` are unchanged, its absence is normal, and the PRD set wins
  wherever they disagree.

### Changed

- Accepting the step now starts a **discussion** — one focused question at a time,
  more than one approach, the technologies and operational constraints each would
  commit to, grounded in the repository — and saves only when the human asks.
  Saving is a second, separate consent. In 0.8.x acceptance went straight to writing
  a document.
- The step is a single shared contract with two offer points, offered at most once
  per session.

### Compatibility

- Schema version 6, approval format 3, and the artifact graph are unchanged. Existing
  drafts, changes, approvals, and published records are untouched. Restart OpenCode
  after updating.

### Upgrade From 0.8.1

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.9.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

Restart OpenCode. A delivery-mode `/opsx-pm` run now offers the step once after
approval, before telling you to run `/opsx-propose`.

## 0.8.1

### Changed

- The optional architecture note is now explicitly Markdown with embedded Mermaid.
  It asks for at least one diagram whenever the note describes structure or
  interaction, permits `flowchart`, `sequenceDiagram`, and `stateDiagram-v2` rather
  than only user-flow charts, and requires a text equivalent after each diagram plus
  a syntax check. Structurally different approaches get their own diagram, and a
  diagram may not introduce a component, interface, or behavior the prose does not
  state. As released in 0.8.0 the note asked only for prose.
- Added a worked flowchart example to imitate, using the same fictional product as
  the bundle's other examples. `test/diagrams.test.js` parses it with the real
  Mermaid parser; it stays a flowchart so that test's assertion is unchanged.

### Compatibility

- Schema version 6, approval format 3, and the artifact graph are unchanged. Nothing
  outside `workflows/product-shaping.md` and the README changed. Restart OpenCode
  after updating.

### Upgrade From 0.8.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.8.1
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
```

## 0.8.0

### Added

- Optional architecture note at the end of a shaping session
  (`workflows/product-shaping.md`). Shaping offers once, and only when the draft has
  enough shape, to write `docs/architecture/<note-id>.md` with the technical question,
  candidate approaches, their trade-offs, and the unknowns that would decide between
  them. The note is **Exploratory — unapproved**: it is not a `design.md`, never
  enters the PRD-set manifest or any approval digest, and authorizes no code. It is
  evidence for a later `design.md`, which still requires the approved PRD set.
- Contract tests for the offer, its write and approval boundaries, and adapter ordering.

### Changed

- `/opsx-pm --shape` offers the note between reporting the saved draft and stopping.
  Its closing boundary now names delivery artifacts (specs, design, tasks) rather than
  "technical artifacts", which the note would otherwise contradict.
- Shaping may write an accepted note in addition to the draft. Requirements analysis
  keeps its stricter draft-only write boundary.

### Compatibility

- Schema version 6, approval format 3, and the artifact graph are unchanged. The note
  lives outside the delivery graph, so existing drafts, changes, approvals, and
  published product records are untouched. Restart OpenCode after updating.

### Upgrade From 0.7.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.8.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode. From the next `/opsx-pm --shape`, a session that ends with enough
shape offers the note once. Declining is the default; silence is not consent, and a
decline is not re-offered in the same session.

## 0.7.0

### Added

- Per-task review loop during apply (`workflows/task-review.md`). Every task ends in a
  mandatory independent agent review, repeated until it passes or escalates, then a
  human prompt to accept, accept and stop prompting, review it themselves, or request
  changes. Agent review cannot be waived; human prompts can.
- Contract tests for the review loop, and the `apply` schema instruction, apply
  operation guidance, and `/opsx-apply` command now reference it.

### Changed

- `/opsx-apply` marks a task `- [x]` only after it is accepted, not as soon as it is
  implemented. On resume, an unchecked task with changes already in the working tree
  is treated as in review.
- Task verification statements are now also what the per-task reviewer re-runs.

### Compatibility

- Schema version 6, approval format 3, and the artifact graph are unchanged. Other
  schemas keep the previous apply loop. Restart OpenCode after updating.

### Upgrade From 0.6.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.7.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode. Existing drafts and approvals are untouched. From the next
`/opsx-apply`, each task ends in an agent review and a human prompt. To skip later
prompts in a run, choose "accept and stop prompting"; agent review always runs.

## 0.6.0

### Added

- Client-neutral requirements elicitation and quality review in the living PRD,
  exposed by the optional OpenCode adapter as `/opsx-pm --requirements <draft-id>`.
- Candidate behavioral requirements, relevant cross-cutting constraints, source and
  acceptance evidence, and explicit ambiguity/conflict/gap findings with review coverage.
- Explicit candidate-to-increment handoff guidance, a fictional partial draft/review,
  and contract/installer regression coverage. Unknowns and inferred suggestions
  remain exploratory; review does not select scope or approve requirements.

### Compatibility

- Retains schema 6, approval format 3, and archive-time publication. Managed updates
  install the new assets without rewriting existing drafts or product records;
  useful draft sections are added on resume. Restart OpenCode after adapter updates.

### Upgrade From 0.5.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.6.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode, then use `/opsx-pm --requirements <draft-id>` to elicit and review
requirements in an existing draft. Existing format-3 approvals remain valid; the
new activity does not select an increment or change approval/publication rules.

## 0.5.0

### Changed

- Schema version 6 / approval format 3: PM prepares and reviews the complete
  documentation set, approval authorizes it without publication, delivery
  reconciles findings with reapproval as needed, and archive publishes before
  preserving the change history.
- Replace the single `master-prd` artifact with `product-docs` and
  `publication-plan`: a high-level overview, detailed capability and
  system-capability pages, preserved README, and staged MkDocs configuration.
- Maintain cumulative product pages and navigation using a complete reviewed
  baseline/mapping/removal plan, with stale-baseline rejection, journaled rollback,
  and derived publication provenance. Detailed journeys/flows live with capabilities.
- Align all agent adapters, config contributions, shaping baseline tracking, and
  client-neutral approval/publication instructions with the new lifecycle.

### Migration

- Existing single masters and legacy approvals remain historical records; the
  installer does not rewrite or republish consumer documentation. Preserve prior
  approved bytes, prepare/review the multi-file candidate and navigation, obtain
  explicit format-3 approval, and publish at archive. See the README migration guide.
- The v0.4.0 tag retains schema 5 / format 2. Existing format-2 approvals need
  reviewed migration before use with the new archive-publication contract.

### Upgrade From 0.4.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.5.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode after updating. Use `/opsx-pm <change>` to preserve prior approval
history, prepare the overview plus capability/system-capability pages and MkDocs
navigation, and obtain format-3 approval. Publication happens when that change
archives, after delivery reconciliation. The installer does not migrate published
product records automatically.

## 0.4.0

### Added

- Optional user-journey tables and embedded Mermaid user flows in saved PRD drafts
  and master revisions, with a text equivalent for each flow.
- Shared client-neutral guidance and a fictional invitation example covering
  success, decline, invalid-invitation recovery, and requirement coverage.
- Journey/flow reconciliation during product revision and review within the
  existing approval digest; diagram-only edits follow normal reapproval.
- Development-only Mermaid syntax checks for embedded examples and installation
  coverage for the new shared resources. Existing approvals remain valid until
  their content is revised; no new delivery artifact or approval format is required.

### Upgrade From 0.3.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.4.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode after updating its adapter. In a shaping session, ask for a user
journey or flow, for example:

```text
/opsx-pm --shape product-vision Map the journey and invitation flow for a new collaborator
```

The views stay embedded in the draft or master PRD. They are optional and do not
force a delivery increment. Schema version 5 and approval format 2 are retained;
valid existing approvals need no renewal solely for this upgrade. Adding or changing
a view in an approved PRD follows the normal revision and reapproval workflow.

## 0.3.0

### Added

- Product-shaping mode through `/opsx-pm --shape <draft-id>`: brainstorm product
  intent and maintain one saved PRD draft across sessions without choosing an MVP,
  delivery increment, or technical approach.
- Durable, explicitly unapproved drafts under `openspec/product-drafts/`, with
  open questions, alternatives, context-baseline tracking, and resumable notes.
- Explicit `/opsx-pm --from-draft <draft-id>` handoff into increment scoping,
  preserving the existing human review and publication gates.
- A client-neutral shaping contract and draft template included in schema-only
  installations, plus documentation and installation coverage.

### Upgrade From 0.2.0

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.3.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode, then start `/opsx-pm --shape product-vision`. Updating the bundle
installs the shared shaping contract and draft template as well as the command
changes. Saved drafts remain consumer-owned documents across updates and uninstall.
Schema version 5 and approval format 2 are retained; valid `v0.2.0` approvals do
not require renewal solely for this upgrade. Projects upgrading from `v0.1.0`
should also follow the [master-PRD migration guide](README.md#migrating-existing-installations-and-prds).

## 0.2.0

### Added

- One cohesive product PRD at `docs/product/prd.md`, published immediately upon
  explicit product approval.
- A `master-prd` artifact that integrates the proposed increment with the existing
  product before review, preserving unaffected requirements and reconciling changed
  capabilities, exclusions, dependencies, and acceptance outcomes.
- Baseline hashes, reviewed-content digests, publication recovery instructions,
  and historical approval preservation for iterative revisions.
- Artifact-graph, approval-contract, and installation-migration regression coverage.

### Changed

- The workflow schema is version 5 and product approval uses format 2. Approval
  includes the full master revision as well as the change-scoped capability PRDs.
- Archive preserves the change and its approval history. It no longer creates
  dated product-document copies or rewrites the current master.
- Engineering work remains scoped to the increment; unchanged requirements carried
  forward in the master do not become new implementation tasks.

### Upgrade From 0.1.0

Install the new tag in the consuming project and update its installed bundle:

```bash
npm install --save-dev github:codehausau/openspec-agile-pm#v0.2.0
npx openspec-agile-pm update --dry-run
npx openspec-agile-pm update
npx openspec-agile-pm doctor
npx openspec-agile-pm --version
```

Restart OpenCode after updating its adapter. Existing approvals must be preserved
and explicitly renewed against the consolidated master; their old digests do not
authorize immediate master publication. Existing dated product snapshots and
catalog rows remain historical records. Review repository-specific instructions
that still require archive-time copies. See the
[migration guide](README.md#migrating-existing-installations-and-prds) for active
changes and projects with only archived PRDs.

## 0.1.0

- Initial release of the approval-gated OpenSpec product workflow, installer,
  optional OpenCode adapter, and discovery skills.
- Change-scoped capability PRDs, deterministic approval, requirement traceability,
  and archive-time publication of approved PRD snapshots.
