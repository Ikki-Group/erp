# Triage labels

The `triage` skill moves issues through five canonical roles. This repo uses the default vocabulary — each label string equals its role name.

| Role             | Label string       | Meaning                                             |
| ---------------- | ------------------ | --------------------------------------------------- |
| needs-triage     | `needs-triage`     | New, unreviewed; entry point to the queue.          |
| needs-info       | `needs-info`       | Blocked awaiting clarification from the reporter.   |
| ready-for-agent  | `ready-for-agent`  | Scoped and ready for an agent to implement.         |
| ready-for-human  | `ready-for-human`  | Needs a human decision or action before proceeding. |
| wontfix          | `wontfix`          | Closed without action; out of scope or rejected.    |

If a label doesn't exist yet in GitHub, create it before applying: `gh label create <name>`.
