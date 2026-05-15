/**
 * `ds add <component…>` — shadcn-style copy.
 *
 * Fetches each component's JSON descriptor from the registry, writes the
 * source files into the consumer's `components/ui/`, installs declared
 * dependencies via the consumer's package manager, and warns when the
 * required Tailwind preset / theme provider isn't wired up.
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "../config.js";
import { addCommand, detectPackageManager } from "../ui/pm.js";
import { code, dim, error, info, success, warn } from "../ui/log.js";

export interface RegistryFile {
  /** Repository-relative path the file is written to (must stay under `components/ui/`). */
  path: string;
  content: string;
}

export interface RegistryComponent {
  name: string;
  /** Other components this one depends on; fetched recursively. */
  registryDependencies?: string[];
  /** npm dependencies + dev dependencies to install in the consumer project. */
  dependencies?: string[];
  devDependencies?: string[];
  files: RegistryFile[];
}

export interface AddOptions {
  cwd?: string;
  /** Force-overwrite existing files. */
  overwrite?: boolean;
  /** Skip installing dependencies (useful for offline / CI flows). */
  skipInstall?: boolean;
  /** Custom destination directory; defaults to `components/ui`. */
  dir?: string;
}

export async function add(names: string[], options: AddOptions = {}): Promise<void> {
  if (names.length === 0) {
    error("No components specified. Usage: ds add button card dialog");
    process.exit(1);
  }
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig();
  const destDir = path.resolve(cwd, options.dir ?? "components/ui");

  info(`Adding ${names.map(code).join(", ")} into ${dim(path.relative(cwd, destDir) || ".")}`);

  const resolved = await resolveAll(names, config.registry);

  await mkdir(destDir, { recursive: true });
  let written = 0;
  let skipped = 0;
  for (const component of resolved.values()) {
    for (const file of component.files) {
      const dest = path.resolve(cwd, file.path);
      // Hard refuse path traversal — keep writes scoped to the consumer's repo.
      if (!dest.startsWith(cwd)) {
        throw new Error(`Refusing to write outside cwd: ${file.path}`);
      }
      if (existsSync(dest) && !options.overwrite) {
        warn(`Exists, skipping: ${path.relative(cwd, dest)} (pass --overwrite to replace)`);
        skipped += 1;
        continue;
      }
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, file.content, "utf8");
      success(`Wrote ${dim(path.relative(cwd, dest))}`);
      written += 1;
    }
  }

  // Aggregate npm-level dependencies across the whole add operation so we
  // install in one shot rather than once per component.
  const deps = new Set<string>();
  const devDeps = new Set<string>();
  for (const component of resolved.values()) {
    component.dependencies?.forEach((d) => deps.add(d));
    component.devDependencies?.forEach((d) => devDeps.add(d));
  }

  if (!options.skipInstall && (deps.size > 0 || devDeps.size > 0)) {
    const pm = detectPackageManager(cwd);
    if (deps.size > 0) {
      const { cmd, args } = addCommand(pm, [...deps]);
      info(`Installing dependencies: ${code(`${cmd} ${args.join(" ")}`)}`);
      await runInstall(cmd, args, cwd);
    }
    if (devDeps.size > 0) {
      const { cmd, args } = addCommand(pm, [...devDeps], true);
      info(`Installing dev dependencies: ${code(`${cmd} ${args.join(" ")}`)}`);
      await runInstall(cmd, args, cwd);
    }
  } else if (options.skipInstall) {
    info("Skipped install (--skip-install)");
  }

  // Brand-spec gate — warn loudly if the project hasn't wired up the preset
  // or the theme provider. We don't auto-edit Tailwind / layout configs from
  // `add`; that's `init`'s job.
  await checkProjectWiring(cwd);

  console.log("");
  success(`Done. Wrote ${written} file(s); skipped ${skipped}.`);
  info("Import as " + code(`import { Button } from "@/components/ui/button";`));
}

async function resolveAll(
  names: string[],
  registry: string,
): Promise<Map<string, RegistryComponent>> {
  const out = new Map<string, RegistryComponent>();
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (out.has(name)) continue;
    const component = await fetchComponent(registry, name);
    out.set(name, component);
    if (component.registryDependencies) queue.push(...component.registryDependencies);
  }
  return out;
}

async function fetchComponent(registry: string, name: string): Promise<RegistryComponent> {
  const url = `${registry.replace(/\/$/, "")}/${name}.json`;
  // Allow `file:`/`http(s):` registries so tests + offline-self-hosted work.
  if (url.startsWith("file:")) {
    const file = new URL(url);
    return JSON.parse(readFileSync(file, "utf8")) as RegistryComponent;
  }
  const response = await fetch(url);
  if (!response.ok) {
    error(`Failed to fetch ${name} from ${url} (status ${response.status})`);
    process.exit(1);
  }
  return (await response.json()) as RegistryComponent;
}

async function runInstall(cmd: string, args: string[], cwd: string): Promise<void> {
  const { execa } = await import("execa");
  try {
    await execa(cmd, args, { cwd, stdio: "inherit" });
  } catch (err) {
    error(`Install command failed (${cmd} ${args.join(" ")}).`);
    throw err;
  }
}

async function checkProjectWiring(cwd: string): Promise<void> {
  // Quietly inspect the most likely Tailwind config locations. Anything more
  // ambitious belongs in `ds doctor`.
  const candidates = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"];
  for (const candidate of candidates) {
    const file = path.join(cwd, candidate);
    if (existsSync(file)) {
      const contents = await readFile(file, "utf8");
      if (!contents.includes("@labmgm/styles")) {
        warn(
          `Your Tailwind config doesn't reference ${code("@labmgm/styles")}. Add it to ${code("presets")}.`,
        );
      }
      return;
    }
  }
  warn(
    `Couldn't find a Tailwind config. If this is a Next.js app, run ${code("ds init")} or wire ${code("@labmgm/styles")} manually.`,
  );
}
