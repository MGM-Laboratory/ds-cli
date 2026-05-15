# Contributing to @labmgm/cli

Thanks for thinking about contributing.

## Local setup

```bash
pnpm install
pnpm build           # tsup → dist/{index.js,index.cjs,index.d.ts}
pnpm test
pnpm typecheck
pnpm lint
```

Try the binary against a scratch directory:

```bash
pnpm build
node bin/ds.mjs init scratch-app --skip-install -y
```

## Workflow

- Branch from `main`. `feat/...`, `fix/...`, `chore/...`.
- Conventional Commits enforced via the commit-msg hook.
- Add a changeset (`pnpm changeset`) for any user-facing change.

## What doesn't land

- Commands that aren't tested.
- Hand-rolled prompt UIs (use `@clack/prompts`).
- Hand-rolled colour codes (use `picocolors` via `src/ui/log.ts`).
- Anything that mutates the consumer's project without a clear confirmation prompt or `--yes` opt-in.
