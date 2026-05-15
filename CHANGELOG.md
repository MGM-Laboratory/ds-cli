# @labmgm/cli

## 0.1.0

### Minor changes

- Initial release. Single binary, three modes:
  - **`ds init [name]`** — scaffold a Next.js 15 App Router app pre-wired with `@labmgm/{tokens,styles,themes,react}`, the Tailwind preset, `next/font`-loaded brand fonts, the SSR-safe `<ThemeScript />`, and a sample landing page.
  - **`ds add <component…>`** — shadcn-style registry copy with transitive-dependency resolution, path-traversal guard, package-manager auto-detection, and overwrite control.
  - **`ds theme create|use`**, **`ds token list [filter]`**, **`ds icon search <query>`**, **`ds doctor`** — management helpers that read live from the consumer's installed packages.
- Built with `commander` + `@clack/prompts` + `execa` + `magicast` + `tinyglobby` + `picocolors`. Distributed as ESM and CJS so `pnpm dlx @labmgm/cli` works in every package manager.
