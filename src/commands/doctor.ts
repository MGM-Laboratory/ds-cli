/**
 * `ds doctor` — sanity-checks a consumer project.
 *
 * Confirms:
 *   - @labmgm/{tokens, styles, themes, react} are installed.
 *   - Tailwind config references the preset.
 *   - app/layout.tsx mounts <ThemeProvider> + <ThemeScript>.
 *   - app/globals.css imports the base + tokens.
 *
 * Exits non-zero on any failure so CI catches drift.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { c, code, dim, error, success, warn } from "../ui/log.js";

export interface DoctorOptions {
  cwd?: string;
}

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail";
  detail?: string;
}

const REQUIRED_DEPS = ["@labmgm/tokens", "@labmgm/styles", "@labmgm/themes", "@labmgm/react"];

export async function doctor(options: DoctorOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const results: CheckResult[] = [];

  results.push(await checkPackageJson(cwd));
  results.push(await checkTailwindConfig(cwd));
  results.push(await checkLayout(cwd));
  results.push(await checkGlobalsCss(cwd));

  console.log("");
  console.log(c.bold(`ds doctor`));
  console.log(dim("─────────"));
  for (const r of results) {
    const badge =
      r.status === "ok" ? c.green("✓") : r.status === "warn" ? c.yellow("!") : c.red("✗");
    console.log(`  ${badge}  ${r.name}${r.detail ? `  ${dim(`— ${r.detail}`)}` : ""}`);
  }

  const fails = results.filter((r) => r.status === "fail");
  const warns = results.filter((r) => r.status === "warn");

  console.log("");
  if (fails.length > 0) {
    error(`${fails.length} check(s) failed.`);
    process.exit(1);
  } else if (warns.length > 0) {
    warn(`${warns.length} warning(s). Project is functional but not fully aligned with the brand spec.`);
  } else {
    success(`All checks passed.`);
  }
}

async function checkPackageJson(cwd: string): Promise<CheckResult> {
  const file = path.join(cwd, "package.json");
  if (!existsSync(file)) return { name: "package.json", status: "fail", detail: "missing" };
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(await readFile(file, "utf8"));
  } catch {
    return { name: "package.json", status: "fail", detail: "unreadable JSON" };
  }
  const installed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  const missing = REQUIRED_DEPS.filter((d) => !installed.has(d));
  if (missing.length === 0) return { name: "Design-system packages installed", status: "ok" };
  return {
    name: "Design-system packages installed",
    status: "fail",
    detail: `missing ${missing.map((m) => code(m)).join(", ")}`,
  };
}

async function checkTailwindConfig(cwd: string): Promise<CheckResult> {
  const candidates = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"];
  const found = candidates.find((c) => existsSync(path.join(cwd, c)));
  if (!found) return { name: "Tailwind config", status: "fail", detail: "no tailwind.config.* found" };
  const contents = await readFile(path.join(cwd, found), "utf8");
  if (!contents.includes("@labmgm/styles")) {
    return {
      name: "Tailwind preset wired",
      status: "fail",
      detail: `${code(found)} doesn't reference ${code("@labmgm/styles")}`,
    };
  }
  return { name: "Tailwind preset wired", status: "ok" };
}

async function checkLayout(cwd: string): Promise<CheckResult> {
  const file = path.join(cwd, "app", "layout.tsx");
  if (!existsSync(file)) return { name: "app/layout.tsx", status: "warn", detail: "not a Next.js App Router project" };
  const contents = await readFile(file, "utf8");
  if (!contents.includes("ThemeProvider")) {
    return { name: "<ThemeProvider> mounted", status: "fail", detail: "not found in app/layout.tsx" };
  }
  if (!contents.includes("ThemeScript")) {
    return {
      name: "<ThemeScript> in <head>",
      status: "warn",
      detail: "without it, the page will flash the wrong theme on first paint",
    };
  }
  return { name: "<ThemeProvider> + <ThemeScript> wired", status: "ok" };
}

async function checkGlobalsCss(cwd: string): Promise<CheckResult> {
  const candidates = ["app/globals.css", "src/app/globals.css", "styles/globals.css"];
  const file = candidates.map((c) => path.join(cwd, c)).find(existsSync);
  if (!file) return { name: "globals.css", status: "warn", detail: "not found" };
  const contents = await readFile(file, "utf8");
  const ok =
    contents.includes("@tailwind base") &&
    contents.includes("@labmgm/tokens") &&
    contents.includes("@labmgm/styles");
  if (!ok) {
    return {
      name: "globals.css imports",
      status: "fail",
      detail: `missing ${code("@tailwind base")}, ${code("@labmgm/tokens")}, or ${code("@labmgm/styles")} imports`,
    };
  }
  return { name: "globals.css imports", status: "ok" };
}
