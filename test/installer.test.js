import assert from "node:assert/strict";
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
