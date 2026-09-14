# Product Requirements Document: <!-- Product name -->

**Revision Change:** <!-- Exact OpenSpec change name -->
**Base Master SHA-256:** <!-- SHA-256 of the previous published master's raw bytes, or absent -->
**Document Status:** Approved product intent upon approval; delivery status is stated separately

## Product Vision And Problem

<!-- Cohesive product purpose, problem, and evidence. Distinguish facts and assumptions. -->

## Users And Context

<!-- Product-wide users, jobs, and operating context, including unaffected existing users. -->

## Outcomes And Success Signals

| Outcome | Signal | Baseline | Target | Validation window |
| --- | --- | --- | --- | --- |
| <!-- outcome --> | <!-- signal --> | <!-- known or unknown --> | <!-- target or assumption --> | <!-- window --> |

## Product Scope And Boundaries

<!-- Current approved product as a whole. Reconcile exclusions with added/changed capabilities. -->

## User Journeys

<!-- Optional: follow workflows/user-journeys.md in the installed schema. Keep useful
     existing journeys and revise those affected by this increment. Omit empty
     sections; do not require older masters to add views solely for template parity. -->

### <!-- Stable journey name -->

**Basis:** <!-- Observed current experience with evidence, or proposed target experience -->
**Actor and goal:** <!-- Who and what they are trying to achieve -->
**Trigger and context:** <!-- Starting situation or preconditions -->
**Desired outcome:** <!-- Consistent with requirements and acceptance outcomes -->

| Stage | User goal and action | Touchpoint and product response | Friction or open question | Evidence or assumption | Outcome |
| --- | --- | --- | --- | --- | --- |
| <!-- stage --> | <!-- action --> | <!-- response --> | <!-- supported friction or question --> | <!-- source, assumption, or unknown --> | <!-- outcome --> |

## User Flows

<!-- Optional: embed a fenced mermaid flowchart TD or LR per useful task. Name its
     actor, entry conditions, outcomes, basis, and related journey using an internal
     anchor. Show relevant success, cancellation, failure, and recovery branches and
     include a text equivalent. Use examples/user-journeys.md for valid syntax.
     Map consequential product actions/outcomes to qualified requirement references
     and acceptance outcomes below; label external context separately. Reconcile
     diagram, prose, and requirements before approval. Keep the source inline so the
     exact approved bytes can be published without link or diagram rewriting. -->

## Capabilities And Requirements

<!-- Use an internal table of contents if useful. Include detailed requirements here,
     not only links to change-specific capability PRDs. Repeat the following section
     for each current capability. Preserve unaffected requirements and qualified IDs. -->

### <!-- Capability name -->

<!-- Purpose, user outcome, and in-scope behavior. -->

| Requirement reference | Requirement | Priority | Delivery status / evidence |
| --- | --- | --- | --- |
| <!-- change-name#capability-path/FR-001 or NFR-001 --> | <!-- complete observable requirement --> | <!-- Must / Should / Could --> | <!-- Approved / delivery pending; unknown; or verified evidence --> |

#### Acceptance Outcomes

<!-- Product-level outcomes, including non-functional constraints. -->

#### Dependencies And Exclusions

<!-- Capability boundaries consistent with the rest of this master. -->

## Cross-Capability Dependencies And Risks

<!-- Product-wide dependencies and risks, reconciled with this revision. -->

## Open Decisions And Assumptions

<!-- Only decisions safe to defer without changing approved intent or acceptance. -->

## Candidate Future Work

<!-- Explicitly unapproved possibilities, not current requirements or commitments. -->

## Revision Summary

<!-- Changes against Base Master SHA-256: added, modified, retired, and carried-forward
     capabilities; replaced requirement references; reconciled exclusions and outcomes;
     affected journey stages, flow branches, and requirement coverage;
     migration implications. For initial consolidation, identify source approval records
     and human resolutions of conflicting history. Use qualified IDs or planning-root
     relative paths in code spans for provenance; do not use change-relative links that
     would break when this exact file is published to docs/product/prd.md. -->
