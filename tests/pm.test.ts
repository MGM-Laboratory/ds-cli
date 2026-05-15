import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { addCommand, detectPackageManager, installCommand } from "../src/ui/pm.js";

describe("detectPackageManager", () => {
  const originalEnv = process.env["npm_config_user_agent"];
  beforeEach(() => {
    delete process.env["npm_config_user_agent"];
  });
  afterEach(() => {
    if (originalEnv) process.env["npm_config_user_agent"] = originalEnv;
  });

  it("reads from npm_config_user_agent first", () => {
    process.env["npm_config_user_agent"] = "pnpm/9.15.0 npm/? node/v22.0.0";
    expect(detectPackageManager("/nonexistent")).toBe("pnpm");

    process.env["npm_config_user_agent"] = "yarn/4.0.0 npm/?";
    expect(detectPackageManager("/nonexistent")).toBe("yarn");
  });

  it("falls back to lockfile presence", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "labmgm-pm-"));
    try {
      writeFileSync(path.join(dir, "pnpm-lock.yaml"), "");
      expect(detectPackageManager(dir)).toBe("pnpm");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("falls back to npm when nothing is detected", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "labmgm-pm-"));
    try {
      expect(detectPackageManager(dir)).toBe("npm");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("installCommand / addCommand", () => {
  it("pnpm uses -D for dev deps", () => {
    expect(addCommand("pnpm", ["foo"], true)).toEqual({ cmd: "pnpm", args: ["add", "-D", "foo"] });
  });
  it("npm uses install", () => {
    expect(installCommand("npm")).toEqual({ cmd: "npm", args: ["install"] });
  });
  it("bun uses -d for dev", () => {
    expect(addCommand("bun", ["x"], true)).toEqual({ cmd: "bun", args: ["add", "-d", "x"] });
  });
});

// Suppress unused-import warning in CI tooling that strips dead requires.
void vi;
void mkdirSync;
