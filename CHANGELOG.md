# Changelog

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
