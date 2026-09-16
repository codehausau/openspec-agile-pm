import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS = path.join(ROOT, "assets");

async function filesBelow(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(filePath)));
    else if (entry.isFile()) files.push(filePath);
  }
  return files;
}

test("reusable text assets contain no TAKBot-specific terminology", async () => {
  const pattern = /takbot|openclaw|cursor-on-target|\bcot\b|tak server|atak/i;
  for (const filePath of await filesBelow(ASSETS)) {
    if (!/\.(md|ya?ml|json)$/.test(filePath)) continue;
    const content = await readFile(filePath, "utf8");
    assert.doesNotMatch(content, pattern, path.relative(ROOT, filePath));
  }
});

test("OpenCode adapter includes the complementary PM commands and skills", async () => {
  const names = [
    "pm-brainstorm",
    "pm-challenge-me",
    "pm-discovery",
    "pm-opportunities",
    "pm-solutions",
  ];
  for (const name of names) {
    await readFile(path.join(ASSETS, "opencode", "commands", `${name}.md`));
    const skill = await readFile(
      path.join(ASSETS, "opencode", "skills", name, "SKILL.md"),
      "utf8",
    );
    assert.match(skill, new RegExp(`name: ${name}`));
  }
});

test("the graph requires product pages and a publication plan before approval and engineering", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const artifacts = new Map(schema.artifacts.map((artifact) => [artifact.id, artifact]));
  assert.equal(artifacts.size, schema.artifacts.length, "artifact IDs must be unique");
  assert.equal(schema.version, 6);

  function dependencies(id, visiting = new Set()) {
    assert.ok(artifacts.has(id), `unknown artifact ${id}`);
    assert.ok(!visiting.has(id), `dependency cycle at ${id}`);
    const next = new Set([...visiting, id]);
    return new Set(artifacts.get(id).requires.flatMap((dependency) => [
      dependency,
      ...dependencies(dependency, next),
    ]));
  }

  for (const artifact of artifacts.values()) {
    dependencies(artifact.id);
    await readFile(path.join(schemaRoot, "templates", artifact.template));
  }
  assert.ok(!artifacts.has("master-prd"), "a single-file master is no longer the product artifact");
  const pages = artifacts.get("product-docs");
  assert.equal(pages.generates, "product-docs/**/*.md");
  assert.deepEqual(pages.requires, ["prd", "prd-capabilities"]);
  const plan = artifacts.get("publication-plan");
  assert.equal(plan.generates, "product-publication.yaml");
  assert.deepEqual(plan.requires, ["product-docs"]);
  assert.ok(artifacts.get("product-approval").requires.includes("publication-plan"));

  for (const id of ["proposal", "specs", "design", "tasks"]) {
    assert.ok(dependencies(id).has("product-approval"), `${id} must be approval-gated`);
    assert.ok(dependencies(id).has("product-docs"), `${id} needs product context`);
    assert.ok(dependencies(id).has("publication-plan"), `${id} needs the reviewed plan`);
    assert.match(artifacts.get(id).instruction, /Approved product set preflight/);
  }
  for (const id of schema.apply.requires) {
    assert.ok(dependencies(id).has("publication-plan"), "apply must require the complete approved set");
  }

  const config = YAML.parse(await readFile(path.join(ASSETS, "config", "config.yaml"), "utf8"));
  for (const id of Object.keys(config.rules)) assert.ok(artifacts.has(id), `unknown rule target ${id}`);
});

test("approval is non-publishing and archive owns the reviewed multi-file transaction", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const approval = schema.artifacts.find(({ id }) => id === "product-approval").instruction;
  const template = await readFile(path.join(schemaRoot, "templates", "product-approval.md"), "utf8");
  const workflow = await readFile(path.join(schemaRoot, "workflows/product-publication.md"), "utf8");
  assert.match(template, /\*\*Approval Format:\*\* 3/);
  assert.match(template, /Approved for archive-time publication/);
  assert.match(approval, /Approval writes only the approval record/);
  assert.match(approval, /including product-docs\/mkdocs\.yml/);
  for (const field of ["Publication Plan SHA-256", "Base Publication SHA-256"]) {
    assert.ok(template.includes(`**${field}:**`));
    assert.ok(approval.includes(field));
  }
  assert.match(workflow, /never silently bless new baseline hashes/);
  assert.match(workflow, /restore previous target bytes\/absences and provenance/);
  assert.match(approval, /product-history\/<PRD-set-digest>\//);
  assert.match(workflow, /Never overwrite a later published revision/);
  assert.match(workflow, /The increment need not be published to plan or implement/);
  assert.match(workflow, /Only after verified publication, move the change/);
  assert.match(workflow, /No unindexed\/unmapped staged files/);

  for (const name of ["pm", "propose", "apply", "sync", "update", "archive"]) {
    const command = await readFile(path.join(ASSETS, "opencode", "commands", `opsx-${name}.md`), "utf8");
    assert.match(command, /Approved\s+product set preflight/, `${name} must validate the approved candidate`);
    assert.match(command, /workflows\/product-publication\.md/, `${name} must use the shared contract`);
    assert.doesNotMatch(command, /approval-time master publication|published at approval|master-prd\.md/);
  }
  const archive = await readFile(path.join(ASSETS, "opencode/commands/opsx-archive.md"), "utf8");
  assert.ok(archive.indexOf("5. **Publish the approved") < archive.indexOf("6. **Perform the archive**"));
  assert.match(archive, /restore the previous product pages, removed\s+files, MkDocs config, and provenance/);
});

test("product shaping is a shared workflow outside the delivery artifact graph", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const workflowPath = "workflows/product-shaping.md";
  const templatePath = "templates/product-draft.md";
  const workflow = await readFile(path.join(schemaRoot, workflowPath), "utf8");
  const template = await readFile(path.join(schemaRoot, templatePath), "utf8");
  const command = await readFile(path.join(ASSETS, "opencode", "commands", "opsx-pm.md"), "utf8");
  const config = YAML.parse(await readFile(path.join(ASSETS, "config", "config.yaml"), "utf8"));

  assert.ok(command.includes(workflowPath), "adapter must load the shared shaping contract");
  assert.ok(workflow.includes(templatePath), "shared contract must name its installed template");
  assert.ok(schema.artifacts.find(({ id }) => id === "product-brief").instruction.includes(workflowPath));
  assert.ok(config.rules["product-brief"].some((rule) => rule.includes(workflowPath)));
  for (const mode of ["--shape", "--from-draft"]) {
    assert.ok(command.includes(mode));
    assert.ok(workflow.includes(`/opsx-pm ${mode}`));
  }
  for (const field of ["**Mode:** product-shaping", "**Status:** Draft — unapproved"]) {
    assert.ok(template.includes(field), "saved draft must identify its non-approved mode");
  }
  for (const artifact of schema.artifacts) {
    assert.notEqual(artifact.template, "product-draft.md", "shaping is not a delivery artifact");
    assert.doesNotMatch(artifact.generates, /product-drafts|product-draft\.md/);
    assert.ok(!artifact.requires.includes("product-draft"), "existing changes must not require a draft");
  }
  assert.ok(!schema.apply.requires.includes("product-draft"));
});

test("journeys live in drafts or detailed user/system pages and remain approval-covered", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const workflowPath = "workflows/user-journeys.md";
  const examplePath = "examples/user-journeys.md";
  const workflow = await readFile(path.join(schemaRoot, workflowPath), "utf8");
  const shaping = await readFile(path.join(schemaRoot, "workflows/product-shaping.md"), "utf8");
  assert.ok(shaping.includes(workflowPath));
  assert.ok(workflow.includes(examplePath));
  await readFile(path.join(schemaRoot, examplePath));

  for (const name of ["product-draft.md", "product-capability.md", "product-system-capability.md"]) {
    const template = await readFile(path.join(schemaRoot, "templates", name), "utf8");
    assert.ok(template.includes(workflowPath), `${name} must use the shared conventions`);
    assert.match(template, /^## User Journeys$/m);
    assert.match(template, /^## User Flows$/m);
  }
  for (const id of ["prd-capabilities", "product-docs", "product-approval"]) {
    const artifact = schema.artifacts.find((artifact) => artifact.id === id);
    assert.ok(artifact.instruction.includes(workflowPath), `${id} must reconcile the same product views`);
  }
  for (const artifact of schema.artifacts) {
    assert.doesNotMatch(artifact.generates, /journey|flow|\.mmd|\.svg/, "views stay embedded in existing PRDs");
  }
  assert.match(workflow, /product-docs\/system-capabilities\//);
  const overview = await readFile(path.join(schemaRoot, "templates/product-overview.md"), "utf8");
  assert.match(overview, /^## Capabilities$/m);
  assert.match(overview, /^## System Capabilities$/m);
  assert.doesNotMatch(overview, /\| Requirement reference \|/, "overview must not duplicate detailed requirement tables");
});

test("publication contract covers navigation ownership, retirement, concurrent changes and recovery", async () => {
  const workflow = await readFile(path.join(ASSETS, "openspec/schemas/agile-pm/workflows/product-publication.md"), "utf8");
  for (const rule of [
    /Either category may be empty/,
    /Preserve existing metadata, theme, plugins, extensions, custom YAML/,
    /two overview indexes|both overview indexes/,
    /Never infer deletion from omission|never infer deletion from omission/,
    /mkdocs build --strict -f <staged-config>/,
    /atomically|atomic\s+directory creation/,
    /journal\/lock\s+for explicit recovery/,
    /format-2 single master/,
    /approval do not change|approval\s+do not change/,
  ]) assert.match(workflow, rule);

  const schema = YAML.parse(await readFile(path.join(ASSETS, "openspec/schemas/agile-pm/schema.yaml"), "utf8"));
  const config = YAML.parse(await readFile(path.join(ASSETS, "config/config.yaml"), "utf8"));
  assert.match(schema.apply.instruction, /Do not publish product pages/);
  assert.ok(config.rules["product-approval"].some((rule) => rule.includes("only during archive")));
  assert.ok(config.operations.archive.guidance.some((rule) => rule.includes("then archive")));
  assert.equal(config.rules["master-prd"], undefined);
});
