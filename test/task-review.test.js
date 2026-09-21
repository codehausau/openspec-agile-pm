import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS = path.join(ROOT, "assets");
const SCHEMA = path.join(ASSETS, "openspec/schemas/agile-pm");
const WORKFLOW = "workflows/task-review.md";

function schemaText(relative) {
  return readFile(path.join(SCHEMA, relative), "utf8");
}

// Contract tests for instruction assets, not an agent conversation runner.
test("the apply instruction, config guidance, and tasks instruction point at the task-review contract", async () => {
  const schema = YAML.parse(await schemaText("schema.yaml"));
  const config = YAML.parse(await readFile(path.join(ASSETS, "config/config.yaml"), "utf8"));

  assert.equal(schema.version, 6, "the artifact graph is unchanged");
  assert.deepEqual(schema.apply.requires, ["tasks"]);
  assert.ok(schema.apply.instruction.includes(WORKFLOW));
  assert.match(schema.apply.instruction, /mandatory independent agent review/);
  assert.match(schema.apply.instruction, /only once it is accepted/);
  assert.doesNotMatch(schema.apply.instruction, /mark complete as you go/);
  assert.ok(config.operations.apply.guidance.some((entry) => entry.includes(WORKFLOW)));
  assert.ok(config.operations.apply.guidance.some((entry) => /never the agent review/.test(entry)));

  const tasks = schema.artifacts.find(({ id }) => id === "tasks");
  assert.match(tasks.instruction, /per-task apply review\s+re-runs it/);
});

test("the workflow makes agent review mandatory, human review optional, and completion follow acceptance", async () => {
  const workflow = await schemaText(WORKFLOW);

  assert.match(workflow, /Agent review is never optional\. The human's review is/);
  assert.match(workflow, /separate agent or context that has not seen the implementer's\s+reasoning/);
  assert.match(workflow, /The reviewer is read-only/);
  assert.match(workflow, /\*\*self-review \(not independent\)\*\*/);
  assert.match(workflow, /Never skip it/);

  for (const verdict of ["PASS", "CHANGES REQUIRED", "ESCALATE"]) {
    assert.ok(workflow.includes(verdict), verdict);
  }
  assert.match(workflow, /A verdict\s+without `Checked` is invalid/);
  assert.match(workflow, /at most three review rounds per task/);
  assert.match(workflow, /may not dismiss a blocking finding/);

  for (const option of [
    "**Accept and continue.**",
    "**Accept and stop prompting for the rest of this run.**",
    "**Review it myself.**",
    "**Request changes.**",
  ]) {
    assert.ok(workflow.includes(option), option);
  }
  assert.match(workflow, /Agent review stays\s+mandatory/);
  assert.match(workflow, /Silence, an unrelated message, or an ambiguous "ok" is not acceptance/);

  assert.match(workflow, /\| In review \| `- \[ \]` \|/);
  assert.match(workflow, /\| Accepted \| `- \[x\]` \|/);
  assert.match(workflow, /The only edit this workflow makes to `tasks.md` is the checkbox/);
});

test("the workflow routes product-level findings through the existing reapproval path", async () => {
  const workflow = await schemaText(WORKFLOW);
  assert.match(workflow, /product-history\//);
  assert.match(workflow, /reapprove the PRD set/);
  assert.match(workflow, /\/opsx-update/);
  assert.match(workflow, /Leave the task unchecked/);
  for (const reference of ["workflows/product-publication.md"]) {
    // Referenced contracts must exist in the installed bundle when a workflow cites them.
    if (workflow.includes(reference)) await schemaText(reference);
  }
});

test("the OpenCode adapter runs the review before marking a task complete", async () => {
  const command = await readFile(path.join(ASSETS, "opencode/commands/opsx-apply.md"), "utf8");
  const step = command.slice(command.indexOf("6. **Implement tasks"), command.indexOf("7. **On completion"));

  assert.ok(step.includes("openspec/schemas/agile-pm/workflows/task-review.md"));
  assert.match(step, /stop\s+with a request for a bundle update if it is missing/);
  assert.match(step, /Delegate the review to a fresh, read-only\s+subagent/);
  assert.match(step, /self-review \(not independent\)/);
  assert.match(step, /Silence or an ambiguous reply is not acceptance/);
  assert.match(step, /Other schemas use the plain loop/);
  assert.match(step, /The reviewer escalates, or the third review round/);

  const review = step.indexOf("independent agent review");
  const prompt = step.indexOf("prompt the human");
  const mark = step.indexOf("`- [ ]` → `- [x]`");
  assert.ok(review !== -1 && prompt !== -1 && mark !== -1);
  assert.ok(review < prompt && prompt < mark, "review, then prompt, then mark complete");

  assert.match(command, /### Review Summary \(agile-pm\)/);
  assert.match(command, /never skip the agent review, never let the implementer dismiss a blocking finding/);
  assert.match(command, /awaiting review/);
});
