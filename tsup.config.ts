import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  target: "node22",
  external: ["@clack/prompts", "commander", "execa", "magicast", "picocolors", "tinyglobby"],
});
