# Product PRD Draft: Joining A Writing Project

**Mode:** product-shaping
**Status:** Draft — unapproved
**Draft ID:** writing-project
**Product Baseline SHA-256:** absent

This fictional partial draft demonstrates `workflows/requirements-analysis.md`.
All human statements, decisions, and requirements below are illustrative, not real
research, approved scope, or evidence of implementation. No increment is selected.
It is a separate exploratory illustration of the invitation experience in
[the journey example](user-journeys.md), not an adoption of that example's formal IDs.

## Product Vision And Problem

Help an invited writer understand and decide whether to join a shared project.
Whether invitation confusion is a real user problem remains unverified.

## User Journeys

### Decide Whether To Join

**Basis:** Proposed target experience
**Actor and goal:** Invited writer deciding whether to join
**Trigger and context:** Writer opens an invitation; identity checks are unknown
**Desired outcome:** Make an informed choice and understand the resulting membership

| Stage | User goal and action | Touchpoint and product response | Friction or open question | Evidence or assumption | Outcome |
| --- | --- | --- | --- | --- | --- |
| Evaluate | Open and review invitation | Show project and offered access | Meaning of valid invitation? | Illustrative human preference | Understand what is offered |
| Decide | Accept or decline | Joining rules unresolved; declining does not join | Does joining require owner approval? | Conflicting illustrative statements | Membership outcome understood |
| Recover | Open an unusable invitation | Recovery behavior unknown | Who can request a replacement? | Agent-identified gap | Unknown |

## Candidate Capabilities

### Invitations

Explore invitation review, membership decisions, and recovery. These candidate
behaviors have no delivery priority. Identity and access rules need further discussion.

## Candidate Requirements

### Invitation Behavior

Capability: [Invitations](#invitations)

#### Functional Requirements

##### Show The Invitation Offer

- **Requirement:** When an invited writer opens a valid invitation, the system SHALL
  display the project name and offered access before the writer decides whether to join.
- **Rationale:** Let the writer understand what accepting would mean.
- **Source / journey:** Illustrative human statement: “Show the project and offered
  access first”; [Evaluate stage](#decide-whether-to-join). Validity is not yet defined.
- **Acceptance evidence:** Proposed demonstration: given an invitation that satisfies
  the agreed validity rules, opening it shows the project name and offered access
  before a membership decision. Validity fixtures remain unknown; no test has run.
- **Status:** Needs clarification
- **Open questions:** [Invitation validity](#invitation-validity)

##### Decline Without Joining

- **Requirement:** When an invited writer declines an invitation, the system SHALL
  leave that writer's project membership unchanged.
- **Rationale:** Declining must not grant access or revoke existing membership.
- **Source / journey:** Illustrative human clarification: “Declining doesn't join
  them or remove membership they already have”; [Decide stage](#decide-whether-to-join).
- **Acceptance evidence:** Proposed demonstrations for a non-member and an existing
  member: declining leaves each one's prior membership unchanged. Not executed.
- **Status:** Human-confirmed intent
- **Open questions:** [Decline feedback](#decline-feedback) is a separate unresolved outcome.

##### Join On Acceptance

- **Requirement:** When an invited writer accepts a valid invitation, the system SHALL
  grant the offered project membership immediately.
- **Rationale:** Avoid an unexplained wait after accepting.
- **Source / journey:** Illustrative statement A: “Accepting should join them right
  away”; [Decide stage](#decide-whether-to-join). Statement B contradicts this below.
- **Acceptance evidence:** Proposed demonstration of membership after acceptance;
  cannot settle the expected outcome until [joining authority](#joining-authority) is clarified.
- **Status:** Needs clarification
- **Open questions:** [Joining authority](#joining-authority)

#### Quality / Constraint Requirements

Shared [response-time concern](#invitation-response-time) applies to invitation review.

## Cross-Cutting Requirements

### Performance

#### Invitation Response Time

- **Requirement:** Candidate quality concern: invitation details should appear “quickly”.
  A testable SHALL statement is not yet possible; acceptable delay is unknown.
- **Rationale:** An unexplained wait might make a writer abandon the invitation
  (agent hypothesis, not observed research).
- **Source / journey:** Agent-inferred concern affecting [Invitations](#invitations)
  and the [Evaluate stage](#decide-whether-to-join).
- **Acceptance evidence:** Proposed measurement from opening to visible details;
  workload, network/device context, threshold, and measurement window are unknown.
- **Status:** Suggested
- **Open questions:** [Response conditions](#response-conditions)

Other cross-cutting categories have not been assessed; their omission does not mean
they are unnecessary. No response-time target or operating environment is assumed.

## Requirements Analysis

### Ambiguities

#### Invitation Validity

- **Affected:** [Show the invitation offer](#show-the-invitation-offer),
  [Join on acceptance](#join-on-acceptance).
- **Finding / basis:** “Valid” is undefined in the illustrative statements; expiry,
  revocation, and recipient rules could change behavior and acceptance evidence.
- **Question:** What makes an invitation usable for this writer?
- **Disposition:** Open

### Conflicts

#### Joining Authority

- **Affected:** [Join on acceptance](#join-on-acceptance), journey Decide stage.
- **Finding / basis:** Statement A promises immediate membership; illustrative
  statement B says “The owner must confirm every new member”. Both cannot define
  the same acceptance outcome without further conditions.
- **Question:** Does an invitation already convey owner authorization, or does
  acceptance enter a pending state? Both are options, not a chosen solution.
- **Disposition:** Open; neither statement has been silently preferred.

### Missing Information

#### Response Conditions

- **Affected:** [Invitation response time](#invitation-response-time).
- **Finding / basis:** “Quickly” lacks a human need, threshold, and operating context;
  the proposed measurement cannot yet distinguish acceptable from unacceptable.
- **Question:** In what situation would waiting prevent the writer from proceeding?
- **Disposition:** Open; do not invent a latency target.

### Unverified Assumptions

#### Waiting Causes Abandonment

- **Affected:** [Invitation response time](#invitation-response-time).
- **Finding / basis:** Abandonment is an agent hypothesis without supplied research.
- **Suggested next step:** Ask whether the human has observed a wait-related problem.
- **Disposition:** Deferred with reason — illustrative human chose to explore
  membership behavior first. Deferral does not confirm the hypothesis.

### Requirement Gaps

#### Decline Feedback

- **Affected:** [Decline without joining](#decline-without-joining), journey Decide stage.
- **Finding / basis:** Unchanged membership describes state, but the writer's feedback
  and next action after declining are not described. The journey expects an understood outcome.
- **Question:** What should the writer learn or be able to do after declining?
- **Disposition:** Open; no new candidate is asserted as fact.

#### Unusable Invitation Recovery

- **Affected:** Journey Recover stage and [Invitations](#invitations).
- **Finding / basis:** No candidate yet covers an unusable invitation; recovery and
  permissions remain unspecified. The separate journey example's replacement flow
  is an option, not evidence of what this human wants.
- **Question:** What should happen when the writer cannot use the invitation?
- **Disposition:** Open

### Review Summary

Reviewed the three functional candidates against the journey's Evaluate/Decide stages
and the proposed performance concern. Recovery was checked only for gaps. Security,
accessibility, retention, and other shared concerns were not assessed.
Human clarification established the intended membership effect of declining; this
is still unapproved. Validity, joining authority, feedback, and performance evidence
remain open. This is a partial review, not a completeness or delivery-readiness claim.

## Open Questions

Next: [Joining authority](#joining-authority). Other questions remain linked from
the affected candidates and review findings above.

## Resume Here

Requirements-analysis focus: invitation membership behavior. Resume by clarifying
joining authority, then revise the candidate, journey, and review finding together.
No delivery increment has been chosen. If the human later explicitly enters scoping,
review selected behaviors and shared constraints, preserve this draft's path/hash
as provenance, and map selected headings to formal IDs only in the increment PRDs.
