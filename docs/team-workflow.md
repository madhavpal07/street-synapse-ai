# Six-laptop workflow

## Source of truth

The `main` branch is the integrated project. Chat messages, copied folders, and ZIP files are not authoritative versions.

## Daily routine

### Before work

```bash
git switch main
git pull origin main
git switch your-feature-branch
git merge main
```

### After a testable change

```bash
git add .
git commit -m "Describe the working change"
git push
```

Open or update a pull request. Record:

- What works
- How to run it
- What remains incomplete
- Any API change
- Test evidence

## Integration order

1. Backend accepts sample JSON.
2. Dashboard renders sample API results.
3. Android sends real GPS.
4. ML replaces the sample event generator.
5. Transit module adds route matching and ETA.
6. Persistent storage replaces in-memory storage.

This order lets every member work in parallel with sample data.

## Daily integration target

At least one complete user-visible flow must work from `main` at the end of each day. Partially written code on six branches does not count as integrated progress.

