import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { init } from "../src/commands/init.js";

describe("ds init", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "labmgm-cli-init-"));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("scaffolds the Next.js template with the chosen lead colour", async () => {
    await init("my-app", {
      cwd: workDir,
      packageManager: "pnpm",
      leadColor: "yellow",
      skipInstall: true,
      yes: true,
    });

    const target = path.join(workDir, "my-app");
    expect(existsSync(target)).toBe(true);
    expect(existsSync(path.join(target, "package.json"))).toBe(true);
    expect(existsSync(path.join(target, "tailwind.config.ts"))).toBe(true);
    expect(existsSync(path.join(target, "app", "layout.tsx"))).toBe(true);
    expect(existsSync(path.join(target, "app", "globals.css"))).toBe(true);
    expect(existsSync(path.join(target, "app", "page.tsx"))).toBe(true);

    const pkg = JSON.parse(readFileSync(path.join(target, "package.json"), "utf8"));
    expect(pkg.name).toBe("my-app");
    expect(pkg.dependencies["@labmgm/react"]).toBeDefined();

    const layout = readFileSync(path.join(target, "app", "layout.tsx"), "utf8");
    expect(layout).toContain("ThemeProvider");
    expect(layout).toContain("ThemeScript");
    expect(layout).toContain('title: "my-app"');

    const page = readFileSync(path.join(target, "app", "page.tsx"), "utf8");
    expect(page).toContain("var(--brand-yellow)");
  });
});
