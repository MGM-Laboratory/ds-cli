/**
 * `ds init [name]` — scaffold a Next.js 15 App Router app pre-wired with
 * the design system.
 *
 * Prompts (defaults derive from positional args + auto-detection):
 *   1. App name        — directory + package.json `name`.
 *   2. Package manager — defaults to whichever the user invoked the CLI with.
 *   3. Leading colour  — sets the brand colour referenced in the eyebrow on
 *                        the sample landing page. Snaps to blue/yellow/red/green.
 *
 * Writes the template tree into `<cwd>/<name>/`, then runs the chosen
 * package manager's install command. The user is left with a runnable
 * `pnpm dev` (or equivalent).
 */

import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as p from "@clack/prompts";

import { detectPackageManager, installCommand, type PackageManager } from "../ui/pm.js";
import { code, dim, error, info, success } from "../ui/log.js";
import { render, type TemplateVars } from "../templating.js";

export type LeadColor = "blue" | "yellow" | "red" | "green";

export interface InitOptions {
  cwd?: string;
  /** Override the prompt — useful for test/CI flows. */
  packageManager?: PackageManager;
  leadColor?: LeadColor;
  /** Skip the install step. */
  skipInstall?: boolean;
  /** Bypass prompts entirely (for automation). */
  yes?: boolean;
}

export async function init(rawName: string | undefined, options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const detectedPm = detectPackageManager(cwd);
  const isAuto = options.yes ?? false;

  p.intro(`${code("ds init")} — MGM Laboratory Design System scaffold`);

  // ─── 1. App name ─────────────────────────────────────────────────────────
  const name = isAuto
    ? rawName ?? "my-app"
    : await ask(
        rawName,
        async () =>
          (await p.text({
            message: "App name",
            placeholder: "my-app",
            initialValue: rawName ?? "my-app",
            validate: (value) => {
              if (!value) return "Required";
              if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
                return "Use lower-case letters, digits, and hyphens.";
              }
              return undefined;
            },
          })) as string,
      );

  const targetDir = path.resolve(cwd, name);
  if (existsSync(targetDir)) {
    const contents = await readdir(targetDir);
    if (contents.length > 0) {
      error(`Target directory ${code(targetDir)} exists and isn't empty.`);
      process.exit(1);
    }
  }

  // ─── 2. Package manager ──────────────────────────────────────────────────
  const pm: PackageManager = options.packageManager
    ? options.packageManager
    : isAuto
      ? detectedPm
      : ((await p.select({
          message: "Package manager",
          options: [
            { value: "pnpm", label: "pnpm", hint: detectedPm === "pnpm" ? "auto-detected" : "" },
            { value: "npm", label: "npm", hint: detectedPm === "npm" ? "auto-detected" : "" },
            { value: "yarn", label: "yarn", hint: detectedPm === "yarn" ? "auto-detected" : "" },
            { value: "bun", label: "bun", hint: detectedPm === "bun" ? "auto-detected" : "" },
          ],
          initialValue: detectedPm,
        })) as PackageManager);

  // ─── 3. Lead brand colour ───────────────────────────────────────────────
  const leadColor: LeadColor = options.leadColor
    ? options.leadColor
    : isAuto
      ? "blue"
      : ((await p.select({
          message: "Leading brand color (60/30/10 rule, brand spec §2.2)",
          options: [
            { value: "blue", label: "Blue (default — product, B2B)" },
            { value: "yellow", label: "Yellow (warmth, onboarding)" },
            { value: "red", label: "Red (energy, urgency)" },
            { value: "green", label: "Green (success-led)" },
          ],
          initialValue: "blue",
        })) as LeadColor);

  if (p.isCancel(name) || p.isCancel(pm) || p.isCancel(leadColor)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  // ─── Write templates ────────────────────────────────────────────────────
  const spinner = p.spinner();
  spinner.start("Writing files");

  const templateRoot = resolveTemplateRoot();
  const vars: TemplateVars = { appName: name, leadColor };
  let written = 0;
  for await (const file of walkTemplates(templateRoot)) {
    const relTarget = file.relative.replace(/\.tmpl$/, "");
    const dest = path.join(targetDir, relTarget);
    await mkdir(path.dirname(dest), { recursive: true });
    const source = await readFile(file.absolute, "utf8");
    await writeFile(dest, render(source, vars), "utf8");
    written += 1;
  }
  spinner.stop(`Wrote ${written} file(s) into ${dim(path.relative(cwd, targetDir) || ".")}`);

  // ─── Install ────────────────────────────────────────────────────────────
  if (!options.skipInstall) {
    const { cmd, args } = installCommand(pm);
    spinner.start(`Installing dependencies with ${cmd}`);
    try {
      const { execa } = await import("execa");
      await execa(cmd, args, { cwd: targetDir, stdio: "ignore" });
      spinner.stop(`Installed dependencies (${cmd})`);
    } catch (err) {
      spinner.stop(`Install failed — you can rerun ${code(`${cmd} ${args.join(" ")}`)} manually.`);
      throw err;
    }
  } else {
    info("Skipped install (--skip-install)");
  }

  p.outro(
    [
      success(""),
      `Next steps:`,
      `  ${code(`cd ${name}`)}`,
      `  ${code(`${pm} dev`)}`,
      ``,
      `Open ${code("http://localhost:3000")} in your browser.`,
    ].join("\n"),
  );
}

async function ask<T>(
  positional: T | undefined,
  prompt: () => Promise<T>,
): Promise<T> {
  if (positional !== undefined && positional !== null && positional !== "") return positional;
  const value = await prompt();
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }
  return value;
}

/**
 * Resolve the on-disk template root.
 *
 * In dev the CLI runs from `src/`; after publish it runs from `dist/`. The
 * `templates/` directory sits at the package root in both cases, so we walk
 * up until we find it.
 */
function resolveTemplateRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  let dir = here;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "templates", "next");
    if (existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`Could not locate the Next.js template directory from ${here}.`);
}

async function* walkTemplates(
  root: string,
  prefix = "",
): AsyncGenerator<{ relative: string; absolute: string }> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  for (const entry of entries) {
    const childRel = path.join(prefix, entry.name);
    const childAbs = path.join(root, childRel);
    const s = await stat(childAbs);
    if (s.isDirectory()) {
      yield* walkTemplates(root, childRel);
    } else {
      yield { relative: childRel, absolute: childAbs };
    }
  }
}
