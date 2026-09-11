import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
