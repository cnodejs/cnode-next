## Admin Mutation Confirmation Matrix

No scoped action currently has a reliable timed undo. Actions marked `confirm` therefore require pre-action confirmation; a success toast is feedback, not undo.

| Surface | Action | Risk | Policy | Confirmation target/impact |
| --- | --- | --- | --- | --- |
| topics | top/un-top, good/un-good | reversible | immediate | Pending and result feedback only |
| topics | mute/unmute | high-impact | confirm | Topic count/title and public visibility impact |
| topics | soft delete, single or bulk | destructive | confirm | Topic target/count; hidden from public views, distinguish from physical deletion |
| topics | permanent delete, single or bulk | irreversible | confirm | Target/count and removal of replies, collections, job metadata, moderation hits, and message references |
| moderation | false-positive, ignore | reversible workflow | immediate | Pending and result feedback only |
| moderation | confirm violation, single/bulk/job scope | destructive | confirm | Hit target/count or scan job scope; matched content is deleted |
| moderation | create/run/pause/resume scan job | reversible workflow | immediate | Pending and result feedback only |
| moderation | cancel scan job | high-impact | confirm | Job id and remaining work that will not run |
| keywords | add/import | additive | immediate | Pending and imported count feedback |
| keywords | delete rule | destructive | confirm | Exact sensitive word; future matching stops, history is unchanged |
| bans | mute/unmute user, single/bulk | high-impact | confirm | User/count; posting ability changes, existing content visibility does not |
| bans | block/unblock user, single/bulk | high-impact | confirm | User/count; content visibility changes, posting ability does not |
| bans | add IP rule | high-impact | confirm | IP/CIDR and reason; matching requests will be blocked |
| bans | delete IP rule | destructive | confirm | Exact IP/CIDR; matching requests become eligible again |
| reports | dismiss | reversible workflow | immediate | Pending and result feedback only |
| reports | confirm violation | destructive | confirm | Report id and topic/reply target; violating content is deleted |
| users | block/unblock | high-impact | confirm | User and content-visibility-only effect |
| users | mute/unmute | high-impact | confirm | User and posting-ability-only effect |
| users | grant/revoke role | high-impact | confirm | User, current role, resulting role, and management access impact |
| users | reset password | irreversible security | confirm | User and invalidation/replacement of existing credentials |
| users | delete all posts | irreversible | confirm | User and all topic/reply content; account remains |

Settings, zone metadata, and tab label/order edits are ordinary configuration saves rather than governance actions in this matrix. They still require pending/error feedback, but are outside the destructive-confirmation scope.
