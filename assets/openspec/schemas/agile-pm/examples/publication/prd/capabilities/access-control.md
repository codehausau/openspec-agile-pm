# Capability PRD: Access Control

**Capability Path:** `access-control`
**Capability Priority:** Must
**Kind:** system
**Product Page:** system-capabilities/access-control.md

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-001 | Must | Only a valid invitation accepted by its intended writer grants its stated group access; an invalid invitation grants no access and explains that a replacement is needed. |

Acceptance checks valid/intended, expired, and wrong-recipient cases. This supports
invitations without defining authentication architecture or a new request service.
The [proposed system page](../../product-docs/system-capabilities/access-control.md)
contains the cumulative requirement and dependencies.
