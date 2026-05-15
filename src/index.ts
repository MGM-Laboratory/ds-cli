/**
 * @labmgm/cli — single binary, three modes.
 *
 *   ds init [name]              scaffold a Next.js 15 App Router app
 *   ds add <component…>         shadcn-style copy from the registry
 *   ds theme create|use         create or activate a theme variant
 *   ds token list [filter]      list every token resolved by @labmgm/tokens
 *   ds icon search <query>      search the @labmgm/icons manifest
 *   ds doctor                   sanity-check a consumer project
 *
 * Reachable via `pnpm dlx @labmgm/cli`, `npx @labmgm/cli`, or after install
 * as the local binary `ds`.
 */

import { Command, Option } from "commander";

import { add } from "./commands/add.js";
import { doctor } from "./commands/doctor.js";
import { iconSearch } from "./commands/icon.js";
import { init, type LeadColor } from "./commands/init.js";
import { themeCreate, themeUse } from "./commands/theme.js";
import { tokenList } from "./commands/token.js";
import { error } from "./ui/log.js";
import { CLI_VERSION } from "./version.js";

export async function run(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .name("ds")
    .description("The MGM Laboratory Design System CLI")
    .version(CLI_VERSION, "-v, --version", "Print the CLI version");

  // ─── init ──────────────────────────────────────────────────────────────
  program
    .command("init [name]")
    .description("Scaffold a new Next.js 15 app pre-wired with the design system")
    .addOption(
      new Option("--package-manager <pm>", "Override the package manager").choices([
        "pnpm",
        "npm",
        "yarn",
        "bun",
      ]),
    )
    .addOption(
      new Option("--lead-color <color>", "Leading brand colour").choices([
        "blue",
        "yellow",
        "red",
        "green",
      ]),
    )
    .option("--skip-install", "Skip the install step")
    .option("-y, --yes", "Skip prompts and accept defaults")
    .action(async (name: string | undefined, opts) => {
      await init(name, {
        ...(opts.packageManager && { packageManager: opts.packageManager }),
        ...(opts.leadColor && { leadColor: opts.leadColor as LeadColor }),
        skipInstall: opts.skipInstall ?? false,
        yes: opts.yes ?? false,
      });
    });

  // ─── add ───────────────────────────────────────────────────────────────
  program
    .command("add <component...>")
    .description("Copy component source from the registry into this project")
    .option("--overwrite", "Replace files that already exist")
    .option("--skip-install", "Don't install declared dependencies")
    .option("--dir <path>", "Destination directory (default components/ui)")
    .action(async (components: string[], opts) => {
      await add(components, {
        overwrite: opts.overwrite ?? false,
        skipInstall: opts.skipInstall ?? false,
        ...(opts.dir && { dir: opts.dir }),
      });
    });

  // ─── theme ─────────────────────────────────────────────────────────────
  const theme = program.command("theme").description("Create or activate a theme variant");
  theme
    .command("create")
    .description("Generate a new theme CSS file")
    .option("--name <name>", "Theme name (kebab-case)")
    .addOption(
      new Option("--lead-color <color>", "Leading brand colour").choices([
        "blue",
        "yellow",
        "red",
        "green",
      ]),
    )
    .option("-y, --yes", "Skip prompts")
    .action(async (opts) => {
      await themeCreate({
        ...(opts.name && { name: opts.name }),
        ...(opts.leadColor && { leadColor: opts.leadColor as LeadColor }),
        yes: opts.yes ?? false,
      });
    });
  theme
    .command("use <name>")
    .description("Activate a theme (updates defaultTheme in app/layout.tsx)")
    .option("--force", "Force the theme regardless of system preference")
    .action(async (name: string, opts) => {
      await themeUse(name, { force: opts.force ?? false });
    });

  // ─── token ─────────────────────────────────────────────────────────────
  program
    .command("token")
    .description("Inspect tokens from @labmgm/tokens")
    .command("list [filter]")
    .description("List every token, optionally filtered by substring")
    .action(async (filter?: string) => {
      await tokenList(filter);
    });

  // ─── icon ──────────────────────────────────────────────────────────────
  program
    .command("icon")
    .description("Search the @labmgm/icons manifest")
    .command("search <query>")
    .action(async (query: string) => {
      await iconSearch(query);
    });

  // ─── doctor ────────────────────────────────────────────────────────────
  program
    .command("doctor")
    .description("Sanity-check a consumer project's design-system setup")
    .action(async () => {
      await doctor();
    });

  // commander's default error output is fine; we wrap to surface unhandled
  // rejections at the top level cleanly.
  try {
    await program.parseAsync(argv);
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}
