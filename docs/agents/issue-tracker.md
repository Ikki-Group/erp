# Issue tracker

Issues for this repo live in **GitHub Issues** on `Ikki-Group/erp`, managed with the [`gh`](https://cli.github.com/) CLI.

## How skills use this

- **Create an issue:** `gh issue create --title "..." --body "..." [--label ...]`
- **Read an issue:** `gh issue view <number>` (add `--comments` for discussion)
- **List issues:** `gh issue list [--label ...] [--state open]`
- **Comment:** `gh issue comment <number> --body "..."`
- **Apply/remove labels:** `gh issue edit <number> --add-label ... --remove-label ...`
- **Close:** `gh issue close <number>` (with a reason comment where relevant)

Skills that read from and write to this tracker: `to-tickets`, `to-spec`, `triage`, `wayfinder`.

## PRs as a request surface

**Off.** External pull requests are not part of the triage queue. To include them, flip this flag to on and describe how PRs should be pulled into triage (e.g. `gh pr list`).
