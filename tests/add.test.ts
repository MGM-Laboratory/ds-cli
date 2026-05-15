import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { add } from "../src/commands/add.js";

describe("ds add", () => {
  let workDir: string;
  let registryDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "labmgm-cli-add-"));
    registryDir = mkdtempSync(path.join(tmpdir(), "labmgm-cli-registry-"));
    // The CLI accepts file: URLs as registry roots — set the env override.
    process.env["DS_REGISTRY_URL"] = pathToFileURL(registryDir).href.replace(/\/$/, "");
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
    rmSync(registryDir, { recursive: true, force: true });
    delete process.env["DS_REGISTRY_URL"];
  });

  it("copies a component + its dependency from the registry", async () => {
    writeRegistry("button", {
      name: "button",
      registryDependencies: ["slot"],
      files: [{ path: "components/ui/button.tsx", content: "export const Button = () => null;\n" }],
    });
    writeRegistry("slot", {
      name: "slot",
      files: [{ path: "components/ui/slot.tsx", content: "export const Slot = () => null;\n" }],
    });

    await add(["button"], { cwd: workDir, skipInstall: true });

    const btn = path.join(workDir, "components", "ui", "button.tsx");
    const slot = path.join(workDir, "components", "ui", "slot.tsx");
    expect(existsSync(btn)).toBe(true);
    expect(existsSync(slot)).toBe(true);
    expect(readFileSync(btn, "utf8")).toContain("Button");
  });

  it("skips existing files unless --overwrite", async () => {
    writeRegistry("card", {
      name: "card",
      files: [{ path: "components/ui/card.tsx", content: "new\n" }],
    });
    mkdirSync(path.join(workDir, "components", "ui"), { recursive: true });
    writeFileSync(path.join(workDir, "components", "ui", "card.tsx"), "OLD\n");

    await add(["card"], { cwd: workDir, skipInstall: true });
    expect(readFileSync(path.join(workDir, "components", "ui", "card.tsx"), "utf8")).toBe("OLD\n");

    await add(["card"], { cwd: workDir, skipInstall: true, overwrite: true });
    expect(readFileSync(path.join(workDir, "components", "ui", "card.tsx"), "utf8")).toBe("new\n");
  });

  it("refuses to write outside cwd (path-traversal guard)", async () => {
    writeRegistry("evil", {
      name: "evil",
      files: [{ path: "../escape.txt", content: "owned" }],
    });
    await expect(add(["evil"], { cwd: workDir, skipInstall: true })).rejects.toThrow(/outside cwd/);
  });

  function writeRegistry(name: string, content: object) {
    writeFileSync(path.join(registryDir, `${name}.json`), JSON.stringify(content), "utf8");
  }
});
