/**
 * Detect the consumer's package manager so generated install commands point
 * at the right tool. Mirrors the resolution `corepack` uses:
 *   1. `npm_config_user_agent` (set by every package manager when it spawns
 *      a script), then
 *   2. lockfile presence, then
 *   3. fallback to `npm`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  const ua = process.env["npm_config_user_agent"];
  if (ua) {
    if (ua.startsWith("pnpm")) return "pnpm";
    if (ua.startsWith("yarn")) return "yarn";
    if (ua.startsWith("bun")) return "bun";
    if (ua.startsWith("npm")) return "npm";
  }
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  return "npm";
}

export function installCommand(pm: PackageManager): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "yarn":
      return { cmd: "yarn", args: ["install"] };
    case "bun":
      return { cmd: "bun", args: ["install"] };
    case "npm":
      return { cmd: "npm", args: ["install"] };
  }
}

export function addCommand(pm: PackageManager, packages: string[], dev = false): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["add", ...(dev ? ["-D"] : []), ...packages] };
    case "yarn":
      return { cmd: "yarn", args: ["add", ...(dev ? ["-D"] : []), ...packages] };
    case "bun":
      return { cmd: "bun", args: ["add", ...(dev ? ["-d"] : []), ...packages] };
    case "npm":
      return { cmd: "npm", args: ["install", ...(dev ? ["-D"] : []), ...packages] };
  }
}
