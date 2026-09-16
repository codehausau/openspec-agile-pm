# Access Control

## Purpose And Supported Capabilities

Provide the shared access constraint for [invitations](../capabilities/invitations.md).
This is observable product behavior, not a choice of authentication architecture.

## Requirements And Acceptance

| Requirement reference | Requirement | Priority | Acceptance |
| --- | --- | --- | --- |
| `invite-writers#access-control/FR-001` | Only a valid invitation accepted by its intended writer grants its stated group access; an invalid invitation grants no access and explains that a replacement is needed. | Must | Test valid/intended, expired, and wrong-recipient cases |

## Flow Coverage

The [invitation flow](../capabilities/invitations.md#user-flow) covers the shared
validity decision and invalid outcome without duplicating that diagram.

## Dependencies, Assumptions, And Exclusions

The current writer and invitation's intended access must be determinable. No
specific sign-in system, recovery service, or broader permission editing is selected.
Implementation ambiguity returns to product review rather than silently broadening scope.
