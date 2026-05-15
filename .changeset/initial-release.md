---
"@labmgm/cli": minor
---

Initial release of `@labmgm/cli` — the `ds` CLI for the MGM Laboratory Design System.

- `ds init [name]` — scaffolds a Next.js 15 App Router app pre-configured with the design system: Tailwind preset, `<ThemeProvider>` in `app/layout.tsx`, `next/font` set up with the design fonts, a sample landing page using `@labmgm/react`.
- `ds add <component…>` — shadcn-style copy. Fetches typed component source from the public registry served by `ds-web` at `/registry/<name>.json`, writes it into the consumer's `components/ui/`, resolves dependencies, and updates `package.json` automatically.
- `ds theme create|use`, `ds token list`, `ds icon search`, `ds doctor` — management helpers.
- Built with `commander` + `@clack/prompts` + `execa` + `magicast` + `tinyglobby` + `picocolors`. Distributed as ESM and CJS so `pnpm dlx @labmgm/cli` works in every package manager.
