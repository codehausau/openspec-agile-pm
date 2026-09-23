---
description: "Work through an architecture or technology question, and record the outcome"
agent: build
---

Work through a technical question with the human and, when they ask, record the
outcome as an architecture note. This is a discussion first: no code, no delivery
artifacts, no approval. No product draft, change, or approved PRD set is required.

**Input:** A note id, optionally followed by the question or topic: $ARGUMENTS

**Contract:** Resolve the planning home with `openspec context --json`. If the user
names a registered OpenSpec store, or the work already lives in one, run
`openspec store list --json`, select its id, and keep `--store <id>` on every supported
command afterwards. Read
`<root.path>/openspec/schemas/agile-pm/workflows/architecture-notes.md` and follow it
as the authoritative contract for the discussion, the note, and its boundaries. If that
file is missing, stop and request a bundle update in that planning home rather than
improvising a note location or format.

**Arguments:** The first argument is the note id: one lowercase kebab-case path segment
matching `[a-z0-9]+(-[a-z0-9]+)*`. Everything after it is the topic. Reject separators,
extensions, absolute paths, `..`, empty ids, and any path escaping the resolved
directory, before any write. These are agent command arguments; never forward them to
the OpenSpec CLI. With no id, inspect `docs/architecture/` and ask which note to resume,
or agree on a new id, before writing anything.

**What this does**

- Takes the problem and the stack as the human states them, then checks them against
  the repository before reasoning from them. Says when the code disagrees with the
  description, and says when a claim could not be verified.
- Identifies the decisions the problem actually forces rather than surveying the whole
  system, starting with the one whose answer most constrains the rest. Asks one focused
  question at a time.
- Surfaces more than one approach per decision, naming the technologies, interfaces,
  protocols, and operational constraints each would commit to, and what would have to
  be true for it to work. Recommends only when asked, marked as the agent's view.
- Separates what the code already does, what the human has decided, what is an
  assumption, and what is the agent's own suggestion. Invents no benchmarks, costs,
  throughput, latency, or operational experience.
- Names the unknowns that would decide between approaches, and what would resolve each
  one: a spike, a measurement, an external limit, or a human decision.
- Saves `docs/architecture/<note-id>.md` as Markdown with Mermaid diagrams and text
  equivalents, only when the human asks. Saving is a second, separate consent, and a
  discussion that saves nothing is a valid outcome.

**Optional context, never required**

Run `openspec list --json` and read a named change's artifacts, a product draft under
`openspec/product-drafts/`, or the published set indexed by `docs/product/prd.md` when
they inform the question. Record the path and raw-byte SHA-256 of anything used, for
provenance. Reading those records grants no authority to edit them.

**Boundaries**

- Write only the note and any temporary file needed for its safe save.
- Do not scaffold a change, create or edit proposal/specs/design/tasks, create or remove
  an approval, publish product pages, touch a product catalog or MkDocs config, or edit
  application code. A note is not a `design.md`.
- Do not select delivery work, assign requirement IDs, or treat the discussion as
  product approval. If the question turns out to need product decisions, say so and
  point at `/opsx-pm`.
- For deeper free-form codebase investigation, point at `/opsx-explore`.
- A saved note is read back as prior discussion when `design.md` is later written; the
  approved PRD set wins wherever they disagree.
