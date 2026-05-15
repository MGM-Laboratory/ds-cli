import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { doctor } from "../src/commands/doctor.js";

describe("ds doctor", () => {
  let workDir: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "labmgm-cli-doctor-"));
    exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`__exit__${code ?? 0}`);
    }) as never);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("fails when the project is missing everything", async () => {
    await expect(doctor({ cwd: workDir })).rejects.toThrow(/__exit__1/);
  });

  it("passes on a properly wired project", async () => {
    writeFileSync(
      path.join(workDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "@labmgm/react": "*",
          "@labmgm/styles": "*",
          "@labmgm/themes": "*",
          "@labmgm/tokens": "*",
        },
      }),
    );
    writeFileSync(
      path.join(workDir, "tailwind.config.ts"),
      `import preset from "@labmgm/styles";\nexport default { presets: [preset] };\n`,
    );
    mkdirSync(path.join(workDir, "app"), { recursive: true });
    writeFileSync(
      path.join(workDir, "app", "layout.tsx"),
      `import { ThemeProvider, ThemeScript } from "@labmgm/themes";\n`,
    );
    writeFileSync(
      path.join(workDir, "app", "globals.css"),
      `@tailwind base;\n@import "@labmgm/tokens/css";\n@import "@labmgm/styles/reset.css";\n`,
    );

    // Should not throw (no exit(1) called).
    await doctor({ cwd: workDir });
  });
});
