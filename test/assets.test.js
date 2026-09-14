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

test("the client-neutral graph requires a complete master before approval and engineering", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const artifacts = new Map(schema.artifacts.map((artifact) => [artifact.id, artifact]));
  assert.equal(artifacts.size, schema.artifacts.length, "artifact IDs must be unique");
  assert.equal(schema.version, 5);

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
  const master = artifacts.get("master-prd");
  assert.equal(master.generates, "master-prd.md");
  assert.deepEqual(master.requires, ["prd", "prd-capabilities"]);
  assert.ok(artifacts.get("product-approval").requires.includes("master-prd"));

  for (const id of ["proposal", "specs", "design", "tasks"]) {
    assert.ok(dependencies(id).has("product-approval"), `${id} must be approval-gated`);
    assert.ok(artifacts.get(id).requires.includes("master-prd"), `${id} needs master context`);
    assert.match(artifacts.get(id).instruction, /Approved master preflight/);
  }
  for (const id of schema.apply.requires) {
    assert.ok(dependencies(id).has("master-prd"), "apply must require the reviewed master");
  }

  const config = YAML.parse(await readFile(path.join(ASSETS, "config", "config.yaml"), "utf8"));
  for (const id of Object.keys(config.rules)) assert.ok(artifacts.has(id), `unknown rule target ${id}`);
});

test("approval and adapter contracts include master publication and historical provenance", async () => {
  const schemaRoot = path.join(ASSETS, "openspec", "schemas", "agile-pm");
  const schema = YAML.parse(await readFile(path.join(schemaRoot, "schema.yaml"), "utf8"));
  const approval = schema.artifacts.find(({ id }) => id === "product-approval").instruction;
  const template = await readFile(path.join(schemaRoot, "templates", "product-approval.md"), "utf8");
  assert.match(template, /\*\*Approval Format:\*\* 2/);
  assert.match(template, /Approved for immediate publication to docs\/product\/prd\.md/);
  assert.match(approval, /followed by master-prd\.md last/);
  for (const field of ["Master SHA-256", "Base Master SHA-256"]) {
    assert.ok(template.includes(`**${field}:**`));
    assert.ok(approval.includes(field));
  }
  assert.match(approval, /rebase the candidate and obtain fresh approval/);
  assert.match(approval, /restore\s+the previous master and README/);
  assert.match(approval, /product-history\/<PRD-set-digest>\//);
  assert.match(approval, /later approved descendant/);

  for (const name of ["pm", "propose", "apply", "sync", "update", "archive"]) {
    const command = await readFile(path.join(ASSETS, "opencode", "commands", `opsx-${name}.md`), "utf8");
    assert.match(command, /Approved master preflight/, `${name} must validate publication`);
    assert.match(command, /master-prd\.md/, `${name} must include the master in approval`);
    assert.doesNotMatch(command, /Approved for archive-time publication|Published to `docs\/product\/<target-name>/);
  }
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
