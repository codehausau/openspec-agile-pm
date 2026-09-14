---
description: "Brainstorm a product idea without creating a PRD or implementation artifacts"
agent: build
---

Load the project-local `pm-brainstorm` skill with OpenCode's skill tool and follow
it exactly.

Topic or starting context: $ARGUMENTS

Keep this conversational. Do not create OpenSpec artifacts or implementation code.
If the human wants to maintain a saved PRD while exploring, suggest an explicit
switch to `/opsx-pm --shape <draft-id>`. For a delivery increment, use `/opsx-pm`
as the authoritative product handoff.
