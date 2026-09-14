import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(filePath));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(filePath);
  }
  return files;
}

test("embedded Mermaid examples have closed fences and valid flowchart syntax", async (t) => {
  // Mermaid's text sanitization uses DOMPurify. A local DOM lets us exercise its
  // real parser without installing a browser or changing production dependencies.
  const dom = new JSDOM();
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  t.after(() => {
    delete globalThis.window;
    delete globalThis.document;
    dom.window.close();
  });
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

  const files = [
    path.join(ROOT, "README.md"),
    path.join(ROOT, "CHANGELOG.md"),
    ...await markdownFiles(path.join(ROOT, "assets")),
  ];
  let diagramCount = 0;
  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    const openings = [...content.matchAll(/^[ \t]*```mermaid[ \t]*\r?$/gm)];
    const diagrams = [...content.matchAll(/^[ \t]*```mermaid[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*\r?$/gm)];
    assert.equal(diagrams.length, openings.length, `Unclosed Mermaid fence in ${filePath}`);
    for (const [index, diagram] of diagrams.entries()) {
      const label = `${path.relative(ROOT, filePath)} diagram ${index + 1}`;
      await t.test(label, async () => {
        const parsed = await mermaid.parse(diagram[1]);
        assert.ok(parsed, `${label} was not parsed`);
        assert.match(parsed.diagramType, /^flowchart(?:-v2)?$/, label);
      });
      diagramCount += 1;
    }
  }
  assert.ok(diagramCount > 0, "The bundle must include at least one working flow example");
});
