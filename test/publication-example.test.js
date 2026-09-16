import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const EXAMPLE = path.join(ROOT, "assets/openspec/schemas/agile-pm/examples/publication");

async function filesBelow(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(path.join(directory, entry.name), relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result.sort();
}

function navigationPaths(node) {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(navigationPaths);
  return Object.values(node).flatMap(navigationPaths);
}

test("multi-file example has exact indexes, mappings, baseline, and MkDocs navigation", async () => {
  const plan = YAML.parse(await readFile(path.join(EXAMPLE, "product-publication.yaml"), "utf8"));
  assert.equal(plan.format, 1);
  assert.equal(plan.change, "invite-writers");
  assert.deepEqual(plan.remove, []);
  const sources = plan.files.map(({ source }) => source);
  const targets = plan.files.map(({ target }) => target);
  assert.equal(new Set(sources).size, sources.length);
  assert.equal(new Set(targets).size, targets.length);
  assert.deepEqual(sources.toSorted(), (await filesBelow(path.join(EXAMPLE, "product-docs")))
    .map((relative) => `product-docs/${relative}`).sort());
  assert.deepEqual(Object.keys(plan.baseline).sort(), [...targets, "docs/product/.publication.json"].sort());
  assert.ok(Object.values(plan.baseline).every((value) => value === "absent"));

  const overview = await readFile(path.join(EXAMPLE, "product-docs/prd.md"), "utf8");
  const indexed = [...overview.matchAll(/\]\(((?:system-)?capabilities\/[^)]+\.md)\)/g)]
    .map(([, relative]) => `product-docs/${relative}`).sort();
  assert.deepEqual(indexed, sources.filter((source) => /\/(?:system-)?capabilities\//.test(source)).sort());
  assert.ok(indexed.some((source) => source.includes("/system-capabilities/")));
  assert.ok(indexed.some((source) => source.includes("/capabilities/")));
  assert.doesNotMatch(overview, /\| Requirement reference \|/, "the overview remains an opening, not the detailed PRD");

  const config = YAML.parse(await readFile(path.join(EXAMPLE, "product-docs/mkdocs.yml"), "utf8"));
  const nav = navigationPaths(config.nav);
  assert.equal(new Set(nav).size, nav.length, "every product page occurs once in navigation");
  assert.deepEqual(nav.map((entry) => path.posix.join(config.docs_dir, entry)).sort(),
    targets.filter((target) => target.endsWith(".md")).sort());

  for (const { source, target } of plan.files) {
    assert.ok(!path.isAbsolute(source) && !source.split("/").includes(".."));
    assert.ok(target === "mkdocs.yml" || target === source.replace(/^product-docs\//, "docs/product/"));
    const content = await readFile(path.join(EXAMPLE, source), "utf8");
    if (!source.endsWith(".md")) continue;
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      const [relative, anchor] = link.split("#");
      const linkedSource = path.posix.normalize(path.posix.join(path.posix.dirname(source), relative));
      assert.ok(sources.includes(linkedSource), `${source}: unmapped link ${link}`);
      const linked = await readFile(path.join(EXAMPLE, linkedSource), "utf8");
      if (anchor) {
        const headings = [...linked.matchAll(/^#+ (.+)$/gm)].map(([, title]) =>
          title.toLowerCase().replace(/[^\w -]/g, "").replaceAll(" ", "-"));
        assert.ok(headings.includes(anchor), `${source}: missing heading ${link}`);
      }
      const publishedLink = path.posix.normalize(path.posix.join(path.posix.dirname(target), relative));
      assert.ok(targets.includes(publishedLink), `link breaks after publication: ${source} -> ${link}`);
    }
  }

  const increment = await readFile(path.join(EXAMPLE, "prd.md"), "utf8");
  const incrementPaths = [...increment.matchAll(/\]\((prd\/capabilities\/[^)]+\.md)\)/g)]
    .map(([, relative]) => relative).sort();
  assert.deepEqual(incrementPaths, (await filesBelow(path.join(EXAMPLE, "prd/capabilities")))
    .map((relative) => `prd/capabilities/${relative}`));
  for (const relative of incrementPaths) {
    const capability = await readFile(path.join(EXAMPLE, relative), "utf8");
    const page = capability.match(/\*\*Product Page:\*\* (.+)/)[1];
    const kind = capability.match(/\*\*Kind:\*\* (.+)/)[1];
    assert.ok(page.startsWith(kind === "system" ? "system-capabilities/" : "capabilities/"));
    assert.ok(indexed.includes(`product-docs/${page}`));
    const productPage = await readFile(path.join(EXAMPLE, "product-docs", page), "utf8");
    const requirement = capability.match(/^\| FR-001 \| Must \| (.+) \|$/m)[1];
    assert.ok(productPage.includes(requirement), "increment and cumulative requirements agree");
  }
  assert.equal(1 + incrementPaths.length + 1 + sources.length, 9, "documented review manifest file count");
});

test("the proposed example builds as a staged MkDocs site when the toolchain is available", async (t) => {
  const python = process.env.MKDOCS_PYTHON ?? "python3";
  const available = spawnSync(python, ["-m", "mkdocs", "--version"], { encoding: "utf8" });
  if (available.error || available.status !== 0) {
    if (process.env.MKDOCS_PYTHON) assert.fail(`Configured MkDocs toolchain unavailable: ${available.stderr ?? available.error}`);
    t.skip("MkDocs is optional; set MKDOCS_PYTHON to run the staged strict build");
    return;
  }
  const stage = await mkdtemp(path.join(os.tmpdir(), "agile-pm-mkdocs-"));
  t.after(() => rm(stage, { recursive: true, force: true }));
  const plan = YAML.parse(await readFile(path.join(EXAMPLE, "product-publication.yaml"), "utf8"));
  for (const { source, target } of plan.files) {
    const destination = path.join(stage, target);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await readFile(path.join(EXAMPLE, source)));
  }
  const result = spawnSync(python, ["-m", "mkdocs", "build", "--strict", "-f", path.join(stage, "mkdocs.yml")], {
    cwd: stage, encoding: "utf8", timeout: 30_000,
  });
  assert.equal(result.status, 0, result.stderr ?? String(result.error));
  await readFile(path.join(stage, "site/product/prd/index.html"));
  await readFile(path.join(stage, "site/product/system-capabilities/access-control/index.html"));
});
