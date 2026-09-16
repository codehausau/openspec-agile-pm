# Capability PRD: Invitations

**Capability Path:** `invitations`
**Capability Priority:** Must
**Kind:** user
**Product Page:** capabilities/invitations.md

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-001 | Must | A writer can accept or decline a valid invitation; acceptance joins the group and decline leaves membership unchanged. |

Acceptance covers both choices and checks membership afterward. Invalid invitations
are constrained by `invite-writers#access-control/FR-001`. The complete flow is in
the [proposed invitation page](../../product-docs/capabilities/invitations.md).
No automatic acceptance or broader access is included.
