## Why

<!-- Summarize the approved PRD set's problem and selected spiral. Do not introduce new product scope. -->

## What Changes

<!-- Describe what will change. Cite IDs such as <change-name>#<capability-path>/FR-001. -->

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Use kebab-case for path segments you introduce
     (e.g., user-auth or identity/user-auth) that follow the project's existing
     spec organization. Each creates specs/<capability-path>/spec.md. -->
- `<capability-path>`: <brief description and capability-qualified PRD IDs covered>

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use the exact existing path under openspec/specs/. Leave empty if no requirement
     changes. A change with no capabilities at all (pure refactor, tooling, docs)
     must set `skip_specs: true` in its .openspec.yaml - openspec validate rejects
     a zero-delta change without that marker. `skip_specs` is forbidden when any
     indexed capability PRD has a Must requirement. Do not invent a requirement
     just to satisfy validation. -->
- `<existing-capability-path>`: <what requirement is changing and capability-qualified PRD IDs covered>

## Impact

<!-- Affected code, APIs, dependencies, systems -->
