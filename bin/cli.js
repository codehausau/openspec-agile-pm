#!/usr/bin/env node

import process from "node:process";

import {
  doctor,
  install,
  packageVersion,
  uninstall,
} from "../lib/installer.js";

const HELP = `openspec-agile-pm <command> [options]

Commands:
  init       Install the schema and optional client adapter
  update     Update an installation created by this package
  doctor     Check installed files, configuration, and available CLIs
  uninstall Remove unchanged package-owned files and config entries

Options:
  --client <opencode|none>  Install a client adapter (default: none)
  --schema-only             Alias for --client none
  --cwd <path>              Target project directory (default: current directory)
  --dry-run                 Show changes without writing
  --force                   Replace conflicting package-owned destinations
  -h, --help                Show help
  -v, --version             Show package version

Examples:
  openspec-agile-pm init --client opencode --dry-run
  openspec-agile-pm init --client opencode
  openspec-agile-pm update
  openspec-agile-pm doctor
`;

function parseArguments(argv) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith("-") ? args.shift() : "help";
  const options = {
    client: undefined,
    cwd: process.cwd(),
    dryRun: false,
    force: false,
  };
  let clientOptionSeen = false;
  let schemaOnlySeen = false;

  function takeValue(option) {
    const value = args.shift();
    if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
    return value;
  }

  while (args.length > 0) {
    const argument = args.shift();
    if (argument === "--client") {
      options.client = takeValue("--client");
      clientOptionSeen = true;
    } else if (argument?.startsWith("--client=")) {
      options.client = argument.slice("--client=".length);
      clientOptionSeen = true;
    } else if (argument === "--schema-only") {
      options.client = "none";
      schemaOnlySeen = true;
    } else if (argument === "--cwd") {
      options.cwd = takeValue("--cwd");
    } else if (argument?.startsWith("--cwd=")) {
      options.cwd = argument.slice("--cwd=".length);
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--version" || argument === "-v") {
      options.version = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  if (!options.cwd) {
    throw new Error("--cwd requires a path");
  }
  if (clientOptionSeen && schemaOnlySeen) {
    throw new Error("Use either --client or --schema-only, not both");
  }
  if (options.client !== undefined && !["none", "opencode"].includes(options.client)) {
    throw new Error(`Unsupported client '${options.client}'. Use opencode or none.`);
  }

  return { command, options };
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));

  if (options.version || command === "version") {
    console.log(await packageVersion());
    return;
  }
  if (options.help || command === "help") {
    console.log(HELP);
    return;
  }

  if (["doctor", "uninstall"].includes(command) && options.client !== undefined) {
    throw new Error(`--client is not valid for ${command}`);
  }
  if (command === "doctor" && (options.dryRun || options.force)) {
    throw new Error("doctor accepts only --cwd");
  }
  if (command === "uninstall" && options.force) {
    throw new Error("--force is not valid for uninstall; modified files are always preserved");
  }

  if (command === "init") {
    await install({ ...options, mode: "init" });
  } else if (command === "update") {
    await install({ ...options, mode: "update" });
  } else if (command === "doctor") {
    const result = await doctor(options);
    if (!result.ok) process.exitCode = 1;
  } else if (command === "uninstall") {
    await uninstall(options);
  } else {
    throw new Error(`Unknown command: ${command}\n\n${HELP}`);
  }
}

main().catch((error) => {
  console.error(`openspec-agile-pm: ${error.message}`);
  process.exitCode = 1;
});
