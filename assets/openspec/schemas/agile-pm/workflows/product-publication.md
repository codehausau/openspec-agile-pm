# Product Documentation: Review, Approve, Deliver, Publish At Archive

Client-neutral contract for schema version 6 and approval format 3. Agent adapters
execute this contract; package installation and native OpenSpec status/archive do
not perform its approval checks or publication transaction.

## Lifecycle

1. **PM:** Prepare and review the increment and proposed cumulative product pages.
2. **Approval:** Approve the requirements, exact documentation set, and publication
   plan. Write only the change's approval record; do not publish product pages or
   update the project's MkDocs configuration at approval.
3. **Delivery:** Reconcile product learning and acceptance findings in the increment
   and proposed pages. Preserve previous approvals and reapprove changed content.
4. **Archive:** Verify acceptance, reviewed bytes, and the current published baseline;
   publish the approved pages and MkDocs navigation, then archive the change/history.

The handbook is cumulative, not dated increment copies. Publication denotes reviewed
closeout, not proof of production deployment. State availability/evidence explicitly.

## Paths And Ownership

Resolve `planningHome.root` and `changeRoot` through OpenSpec instructions/status,
including for stores. Targets belong to that home, never an unrelated checkout.
Reject symlink components, absolute/escaping paths, `..`, control characters,
noncanonical separators, duplicate paths, and case-folded collisions. Capability
segments are lowercase kebab-case. Reject unknown fields and ambiguous ownership.

```text
prd.md                                  # Increment overview and exact index
prd/capabilities/**/*.md                 # Increment requirements, user/system kind
product-docs/prd.md                      # Full product opening and capability indexes
product-docs/capabilities/**/*.md        # User-facing requirements and flows
product-docs/system-capabilities/**/*.md # Shared/enabling requirements and flows
product-docs/README.md                   # Stable link; preserve legacy catalog
product-docs/mkdocs.yml                  # Complete proposed MkDocs configuration
product-publication.yaml                # Source/target mapping, baseline, removals
product-approval.md                     # Approval format 3
product-history/<prd-set-digest>/        # Previous approved sets and records
```

`product-docs` generates concrete Markdown pages; `publication-plan` adds the YAML
mapping and staged MkDocs configuration. File-existence status alone cannot prove
either artifact complete.

Allowed publication targets: `docs/product/prd.md`, `docs/product/README.md`,
`docs/product/capabilities/**/*.md`, `docs/product/system-capabilities/**/*.md`,
and one project-root `mkdocs.yml` (or existing `mkdocs.yaml`). The publisher also
owns the derived `docs/product/.publication.json` provenance record. No other
targets are allowed. Legacy `docs/product/<archive-target>/` snapshots and catalog
rows are historical; unrelated docs/configuration remain consumer-owned.

## Prepare The Complete Proposed Set

- Read the entire current set and approved history, not just the latest increment.
  Preserve unaffected requirements and qualified identities. Integrate changes,
  explicitly retire/supersede requirements, and reconcile contradictory boundaries.
  Never concatenate snapshots or infer the whole product from its newest increment.
- `product-docs/prd.md` is the opening: vision, users, outcomes, boundaries, exact
  capability indexes, relationships, assumptions, and revision summary. Detailed
  requirements and flows belong in linked pages, not duplicated into the overview.
- `capabilities/` describes user-facing features; `system-capabilities/` describes
  shared/enabling product behavior such as offline operation or access control.
  Do not turn every NFR into a page or describe internal components as requirements.
  Either category may be empty; do not invent dummy pages. The combined index is exact.
- Detailed pages include purpose/outcomes, scope, requirements/priorities, acceptance,
  dependencies, exclusions, assumptions, and useful journeys/flows following
  `workflows/user-journeys.md`. Cross-capability journeys may live in the overview.
  Preserve qualified IDs when moving a page between categories or renaming it.
- Both increment kinds stay under `prd/capabilities/`. The increment index records
  `Kind: user | system` and the corresponding product page. Existing identities
  `<change>#<capability-path>/FR-001` do not depend on published classification.
  Carried-forward requirements are not new implementation tasks.
  For a removed capability, retain its increment PRD to explain retirement and
  acceptance, mark its Product Page as `retired: <previous-product-path>`, and list
  that target in `remove`. Do not require a nonexistent page in the proposed
  overview/navigation. Historical references remain in the change, not broken links
  in the published handbook. Reclassification is a reviewed move, not a new ID.
- Stage the final relative layout so links survive copying. Keep hashes, baseline
  details, and draft review status in plan/approval/review records, not permanent
  draft labels or migration bookkeeping in reader-facing product pages.
- Preserve the product README's human content and historical catalog rows; add a
  stable `prd.md` link and current publication explanation in the staged README.
  Do not create dated product copies or append a new historical catalog row.
- Show the full proposed set AND baseline diff, including removals, classification,
  supersession, diagrams, and navigation. Do not invent scope through these views.

## MkDocs Configuration

Always stage `product-docs/mkdocs.yml`. Map it to existing `mkdocs.yaml` if that is
the project's config; if both names exist, ask which is authoritative. Otherwise
target `mkdocs.yml`. Use `templates/mkdocs.yml` only for a new site with the actual
product name. Preserve existing metadata, theme, plugins, extensions, custom YAML
tags, comments, and unrelated navigation. Change only the product subtree and
explicitly agreed setup. Use round-trip YAML editing without executing constructors
or Python tags. If tooling cannot preserve the config, resolve the merge with the
human; do not replace it with the minimal template or install plugins implicitly.

Navigation is relative to the configured `docs_dir`. Require the product pages to
be inside it; resolve incompatible layouts with the human instead of changing
`docs_dir` silently. Preserve nested/unrelated nav, choose an unambiguous Product
subtree, and include every indexed capability/system page exactly once. Remove
only retired product entries. If no explicit `nav` exists, preserve the effective
unrelated-page navigation before introducing an explicit tree.

Validate YAML, local links, and Mermaid syntax; report rendering separately. Build
a staged site with the full proposed config and consuming project's toolchain:
`mkdocs build --strict -f <staged-config>`. Never overwrite published pages to test.
Missing toolchain/plugins require a documented human closeout decision before
archive, not a claimed passing build. Actual build failures or broken product links
must be fixed in the candidate and reapproved before publication.

## Publication Plan And Baseline

Use `templates/product-publication.yaml`. Fields:

- `format: 1`: plan encoding, separate from approval format 3.
- `change`: exact selected change name.
- `baseline`: planning-root-relative target to raw-byte lowercase SHA-256 or
  `absent`. Include every current managed page, proposed target, removal, selected
  MkDocs config, and `docs/product/.publication.json`. Hash unchanged files too;
  new targets must be absent. No single overview hash can represent this baseline.
- `files`: complete one-to-one `{source, target}` mapping. Sources are relative to
  the change under `product-docs/` only, in the layout above. Include the overview,
  README, every indexed page (even unchanged), and staged MkDocs config. The staged
  Markdown set, both overview indexes, mappings, and product nav must agree exactly.
  Each Markdown target must equal its source with `product-docs/` replaced by
  `docs/product/`; only staged `product-docs/mkdocs.yml` maps to the chosen root config.
- `remove`: explicit retired managed capability/system-capability target paths.
  Each needs a present baseline hash and reviewed rationale. Rename means old-path
  removal plus new-path mapping. Never remove overview, README, config, provenance,
  historical snapshots, or unrelated pages; never infer deletion from omission.

Except provenance, every baseline path must appear in `files` or `remove`; their
targets must not overlap. Compute **Base Publication SHA-256** by sorting baseline
keys bytewise, emitting `<sha256-or-absent><two spaces><target-path><LF>` for each,
and hashing that UTF-8 manifest, including absent entries.

Validate existing `.publication.json` against its approved archived source set
before adopting a published baseline: require the exact declared fields/format,
matching approval and base digests, exact mapped target/hash set and removals, and
current product-page bytes equal to that approved source. Reject cycles, missing
sources, unapproved page edits, and fabricated provenance. Consumer MkDocs changes
since the last archive may be reconciled into a newly reviewed baseline; an active
approval's baseline must still match exactly. For a format-2 single master, validate its
original approval algorithm and byte-identical source. Validate older dated sets
with their original algorithms too. Identify unmanaged pages and obtain explicit
human adoption/reconciliation, recorded in the review summary, rather than silently
approving or deleting them. An empty first baseline needs no prior provenance.
Existing MkDocs config is consumer context, not product approval, but its bytes
are baseline-protected.

## Approval Digest And Preflight

Before asking for approval, compute and retain the ordered PRD-set manifest:

1. `prd.md` first.
2. Exactly indexed `prd/capabilities/**/*.md` files in bytewise lexical order.
3. `product-publication.yaml`.
4. Every `files[].source` in bytewise lexical order, including
   `product-docs/mkdocs.yml`, once each. No unindexed/unmapped staged files.

Each line is `<raw-byte-sha256><two spaces><change-relative-path><LF>`. Hash the
exact UTF-8 manifest. Record **PRD-Set SHA-256**, **PRD-Set File Count**,
**Publication Plan SHA-256** (raw plan hash), and **Base Publication SHA-256** in
format-3 approval. Approval/history/derived provenance are not digest inputs.
YAML comments/order are approved bytes, not silently reformatted at publication.

**Approved product set preflight** before engineering, apply, sync, or archive:

- Stop while the publication lock exists, except for its owner.
- Require explicit format-3 archive-time publication approval. Validate exact
  indexes, mappings, paths, coverage, digest/count, plan hash, and baseline digest.
- Compare every current baseline path/hash and complete managed-page inventory to
  the plan. Unexpected pages, edits, or another published revision are drift. Stop
  affected work, return to PM, reconcile/rebase, show the full revised set, and
  obtain renewed approval. Even unrelated MkDocs edits require reconciliation;
  never silently bless new baseline hashes.
- The increment need not be published to plan or implement. Its approved candidate
  supplies engineering context; the last archived handbook stays public. A first
  publication with targets recorded as `absent` is valid before archive.
- Delivery/acceptance changes to product intent, claims, outcomes, diagrams, or
  status require history preservation and complete-set reapproval. Never rewrite
  statuses or draft labels at archive after the reviewed digest was approved.

Before revision, preserve all approved manifest files, approval, and review record
byte-for-byte under `product-history/<old-prd-set-digest>/`. Verify digest/count;
reuse only identical snapshots. Then remove working approval before editing.
Legacy snapshots keep their original algorithm. Drafting, rejection, and approval
do not change published documents or MkDocs configuration.

## Archive Publication Transaction

Load this contract before any spec sync or archive move. Publication is required
for archive completion, not optional best effort.

1. Run Approved product set preflight and reconcile acceptance with the human.
   No unreviewed product/availability changes may remain. Confirmation to archive
   unfinished tasks does not waive approval or permit shipped claims. Revise and
   reapprove pages whose claims do not match the agreed closeout.
2. Validate an absent archive target and follow normal spec reconciliation. Spec
   sync never rewrites the PRDs; report its effects separately if publication fails.
3. Validate target parents and acquire `docs/product/.publication-lock` by atomic
   directory creation. Stop if occupied; never delete another writer's lock.
   Store an owner/transaction ID and recovery journal inside. Recheck approved
   digest, baseline, inventory, and archive absence under the lock before writes.
4. Journal previous bytes/absence, permissions, provenance, and directory existence
   for every affected target plus intended writes/removals/archive move. Stage
   exact approved source bytes on the target filesystem and verify hashes. Check
   the staged site; retain the build result or missing-toolchain closeout decision.
5. Atomically replace each mapped target and perform only approved removals.
   Never replace the whole product directory; preserve legacy/unrelated files.
   Verify the installed set, links, navigation, and all expected source/target hashes.
6. Atomically write derived `docs/product/.publication.json` with exactly:
   `format: 1`, `change` (stable name), `approvalDigest`, `basePublicationDigest`,
   `files` (target-to-published-hash map for every plan file), and `removed` (approved
   removal list). All values derive from approval; no timestamp or active-change link.
7. Only after verified publication, move the change to the validated archive path,
   preserving approved sources, approval, history, and closeout evidence. Verify
   their raw bytes/digests and resolve provenance to the archived approval. Mark
   the journal committed, release owned lock/staging, and report archive complete.
8. On failure restore previous target bytes/absences and provenance, undo only
   this transaction's removals/new directories, and restore the change's original
   location if it moved and that path remains absent. Never overwrite a recovery
   conflict. Report archive incomplete and any spec-sync effects. Keep journal/lock
   for explicit recovery if rollback cannot be verified; retain recovery evidence.

Multiple files cannot be exposed in one rename: this is coordinated publication
with rollback, not atomic visibility to uncooperative readers. Deploy the site only
after commit. On interrupted retries inspect journal, target hashes, approval,
and archive location. A fully committed identical transaction permits bookkeeping
recovery without republishing; partial transactions require explicit recovery or
rollback first. Never overwrite a later published revision with an old approval.

## Migration

Schema 5 / format-2 single masters and earlier four-file approvals remain historical
records, not format-3 authority. Package updates do not publish, split, delete, or
relabel consumer records. For an active legacy change, preserve its approved set
using the original algorithm; prepare the full multi-file candidate and plan from
relevant history; review classification/content/navigation/baseline differences;
obtain format-3 approval for archive-time publication. Retain implementation and
engineering evidence and reconcile affected artifacts after approval. With only
archived records, use a new consolidation change. Published single masters remain
until that migration archives. Shaping-only drafts need no delivery migration but
must compare the full product-set baseline on resume.
