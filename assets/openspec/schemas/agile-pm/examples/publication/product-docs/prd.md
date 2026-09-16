# Product Requirements: Shared Writing Groups

## Vision, Users, And Outcomes

Help invited writers join a shared writing group with clear control over membership.
Success means valid acceptance grants intended access, decline changes nothing,
and invalid invitations cannot grant access. Field demand has not been established.

## Scope And Boundaries

This product slice covers invitation decisions and their shared access constraint.
Public discovery, automatic joining, and broader permission management are excluded.
These are product requirements; availability requires separately recorded evidence.

## Capabilities

| Capability | Purpose |
| --- | --- |
| [Invitations](capabilities/invitations.md) | Let an invited writer choose whether to join |

## System Capabilities

| System capability | Supports | Purpose |
| --- | --- | --- |
| [Access control](system-capabilities/access-control.md) | Invitations | Grant only intended access from valid accepted invitations |

## Dependencies And Assumptions

The invitation experience depends on the shared access decision. How invitations
are delivered is external context; this increment does not select a transport.

## Revision Summary

Introduces invitations and the shared access constraint with stable qualified IDs.
