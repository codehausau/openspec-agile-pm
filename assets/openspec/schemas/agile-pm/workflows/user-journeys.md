# Embedded User Journeys And User Flows

Use this client-neutral contract when the human asks for a journey or flow, or when
mapping the experience would clarify an important product question. Embed the result
in the working PRD. These are optional product views, not new delivery artifacts or
mandatory gates. Use `examples/user-journeys.md` in this schema bundle as a worked
example, never as evidence or product-specific scope.

## Choose The View

- A **journey** describes an actor pursuing a goal across stages, touchpoints, and
  possibly multiple capabilities. Use a Markdown table for stages, user actions,
  product responses, difficulties, evidence or assumptions, and outcomes.
- A **flow** describes the steps and decisions for a particular task. Use a fenced
  `mermaid` block with `flowchart TD` or `flowchart LR`, plus a short text equivalent.
  Show the main path and relevant alternatives, cancellation, failure, and recovery.
  Do not invent unnecessary branches to satisfy a checklist.
- Either view can stand alone. Start with the most useful actor/goal; do not map
  every possible experience or create empty sections just to complete a template.

## Product Content

1. Name the actor, their goal, the trigger, starting context or preconditions, and
   intended end state. Give each journey and flow a descriptive, stable heading;
   preserve its title/anchor when revising it so internal links remain useful.
2. Label each view's basis as **observed current experience** or **proposed target
   experience**. Cite evidence for observed claims; otherwise mark them as assumptions
   or unknowns. Split observed and proposed paths into separate views when comparing
   them. Approval of a target experience is not proof that it is implemented.
3. Describe actions and feedback in user language. Identify changes of actor and
   external/manual steps. Represent product touchpoints without deciding screen
   layouts, APIs, services, databases, frameworks, or implementation sequences.
4. Capture friction only when supported by evidence or explicitly framed as a
   hypothesis. Do not invent interviews, quotes, feelings, motivations, or metrics.
   If an actor or goal is unclear, ask one focused question rather than guessing.
5. Label decision branches and make outcomes understandable. Explain how the user
   knows whether the action succeeded, was cancelled, is awaiting another actor,
   or failed, and what they can do next. Unknown behavior may stay an open question
   during shaping; do not draw an unresolved choice as a settled product promise.
6. In a shaping draft, reference candidate capability headings when useful; formal
   requirement IDs and complete flows are not required. In a product-set revision, map
   consequential product actions and outcomes to the relevant qualified requirements
   and acceptance outcomes. A compact coverage table can group steps/branches.
   Label external context separately. If a flow reveals missing product behavior,
   clarify it with the human and revise the change-scoped requirements before
   approval; the diagram must not silently expand scope.

During requirements elicitation/review, follow `workflows/requirements-analysis.md`.
Link draft journey stages and flow branches to descriptive candidate requirement
headings and proposed acceptance evidence. Gaps, conflicts, and unknown branches
belong in the same draft's Requirements Analysis; clarify them with the human and
revise affected views together. These links do not assign final requirement IDs,
select delivery work, or turn an inferred behavior into confirmed intent.

## Markdown And Mermaid Conventions

- During shaping, keep tables/Mermaid inside `openspec/product-drafts/<draft-id>.md`.
  During delivery, put detailed journeys/flows in the corresponding
  `product-docs/capabilities/` or `product-docs/system-capabilities/` Markdown page;
  product-wide journeys may live in `product-docs/prd.md`. Increment capability PRDs
  link to those headings. Archive publishes these reviewed pages to the equivalent
  `docs/product/` layout. Do not duplicate diagrams or generate separate image artifacts.
- Use simple ASCII node IDs, quoted plain-text labels, labelled decision edges,
  and ordinary flowchart shapes. Keep each diagram focused on one task. Avoid
  HTML labels, renderer-specific initialization, scripts, click actions, or external
  images; ordinary Markdown readers must still have the adjacent text equivalent.
- Connect a flow to its journey with an internal Markdown anchor when applicable.
  Describe every important branch in the text equivalent. Relative links must work
  in both `product-docs/` and `docs/product/` without archive-time rewriting.
- Validate Mermaid syntax with an available parser or renderer before review. Use
  a rendered preview to check readability and branch labels when available. Report
  whether syntax only or rendering was checked; do not claim an unperformed visual
  check. Fix malformed diagrams before approval. In shaping, keep unresolved product
  questions in prose rather than saving broken syntax as a placeholder diagram.

## Reconciliation And Approval

- On a capability or requirement change, inspect affected journeys and flows in both
  directions: stages, actors, decisions, alternative paths, outcomes, exclusions,
  acceptance outcomes, and requirement references must tell the same product story.
  Preserve unaffected views. Remove or revise paths that rely on retired behavior,
  and fix internal links when a heading must change. Explain these changes in the
  PRD revision summary. Rendering success alone is not a consistency check.
- During shaping, update the selected saved draft and retain its unapproved status.
  Map alternative ideas without triggering delivery planning or product publication.
- At a draft-to-delivery handoff, select the relevant experience with the human.
  Reconcile it against the current published product set and reviewed increment. Preserve context
  from unaffected approved capabilities without importing unrelated draft candidates.
- Before product approval, review the journey tables, flow source, text equivalents,
  requirement coverage, and important unresolved questions with the rest of the
  complete PRD set. Resolve questions that materially affect scope or acceptance.
  Candidate future paths must remain clearly unapproved and outside current scope.
- Embedded journeys and diagrams are covered by approval format 3's raw-byte
  PRD-set digest. Any later edit, including a diagram-only correction, follows the
  existing history-preservation and reapproval procedure. Do not generate or rewrite
  diagrams after approval or during archive. Follow workflows/product-publication.md
  for digest, history, migration, and archive publication. Preserve legacy approved
  content; adding optional views is a reviewed revision. Published pages are never
  edited directly outside the approved publication transaction.
