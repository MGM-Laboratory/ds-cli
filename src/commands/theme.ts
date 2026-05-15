/**
 * `ds theme create`  → prompts for a name + leading brand colour and writes
 *                      a custom theme CSS file (overrides the page's brand
 *                      hooks) into `app/themes/<name>.css`.
 *
 * `ds theme use <name>` → toggles `<html data-theme="…">` at build time by
 *                          rewriting `defaultTheme` inside `app/layout.tsx`.
 *                          The dark/light system pref still wins at runtime
 *                          unless the user picks "force".
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import * as p from "@clack/prompts";

import { code, error, info, success } from "../ui/log.js";

export type LeadColor = "blue" | "yellow" | "red" | "green";

export interface ThemeCreateOptions {
  cwd?: string;
  name?: string;
  leadColor?: LeadColor;
  yes?: boolean;
}

export async function themeCreate(options: ThemeCreateOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const isAuto = options.yes ?? false;

  const name = options.name
    ? options.name
    : isAuto
      ? "custom"
      : ((await p.text({
          message: "Theme name",
          placeholder: "warm-yellow",
          validate: (v) => (/^[a-z0-9][a-z0-9-]*$/.test(v ?? "") ? undefined : "Use kebab-case."),
        })) as string);

  const leadColor: LeadColor = options.leadColor
    ? options.leadColor
    : isAuto
      ? "blue"
      : ((await p.select({
          message: "Leading brand color",
          options: [
            { value: "blue", label: "Blue" },
            { value: "yellow", label: "Yellow" },
            { value: "red", label: "Red" },
            { value: "green", label: "Green" },
          ],
          initialValue: "blue",
        })) as LeadColor);

  if (p.isCancel(name) || p.isCancel(leadColor)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  const themesDir = path.join(cwd, "app", "themes");
  await mkdir(themesDir, { recursive: true });

  const file = path.join(themesDir, `${name}.css`);
  const css = renderThemeCss(name, leadColor);
  await writeFile(file, css, "utf8");

  success(`Wrote ${code(path.relative(cwd, file))}`);
  info(`Import it in ${code("app/globals.css")} or activate with ${code(`ds theme use ${name}`)}.`);
}

export interface ThemeUseOptions {
  cwd?: string;
  /** Force the theme regardless of system preference. */
  force?: boolean;
}

export async function themeUse(name: string, options: ThemeUseOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const layout = path.join(cwd, "app", "layout.tsx");
  if (!existsSync(layout)) {
    error(`Couldn't find ${code(path.relative(cwd, layout))}. Run ${code("ds init")} first.`);
    process.exit(1);
  }
  const source = await readFile(layout, "utf8");
  const next = source.replace(
    /defaultTheme=(["'])\w+\1/,
    `defaultTheme=${JSON.stringify(options.force ? name : "system")}`,
  );
  if (source === next) {
    info(`No change — ${code("defaultTheme")} already set to that value.`);
    return;
  }
  await writeFile(layout, next, "utf8");
  success(`Set ${code("defaultTheme")} → ${code(options.force ? name : "system")} in app/layout.tsx`);
  if (!options.force) {
    info(`Pass ${code("--force")} to ignore the system preference.`);
  }
}

function renderThemeCss(name: string, lead: LeadColor): string {
  const focusVar = `var(--brand-${lead})`;
  return `/**
 * Theme: ${name}
 *
 * Overrides the leading brand colour. Apply by importing this file from
 * app/globals.css AFTER the @labmgm/tokens imports, or by toggling
 * <html data-custom-theme="${name}"> from your app.
 */

[data-custom-theme="${name}"] {
  --focus-ring: ${focusVar};
}

.theme-${name} {
  --focus-ring: ${focusVar};
}
`;
}
