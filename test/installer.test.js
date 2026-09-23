import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import YAML from "yaml";

import { install, uninstall } from "../lib/installer.js";

async function temporaryProject(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "openspec-agile-pm-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function writeProjectConfig(root) {
  await mkdir(path.join(root, "openspec"), { recursive: true });
  await writeFile(
    path.join(root, "openspec", "config.yaml"),
    `# consumer comment
schema: spec-driven
context: |
  Product-specific context remains here.
rules:
  proposal:
    - Keep this consumer rule. # retain this comment
`,
  );
}

test("init installs schema and OpenCode adapter while preserving project config", async (t) => {
  const root = await temporaryProject(t);
  await writeProjectConfig(root);

  await install({ cwd: root, client: "opencode", mode: "init" });

  const configText = await readFile(path.join(root, "openspec", "config.yaml"), "utf8");
  const config = YAML.parse(configText);
  assert.equal(config.schema, "agile-pm");
  assert.match(config.context, /Product-specific context remains here/);
  assert.ok(config.rules.proposal.includes("Keep this consumer rule."));
  assert.ok(config.rules.proposal.some((rule) => rule.includes("stale PRD-set approval")));
  assert.ok(config.operations.archive.guidance.length > 0);
  assert.match(configText, /# consumer comment/);

  await readFile(path.join(root, "openspec", "schemas", "agile-pm", "schema.yaml"));
  await readFile(path.join(root, ".opencode", "commands", "opsx-pm.md"));
  await readFile(path.join(root, ".opencode", "skills", "pm-discovery", "SKILL.md"));

  const manifest = JSON.parse(
    await readFile(path.join(root, "openspec", ".agile-pm-install.json"), "utf8"),
  );
  assert.equal(manifest.client, "opencode");
  assert.equal(manifest.config.originalSchema, "spec-driven");
  assert.ok(Object.keys(manifest.files).every((file) => !file.includes("\\")));
  assert.match(await readFile(path.join(root, ".gitignore"), "utf8"), /^\.nanopm\/$/m);
});

test("init preflights conflicts before writing anything", async (t) => {
  const root = await temporaryProject(t);
  const conflict = path.join(root, ".opencode", "commands", "pm-brainstorm.md");
  await mkdir(path.dirname(conflict), { recursive: true });
  await writeFile(conflict, "consumer-owned\n");

  await assert.rejects(
    install({ cwd: root, client: "opencode", mode: "init" }),
    /Refusing to overwrite conflicting files/,
  );
  await assert.rejects(
    readFile(path.join(root, "openspec", "schemas", "agile-pm", "schema.yaml")),
    /ENOENT/,
  );
  assert.equal(await readFile(conflict, "utf8"), "consumer-owned\n");
});

test("update rejects modified owned files unless forced", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, client: "opencode", mode: "init" });
  const installed = path.join(root, ".opencode", "commands", "pm-brainstorm.md");
  await writeFile(installed, "locally modified\n");

  await assert.rejects(
    install({ cwd: root, mode: "update" }),
    /Refusing to overwrite conflicting files/,
  );
  await install({ cwd: root, mode: "update", force: true });
  assert.match(await readFile(installed, "utf8"), /pm-brainstorm/);
});

test("uninstall restores prior config and preserves modified files", async (t) => {
  const root = await temporaryProject(t);
  await writeProjectConfig(root);
  await install({ cwd: root, client: "opencode", mode: "init" });

  const modified = path.join(root, ".opencode", "commands", "pm-brainstorm.md");
  await writeFile(modified, "keep my local command\n");
  await uninstall({ cwd: root });

  assert.equal(await readFile(modified, "utf8"), "keep my local command\n");
  await assert.rejects(
    readFile(path.join(root, "openspec", "schemas", "agile-pm", "schema.yaml")),
    /ENOENT/,
  );
  await assert.rejects(
    readFile(path.join(root, "openspec", ".agile-pm-install.json")),
    /ENOENT/,
  );

  const configText = await readFile(path.join(root, "openspec", "config.yaml"), "utf8");
  const config = YAML.parse(configText);
  assert.equal(config.schema, "spec-driven");
  assert.match(config.context, /Product-specific context remains here/);
  assert.deepEqual(config.rules.proposal, ["Keep this consumer rule."]);
  assert.match(configText, /retain this comment/);
});

test("dry-run does not create files", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, client: "opencode", mode: "init", dryRun: true });
  await assert.rejects(
    readFile(path.join(root, "openspec", ".agile-pm-install.json")),
    /ENOENT/,
  );
});

test("uninstall removes package-created config and gitignore files", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, mode: "init" });
  await uninstall({ cwd: root });
  await assert.rejects(readFile(path.join(root, "openspec", "config.yaml")), /ENOENT/);
  await assert.rejects(readFile(path.join(root, ".gitignore")), /ENOENT/);
});

test("manifest paths cannot escape the target project", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, mode: "init" });
  const outside = path.join(path.dirname(root), `${path.basename(root)}-outside.txt`);
  t.after(() => rm(outside, { force: true }));
  await writeFile(outside, "do not remove\n");

  const manifestPath = path.join(root, "openspec", ".agile-pm-install.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.files["../../outside.txt"] = "0".repeat(64);
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);

  await assert.rejects(uninstall({ cwd: root }), /escapes the project/);
  assert.equal(await readFile(outside, "utf8"), "do not remove\n");
});

test("installer rejects symlinked destination directories", async (t) => {
  const root = await temporaryProject(t);
  const outside = await temporaryProject(t);
  try {
    await symlink(outside, path.join(root, ".opencode"), "dir");
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error.code)) {
      t.skip("directory symlinks are unavailable on this platform");
      return;
    }
    throw error;
  }

  await assert.rejects(
    install({ cwd: root, client: "opencode", mode: "init" }),
    /symlinked destination/,
  );
  assert.deepEqual(await readFile(path.join(root, ".opencode")).catch(() => null), null);
  assert.deepEqual(await import("node:fs/promises").then(({ readdir }) => readdir(outside)), []);
});

test("client removal preserves modified obsolete adapter files and stops tracking them", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, client: "opencode", mode: "init" });
  const modified = path.join(root, ".opencode", "commands", "pm-brainstorm.md");
  await writeFile(modified, "consumer version\n");

  await install({ cwd: root, client: "none", mode: "update" });

  assert.equal(await readFile(modified, "utf8"), "consumer version\n");
  const manifest = JSON.parse(
    await readFile(path.join(root, "openspec", ".agile-pm-install.json"), "utf8"),
  );
  assert.equal(manifest.client, "none");
  assert.equal(manifest.files[".opencode/commands/pm-brainstorm.md"], undefined);
});

test("update migrates owned single-master rules without publishing or changing consumer records", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, client: "opencode", mode: "init" });

  // Model an installed schema-5 bundle and its original owned contributions.
  const oldRule = "Complete approval by publishing the exact reviewed master to docs/product/prd.md immediately, using the selected planning home and the guarded publication transaction.";
  const oldMasterRule = "Prepare one self-contained full product revision before approval.";
  const oldGuidance = [
    "Archive records history only; never publish dated product copies, append catalog rows, or rewrite docs/product/prd.md during archive.",
  ];
  const consumerGuidance = "Preserve this consumer archive convention.";
  const configPath = path.join(root, "openspec", "config.yaml");
  await writeFile(configPath, YAML.stringify({
    schema: "agile-pm",
    context: "Consumer product context.",
    rules: { "product-approval": [oldRule], "master-prd": [oldMasterRule] },
    operations: { archive: { guidance: [...oldGuidance, consumerGuidance] } },
  }));

  const manifestPath = path.join(root, "openspec", ".agile-pm-install.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.config.contextAdded = null;
  manifest.config.rulesAdded = { "product-approval": [oldRule], "master-prd": [oldMasterRule] };
  manifest.config.guidanceAdded = { archive: oldGuidance };

  const schemaPath = "openspec/schemas/agile-pm/schema.yaml";
  const oldSchema = "name: agile-pm\nversion: 5\nartifacts: []\n";
  await writeFile(path.join(root, schemaPath), oldSchema);
  manifest.files[schemaPath] = createHash("sha256").update(oldSchema).digest("hex");
  const masterTemplate = "openspec/schemas/agile-pm/templates/master-prd.md";
  const oldTemplate = "# Original single master template\n";
  await writeFile(path.join(root, masterTemplate), oldTemplate);
  manifest.files[masterTemplate] = createHash("sha256").update(oldTemplate).digest("hex");
  const newResources = [
    "workflows/product-publication.md", "templates/product-overview.md",
    "templates/product-capability.md", "templates/product-system-capability.md",
    "templates/product-publication.yaml", "templates/mkdocs.yml",
  ].map((relative) => `openspec/schemas/agile-pm/${relative}`);
  for (const relative of newResources) {
    await rm(path.join(root, relative));
    delete manifest.files[relative];
  }
  await writeFile(manifestPath, JSON.stringify(manifest));

  const historicalFiles = {
    "docs/product/README.md": "# Product Documentation\n\nHuman preamble and legacy catalog rows.\n",
    "docs/product/prd.md": "Previously approved single master.\n",
    "docs/product/capabilities/consumer-page.md": "Consumer-owned capability notes.\n",
    "mkdocs.yml": "# consumer site\nsite_name: Original\ntheme: readthedocs\nnav:\n  - Guide: guide.md\n",
    "docs/product/2026-09-13-first-increment/prd.md": "Approved historical increment.\n",
    "openspec/changes/archive/2026-09-13-first-increment/product-approval.md": "Original approval record.\n",
    "openspec/changes/active/master-prd.md": "Pending legacy master.\n",
    "openspec/changes/active/product-approval.md": "**Approval Format:** 2\n",
  };
  for (const [relative, content] of Object.entries(historicalFiles)) {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), content);
  }

  await install({ cwd: root, mode: "update" });
  const config = YAML.parse(await readFile(configPath, "utf8"));
  assert.equal(config.context, "Consumer product context.");
  assert.ok(config.operations.archive.guidance.includes(consumerGuidance));
  for (const rule of oldGuidance) assert.ok(!config.operations.archive.guidance.includes(rule));
  assert.ok(!config.rules["product-approval"].includes(oldRule));
  assert.equal(config.rules["master-prd"], undefined);
  assert.ok(config.rules["product-docs"].length > 0);
  assert.ok(config.rules["publication-plan"].length > 0);
  assert.ok(config.rules["product-approval"].some((rule) => rule.includes("only during archive")));
  assert.equal(YAML.parse(await readFile(path.join(root, schemaPath), "utf8")).version, 6);
  await assert.rejects(readFile(path.join(root, masterTemplate)), /ENOENT/);
  for (const relative of newResources) await readFile(path.join(root, relative));
  await assert.rejects(readFile(path.join(root, "docs/product/.publication.json")), /ENOENT/);
  await assert.rejects(readFile(path.join(root, "openspec/changes/active/product-publication.yaml")), /ENOENT/);
  for (const [relative, content] of Object.entries(historicalFiles)) {
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
  }

  const once = await readFile(configPath, "utf8");
  await install({ cwd: root, mode: "update" });
  assert.equal(await readFile(configPath, "utf8"), once, "migration must be idempotent");
});

test("schema-only installs shaping resources and preserves saved drafts across updates and uninstall", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, mode: "init" });
  const resources = [
    "openspec/schemas/agile-pm/workflows/product-shaping.md",
    "openspec/schemas/agile-pm/workflows/architecture-notes.md",
    "openspec/schemas/agile-pm/workflows/requirements-analysis.md",
    "openspec/schemas/agile-pm/examples/requirements-analysis.md",
    "openspec/schemas/agile-pm/templates/product-draft.md",
    "openspec/schemas/agile-pm/workflows/user-journeys.md",
    "openspec/schemas/agile-pm/examples/user-journeys.md",
    "openspec/schemas/agile-pm/workflows/product-publication.md",
    "openspec/schemas/agile-pm/templates/product-overview.md",
    "openspec/schemas/agile-pm/templates/product-capability.md",
    "openspec/schemas/agile-pm/templates/product-system-capability.md",
    "openspec/schemas/agile-pm/templates/product-publication.yaml",
    "openspec/schemas/agile-pm/templates/mkdocs.yml",
  ];
  const manifestPath = path.join(root, "openspec/.agile-pm-install.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const relative of resources) {
    const content = await readFile(path.join(root, relative));
    assert.equal(manifest.files[relative], createHash("sha256").update(content).digest("hex"));
  }
  await assert.rejects(readFile(path.join(root, ".opencode/commands/opsx-pm.md")), /ENOENT/);
  await assert.rejects(readFile(path.join(root, "openspec/product-drafts/product-vision.md")), /ENOENT/);
  await assert.rejects(readFile(path.join(root, "mkdocs.yml")), /ENOENT/);
  await assert.rejects(readFile(path.join(root, "docs/product/prd.md")), /ENOENT/);

  const documents = {
    "openspec/product-drafts/product-vision.md": [
      "# Collaboration PRD Draft",
      "**Mode:** product-shaping",
      "**Status:** Draft — unapproved",
      "## Candidate Requirements",
      "### Show The Invitation Offer",
      "- **Requirement:** The system SHALL show offered access before joining.",
      "- **Status:** Needs clarification",
      "## Requirements Analysis",
      "Validity rules remain unknown; no increment has been selected.",
      "## Open Questions",
      "Should collaborators share a workspace or only selected documents?",
      "## Resume Here",
      "Explore invitations next; no delivery increment has been chosen.",
      "",
    ].join("\n"),
    "docs/product/prd.md": "Existing approved master.\n",
    "openspec/changes/current/product-approval.md": "Existing approval record.\n",
  };
  for (const [relative, content] of Object.entries(documents)) {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), content);
  }

  // An older manifest did not own these resources. Updating must add them without
  // treating the consumer's exploratory draft as an installed or generated asset.
  for (const relative of resources) {
    await rm(path.join(root, relative));
    delete manifest.files[relative];
  }
  await writeFile(manifestPath, JSON.stringify(manifest));
  await install({ cwd: root, mode: "update" });
  const updated = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const relative of resources) {
    assert.ok(updated.files[relative]);
    await readFile(path.join(root, relative));
  }
  for (const [relative, content] of Object.entries(documents)) {
    assert.equal(updated.files[relative], undefined);
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
  }

  await uninstall({ cwd: root });
  for (const relative of resources) {
    await assert.rejects(readFile(path.join(root, relative)), /ENOENT/);
  }
  for (const [relative, content] of Object.entries(documents)) {
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
  }
});

test("managed adapter update adds requirements assets and preserves consumer drafts and approvals", async (t) => {
  const root = await temporaryProject(t);
  await install({ cwd: root, client: "opencode", mode: "init" });
  const manifestPath = path.join(root, "openspec/.agile-pm-install.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const commandPath = ".opencode/commands/opsx-pm.md";
  const templatePath = "openspec/schemas/agile-pm/templates/product-draft.md";
  const resources = [
    "openspec/schemas/agile-pm/workflows/requirements-analysis.md",
    "openspec/schemas/agile-pm/examples/requirements-analysis.md",
  ];
  const expected = new Map();
  for (const relative of [commandPath, templatePath, ...resources]) {
    expected.set(relative, await readFile(path.join(root, relative), "utf8"));
  }

  // Model unchanged owned files from a bundle predating requirements analysis.
  for (const [relative, content] of [
    [commandPath, "---\ndescription: Shape or scope a product\nagent: build\n---\nUse --shape or --from-draft.\n"],
    [templatePath, "# Product Draft\n\n**Mode:** product-shaping\n**Status:** Draft — unapproved\n\n## Open Questions\n"],
  ]) {
    await writeFile(path.join(root, relative), content);
    manifest.files[relative] = createHash("sha256").update(content).digest("hex");
  }
  for (const relative of resources) {
    await rm(path.join(root, relative));
    delete manifest.files[relative];
  }
  const configPath = path.join(root, "openspec/config.yaml");
  const config = YAML.parse(await readFile(configPath, "utf8"));
  for (const id of ["product-brief", "prd-capabilities"]) {
    config.rules[id] = config.rules[id].filter((rule) => !rule.includes("workflows/requirements-analysis.md"));
    manifest.config.rulesAdded[id] = config.rules[id];
  }
  const consumerRule = "Preserve the human's product vocabulary.";
  config.rules["product-brief"].push(consumerRule);
  // The consumer rule is not part of the installer's historical contribution.
  manifest.config.rulesAdded["product-brief"] = config.rules["product-brief"].filter((rule) => rule !== consumerRule);
  await writeFile(configPath, YAML.stringify(config));
  await writeFile(manifestPath, JSON.stringify(manifest));

  const consumerFiles = {
    "openspec/product-drafts/invitations.md": "# My existing draft\n\n## Open Questions\nWho may join?\n",
    "openspec/changes/active/prd.md": "Existing increment and requirements.\n",
    "openspec/changes/active/product-approval.md": "**Approval Format:** 3\nExisting approval bytes.\n",
    "docs/product/prd.md": "Existing published overview.\n",
    "mkdocs.yml": "site_name: Existing site\n",
  };
  for (const [relative, content] of Object.entries(consumerFiles)) {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), content);
  }

  await install({ cwd: root, mode: "update", dryRun: true });
  await assert.rejects(readFile(path.join(root, resources[0])), /ENOENT/);
  assert.doesNotMatch(await readFile(path.join(root, commandPath), "utf8"), /--requirements/);

  await install({ cwd: root, mode: "update" });
  const updated = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(updated.client, "opencode");
  for (const [relative, content] of expected) {
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
    assert.equal(updated.files[relative], createHash("sha256").update(content).digest("hex"));
  }
  const updatedConfig = YAML.parse(await readFile(configPath, "utf8"));
  for (const id of ["product-brief", "prd-capabilities"]) {
    assert.ok(updatedConfig.rules[id].some((rule) => rule.includes("workflows/requirements-analysis.md")));
  }
  assert.ok(updatedConfig.rules["product-brief"].includes(consumerRule));
  for (const [relative, content] of Object.entries(consumerFiles)) {
    assert.equal(updated.files[relative], undefined);
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
  }
  const once = await readFile(configPath, "utf8");
  await install({ cwd: root, mode: "update" });
  assert.equal(await readFile(configPath, "utf8"), once);

  const modifiedWorkflow = `${expected.get(resources[0])}\nConsumer elicitation guidance.\n`;
  await writeFile(path.join(root, resources[0]), modifiedWorkflow);
  await assert.rejects(install({ cwd: root, mode: "update" }), /Refusing to overwrite conflicting files/);
  await uninstall({ cwd: root });
  assert.equal(await readFile(path.join(root, resources[0]), "utf8"), modifiedWorkflow);
  for (const relative of [commandPath, templatePath, resources[1]]) {
    await assert.rejects(readFile(path.join(root, relative)), /ENOENT/);
  }
  for (const [relative, content] of Object.entries(consumerFiles)) {
    assert.equal(await readFile(path.join(root, relative), "utf8"), content);
  }
});
