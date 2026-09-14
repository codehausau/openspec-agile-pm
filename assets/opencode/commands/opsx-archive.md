---
description: "Archive a completed change in the experimental workflow"
---

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `schemas`, `view`). Once selected, treat `--store <id>` as sticky for the rest of the workflow. Every unscoped example of those commands below is shorthand: before running it, append the flag. For example, run `openspec status --change "<name>" --json --store "<id>"`, not the unscoped form shown below. Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

`<capability-path>` is the spec directory relative to `specs/` (for example, `user-auth` or `identity/user-auth`). Preserve the full path from each delta spec when resolving its main spec.

**Input**: Optionally specify a change name after `/opsx-archive` (e.g., `/opsx-archive add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.
**Provided arguments**: $ARGUMENTS

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   When prompting, show only active changes (not already archived).
   Include the schema used for each change if available.

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-archive <other>`).

   **Load current archive inputs before the existing archive checks:**

   After resolving the selected change and planning root, run:
   ```bash
   openspec instructions archive --change "<name>" --json
   ```
   Keep the same selected-root flags on this command. If it exits non-zero or
   returns invalid JSON, run status to identify the schema. For `agile-pm`, report
   the lookup failure and stop because its approval and publication guidance is a
   required archive contract. For workflows without mandatory custom archive
   completion behavior, continue with no context or operation guidance.

   A successful response may omit both optional fields for ordinary workflows.
   For `agile-pm`, require the current publication guidance and fail closed if it
   is absent. Treat `context` as a required prompt-level input: read and consider
   it, and apply relevant project facts, conventions, and constraints. Treat
   `operationGuidance` as optional additive advice for ordinary workflows: read
   and consider every entry, and follow entries that are applicable and compatible
   with the built-in archive workflow. For `agile-pm`, its approval and publication
   entries are mandatory completion requirements rather than optional advice.

   Keep both fields separate from built-in steps, explicit user choices, resolved
   paths, and CLI checks. For ordinary workflows, report conflicts and preserve
   controlling built-in values; inapplicable operation guidance remains advisory.
   For `agile-pm`, missing, conflicting, or inapplicable mandatory approval or
   publication guidance is a blocker: stop and report it rather than ignoring the
   contract or guessing. Do not infer replacement paths, skipped prompts, or flags
   from either field, and do not copy their text verbatim into specs, change
   artifacts, or archive summaries unless the user separately asks for it. These
   are prompt-level behavior contracts, not native CLI enforcement.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done`, `skipped`, or other)

   When the graph contains `prd`, `prd-capabilities`, and `product-approval`, run
   a mandatory approval preflight before offering incomplete-artifact overrides,
   syncing specs, or moving the change. Read the current product-approval
   instructions and concrete PRD-set paths from `artifactPaths`, verify the exact
   index/file match, and compare the recomputed deterministic manifest digest and
   file count with `product-approval.md`. Stop if approval is missing or stale.
   For `agile-pm`, require the `master-prd` artifact and run the Approved master
   preflight from the product-approval instructions: validate format 2, include
   `master-prd.md` last in the manifest, and verify approved publication provenance.
   A current master that is a valid later approved descendant is allowed; never
   overwrite it with the revision being archived. If an older change lacks the
   master or format-2 approval, stop and use `/opsx-pm <name>` to reconcile the
   complete product and obtain explicit approval before archive. Archive cannot
   grant publication authorization or synthesize an unreviewed master.
   This is a workflow gate, not optional archive guidance, and cannot be overridden
   by confirmation merely because status reports the approval file as done.

   Generate the archive target name now: use the change name as-is when it already
   starts with a `YYYY-MM-DD-` prefix; otherwise prepend the current date as
   `YYYY-MM-DD-<change-name>`. Never stack a second date. Before sync or any other
   mutation, require both the change name and target name to match
   `[a-z0-9]+(-[a-z0-9]+)*`; reject path separators, `..`, absolute paths, empty
   names, and any value not derived exactly by the date-prefix rule above. Resolve
   the real paths of `planningHome.root`, `planningHome.changesDir`, and
   `changeRoot`; require the changes directory and change root to be descendants
   of the selected planning root, require `changeRoot` to be the selected change,
   and reject symlinks in any existing source or destination path component.
   Fail if `<planningHome.changesDir>/archive/<target-name>` exists.
   Never overwrite an archive. Existing dated product snapshots are historical;
   archive does not create, overwrite, or otherwise modify them.

   **If any artifacts are neither `done` nor `skipped`** (skipped artifacts satisfy the requirement - the change declares skip_specs):
   - Display warning listing incomplete artifacts
   - Prompt user for confirmation to continue
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Prompt user for confirmation to continue
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON as the only
   delta-spec source. If the `specs` entry is missing or
   `existingOutputPaths` is empty, proceed without a sync prompt and do not infer
   delta specs from other artifacts.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `<planningHome.root>/openspec/specs/<capability-path>/spec.md` (use the store-aware `planningHome.root` from step 2, not a hardcoded repo path)
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   Route on the answer:
   - "Cancel" — stop, do not archive
   - "Archive without syncing" or "Archive now" — proceed to archive
   - "Sync now" or "Sync anyway" — sync, then verify (below)
   - Anything else — ask again rather than archiving

   Before a selected sync writes any main spec, run
   `openspec instructions specs --change "<name>" --json` once with the same
   selected-root flags. Require a zero exit status and valid artifact-instruction
   JSON. If the lookup fails or returns invalid JSON, report the error and stop
   before writing any main spec or moving the change. A valid response with omitted
   `rules` is the no-rules case. Apply returned `rules` only to the content and
   form of main specs produced by this merge; do not use them as archive guidance,
   change CLI behavior, or copy the rule text into any output file.

   Then run the `/opsx-sync` workflow inline (agent-driven intelligent merge) for change '<name>', passing the delta spec analysis and the fetched specs-rule snapshot from above, and wait for it to finish. The inline sync must reuse that snapshot without fetching `specs` instructions again. Do not delegate it to a background task — step 6 would move `changeRoot` out from under a sync that is still reading it, leaving the change archived and the main specs never updated. If your agent can only run it by delegation, delegate synchronously and wait for the result.

   Then re-run the comparison from the top of this step against every capability that has a delta spec in `artifactPaths.specs.existingOutputPaths` — not only the ones the sync reports it touched. A successful sync leaves nothing left to apply, so each capability must now read as already synced:
   - ADDED requirements present
   - MODIFIED requirements carrying the scenario and description changes named in the delta, with their other scenarios intact
   - REMOVED requirements gone — and where this sync retired a capability (removed its last requirement, leaving `## Requirements` empty), its main spec deleted rather than left empty; a spec the sync deliberately kept and reported is also a match
   - RENAMED requirements present under the new name and absent under the old one

   If the sync failed, or any capability does not match, report what differs and stop — do not archive. Nothing has moved and `changeRoot` is intact, so the user can fix the mismatch or re-run the sync and start the archive again.

5. **Verify approved product history**

   For `agile-pm`, publication already happened at approval. Before moving
   `changeRoot`, repeat the Approved master preflight using the current published
   master in the selected planning home. Capture a raw-byte manifest of `prd.md`,
   indexed capability PRDs, `master-prd.md`, `product-approval.md`, and all
   `product-history/` records. Reject symlinks and paths escaping the change root.
   Validate each historical snapshot with its recorded approval format (legacy
   snapshots retain the old manifest algorithm). Stop on missing or invalid evidence.

   Do not stage product publication, create a dated docs/product directory, append
   a catalog row, or change the published master. Incomplete tasks or skipped spec
   sync remain archive warnings, never evidence of deployed functionality.
   Workflows without master-PRD publication skip this product-history step.

6. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/<target-name>"
   ```

   Immediately before these commands, repeat the realpath and symlink checks from
   step 2. After creating `archive`, resolve it and require it to be the direct
   `archive` child of the real `planningHome.changesDir`; require the final target
   to be one path segment below it and still absent. Stop rather than executing
   `mv` when any containment, identity, or symlink check is inconclusive. Do not
   rely on string-prefix path checks.

   For `agile-pm`, verify the archived product files against the captured manifest,
   recompute the PRD-set digest/count, and repeat the Approved master preflight with
   the approval record now in the archive. Preserve every historical snapshot.
   If verification fails, move the archived directory back to its original
   `changeRoot` when that path is still absent; otherwise stop and report the
   recovery conflict without overwriting anything. Report the failure and whether
   main specs had already been synced. Never restore an older master as part of
   archive rollback or report success with missing approval evidence.

7. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status (synced / sync skipped / no delta specs)
   - Master PRD path and verified approval history, or why this workflow has no master
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** ✓ Synced to main specs
**Product docs:** `docs/product/prd.md` (published at approval; history verified)

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** No delta specs
**Product docs:** `docs/product/prd.md` (published at approval; history verified)

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```markdown
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** Sync skipped (user chose to skip)
**Product docs:** `docs/product/prd.md` (published at approval; history verified)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```markdown
## Archive Failed

**Change:** <change-name>
**Target:** the archive path derived from `planningHome.changesDir`/<target-name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**
- Announce the selected change; prompt for selection when it is ambiguous
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- For a master-PRD workflow, warnings do not waive approval or provenance checks;
  report them in the archive summary without changing the approved master
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, run the `/opsx-sync` workflow inline (agent-driven)
- Never archive while a spec sync is still in flight — run the sync inline and verify the main specs before moving `changeRoot`
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- Apply relevant runtime context and report conflicts. Operation guidance is
  advisory except for agile-pm's mandatory approval and publication contract
- Consider every guidance entry and explain any inapplicable or conflicting advice
- Existing CLI checks, resolved paths, prompts, and command contracts are unchanged
- Artifact rules constrain only the specs being written and are never operation guidance
- Never copy runtime context, operation guidance, or artifact-rule text verbatim into output files
- Archive preserves approved history; it never republishes a master or creates
  dated product copies. Preserve legacy snapshots and catalog rows.
