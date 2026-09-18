import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS = path.join(ROOT, "assets");
const SCHEMA = path.join(ASSETS, "openspec/schemas/agile-pm");
const WORKFLOW = "workflows/requirements-analysis.md";
const EXAMPLE = "examples/requirements-analysis.md";

function schemaText(relative) {
  return readFile(path.join(SCHEMA, relative), "utf8");
}

// These are contract tests for instruction assets, not an agent conversation runner.
// The README smoke test exercises human decisions, mode stickiness, and write boundaries.
test("requirements analysis is reachable from core shaping and handoff without extending the delivery graph", async () => {
  const schema = YAML.parse(await schemaText("schema.yaml"));
  const config = YAML.parse(await readFile(path.join(ASSETS, "config/config.yaml"), "utf8"));
  const shaping = await schemaText("workflows/product-shaping.md");
  const journeys = await schemaText("workflows/user-journeys.md");
  const workflow = await schemaText(WORKFLOW);

  assert.equal(schema.version, 6);
  assert.deepEqual(schema.artifacts.map(({ id }) => id), [
    "product-brief", "prd", "prd-capabilities", "product-docs", "publication-plan",
    "product-approval", "proposal", "specs", "design", "tasks",
  ]);
  assert.deepEqual(schema.apply.requires, ["tasks"]);
  for (const id of ["product-brief", "prd-capabilities"]) {
    assert.ok(schema.artifacts.find((artifact) => artifact.id === id).instruction.includes(WORKFLOW));
    assert.ok(config.rules[id].some((rule) => rule.includes(WORKFLOW)));
  }
  for (const content of [shaping, journeys]) assert.ok(content.includes(WORKFLOW));
  assert.ok(shaping.includes("/opsx-pm --requirements <draft-id>"));
  for (const reference of [
    "workflows/product-shaping.md", "workflows/user-journeys.md",
    "workflows/product-publication.md", "templates/product-draft.md", EXAMPLE,
  ]) {
    assert.ok(workflow.includes(reference));
    await schemaText(reference);
  }
});

test("adapter routes requirements before delivery and fails closed for invalid or missing input", async () => {
  const command = await readFile(path.join(ASSETS, "opencode/commands/opsx-pm.md"), "utf8");
  const frontmatter = YAML.parse(command.match(/^---\n([\s\S]*?)\n---/)[1]);
  assert.equal(frontmatter.agent, "build");
  assert.match(frontmatter.description, /elicit and review requirements/);
  assert.ok(command.includes("$ARGUMENTS"));

  const delivery = command.indexOf("**Delivery workflow**");
  const requirements = command.indexOf("For `--requirements` or equivalent living-draft intent");
  const stop = command.indexOf("Stop here:", requirements);
  assert.ok(requirements > 0 && stop > requirements && stop < delivery);
  const entry = command.slice(0, delivery);
  for (const pattern of [
    /--shape.*,.*--requirements.*, and.*--from-draft.*are mutually\s+exclusive/,
    /Reject combined or repeated mode flags, missing IDs, unknown flags/,
    /extra arguments except the optional `--shape` topic before any writes/,
    /Do not forward\s+them to OpenSpec/,
    /openspec context --json/,
    /returned `root.path`/,
    /Stop on a missing contract/,
    /require the named draft to\s+exist/,
    /baseline-drift, and concurrent-edit checks/,
    /Missing drafts require a separate shaping request/,
    /Human-confirmed intent and a clean review do not authorize delivery or approval/,
    /Honor its recorded requirements-analysis focus/,
  ]) assert.match(entry, pattern);
  assert.ok(entry.includes(WORKFLOW));
  assert.match(command.slice(stop, command.indexOf("For shaping, follow", stop)), /do not run delivery,[\s\S]*approve, or publish documentation/);
});

test("requirements contract retains exploratory write, evidence, and approval boundaries", async () => {
  const workflow = await schemaText(WORKFLOW);
  for (const pattern of [
    /Require an existing draft/,
    /reject escaping paths and\s+symlink components/,
    /For a missing named draft, stop/,
    /Read the entire draft/,
    /Only the draft and temporary safe-save file\s+may be written/,
    /write failure leaves the last saved draft intact/,
    /concurrent-edit\s+check and staged verified replacement/,
    /Mode: product-shaping/,
    /Status: Draft — unapproved/,
    /do not create\s+final change-scoped FR\/NFR IDs/,
    /Inferred requirements\s+stay `Suggested`/,
    /Never treat\s+an inference as a fact or silently resolve unanswered questions/,
    /SHALL is candidate\s+wording, not approval/,
    /must not create an OpenSpec delivery change, call\s+`\/opsx-propose`/,
    /select an MVP or increment automatically/,
    /create implementation\s+tasks, implement code, approve requirements/,
    /publish product documentation, or edit catalogs\/MkDocs/,
    /outside the approved PRD-set manifest/,
    /Later draft edits never silently\s+change approved scope or invalidate its digest/,
  ]) assert.match(workflow, pattern);
});

test("template and review contract capture candidates and findings without requiring filled categories", async () => {
  const workflow = await schemaText(WORKFLOW);
  const template = await schemaText("templates/product-draft.md");
  assert.ok(template.includes(WORKFLOW));
  for (const heading of [
    "Candidate Requirements", "Cross-Cutting Requirements", "Requirements Analysis", "Open Questions",
  ]) assert.ok(template.includes(`## ${heading}\n`));
  for (const category of [
    "Security", "Performance", "Availability", "Reliability", "Accessibility", "Auditability",
    "Data And Retention", "Interoperability", "Deployment / Operating Environment",
    "Ambiguities", "Conflicts", "Missing Information", "Unverified Assumptions", "Requirement Gaps",
    "Review Summary",
  ]) assert.ok(template.includes(`### ${category}\n`));
  for (const field of ["Requirement", "Rationale", "Source / journey", "Acceptance evidence", "Status", "Open questions"]) {
    assert.ok(template.includes(`**${field}:**`));
    assert.ok(workflow.includes(`**${field}:**`));
  }
  for (const pattern of [
    /Ask one focused question at a time/,
    /Run a distinct review pass/,
    /start\s+directly at Quality Review/,
    /behavioral, observable, atomic, consistent, traceable, and testable/,
    /Do not fabricate requirements merely to fill categories/,
    /Do not invent latency targets, uptime percentages, retention periods/,
    /Record \*\*Review Summary\*\*: coverage and omissions/,
    /Do not silently\s+choose between conflicting requirements, drop an obligation during deduplication/,
    /Revisit affected\s+findings when a candidate, source, journey, or baseline changes/,
  ]) assert.match(workflow, pattern);
  for (const status of ["Suggested", "Needs clarification", "Human-confirmed intent", "Parked"]) {
    assert.ok(template.includes(status));
    assert.ok(workflow.includes(`\`${status}\``));
  }
});

test("draft handoff selects candidates and shared constraints before assigning formal IDs", async () => {
  const workflow = await schemaText(WORKFLOW);
  const handoff = workflow.slice(workflow.indexOf("Only an explicit request for delivery scoping"));
  for (const pattern of [
    /\/opsx-pm --from-draft <draft-id>/,
    /reconcile material baseline drift/,
    /do not promote\s+the entire draft/,
    /cross-cutting constraints, dependencies, acceptance evidence, and unresolved\s+findings/,
    /Resolve questions material to the\s+selected scope\/acceptance before PRD approval/,
    /Keep existing product-brief capture\/pursue gates/,
    /source draft path and\s+raw-byte SHA-256/,
    /selected candidate headings/,
    /map only human-selected\s+candidates to normal capability-local FR\/NFR IDs/,
    /Unselected candidates stay exploratory/,
    /No prior requirements session\s+or exhaustive review is required/,
    /complete-set format-3 approval/,
    /archive-time publication/,
  ]) assert.match(handoff, pattern);
});

test("worked draft is partial, traceable, and unapproved with resolvable local references", async () => {
  const example = await schemaText(EXAMPLE);
  assert.match(example, /fictional partial draft/);
  assert.match(example, /\*\*Status:\*\* Draft — unapproved/);
  assert.doesNotMatch(example, /\b(?:FR|NFR)-\d+\b|\*\*Approval Format:/);
  assert.match(example, /Neither|neither statement has been silently preferred/);
  assert.match(example, /threshold, and measurement window are unknown/);
  assert.match(example, /were not assessed/);
  assert.match(example, /not executed|Not executed/);
  const candidates = [...example.matchAll(/^- \*\*Requirement:\*\* ([\s\S]*?)(?=\n#{2,5} |\nOther cross-cutting)/gm)];
  assert.equal(candidates.length, 4);
  for (const [, candidate] of candidates) {
    for (const field of ["Rationale", "Source / journey", "Acceptance evidence", "Status", "Open questions"]) {
      assert.ok(candidate.includes(`**${field}:**`));
    }
  }
  const headings = new Set([...example.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) =>
    heading.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s/g, "-")));
  for (const [, anchor] of example.matchAll(/\]\(#([^)]+)\)/g)) {
    assert.ok(headings.has(anchor), `missing example heading: ${anchor}`);
  }
  await schemaText("examples/user-journeys.md");
  const readme = await readFile(path.join(ROOT, "README.md"), "utf8");
  assert.ok(readme.includes(`assets/openspec/schemas/agile-pm/${WORKFLOW}`));
  assert.ok(readme.includes(`assets/openspec/schemas/agile-pm/${EXAMPLE}`));
  assert.match(readme, /\/opsx-pm --requirements <draft-id>/);
});
