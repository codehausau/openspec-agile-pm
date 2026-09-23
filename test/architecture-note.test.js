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

test("accepting starts a discussion, and saving is a second, separate consent", async () => {
  const section = noteSection(await schemaText(WORKFLOW));

  assert.match(section, /When the human accepts, discuss before writing anything/);
  assert.match(section, /ask one\s+focused question at a time, surface more than one approach/);
  assert.match(section, /name the\s+technologies, interfaces, and operational constraints/);
  assert.match(section, /Never present a preference as a\s+settled choice/);
  assert.match(section, /`\/opsx-explore` is the existing thinking mode/);
  assert.match(section, /Offer to save only once the discussion has something worth keeping/);
  assert.match(section, /changes nobody's\s+mind is still a successful outcome/);

  // Discussion comes before any write step.
  const discuss = section.indexOf("discuss before writing anything");
  const save = section.indexOf("When the human asks to save it:");
  const destination = section.indexOf("Resolve the destination before writing");
  assert.ok(discuss !== -1 && save !== -1 && destination !== -1);
  assert.ok(discuss < save && save < destination, "discuss, then ask to save, then write");
});

test("both offer points reach the same shared step", async () => {
  const workflow = await schemaText(WORKFLOW);
  const section = noteSection(workflow);
  assert.match(section, /This step is\s+shared by two offer points/);
  assert.match(section, /At the end of a shaping session/);
  assert.match(section, /At the delivery PM handoff, once approval passes/);
  assert.match(section, /offered at most once per session/);

  // Delivery mode previously never reached this step at all.
  const command = await readFile(path.join(ASSETS, "opencode/commands/opsx-pm.md"), "utf8");
  const delivery = command.slice(command.indexOf("The remaining sections apply only to delivery mode"));
  assert.match(delivery, /offer the optional\s+architecture step once/);
  assert.match(delivery, /workflows\/product-shaping\.md/);
  assert.match(delivery, /Discuss first and save only if asked/);
  assert.match(delivery, /Name `\/opsx-explore <name>` for deeper free-form investigation/);
  assert.match(delivery, /Create, edit, and skip no engineering artifact here/);

  const preflight = delivery.indexOf("Approved product set preflight");
  const offer = delivery.indexOf("offer the optional");
  const handoff = delivery.indexOf("run `/opsx-propose <name>`");
  assert.ok(preflight !== -1 && offer !== -1 && handoff !== -1);
  assert.ok(preflight < offer && offer < handoff, "approval, then offer, then engineering handoff");
});

test("a saved note is read back as design input without becoming approved scope", async () => {
  const schema = YAML.parse(await schemaText("schema.yaml"));
  const design = schema.artifacts.find(({ id }) => id === "design");

  assert.match(design.instruction, /architecture note for this work exists under docs\/architecture\//);
  assert.match(design.instruction, /treat it as prior discussion with the human/);
  assert.match(design.instruction, /cite its path in Context/);
  assert.match(design.instruction, /exploratory input, not approved scope or a\s+decision/);
  assert.match(design.instruction, /prefer the PRD set wherever they disagree/);
  assert.match(design.instruction, /never create or edit one from this artifact/);

  // The note is an input, not a dependency: the graph is untouched.
  assert.deepEqual(design.requires, [
    "proposal", "product-approval", "prd", "prd-capabilities", "product-docs", "publication-plan",
  ]);
});

test("the note is Markdown with checked Mermaid diagrams and text equivalents", async () => {
  const section = noteSection(await schemaText(WORKFLOW));

  assert.match(section, /Write the note as Markdown/);
  assert.match(section, /Include at least one diagram whenever it describes/);
  for (const type of ["flowchart TD", "sequenceDiagram", "stateDiagram-v2"]) {
    assert.ok(section.includes(type), `architecture needs ${type}, not only user-flow charts`);
  }
  assert.match(section, /text equivalent after\s+each diagram/);
  assert.match(section, /say\s+whether rendering was also checked/);
  assert.match(section, /give each its own\s+diagram instead of blending them/);
  assert.match(section, /must not introduce a component,\s+interface, or behavior the note's prose does not state/);

  // A worked example the agent can imitate; diagrams.test.js parses it for real.
  const diagrams = [...section.matchAll(/^[ \t]*```mermaid[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*\r?$/gm)];
  assert.equal(diagrams.length, 1, "one embedded example");
  assert.match(diagrams[0][1], /^flowchart /m, "kept a flowchart so diagrams.test.js stays unchanged");
  assert.match(section, /Text equivalent: the web client sends an invite request/);
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
