# Requirements Elicitation And Quality Review

This client-neutral workflow helps the human discover, clarify, structure, and
review candidate requirements in an existing living PRD. It extends product shaping
between journeys/flows/capabilities and explicit delivery scoping. Any agent client
can follow it; the optional OpenCode adapter exposes `/opsx-pm --requirements <draft-id>`.
Elicitation and review are repeatable activities, not new delivery artifacts or
mandatory gates for every draft. The human chooses the focus and when to pause.

## Inputs, Entry, And Safe Saves

1. Follow `workflows/product-shaping.md` for planning-home resolution, draft ID/path
   validation, baseline reconciliation, and concurrent-edit/safe-save rules. Resolve
   `planningHome.root` from `openspec context --json` with the selected store flag.
   Require this workflow, product-shaping, and `templates/product-draft.md` in that
   home's installed schema. Stop if the home or contracts cannot be resolved; never
   fall through into delivery or another checkout.
2. Require an existing draft at
   `<planningHome.root>/openspec/product-drafts/<draft-id>.md`. Use one lowercase
   kebab-case segment matching `[a-z0-9]+(-[a-z0-9]+)*`; reject escaping paths and
   symlink components as in shaping. For a missing ID, ask which existing draft to
   use. For a missing named draft, stop and explain how to start a shaping session;
   do not create a replacement or interpret the ID as a delivery change.
3. Read the entire draft, its sources, open questions, parked ideas, and current
   product-set baseline. Treat published intent as context, not proof of deployment.
   Reconcile relevant drift with the human; unresolved drift may remain explicit in
   exploration. Preserve legacy baseline markers until reconciled as shaping requires.
4. Reflect back what is understood and ask which journey, capability, uncertainty,
   or quality concern to examine. A request to review existing requirements can start
   directly at Quality Review below; it need not generate new requirements first.
   Keep requirements analysis sticky on resume, recording the focus in `Resume Here`.
   Partial drafts without journeys or requirements are valid inputs: elicit the
   missing actor/goal or behavior rather than fabricating an exhaustive decomposition.

The only persistent output is the selected draft, revised in place. Retain
`Mode: product-shaping` and `Status: Draft — unapproved`; requirements analysis is
an activity within that exploratory mode. Add useful sections from the template
incrementally to older drafts, preserving human content and heading references.
Do not replace older drafts with the template or create a separate requirements
database, review report, delivery artifact, or second source of truth.

Save after meaningful turns and before pausing, using shaping's concurrent-edit
check and staged verified replacement. Only the draft and temporary safe-save file
may be written. A write failure leaves the last saved draft intact; report unsaved
changes. End with the saved path, candidates/findings changed, uncertainties still
open, and one useful next question. Staying exploratory is a successful outcome.

## Elicit Behavior With The Human

- Start from a chosen actor's goal, journey stage/flow branch, or candidate
  capability. Ask one focused question at a time, adapt to the answer, and reflect
  the proposed behavior back. Use the following concerns as prompts, not a fixed
  questionnaire or a demand to complete every category.
- Clarify the trigger, preconditions, inputs, observable response/output, state
  change, and how the actor or external system recognizes the outcome. Explore
  relevant permissions, business rules, alternatives, cancellation, invalid input,
  empty results, failure, recovery, repeated actions, and external dependencies.
  Unknown branches remain questions, not silently settled promises.
- Distinguish direct human statements, cited evidence, existing product context,
  unverified assumptions, and agent-inferred suggestions. Inferred requirements
  stay `Suggested` with an explicit unverified basis until discussed. Never treat
  an inference as a fact or silently resolve unanswered questions.
- Follow `workflows/user-journeys.md` for useful embedded views. Reconcile journeys,
  flow branches/text equivalents, capabilities, candidates, and acceptance evidence
  in both directions. A diagram reveals questions; it does not authorize scope.

## Candidate Requirement Contract

Group candidates under descriptive capability headings in `Candidate Requirements`.
Separate functional behavior from capability-specific quality/constraint concerns.
Use stable descriptive candidate headings/anchors for references; do not create
final change-scoped FR/NFR IDs or Must/Should/Could delivery priorities. Existing
published qualified IDs may be cited as source context, never assigned to a new
candidate. Preserve references when wording changes; repair links for renamed or
merged headings. Park rejected alternatives with the human's reason.

For each useful candidate, capture:

- **Requirement:** one behavioral obligation. Prefer “The system SHALL …” with the
  actor/trigger/condition and observable result where known. SHALL is candidate
  wording, not approval, priority, or a claim of implementation.
- **Rationale:** the user/system outcome or problem this behavior addresses; unknown
  rationale is a question rather than an invented justification.
- **Source / journey:** a specific human statement, evidence path, journey stage,
  flow branch, or existing product reference. Explicitly label agent suggestions
  and assumptions. Preserve source distinctions when splitting or merging candidates.
- **Acceptance evidence:** a proposed scenario, demonstration, inspection, or
  measurement that could distinguish success from failure. Separate this planned
  evidence from evidence actually observed; record unknown conditions/thresholds.
- **Status:** `Suggested` (agent inference or option), `Needs clarification`
  (unresolved intent/acceptance), `Human-confirmed intent` (explicitly expressed
  preference, still unapproved), or `Parked` (human-deferred/rejected with reason).
  These are exploratory dispositions, not approval or delivery-readiness states.
- **Open questions:** links to unresolved decisions and relevant analysis findings;
  use “None identified in this review” only when that is accurate, not “complete”.

Favor behavioral, observable, atomic, consistent, traceable, and testable statements
where practical. For example, “The system SHALL display valid geospatial records
on the map” is a behavioral candidate; ask what makes a record valid and how display
is verified. “Implement a Leaflet component that loads GeoJSON into React state”
chooses an implementation. Ask what experience it serves and rewrite the candidate
as behavior; park the engineering question. Do not choose architecture, invent APIs,
technologies, data structures, implementation tasks, or estimates. A human-supplied
external protocol or operating constraint may be recorded with its source and
rationale; distinguish a real constraint from a suggested solution.

## Quality And Cross-Cutting Requirements

Keep capability-specific concerns beside their capability. Capture shared concerns
once under `Cross-Cutting Requirements`, with links to affected capabilities and
journeys, using the same candidate fields. Do not duplicate obligations or turn
every quality concern into a new system capability.

Consider security, performance, availability, reliability, accessibility,
auditability, data and retention, interoperability, and deployment/operating
environment only where relevant. Empty categories may be omitted or left unknown.
Do not fabricate requirements merely to fill categories. If applicability itself
is uncertain, record a question; claim “not applicable” only with a stated basis.

Replace vague terms such as “fast”, “secure”, “easy”, and “highly available” with
questions about observable outcomes, operating conditions, and acceptable evidence.
For quantitative qualities, ask about workload/data volume, measurement boundary,
threshold, time window/percentile, environment, and validation method as relevant.
Do not invent latency targets, uptime percentages, retention periods, accessibility
standards, or obligations. Unagreed targets remain explicitly unknown or proposed
assumptions. Where a numeric target is inappropriate, define a qualitative
demonstration or inspection and who would judge it, or record why it is not yet
testable. Product outcomes and externally imposed constraints belong here; internal
design choices belong in later engineering work.

## Quality Review

Run a distinct review pass after a meaningful elicitation/revision batch or whenever
the human asks to review. Agree on its coverage (selected capability/journey or the
current candidate set); a partial review must not claim whole-product completeness.
Read the latest candidate wording and related views, then inspect:

| Check | Questions to investigate |
| --- | --- |
| Clarity and atomicity | Are terms defined, actors/conditions clear, and compound obligations separable? |
| Observability and testability | Can proposed evidence distinguish success/failure? Are conditions or measures missing? |
| Rationale and traceability | Does the requirement have a supported need and source? Is an inference labelled? |
| Consistency and duplication | Do requirements, flows, business rules, constraints, and the baseline contradict or duplicate one another? |
| Coverage and gaps | Are consequential success, alternative, failure, recovery, permission, and data-lifecycle outcomes accounted for where relevant? |
| Product level and feasibility | Is behavior separated from implementation? Is feasibility uncertain or a constraint unsupported? |

Save findings in the draft's `Requirements Analysis` under **Ambiguities**,
**Conflicts**, **Missing Information**, **Unverified Assumptions**, and
**Requirement Gaps** as applicable. Each finding identifies the affected candidate
or journey, the issue and consequence, the evidence/basis, a focused question or
suggested resolution, and its disposition (`Open`, `Resolved with human`, or
`Deferred with reason`). Link rather than duplicate questions across sections.
Proposed fixes are suggestions until the human clarifies intent. Do not silently
choose between conflicting requirements, drop an obligation during deduplication,
or infer missing behavior. Feasibility unknowns become engineering questions, not
architecture decisions. Close intent findings only after human clarification;
mechanical wording/link fixes may be saved and summarized without an approval gate.

Record **Review Summary**: coverage and omissions, main findings, human decisions,
remaining questions, and next focus. A clean review means only “no issues identified
within this coverage”, not approved, ready to build, or complete. Revisit affected
findings when a candidate, source, journey, or baseline changes. Earlier review
conclusions do not silently carry over to revised intent.

## Boundaries And Explicit Delivery Handoff

Requirements analysis must not create an OpenSpec delivery change, call
`/opsx-propose`, select an MVP or increment automatically, create implementation
tasks, implement code, approve requirements, write product-approval records,
publish product documentation, or edit catalogs/MkDocs. Opening an active change
as context gives no edit authority over it or its approval. Draft candidates and
review findings remain outside the approved PRD-set manifest.

“Looks good”, saving, human-confirmed intent, and resolving review findings are not
approval or a mode switch. Clarify ambiguous “approve” requests using shaping's
rules. Returning to shaping or continuing review requires no delivery decision.

Only an explicit request for delivery scoping, including
`/opsx-pm --from-draft <draft-id>`, enters shaping's existing handoff. Read the latest
draft and reconcile material baseline drift. Ask which outcomes/capabilities and
candidate behaviors the human wants to consider for the increment; do not promote
the entire draft or equate review quality with delivery priority. Review applicable
cross-cutting constraints, dependencies, acceptance evidence, and unresolved
findings with that selection. Do not silently discard a shared constraint because
its heading is outside the selected capability. Resolve questions material to the
selected scope/acceptance before PRD approval; unrelated questions can stay in the
draft. Preserve safely deferred questions explicitly in the selected PRDs.

Keep existing product-brief capture/pursue gates. Record the source draft path and
raw-byte SHA-256 in the brief, plus selected candidate headings and their disposition
in the increment. When creating detailed capability PRDs, map only human-selected
candidates to normal capability-local FR/NFR IDs and reviewed priorities. Retain
their rationale, source, and acceptance intent; explain splits/merges and exclusions
for review. Unselected candidates stay exploratory. No prior requirements session
or exhaustive review is required to use the existing direct delivery workflow.

Follow `workflows/product-publication.md` for complete-set format-3 approval,
history, reapproval, and archive-time publication. Later draft edits never silently
change approved scope or invalidate its digest; revisions to approved intent use
the existing review/reapproval process. The source draft remains unapproved and
available for further shaping and requirements analysis.

See `examples/requirements-analysis.md` for a fictional partial draft and review.
