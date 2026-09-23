import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS = path.join(ROOT, "assets");
const SCHEMA = path.join(ASSETS, "openspec/schemas/agile-pm");
const WORKFLOW = "workflows/product-shaping.md";

function schemaText(relative) {
  return readFile(path.join(SCHEMA, relative), "utf8");
}

function noteSection(workflow) {
  const start = workflow.indexOf("## Optional Architecture Note");
  assert.notEqual(start, -1, "shaping must define the optional architecture step");
  return workflow.slice(start, workflow.indexOf("## Boundaries And Explicit Handoff", start));
}

// Contract tests for instruction assets, not an agent conversation runner.
test("shaping offers the architecture note once and never assumes consent", async () => {
  const section = noteSection(await schemaText(WORKFLOW));

  assert.match(section, /docs\/architecture\/<note-id>\.md/);
  assert.match(section, /Offer it; never assume it/);
  assert.match(section, /continuing the product\s+conversation declines/);
  assert.match(section, /Do not repeat the offer every turn, re-offer after a decline/);
  assert.match(section, /with no note is a successful outcome/);
  assert.match(section, /Skip the offer when the draft has no candidate/);
});

test("the note stays exploratory, outside every approval and delivery boundary", async () => {
  const workflow = await schemaText(WORKFLOW);
  const section = noteSection(workflow);

  assert.match(section, /\*\*Status:\*\* Exploratory — unapproved/);
  assert.match(section, /never enters the PRD-set manifest or\s+any approval digest/);
  assert.match(section, /A note is not a `design\.md`/);
  assert.match(section, /selects no delivery work, assigns no requirement IDs, approves nothing/);
  assert.match(section, /must never add\s+scope the product conversation has not agreed/);
  assert.match(section, /still requires the\s+approved PRD set and the normal engineering gates/);

  // Path handling matches the draft-ID rules rather than inventing new ones.
  assert.match(section, /Validate `<note-id>` with the draft-ID\s+rules above/);
  assert.match(section, /never write outside the resolved directory/);
  assert.match(section, /ask which root\s+should hold the note instead of guessing/);
  assert.match(section, /reconcile concurrent human edits/);
});

test("the note is an extra permitted write, not a new delivery artifact", async () => {
  const workflow = await schemaText(WORKFLOW);
  assert.match(workflow, /Shaping writes only the selected draft, an accepted architecture note/);
  assert.match(workflow, /The optional architecture note below is the one place those questions may be/);
  assert.match(workflow, /Offer the optional architecture note below when the draft has enough shape/);

  const schema = YAML.parse(await schemaText("schema.yaml"));
  assert.equal(schema.version, 6, "the artifact graph is unchanged");
  assert.deepEqual(schema.artifacts.map(({ id }) => id), [
    "product-brief", "prd", "prd-capabilities", "product-docs", "publication-plan",
    "product-approval", "proposal", "specs", "design", "tasks",
  ]);
  for (const artifact of schema.artifacts) {
    assert.doesNotMatch(artifact.generates, /architecture/, "notes stay outside the graph");
  }

  // Requirements analysis deliberately keeps its stricter draft-only write boundary.
  const requirements = await schemaText("workflows/requirements-analysis.md");
  assert.match(requirements, /Only the draft and temporary safe-save file\s+may be written/);
});

test("the OpenCode adapter offers the note after the draft and still stops before delivery", async () => {
  const command = await readFile(path.join(ASSETS, "opencode/commands/opsx-pm.md"), "utf8");
  const shaping = command.slice(command.indexOf("For shaping, follow"), command.indexOf("For `--from-draft`"));

  assert.match(shaping, /optional architecture\s+note: offer it once when the draft has enough shape/);
  assert.match(shaping, /only if the human accepts/);
  assert.match(shaping, /covered by no approval, and is not a `design\.md`/);
  assert.match(shaping, /do not run the delivery\s+workflow, scaffold a change/);

  const report = shaping.indexOf("Report the saved");
  const offer = shaping.indexOf("optional architecture");
  const stop = shaping.indexOf("Stop here:");
  assert.ok(report !== -1 && offer !== -1 && stop !== -1);
  assert.ok(report < offer && offer < stop, "report the draft, then offer, then stop");
});
