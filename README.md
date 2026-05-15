# @labmgm/cli

The `ds` CLI for the MGM Laboratory Design System. Single binary, three modes.

## Run it

```bash
pnpm dlx @labmgm/cli init my-app
# or
npx @labmgm/cli init my-app
```

After install, `ds` is on your path:

```bash
cd my-app
ds add button card dialog
ds doctor
```

## Commands

### `ds init [name]`

Scaffolds a Next.js 15 App Router app pre-wired with the design system.

```bash
ds init my-app
ds init my-app --lead-color yellow --package-manager pnpm
ds init my-app -y          # accept defaults, no prompts
```

Generated layout:
- `app/layout.tsx` mounts `<ThemeProvider>` + `<ThemeScript />` (SSR-safe, no FOUC).
- `app/globals.css` imports `@labmgm/tokens/css/{light,dark}` and the base CSS layer.
- `tailwind.config.ts` consumes `@labmgm/styles` as a preset.
- `next/font` self-hosts Geist + Bricolage Grotesque + Geist Mono.
- A sample landing page using `@labmgm/react` components.

### `ds add <component…>`

Shadcn-style copy. Fetches each component's source from the registry served by `ds-web` at `/registry/<name>.json`, writes it into `components/ui/`, resolves transitive dependencies, and installs declared npm deps with your project's package manager.

```bash
ds add button card dialog
ds add table --overwrite
ds add accordion --skip-install
ds add button --dir src/components/ui
```

Components are **copied source you own**, not a runtime dependency. Modify freely.

### `ds theme create | use <name>`

Generate or activate a theme variant.

```bash
ds theme create --name warm-yellow --lead-color yellow
ds theme use warm-yellow            # tracks system preference still
ds theme use warm-yellow --force    # force it regardless of OS pref
```

### `ds token list [filter]`

List every token from the consumer's installed `@labmgm/tokens` package.

```bash
ds token list                  # everything
ds token list brand            # only tokens whose name contains "brand"
```

### `ds icon search <query>`

Search the consumer's installed `@labmgm/icons` manifest.

```bash
ds icon search arrow
ds icon search lab
```

### `ds doctor`

Sanity-checks a consumer project. Exits non-zero on any failure so CI catches drift.

Checks:
- Design-system packages (`@labmgm/tokens`, `@labmgm/styles`, `@labmgm/themes`, `@labmgm/react`) are installed.
- `tailwind.config.*` references the `@labmgm/styles` preset.
- `app/layout.tsx` mounts `<ThemeProvider>` and `<ThemeScript />`.
- `app/globals.css` imports `@tailwind base`, `@labmgm/tokens`, `@labmgm/styles`.

## Configuration

Override the registry root (useful for self-hosted docs / local testing):

```bash
DS_REGISTRY_URL=http://localhost:3000/registry ds add button
```

## License

MIT © MGM Laboratory.
