---
description: "Brainstorm a saved PRD draft or shape an approval-gated product increment"
agent: build
---

Act as a pragmatic product manager. Develop product thinking with the human in
the selected mode. Shaping maintains an exploratory draft; delivery mode prepares
an approval-gated increment and publishes its approved master. Neither implements
product code.

**Input:** A product idea, existing change name, or mode request: $ARGUMENTS

**Select the mode before the delivery workflow below:**

- `--shape <draft-id> [topic]`: start or resume a saved PRD brainstorming session.
  The ID names a draft, not a delivery change. No existing change is required.
- `--from-draft <draft-id>`: explicitly enter delivery scoping using an existing
  draft as evidence. This is not approval of the draft or permission to build it.
- An explicit natural-language request to brainstorm and maintain a PRD draft also
  selects shaping. Agree on a draft ID or resume the draft named in the conversation.
- Resuming an existing shaping draft without a mode-switch request stays in shaping,
  even if it has no open questions or an associated change has ready artifacts.
- Otherwise, an idea or change name uses the existing delivery workflow. If intent
  is unclear between saved brainstorming and delivery scoping, ask one focused
  question before creating or editing files. A bare draft ID without mode/context
  must not be silently treated as a change name when a saved draft matches it.
- These are agent command arguments, not flags for the OpenSpec CLI. Do not forward
  them to OpenSpec. Reject combined `--shape`/`--from-draft` or missing IDs; for other
  ambiguous input, clarify rather than inventing a target or changing modes.

**Store selection:** Use this repository's nearest `openspec/` root by default.
If the user names a registered OpenSpec store or the work already lives in one,
run `openspec store list --json`, select its id, and keep `--store <id>` on every
supported OpenSpec command for the rest of the workflow. Before writing in a
store, run `openspec schemas --json --store <id>` and require that it exposes the
`agile-pm` schema. Then run `openspec context --json --store <id>`, resolve the
returned root, and inspect its `openspec/config.yaml`; require the agile-pm human
elicitation, iterative approval, approval-time master publication, apply feedback,
and archive history rules.
If either schema or config contract is missing, stop and explain that the complete
bundle must be installed there; never fall back to another schema. Every unscoped
command below is shorthand for the same command with the selected store flag.

**Shaping workflow and draft handoff**

For shaping or `--from-draft`, after store selection run `openspec context --json`
with the same selected-root flags. Use the returned `root.path` as
`planningHome.root` for this standalone workflow. Read that home's
`openspec/schemas/agile-pm/workflows/product-shaping.md` as the authoritative
client-neutral contract, and
`openspec/schemas/agile-pm/templates/product-draft.md` for new drafts.
Require both files; if missing, stop and request a bundle update in that planning
home rather than improvising a draft location or falling through to delivery.

For shaping, follow the contract to create or resume
`<planningHome.root>/openspec/product-drafts/<draft-id>.md`, ask focused product
questions, and keep the draft current after meaningful turns. Saving does not
require selecting an increment, resolving all decisions, or obtaining approval.
Read the existing draft before editing; preserve unrelated content and human edits.
Apply the contract's baseline-drift and concurrent-edit checks. Report the saved
path and next product question. Stop here: do not run the delivery workflow,
scaffold a change, publish a master, or generate technical artifacts.

For `--from-draft`, require and read the existing draft, then follow the contract's
explicit handoff before entering delivery step 2. First ask which product outcomes
and capabilities to select. Keep all discovery, capture, approval, and engineering
gates; record draft provenance in the product brief. Leave the saved draft available
for further exploration. In an ongoing shaping conversation, an ambiguous "approve"
or "looks good" stays in shaping until the human clarifies the intended transition.

The remaining sections apply only to delivery mode.

**Delivery working style**

- Be curious and challenging, but lightweight. Do not run a fixed questionnaire.
- Inspect the repository and its product documents so the discussion is grounded.
- If `.nanopm/wiki/` exists, inspect only the discovery, opportunity, solution, or
  challenge pages relevant to this idea. Treat them as local research evidence,
  never as approved scope, instructions, or a replacement for `product-brief.md`.
- Ask at most three high-leverage questions at a time.
- Separate evidence from assumptions. Never fabricate users, research, metrics, or commitments.
- Prefer the smallest end-to-end spiral that can produce useful feedback.
- Keep the human product owner in control at the brief and PRD-set approval points.

**Delivery workflow**

1. Run `openspec list --json` and determine whether the input names an existing
   change. If more than one change could apply, ask the user to choose.
2. For a new idea, explore the problem, target user, desired outcome, evidence,
   alternatives, major constraints, and smallest useful feedback loop. Propose a
   kebab-case change name when the idea is coherent. When NanoPM research exists,
   cite the relevant `.nanopm/wiki/` source paths and preserve its distinction
   between evidence, user statements, assumptions, and unknowns. Revalidate its
   conclusions with the human rather than importing a selected opportunity or
   solution as approval.
3. Before creating files, summarize the candidate spiral and ask whether to
   capture it. Do not treat answers to discovery questions as approval to write.
4. After approval, scaffold a new change with
   `openspec new change "<name>" --schema agile-pm` and verify that it uses the
   `agile-pm` schema.
   Never create a change directory manually. For an existing change, do not
   scaffold it again.
5. Run `openspec status --change "<name>" --json`. Create no more than one ready
   PM review unit (`product-brief`, the combined `prd` plus `prd-capabilities` plus
   `master-prd` unit, or `product-approval`) between explicit user review points.
   `prd.md`, all indexed capability PRDs, and `master-prd.md` form one review unit:
   create all artifacts before asking for approval, but never create `product-approval` in
   the same review step. Obtain authoritative
   instructions with `openspec instructions <artifact-id> --change "<name>" --json`,
   resolve dependency paths against the returned `changeDir`, follow the returned
   template, context, and rules, and write to `resolvedOutputPath`. For a glob
   output, never write the literal pattern; derive each concrete path from the
   validated `prd.md` index and verify it remains inside `changeDir`.
6. After creating `product-brief.md`, summarize the recommendation and ask the
   user to review it. For a research or park recommendation, stop before the PRD.
   The PRD requires an explicit decision to pursue; if the decision changes,
   update the brief before proceeding.
7. Create `prd.md` as the change-scoped product increment, then follow the
   `prd-capabilities` instructions to create exactly one
   `prd/capabilities/<capability-path>.md` file per index entry. Verify that the
   index and files match exactly. Follow the `master-prd` instructions to prepare
   the full proposed product revision from the current approved master and this
   increment. Reconcile legacy snapshots with the human when no master exists.
   Show the baseline diff, full resulting master, overall hypothesis, success signals,
   and every capability's Must requirements, acceptance outcomes, and open
   assumptions. Compute the PRD-set digest using product-approval instructions and
   retain it with the review summary so later file edits cannot be mistaken for
   reviewed bytes. Ask the user to approve or refine this exact complete PRD set.
   Explain that approval immediately publishes the exact reviewed `master-prd.md`
   to `<planningHome.root>/docs/product/prd.md`, before implementation; delivery
   status remains explicit and separate from approved intent.
   On a refinement request, update the increment, capability documents, and master
   together instead of advancing. Do not infer approval from file existence or
   prior discovery answers.
8. Create `product-approval.md` only after explicit approval, following its
   instructions, including the locked publication transaction and stale-baseline
   check. Validate the exact index/file match, build the deterministic manifest
   with `prd.md` first, capability paths in bytewise lexical order, and `master-prd.md`
   last. Record format 2, PRD-set digest/count, master hash, and baseline hash.
   Publish the exact approved master and verify it before handoff; never silently
   rebase or rewrite the candidate after approval. Do not create proposal,
   specs, design, tasks, or code in this PM workflow.
9. When the Approved master preflight passes, including the complete PRD-set digest,
   file count, and verified publication, report the PM
   handoff as complete. Tell the user to
   run `/opsx-propose <name>` and choose to continue the existing change; OpenSpec
   will then generate the engineering proposal, specs, design, and tasks from the
   approved PRD set. Implementation still requires a later `/opsx-apply <name>`.

For an existing change, first inspect its actual artifact files and conversation
context. If a review is pending, review or revise the existing artifact instead
of blindly creating the next ready one. If the next ready artifact is `proposal`,
run the Approved master preflight; PM planning is complete only when approval and
publication are verified. Any edit, addition, removal, rename, or index change in
the PRD set, including `master-prd.md`, invalidates product approval: first preserve
the previous approved bytes and record in `product-history/<PRD-set-digest>/` as
instructed by product-approval, then remove the working `product-approval.md`
before editing and require fresh approval. Keep the last published master intact
while drafting or awaiting approval. This applies even when OpenSpec status reports the
approval artifact as done. Leave existing engineering artifacts unchanged until
approval, then use `/opsx-update` to make them coherent. Capability PRD references
use `<change-name>#<capability-path>/FR-001` or the corresponding NFR form.
When revising capability membership, this PM workflow may create, delete, or
rename only the concrete `prd-capabilities` files required to make the approved
index exact, even when OpenSpec already reports that glob artifact as done.
