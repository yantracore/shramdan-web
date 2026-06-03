# Branch and Deploy Workflow

## Policy

All commits land on `staging` first. Merging into `main` happens exclusively through a GitHub pull request — never via a direct local push to `main`.

## Why

- `main` is the production deploy branch for the hosted frontend. There is no in-repo CI guard (`vercel.json` / `netlify.toml` / `.github/workflows/`); the host (Vercel/Netlify) is wired to `main` via dashboard configuration. Any commit reaching `main` can trigger a production deploy.
- Going through GitHub adds a human-visible diff and merge step — a deliberate safety gate before anything goes live.
- `staging` doubles as a preview track: per-branch preview deploys (if enabled in the host dashboard) live at a unique URL that never replaces production.

## How

| Step | Command / action |
| --- | --- |
| Daily work | Commit locally on `staging` (or a feature branch off `staging`). |
| Share / preview | `git push origin staging` — opens a preview deploy if the host has previews enabled. |
| Promote to prod | Open a PR on GitHub from `staging` → `main`, review the diff, and **Squash and merge** (or merge) on GitHub. |
| Never | `git push origin main` directly, force-push `main`, or fast-forward `main` from the local shell. |

## What this means for the auto-commit routine

Local task-completion commits already land on whatever branch is currently checked out. The end-of-day push (per `feedback_session_routines`) pushes the current branch — that should be `staging`, not `main`.

If a commit accidentally lands on `main` locally:

1. Do **not** push.
2. `git branch staging` (if `staging` doesn't already exist) or fast-forward `staging` to that commit.
3. `git reset --hard origin/main` to put local `main` back where remote is.
4. Continue from `staging`.

## When the policy can flex

- Hotfixes that bypass `staging` should still go through a PR on GitHub — a "hotfix" branch → `main` PR is fine. The non-negotiable is "merge on GitHub, not from the shell."
- Documentation-only changes to `main` (README, this doc) — still go via PR; the discipline matters more than the urgency.
