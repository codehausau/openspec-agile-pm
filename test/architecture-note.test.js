import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS = path.join(ROOT, "assets");
const SCHEMA = path.join(ASSETS, "openspec/schemas/agile-pm");
const WORKFLOW = "workflows/architecture-notes.md";

function schemaText(relative) {
  return readFile(path.join(SCHEMA, relative), "utf8");
}

function commandText(name) {
  return readFile(path.join(ASSETS, "opencode/commands", `${name}.md`), "utf8");
}

// Contract tests for instruction assets, not an agent conversation runner.
test("the architecture step is its own contract, reachable without a draft or approval", async () => {
  const workflow = await schemaText(WORKFLOW);

  assert.match(workflow, /requires no OpenSpec change, product draft, or approved PRD set/);
  assert.match(workflow, /`\/opsx-architect <note-id> \[topic\]`/);
  assert.match(workflow, /At the end of a product shaping session/);
  assert.match(workflow, /At the delivery PM handoff, after approval passes/);
  assert.match(workflow, /At points 2 and 3, offer at most once per session/);
  assert.match(workflow, /Offer it; never assume it/);
  assert.match(workflow, /Do not repeat the offer every\s+turn, re-offer after a decline/);

  // The two pre-existing offer points now delegate here instead of inlining the step.
  const shaping = await schemaText("workflows/product-shaping.md");
  assert.ok(shaping.includes(WORKFLOW), "shaping must delegate to the extracted contract");
  assert.doesNotMatch(shaping, /When the human accepts, discuss before writing/, "step was extracted");
  const pm = await commandText("opsx-pm");
  assert.equal([...pm.matchAll(new RegExp(WORKFLOW, "g"))].length, 2, "both offer points cite it");
});

test("accepting starts a discussion, and saving is a second, separate consent", async () => {
  const workflow = await schemaText(WORKFLOW);

  assert.match(workflow, /check it against the\s+repository before reasoning from it/);
  assert.match(workflow, /Ask one focused question at a time/);
  assert.match(workflow, /surface more than one approach/);
  assert.match(workflow, /Name the technologies, interfaces,\s+protocols, and operational constraints/);
  assert.match(workflow, /never invent benchmarks, costs, throughput, latency, or operational experience/);
  assert.match(workflow, /Name the unknowns that would decide between approaches/);
  assert.match(workflow, /`\/opsx-explore` is the existing thinking mode/);
  assert.match(workflow, /Offer to save only once the discussion has something worth keeping/);
  assert.match(workflow, /changes nobody's\s+mind is still a successful outcome/);

  const discuss = workflow.indexOf("## The Discussion");
  const save = workflow.indexOf("## Writing The Note");
  assert.ok(discuss !== -1 && save !== -1 && discuss < save, "discuss, then write");
});

test("the note stays exploratory, outside every approval and delivery boundary", async () => {
  const workflow = await schemaText(WORKFLOW);

  assert.match(workflow, /\*\*Exploratory — unapproved\*\*/);
  assert.match(workflow, /never enters the PRD-set manifest or any\s+approval digest/);
  assert.match(workflow, /It is not a `design\.md`/);
  assert.match(workflow, /selects no delivery work, assigns no requirement IDs, approves\s+nothing/);
  assert.match(workflow, /must never add scope the product conversation has not\s+agreed/);
  assert.match(workflow, /Validate `<note-id>` as one lowercase kebab-case path segment/);
  assert.match(workflow, /Reject separators, extensions, absolute paths/);
  assert.match(workflow, /ask\s+which root should hold the note instead of guessing/);
  assert.match(workflow, /writes only the selected note and any temporary file/);
  assert.match(workflow, /route to `\/opsx-pm`/);
});

test("the note is Markdown with checked Mermaid diagrams and text equivalents", async () => {
  const workflow = await schemaText(WORKFLOW);

  assert.match(workflow, /Write the note as Markdown/);
  for (const type of ["flowchart TD", "sequenceDiagram", "stateDiagram-v2"]) {
    assert.ok(workflow.includes(type), `architecture needs ${type}, not only user-flow charts`);
  }
  assert.match(workflow, /text equivalent after each\s+diagram/);
  assert.match(workflow, /say whether\s+rendering was also checked/);
  assert.match(workflow, /give each its own diagram\s+instead of blending them/);
  assert.match(workflow, /must not introduce a component, interface, or\s+behavior the note's prose does not state/);

  // A worked example to imitate; diagrams.test.js parses it with the real parser.
  const diagrams = [...workflow.matchAll(/^[ \t]*```mermaid[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*\r?$/gm)];
  assert.equal(diagrams.length, 1, "one embedded example");
  assert.match(diagrams[0][1], /^flowchart /m, "kept a flowchart so diagrams.test.js stays unchanged");
});

test("the /opsx-architect adapter validates its id and writes nothing else", async () => {
  const command = await commandText("opsx-architect");
  const frontmatter = YAML.parse(command.match(/^---\n([\s\S]*?)\n---/)[1]);

  assert.equal(frontmatter.agent, "build");
  assert.match(frontmatter.description, /architecture or technology question/);
  assert.ok(command.includes("$ARGUMENTS"));
  assert.ok(command.includes(`openspec/schemas/agile-pm/${WORKFLOW}`));
  assert.match(command, /stop and request a bundle update/);

  assert.match(command, /one lowercase kebab-case path segment/);
  assert.match(command, /Reject separators,\s+extensions, absolute paths, `\.\.`, empty ids/);
  assert.match(command, /before any write/);
  assert.match(command, /never forward them to\s+the OpenSpec CLI/);

  assert.match(command, /No product draft, change, or approved PRD set is required/);
  assert.match(command, /Write only the note and any temporary file needed for its safe save/);
  assert.match(command, /Do not scaffold a change, create or edit proposal\/specs\/design\/tasks/);
  assert.match(command, /point at `\/opsx-pm`/);
  assert.match(command, /point at `\/opsx-explore`/);

  // It has no business running the publication preflight the PM-path commands do.
  assert.doesNotMatch(command, /Approved\s+product set preflight/);
});

test("a saved note is read back as design input without becoming approved scope", async () => {
  const schema = YAML.parse(await schemaText("schema.yaml"));
  const design = schema.artifacts.find(({ id }) => id === "design");

  assert.match(design.instruction, /architecture note for this work exists under docs\/architecture\//);
  assert.match(design.instruction, new RegExp(WORKFLOW.replace("/", "\\/")));
  assert.match(design.instruction, /treat it as prior discussion with the human/);
  assert.match(design.instruction, /cite its path in Context/);
  assert.match(design.instruction, /exploratory input, not approved scope or a\s+decision/);
  assert.match(design.instruction, /prefer the PRD set wherever they disagree/);
  assert.match(design.instruction, /never create or edit one from this artifact/);

  // The note is an input, not a dependency: the graph is untouched.
  assert.equal(schema.version, 6);
  assert.deepEqual(design.requires, [
    "proposal", "product-approval", "prd", "prd-capabilities", "product-docs", "publication-plan",
  ]);
  for (const artifact of schema.artifacts) {
    assert.doesNotMatch(artifact.generates, /architecture/, "notes stay outside the graph");
  }
});

test("propose stops at design before deriving tasks from it", async () => {
  const command = await commandText("opsx-propose");

  assert.match(command, /also stop after creating `design\.md` and before `tasks`/);
  assert.match(command, /Decisions with the alternatives considered/);
  assert.match(command, /say whether an architecture note under\s+`docs\/architecture\/` informed it/);
  assert.match(command, /Tasks are\s+derived from design, so a correction costs far less before they exist/);
  assert.match(command, /Silence or an\s+ambiguous reply is not acceptance/);
  assert.match(command, /update `design\.md` and\s+re-present it instead of advancing/);
  assert.match(command, /reviews engineering approach, not\s+product scope/);
  assert.match(command, /any of these human gates/);

  // Scoped to agile-pm so the stock spec-driven flow is unaffected.
  const gate = command.indexOf("For `agile-pm`, also stop after creating `design.md`");
  const block = command.indexOf("**Capability-PRD human gates override automatic continuation.**");
  assert.ok(block !== -1 && gate > block, "the gate lives in the capability-PRD block");
});
