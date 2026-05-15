/**
 * `ds token list [filter]` — print every semantic token in @labmgm/tokens
 * with its current value. Filter is a case-insensitive substring match.
 */

import { code, dim, info } from "../ui/log.js";

interface TokenEntry {
  name: string;
  value: string;
}

async function loadTokens(): Promise<Record<string, TokenEntry[]>> {
  // We import the consumer-installed tokens package so the result reflects
  // whatever version the project pinned, not the CLI's bundled copy.
  // The CLI itself doesn't depend on @labmgm/tokens — `import()` resolves it
  // at runtime from the consumer's node_modules.
  let mod: { tokens?: Record<string, unknown> };
  try {
    const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<unknown>;
    mod = (await dynamicImport("@labmgm/tokens")) as { tokens?: Record<string, unknown> };
  } catch {
    return {};
  }
  const tokens = mod.tokens ?? {};
  const groups: Record<string, TokenEntry[]> = {};
  walk(tokens, [], groups);
  return groups;
}

function walk(node: unknown, path: string[], groups: Record<string, TokenEntry[]>): void {
  if (node === null || typeof node !== "object") {
    const groupKey = path.length > 1 ? path[0]! : "core";
    const entries = (groups[groupKey] ??= []);
    entries.push({ name: path.join("."), value: String(node) });
    return;
  }
  if (Array.isArray(node)) {
    const groupKey = path.length > 1 ? path[0]! : "core";
    const entries = (groups[groupKey] ??= []);
    entries.push({ name: path.join("."), value: JSON.stringify(node) });
    return;
  }
  for (const [k, v] of Object.entries(node)) walk(v, [...path, k], groups);
}

export async function tokenList(filter?: string): Promise<void> {
  const groups = await loadTokens();
  if (Object.keys(groups).length === 0) {
    info(`No tokens found. Install ${code("@labmgm/tokens")} in this project first.`);
    return;
  }
  const needle = filter?.toLowerCase();
  for (const [group, entries] of Object.entries(groups)) {
    const filtered = needle ? entries.filter((e) => e.name.toLowerCase().includes(needle)) : entries;
    if (filtered.length === 0) continue;
    console.log("");
    console.log(code(group));
    console.log(dim("─".repeat(group.length)));
    for (const entry of filtered) {
      console.log(`  ${entry.name.padEnd(36)} ${dim(entry.value)}`);
    }
  }
}
