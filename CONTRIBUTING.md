# Contributing to StreetSynapse AI

## Branch ownership

Use one branch per responsibility:

- `feature/road-ai`
- `feature/dataset-traffic`
- `feature/android-edge`
- `feature/backend-api`
- `feature/web-dashboard`
- `feature/transit-eta`

For a new task, create a short branch from the latest `main`:

```bash
git switch main
git pull origin main
git switch -c feature/short-task-name
```

## Save and share work

```bash
git add .
git commit -m "Add concise description of change"
git push -u origin feature/short-task-name
```

Open a pull request into `main`. Another member should review it before merge.

## Pull request checklist

- The module runs on a clean laptop using documented commands.
- Tests pass for the changed module.
- API fields match `docs/api-contract.md`.
- No credentials, private videos, datasets, or large weights are included.
- The README is updated when setup or behavior changes.
- Screenshots and claimed metrics come from the current version.

## Conflict rule

Do not solve a difficult merge conflict by deleting another member's work. Ask the integration lead, compare both versions, and preserve the required behavior.

