# Archived Documentation

> ⚠️ **SUPERSEDED — historical reference only. Do not follow these documents as current guidance.**

This directory holds documentation that has been retired but kept for its reasoning and decision history. The contents describe **past** plans and architectures, not the current one.

## Contents

| Directory | What it was | Why it's archived |
| --- | --- | --- |
| [`server-redesign/`](./server-redesign/) | A backend redesign plan (glossary, ADR-0001…0010, golden-path specs 10–12, migration tickets, progress tracker). Its progress tracker claimed 19/29 modules "done". | The redesign is being restarted from scratch under a fresh planning workflow. Its ADRs and glossary remain useful raw material for that planning, but its specs (five-folder layout) never matched the code that was actually built (flat-hybrid), so they must not be followed. |

## How to use this archive

- **Reading for context / prior decisions:** fine, that's what it's for.
- **Building against it:** don't. The active backend standard lives in the current `docs/` tree once the new planning flow produces it.

The obsolete `docs/server/` tree (current-state architecture docs) was deleted rather than archived — it described the pre-redesign code and had drifted from reality.
