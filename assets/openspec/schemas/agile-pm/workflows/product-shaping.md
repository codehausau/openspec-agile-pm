# Product Shaping With A Living PRD Draft

This is the client-neutral contract for exploring a product and maintaining a saved
PRD draft. It runs before, or alongside, delivery planning. It is not an artifact
in the delivery graph and does not require an OpenSpec change. Any agent client can
follow this document; the OpenCode adapter exposes it through `/opsx-pm --shape`.

## Inputs And Outputs

- Inputs: a product topic or existing draft ID, the human's conversation, and the
  selected planning home. The current approved master is optional context.
- Output: one evolving Markdown PRD draft at
  `<planningHome.root>/openspec/product-drafts/<draft-id>.md`.
- Use `templates/product-draft.md` from this same installed schema bundle for a new
  draft. Existing drafts are resumed and revised in place, not replaced by the
  template or copied into a new file for every session.
- Drafts are durable project documents that may be committed and shared. They are
  not ignored local research, approved masters, or engineering commitments. Always
  retain `Mode: product-shaping` and `Status: Draft — unapproved` in the document.
- Neither the draft nor its path belongs in the approved PRD-set manifest. Approval
  format 2 and the existing delivery artifact graph are unchanged.

## Enter And Resume

1. Resolve the selected planning home through `openspec context --json` with the
   selected store flag, when applicable. Use its returned `root.path` as
   `planningHome.root` in this standalone workflow; never silently switch to
   another checkout. Require this workflow and its template to exist in
   that home's installed schema. Stop if the home or contract cannot be resolved.
2. Validate the draft ID as one lowercase kebab-case path segment matching
   `[a-z0-9]+(-[a-z0-9]+)*`. Reject separators, extensions, absolute paths, `..`, empty
   IDs, and symlinks or paths escaping the selected root. Never interpret an ID as
   a change name or write a draft inside `openspec/changes/`.
3. If no ID was supplied, inspect the selected home's existing product drafts and
   ask which one to resume, or agree on a new ID. Do not auto-select a similarly
   named delivery change. If a specifically requested existing draft is missing,
   ask before creating a replacement. A new named shaping session authorizes draft
   creation; a request only to discuss without saving remains conversational.
4. Read an existing draft in full, including open questions, parked ideas, source
   references, and session notes. Reflect back where the discussion stopped and
   ask one useful next question. Keep shaping mode sticky across sessions, even
   if the draft seems complete or an associated delivery change exists.
5. For a new draft, inspect relevant repository product evidence and
   `docs/product/prd.md` if present. Ask about the product vision or topic, then
   capture what is understood using the template. A partial draft is useful;
   unknown users, outcomes, or capabilities are questions, not blockers to saving.
   Do not invent content just to fill the template.

## Conversation And Drafting

- Explore who the product serves, their problems, desired experience, outcomes,
  possible capabilities, boundaries, alternatives, and unresolved tensions. The
  human controls how long to explore and which area to revisit.
- Ask one focused question at a time when it helps. Reflect and challenge ideas
  constructively; distinguish evidence, user preferences, assumptions, and agent
  suggestions. Do not infer demand, metrics, approval, or commitments.
- No delivery increment, MVP, prioritization matrix, requirement numbering,
  exhaustive capability index, or resolved acceptance criteria is required. Leave
  competing options and material questions open when the human is still exploring.
- Discuss technical feasibility only as relevant product context or a constraint,
  clearly marked as unverified when appropriate. Do not choose architecture,
  technology stacks, APIs, estimates, tasks, or implementation sequences. Record
  engineering questions for later rather than turning them into technical scope.
- Update the draft after meaningful conversation turns and before pausing. The
  request for a living draft authorizes these incremental saves; do not add a
  repeated approval prompt for every edit. Summarize what changed so the human can
  correct it. A suggested idea stays a suggestion until the human expresses a
  preference; even a preferred direction remains unapproved product intent.
- Keep the PRD cohesive rather than appending a transcript. Preserve unrelated
  sections, human edits, and useful alternatives. Move rejected or parked ideas to
  a short decision note with the human's stated reason, rather than erasing them
  or keeping them as active candidate requirements.
- Use `Master Baseline SHA-256` to record the raw-byte hash of the master read for
  context, or `absent`. It is a context marker, not approval. On resume or handoff,
  compare it with the current master. If it differs, explain the drift and reconcile
  affected ideas with the human while preserving draft work. Update the marker only
  after reconciliation; unresolved drift may remain an open question during shaping.
  Never overwrite the approved master to make it match the draft.
- Before saving, re-read the draft and compare it with the bytes read at the start
  of the turn. If someone else edited it, reconcile their edits first; do not overwrite
  them with stale content. Use exclusive creation for a new draft and a staged,
  verified replacement for an existing draft. On a write failure preserve the last
  saved file, report unsaved changes, and do not claim the draft was saved.
- End a session with the draft path, the changes captured, and the next useful
  product question. Staying in shaping mode is a successful outcome. Do not prompt
  for approval or technical planning merely because the template has been filled.

## Boundaries And Explicit Handoff

Shaping writes only the selected draft and any temporary file needed for its safe
save. It must not create or revise delivery artifacts, remove an existing approval,
publish `docs/product/prd.md`, update a product catalog, or change application code.
Opening an approved product or an active change as context grants no edit authority
over those records. A draft may remain unfinished indefinitely.

"Looks good", "save it", accepting an idea, and continuing the conversation are
not a mode switch or product approval. If "approve" is ambiguous, ask whether the
human is expressing a product preference or requesting the formal approval workflow.
Record a preference in the draft without creating a product-approval record.

Only when the human explicitly requests delivery scoping, or uses
`/opsx-pm --from-draft <draft-id>`, begin the normal product-brief conversation:

1. Require the named draft to exist, validate its path, and read its latest bytes
   and the current approved master. Resolve material baseline drift with the human.
2. Ask which candidate outcomes/capabilities belong in the next increment and
   which remain exploratory. A switch into scoping is not agreement to build the
   whole draft, approval to create a change, or approval to publish it.
3. Follow the existing product-brief and PRD review gates. Include the source draft
   path and raw-byte SHA-256 in the product brief for provenance, and capture the
   selected intent in the change-scoped PRDs. Later draft edits do not silently
   change that increment or invalidate its approval; changes to approved intent go
   through the normal revision and reapproval procedure.
4. Prepare the full master revision against the current approved master using only
   the reviewed increment. Never copy exploratory candidates wholesale into it.
   Publication still requires explicit approval of the complete format-2 PRD set;
   engineering planning and implementation remain separate explicit actions.
5. Leave the exploratory draft available for further thinking. It remains
   `Draft — unapproved` after a handoff. Return to shaping whenever the human asks,
   preserving existing delivery artifacts and approval records.

If the human requests formal product approval without choosing delivery work,
clarify what product scope they want to approve before entering the existing approval
workflow. Saving or endorsing an exploratory draft alone never performs publication.
