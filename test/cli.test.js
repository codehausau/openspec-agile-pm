import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CLI = path.join(ROOT, "bin", "cli.js");

function run(...args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
}

test("standard global help and version flags work", () => {
  const help = run("--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /openspec-agile-pm <command>/);

  const version = run("--version");
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^0\.1\.0\s*$/);
});

test("value and conflicting client options fail clearly", () => {
  const missing = run("init", "--client");
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /--client requires a value/);

  const conflict = run("init", "--client", "opencode", "--schema-only");
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /either --client or --schema-only/);
});
