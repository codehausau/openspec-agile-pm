# Per-Task Review Loop

This is the client-neutral contract for the apply phase. Every task ends in a
mandatory independent agent review, repeated until it passes, and then the human
is prompted to accept, review it themselves, or request changes. It governs when a
task counts as complete; it does not change what the approved PRD set, specs,
design, or tasks require. Like the other workflow contracts it is prompt-level
guidance, not native OpenSpec CLI enforcement. The OpenCode adapter applies it
from `/opsx-apply`.

## When It Applies

- Every pending task in the apply loop, including one-task runs and resumed
  sessions. Run it after the Approved product set preflight, never instead of it.
- Agent review is never optional. The human's review is: they choose it at the
  prompt below, and can waive further prompts for the rest of a run.

## Task Lifecycle

A task moves through three states. Only the last is written to `tasks.md`.

| State | `tasks.md` | Meaning |
| --- | --- | --- |
| Pending | `- [ ]` | Not started |
| In review | `- [ ]` | Implemented; agent review, fixes, or the human prompt outstanding |
| Accepted | `- [x]` | Passed agent review and accepted by the human |

On resume, a `- [ ]` task whose changes are already in the working tree is in
review, not pending. Inspect those changes, tell the human what you found, and
continue from the review step rather than reimplementing it.

## Task Record

After implementing a task, and again after each fix round, assemble the record the
reviewer works from. Keep it factual; the reviewer must be able to check every line.

- Task number and text, plus the qualified PRD IDs
  (`<change-name>#<capability-path>/FR-001`) and spec requirement names it cites.
- Every file created, changed, or deleted for this task, by path. Do not rely on a
  whole-tree diff; the working tree may already hold unrelated changes.
- The verification the task names, the command or check actually run, and its
  real outcome. If it could not be run, say so; never claim a pass.
- Deviations, deferrals, assumptions, and anything the task needed beyond its text.

## Independent Agent Review

Review with a separate agent or context that has not seen the implementer's
reasoning. Give it the Task Record, the task text, the cited PRD requirement text
and acceptance outcomes, the matching spec requirements and scenarios, the relevant
`design.md` decisions, the repository instruction files, and the changed files.
The reviewer is read-only: it must not edit files or task checkboxes. It may run
read-only inspection and the task's own verification.

If the client cannot delegate, perform a distinct review pass against this
checklist from the artifacts, not from memory of the implementation, and label the
result **self-review (not independent)** everywhere it is reported. Never skip it.

The reviewer checks:

1. **Completeness:** the specified behavior is fully implemented. Nothing is
   narrowed, stubbed, deferred, or accepted as an exception.
2. **Spec coverage:** each cited scenario is satisfied, shown by a test or
   observable behavior rather than asserted.
3. **Verification:** the task's stated verification was actually run and its
   outcome matches the record. Re-run it when safe and inexpensive.
4. **Scope:** no changes beyond the task, no unrelated edits, no change to product
   intent, acceptance, or priority, and no edit to published product pages or the
   live MkDocs configuration.
5. **Design and constraints:** `design.md` decisions, PRD non-functional
   requirements, and repository instruction files are respected.
6. **Regressions and safety:** obvious breakage of adjacent behavior, unhandled
   errors on new inputs, and any sensitive surface the repository instructions name.

The reviewer returns exactly this shape:

```text
Task: <number>
Verdict: PASS | CHANGES REQUIRED | ESCALATE
Findings:
- [blocking|advisory] <finding> | evidence: <path:line or command output> | ref: <requirement>
Checked: <what was examined and which verification was re-run>
```

- `PASS` requires zero blocking findings and a non-empty `Checked`. A verdict
  without `Checked` is invalid; request it again.
- Every finding cites evidence. A concern with none is advisory, phrased as a question.
- `ESCALATE` means the problem cannot be fixed inside the task: a product
  ambiguity, a spec or design contradiction, or an infeasible task.

## Fix Loop

- On `CHANGES REQUIRED`, fix only what the blocking findings require, update the
  Task Record, re-run the task's verification, and request a new review. Give the
  new review the previous findings, ask it to confirm each is resolved, and have it
  re-check the whole task.
- Allow at most three review rounds per task. If the third does not pass, stop and
  give the human the unresolved findings with the options: fix differently, edit the
  spec or design, accept with a stated deviation, or stop.
- The implementer may not dismiss a blocking finding. If it believes one is wrong,
  it shows the evidence to the human as a disputed finding at the prompt.
- Advisory findings do not loop. Carry them to the human prompt.

## Escalation

On `ESCALATE`, or when a finding shows product intent, acceptance, or priority
would change, stop only the affected work and follow the apply instruction's return
path: clarify with the human, preserve the approved set in `product-history/`,
remove working approval, revise and reapprove the PRD set, then reconcile the
engineering artifacts with `/opsx-update`. A defect in the specs or design alone
goes to `/opsx-update`. Leave the task unchecked in both cases.

## Human Prompt

After the agent review passes, always prompt, unless the human already waived
prompts for this run. Show the task number and text, the files changed, the
verification result, the verdict with its round count and whether it was independent,
any advisory findings or disputes, and progress as `N/M`. Offer:

1. **Accept and continue.**
2. **Accept and stop prompting for the rest of this run.** Agent review stays
   mandatory. Show a one-line summary after each later task. The waiver ends with
   the run, and on an escalation or the round cap.
3. **Review it myself.** List the changed files, pause, and wait.
4. **Request changes.** Treat the feedback as blocking findings: fix, run a new
   agent review, then prompt again.

Silence, an unrelated message, or an ambiguous "ok" is not acceptance; ask again.
A human may accept a task that still has unresolved blocking findings only by
explicit choice, and that deviation is reported in the completion summary.

## Records And Completion

- The review record lives in the conversation and the completion summary. Do not
  write reviewer output into change artifacts or `tasks.md` unless the human asks.
  The only edit this workflow makes to `tasks.md` is the checkbox.
- Mark `- [x]` immediately after acceptance, then move to the next task.
- Report the implementation complete only when every task is accepted. The summary
  lists review rounds per task, independence per task, advisory findings, disputed
  findings, and any accepted deviations.
