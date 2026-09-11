# NanoPM OpenCode Adaptation

This directory documents project-local skills adapted from NanoPM for an OpenCode
workflow using the `agile-pm` OpenSpec schema.

## Source

- Project: <https://github.com/nmrtn/nanopm>
- Version: `0.26.0`
- Commit: `6f048a8d3e151ce72e7298d11a0d53614bb7e40b`
- License: MIT; see `LICENSE`

These are intentionally adapted rather than byte-for-byte copies. They use OpenCode
tool names, avoid NanoPM's host-specific shell runtime, and preserve the
approval-gated `agile-pm` OpenSpec workflow.

## Included

- `pm-brainstorm`: informal, grounded product thinking
- `pm-discovery`: opportunity mapping, assumption tests, and interview preparation
- `pm-opportunities`: local evidence-backed problem inventory
- `pm-solutions`: compared alternatives for one opportunity
- `pm-challenge-me`: adaptive adversarial review

The corresponding `.opencode/commands/pm-*.md` files provide slash-command entry
points.

## Deliberately Excluded

- `pm-prd`
- `pm-breakdown`
- `pm-run`
- NanoPM's OpenSpec schema and OpenSpec handoff

Those surfaces overlap with `agile-pm` and would create a second PRD, approval, and
delivery authority.

## Artifact Boundary

The adapted skills may write local research under `.nanopm/wiki/` only after human
confirmation. `.nanopm/` is gitignored and non-authoritative. A selected opportunity
or solution enters delivery through:

```text
/opsx-pm <idea-or-change>
```

`/opsx-pm` creates and governs the authoritative product brief, capability PRD set,
approval digest, and engineering handoff.
