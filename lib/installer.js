import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  rmdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const PACKAGE_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ASSETS_ROOT = path.join(PACKAGE_ROOT, "assets");
const CONFIG_ASSET = path.join(ASSETS_ROOT, "config", "config.yaml");
const MANIFEST_PATH = "openspec/.agile-pm-install.json";
const MANIFEST_FORMAT = 1;
const ALLOWED_FILE_PREFIXES = ["openspec/schemas/agile-pm/", ".opencode/commands/", ".opencode/skills/"];
const GITIGNORE_BLOCK = "# openspec-agile-pm local product research\n.nanopm/\n";

function canonicalRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new Error("Install manifest contains an invalid file path");
  }
  const canonical = value.replaceAll("\\", "/");
  if (
    path.posix.isAbsolute(canonical) ||
    path.posix.normalize(canonical) !== canonical ||
    canonical === ".." ||
    canonical.startsWith("../")
  ) {
    throw new Error(`Install manifest path escapes the project: ${value}`);
  }
  if (!ALLOWED_FILE_PREFIXES.some((prefix) => canonical.startsWith(prefix))) {
    throw new Error(`Install manifest path is outside package-owned locations: ${value}`);
  }
  return canonical;
}

function destinationPath(root, relative) {
  const canonical = canonicalRelativePath(relative);
  const destination = path.resolve(root, ...canonical.split("/"));
  const relation = path.relative(root, destination);
  if (relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
    throw new Error(`Destination escapes the project: ${relative}`);
  }
  return destination;
}

async function assertNoSymlinkComponents(root, destination) {
  const relation = path.relative(root, destination);
  if (relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
    throw new Error(`Destination escapes the project: ${destination}`);
  }
  let current = root;
  for (const segment of relation.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const metadata = await lstat(current).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!metadata) continue;
    if (metadata.isSymbolicLink()) {
      throw new Error(`Refusing to traverse symlinked destination: ${current}`);
    }
  }
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function sha256Content(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function atomicWrite(root, filePath, content, mode) {
  await assertNoSymlinkComponents(root, filePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await assertNoSymlinkComponents(root, filePath);
  const temporary = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, content, mode ? { mode } : undefined);
  await rename(temporary, filePath);
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Package asset must not be a symlink: ${path.join(directory, entry.name)}`);
    }
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolute, relative)));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

async function desiredFiles(client) {
  const groups = [
    {
      source: path.join(ASSETS_ROOT, "openspec", "schemas", "agile-pm"),
      destination: "openspec/schemas/agile-pm",
    },
  ];

  if (client === "opencode") {
    groups.push({
      source: path.join(ASSETS_ROOT, "opencode"),
      destination: ".opencode",
    });
  }

  const desired = new Map();
  for (const group of groups) {
    for (const relative of await listFiles(group.source)) {
      const source = path.join(group.source, relative);
      const destination = path.posix.join(group.destination, relative);
      const content = await readFile(source);
      desired.set(destination, {
        content,
        hash: sha256Content(content),
        mode: destination.endsWith(".js") ? 0o755 : 0o644,
      });
    }
  }
  return desired;
}

async function readManifest(root) {
  const filePath = path.join(root, ...MANIFEST_PATH.split("/"));
  await assertNoSymlinkComponents(root, filePath);
  if (!(await exists(filePath))) return null;
  const manifest = JSON.parse(await readFile(filePath, "utf8"));
  if (
    manifest.formatVersion !== MANIFEST_FORMAT ||
    manifest.package !== "openspec-agile-pm" ||
    !["none", "opencode"].includes(manifest.client) ||
    !manifest.files ||
    Array.isArray(manifest.files) ||
    typeof manifest.files !== "object" ||
    !manifest.config ||
    typeof manifest.config !== "object"
  ) {
    throw new Error(`Unsupported install manifest at ${filePath}`);
  }
  const files = {};
  for (const [relative, hash] of Object.entries(manifest.files)) {
    const canonical = canonicalRelativePath(relative);
    if (!/^[a-f0-9]{64}$/.test(hash) || files[canonical]) {
      throw new Error(`Invalid file record in install manifest: ${relative}`);
    }
    files[canonical] = hash;
  }
  manifest.files = files;
  return manifest;
}

function getArray(document, keyPath) {
  const node = document.getIn(keyPath);
  const value = node?.toJSON ? node.toJSON() : node;
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Expected YAML array at ${keyPath.join(".")}`);
  }
  return value;
}

function addUnique(document, keyPath, entries) {
  const node = document.getIn(keyPath);
  const existing = getArray(document, keyPath);
  const additions = entries.filter((entry) => !existing.includes(entry));
  if (additions.length === 0) return additions;
  if (node === undefined) document.setIn(keyPath, additions);
  else for (const addition of additions) node.add(addition);
  return additions;
}

function removeExact(document, keyPath, entries) {
  if (!entries?.length) return;
  const node = document.getIn(keyPath);
  if (node === undefined) return;
  getArray(document, keyPath);
  node.items = node.items.filter((item) => {
    const value = item?.toJSON ? item.toJSON() : item;
    return !entries.includes(value);
  });
  if (node.items.length === 0) document.deleteIn(keyPath);
}

function pruneEmptyMap(document, keyPath) {
  const node = document.getIn(keyPath);
  if (node && YAML.isMap(node) && node.items.length === 0) document.deleteIn(keyPath);
}

async function loadConfigDocument(root) {
  const filePath = path.join(root, "openspec", "config.yaml");
  await assertNoSymlinkComponents(root, filePath);
  const present = await exists(filePath);
  const document = present
    ? YAML.parseDocument(await readFile(filePath, "utf8"))
    : new YAML.Document();
  if (document.errors.length > 0) {
    throw new Error(`Cannot parse ${filePath}: ${document.errors[0].message}`);
  }
  if (!present) document.contents = document.createNode({});
  return { document, filePath, present };
}

function removeConfigContribution(document, contribution) {
  if (!contribution) return;
  for (const [artifact, entries] of Object.entries(contribution.rulesAdded ?? {})) {
    removeExact(document, ["rules", artifact], entries);
    pruneEmptyMap(document, ["rules"]);
  }
  for (const [operation, entries] of Object.entries(contribution.guidanceAdded ?? {})) {
    removeExact(document, ["operations", operation, "guidance"], entries);
    pruneEmptyMap(document, ["operations", operation]);
    pruneEmptyMap(document, ["operations"]);
  }
  if (
    contribution.contextAdded !== null &&
    contribution.contextAdded !== undefined &&
    document.get("context") === contribution.contextAdded
  ) {
    document.delete("context");
  }
  for (const key of contribution.originalEmptyArrays ?? []) {
    const keyPath = key.split(".");
    if (document.getIn(keyPath) === undefined) document.setIn(keyPath, []);
  }
}

async function mergeConfig(root, previousManifest, force) {
  const { document, filePath, present } = await loadConfigDocument(root);
  const fragment = YAML.parse(await readFile(CONFIG_ASSET, "utf8"));
  const previousContribution = previousManifest?.config;

  if (previousContribution) removeConfigContribution(document, previousContribution);

  const currentSchema = document.get("schema");
  const originalSchemaPresent = previousContribution
    ? previousContribution.originalSchemaPresent
    : currentSchema !== undefined;
  const originalSchema = previousContribution
    ? previousContribution.originalSchema
    : currentSchema;

  if (
    previousContribution &&
    currentSchema !== undefined &&
    currentSchema !== fragment.schema &&
    !force
  ) {
    throw new Error(
      `openspec/config.yaml selects schema '${currentSchema}'. Re-run with --force to select '${fragment.schema}'.`,
    );
  }
  document.set("schema", fragment.schema);

  let contextAdded = null;
  if (document.get("context") === undefined && fragment.context) {
    document.set("context", fragment.context);
    contextAdded = fragment.context;
  }

  const rulesAdded = {};
  const originalEmptyArrays = previousContribution?.originalEmptyArrays ?? [];
  for (const [artifact, entries] of Object.entries(fragment.rules ?? {})) {
    const keyPath = ["rules", artifact];
    const existing = getArray(document, keyPath);
    const key = keyPath.join(".");
    if (!previousContribution && existing.length === 0 && document.getIn(keyPath) !== undefined) {
      originalEmptyArrays.push(key);
    }
    const additions = addUnique(document, keyPath, entries);
    if (additions.length > 0) rulesAdded[artifact] = additions;
  }

  const guidanceAdded = {};
  for (const [operation, value] of Object.entries(fragment.operations ?? {})) {
    const keyPath = ["operations", operation, "guidance"];
    const existing = getArray(document, keyPath);
    const key = keyPath.join(".");
    if (!previousContribution && existing.length === 0 && document.getIn(keyPath) !== undefined) {
      originalEmptyArrays.push(key);
    }
    const additions = addUnique(
      document,
      keyPath,
      value.guidance ?? [],
    );
    if (additions.length > 0) guidanceAdded[operation] = additions;
  }

  return {
    content: document.toString({ lineWidth: 0 }),
    filePath,
    contribution: {
      originalConfigPresent: previousContribution?.originalConfigPresent ?? present,
      originalSchemaPresent,
      originalSchema: originalSchema ?? null,
      contextAdded,
      rulesAdded,
      guidanceAdded,
      originalEmptyArrays,
    },
  };
}

async function mergeGitignore(root, previousManifest) {
  const filePath = path.join(root, ".gitignore");
  await assertNoSymlinkComponents(root, filePath);
  const present = await exists(filePath);
  const current = present ? await readFile(filePath, "utf8") : "";
  const hasIgnore = current.split(/\r?\n/).some((line) => line.trim() === ".nanopm/");
  if (hasIgnore) {
    return {
      content: current,
      filePath,
      contribution: previousManifest?.gitignore ?? {
        originalPresent: present,
        blockAdded: false,
      },
    };
  }
  const separator = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
  const leading = current.length > 0 ? "\n" : "";
  return {
    content: `${current}${separator}${leading}${GITIGNORE_BLOCK}`,
    filePath,
    contribution: {
      originalPresent: previousManifest?.gitignore?.originalPresent ?? present,
      blockAdded: true,
    },
  };
}

function removeGitignoreContribution(content, contribution) {
  if (!contribution?.blockAdded) return content;
  const withLeadingLine = `\n${GITIGNORE_BLOCK}`;
  if (content.endsWith(withLeadingLine)) return content.slice(0, -withLeadingLine.length);
  if (content === GITIGNORE_BLOCK) return "";
  return content;
}

async function preflightFiles(root, desired, previousManifest, force) {
  const conflicts = [];
  const writes = [];
  const removals = [];
  const preserved = [];
  const previousFiles = previousManifest?.files ?? {};

  for (const [relative, asset] of desired) {
    const destination = destinationPath(root, relative);
    await assertNoSymlinkComponents(root, destination);
    if (!(await exists(destination))) {
      writes.push({ relative, destination, ...asset, action: "create" });
      continue;
    }

    const currentHash = await sha256File(destination);
    const previousHash = previousFiles[relative];
    if (currentHash === asset.hash) continue;
    if (previousHash && currentHash === previousHash) {
      writes.push({ relative, destination, ...asset, action: "update" });
    } else if (force) {
      writes.push({ relative, destination, ...asset, action: "replace" });
    } else {
      conflicts.push(relative);
    }
  }

  for (const [relative, previousHash] of Object.entries(previousFiles)) {
    if (desired.has(relative)) continue;
    const destination = destinationPath(root, relative);
    await assertNoSymlinkComponents(root, destination);
    if (!(await exists(destination))) continue;
    const currentHash = await sha256File(destination);
    if (currentHash === previousHash) removals.push({ relative, destination });
    else preserved.push(relative);
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Refusing to overwrite conflicting files:\n- ${conflicts.join("\n- ")}\nUse --force only after reviewing them.`,
    );
  }
  return { writes, removals, preserved };
}

function logPlan(mode, root, client, writes, removals, preserved, configChanged, gitignoreChanged, dryRun) {
  console.log(`${dryRun ? "Dry run: " : ""}${mode} openspec-agile-pm in ${root}`);
  console.log(`Client adapter: ${client}`);
  for (const item of writes) console.log(`  ${item.action}: ${item.relative}`);
  for (const item of removals) console.log(`  remove: ${item.relative}`);
  for (const relative of preserved) console.log(`  preserve modified: ${relative}`);
  if (configChanged) console.log("  merge: openspec/config.yaml");
  if (gitignoreChanged) console.log("  merge: .gitignore");
  if (writes.length === 0 && removals.length === 0 && !configChanged && !gitignoreChanged) {
    console.log("  no changes");
  }
}

export async function packageVersion() {
  const packageJson = JSON.parse(await readFile(path.join(PACKAGE_ROOT, "package.json"), "utf8"));
  return packageJson.version;
}

export async function install({ cwd, client, dryRun = false, force = false, mode }) {
  const requestedRoot = path.resolve(cwd);
  const rootStats = await stat(requestedRoot).catch(() => null);
  if (!rootStats?.isDirectory()) throw new Error(`Target directory does not exist: ${requestedRoot}`);
  const root = await realpath(requestedRoot);

  const previousManifest = await readManifest(root);
  if (mode === "init" && previousManifest) {
    throw new Error("An installation manifest already exists. Use the update command.");
  }
  if (mode === "update" && !previousManifest) {
    throw new Error("No installation manifest found. Use the init command.");
  }
  if (mode === "update" && client === undefined) client = previousManifest.client ?? "none";
  if (client === undefined) client = "none";

  const desired = await desiredFiles(client);
  const { writes, removals, preserved } = await preflightFiles(
    root,
    desired,
    previousManifest,
    force,
  );
  const mergedConfig = await mergeConfig(root, previousManifest, force);
  const mergedGitignore = await mergeGitignore(root, previousManifest);
  const currentConfig = (await exists(mergedConfig.filePath))
    ? await readFile(mergedConfig.filePath, "utf8")
    : null;
  const configChanged = currentConfig !== mergedConfig.content;
  const gitignoreChanged =
    (!(await exists(mergedGitignore.filePath)) ? null : await readFile(mergedGitignore.filePath, "utf8")) !==
    mergedGitignore.content;

  logPlan(
    mode,
    root,
    client,
    writes,
    removals,
    preserved,
    configChanged,
    gitignoreChanged,
    dryRun,
  );
  if (dryRun) return;

  for (const item of writes) await atomicWrite(root, item.destination, item.content, item.mode);
  for (const item of removals) {
    await assertNoSymlinkComponents(root, item.destination);
    await rm(item.destination);
  }
  if (configChanged) {
    await atomicWrite(root, mergedConfig.filePath, mergedConfig.content, 0o644);
  }
  if (gitignoreChanged) {
    await atomicWrite(root, mergedGitignore.filePath, mergedGitignore.content, 0o644);
  }

  const manifest = {
    formatVersion: MANIFEST_FORMAT,
    package: "openspec-agile-pm",
    version: await packageVersion(),
    client,
    installedAt: new Date().toISOString(),
    files: Object.fromEntries([...desired].map(([relative, asset]) => [relative, asset.hash])),
    config: mergedConfig.contribution,
    gitignore: mergedGitignore.contribution,
  };
  await atomicWrite(
    root,
    path.join(root, ...MANIFEST_PATH.split("/")),
    `${JSON.stringify(manifest, null, 2)}\n`,
    0o644,
  );

  console.log("Installation complete.");
  console.log("Run: openspec-agile-pm doctor");
  if (client === "opencode") console.log("Restart OpenCode before using the installed commands.");
}

function hasAllEntries(document, keyPath, expected) {
  const actual = getArray(document, keyPath);
  return expected.every((entry) => actual.includes(entry));
}

export async function doctor({ cwd }) {
  const requestedRoot = path.resolve(cwd);
  const rootStats = await stat(requestedRoot).catch(() => null);
  if (!rootStats?.isDirectory()) throw new Error(`Target directory does not exist: ${requestedRoot}`);
  const root = await realpath(requestedRoot);
  const errors = [];
  const warnings = [];
  let manifestReadFailed = false;
  const manifest = await readManifest(root).catch((error) => {
    errors.push(error.message);
    manifestReadFailed = true;
    return null;
  });

  if (!manifest && !manifestReadFailed) {
    errors.push(`Missing ${MANIFEST_PATH}`);
  } else {
    for (const [relative, expectedHash] of Object.entries(manifest?.files ?? {})) {
      const destination = destinationPath(root, relative);
      await assertNoSymlinkComponents(root, destination);
      if (!(await exists(destination))) errors.push(`Missing installed file: ${relative}`);
      else if ((await sha256File(destination)) !== expectedHash) {
        warnings.push(`Modified installed file: ${relative}`);
      }
    }
  }

  try {
    const { document } = await loadConfigDocument(root);
    const fragment = YAML.parse(await readFile(CONFIG_ASSET, "utf8"));
    if (document.get("schema") !== fragment.schema) {
      errors.push(`openspec/config.yaml does not select '${fragment.schema}'`);
    }
    for (const [artifact, entries] of Object.entries(fragment.rules ?? {})) {
      if (!hasAllEntries(document, ["rules", artifact], entries)) {
        errors.push(`openspec/config.yaml is missing required rules for '${artifact}'`);
      }
    }
    for (const [operation, value] of Object.entries(fragment.operations ?? {})) {
      if (!hasAllEntries(document, ["operations", operation, "guidance"], value.guidance ?? [])) {
        errors.push(`openspec/config.yaml is missing '${operation}' operation guidance`);
      }
    }
  } catch (error) {
    errors.push(error.message);
  }

  const openspec = spawnSync("openspec", ["schema", "validate", "agile-pm"], {
    cwd: root,
    encoding: "utf8",
    timeout: 15_000,
  });
  if (openspec.error?.code === "ENOENT") {
    warnings.push("OpenSpec CLI is not installed or not on PATH");
  } else if (openspec.error) {
    errors.push(`OpenSpec validation could not start: ${openspec.error.message}`);
  } else if (openspec.status !== 0) {
    errors.push(`OpenSpec validation failed: ${(openspec.stderr ?? openspec.stdout ?? "").trim()}`);
  }

  if (manifest?.client === "opencode") {
    const opencode = spawnSync("opencode", ["debug", "config"], {
      cwd: root,
      encoding: "utf8",
      timeout: 15_000,
    });
    if (opencode.error?.code === "ENOENT") {
      warnings.push("OpenCode CLI is not installed or not on PATH");
    } else if (opencode.error) {
      errors.push(`OpenCode configuration could not start: ${opencode.error.message}`);
    } else if (opencode.status !== 0) {
      errors.push(`OpenCode configuration failed: ${(opencode.stderr ?? opencode.stdout ?? "").trim()}`);
    }
  }

  for (const warning of warnings) console.log(`WARN: ${warning}`);
  for (const error of errors) console.error(`ERROR: ${error}`);
  if (errors.length === 0) console.log("openspec-agile-pm doctor: healthy");
  return { ok: errors.length === 0, errors, warnings };
}

async function pruneEmptyParents(start, root) {
  let current = path.dirname(start);
  while (current !== root) {
    const relation = path.relative(root, current);
    if (relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) break;
    await assertNoSymlinkComponents(root, current);
    const entries = await readdir(current).catch(() => ["not-empty"]);
    if (entries.length > 0) break;
    await rmdir(current);
    current = path.dirname(current);
  }
}

export async function uninstall({ cwd, dryRun = false }) {
  const requestedRoot = path.resolve(cwd);
  const rootStats = await stat(requestedRoot).catch(() => null);
  if (!rootStats?.isDirectory()) throw new Error(`Target directory does not exist: ${requestedRoot}`);
  const root = await realpath(requestedRoot);
  const manifest = await readManifest(root);
  if (!manifest) throw new Error("No installation manifest found.");

  const removals = [];
  const preserved = [];
  for (const [relative, expectedHash] of Object.entries(manifest.files)) {
    const destination = destinationPath(root, relative);
    await assertNoSymlinkComponents(root, destination);
    if (!(await exists(destination))) continue;
    if ((await sha256File(destination)) === expectedHash) removals.push({ relative, destination });
    else preserved.push(relative);
  }

  const { document, filePath: configPath } = await loadConfigDocument(root);
  removeConfigContribution(document, manifest.config);
  if (document.get("schema") === "agile-pm") {
    if (manifest.config.originalSchemaPresent) {
      document.set("schema", manifest.config.originalSchema);
    } else {
      document.delete("schema");
    }
  } else {
    preserved.push("openspec/config.yaml schema selection");
  }

  const gitignorePath = path.join(root, ".gitignore");
  await assertNoSymlinkComponents(root, gitignorePath);
  const currentGitignore = (await exists(gitignorePath))
    ? await readFile(gitignorePath, "utf8")
    : "";
  const nextGitignore = removeGitignoreContribution(currentGitignore, manifest.gitignore);

  console.log(`${dryRun ? "Dry run: " : ""}uninstall openspec-agile-pm from ${root}`);
  for (const item of removals) console.log(`  remove: ${item.relative}`);
  for (const item of preserved) console.log(`  preserve modified: ${item}`);
  console.log("  update: openspec/config.yaml");
  if (currentGitignore !== nextGitignore) console.log("  update: .gitignore");
  console.log(`  remove: ${MANIFEST_PATH}`);
  if (dryRun) return;

  for (const item of removals) {
    await assertNoSymlinkComponents(root, item.destination);
    await rm(item.destination);
    await pruneEmptyParents(item.destination, root);
  }

  const configObject = document.toJS() ?? {};
  if (!manifest.config.originalConfigPresent && Object.keys(configObject).length === 0) {
    await rm(configPath, { force: true });
  } else {
    await atomicWrite(root, configPath, document.toString({ lineWidth: 0 }), 0o644);
  }
  if (currentGitignore !== nextGitignore) {
    if (!manifest.gitignore?.originalPresent && nextGitignore.length === 0) {
      await rm(gitignorePath, { force: true });
    } else {
      await atomicWrite(root, gitignorePath, nextGitignore, 0o644);
    }
  }
  const manifestPath = path.join(root, ...MANIFEST_PATH.split("/"));
  await assertNoSymlinkComponents(root, manifestPath);
  await rm(manifestPath, { force: true });
  console.log("Uninstall complete. Modified package files were preserved.");
}
