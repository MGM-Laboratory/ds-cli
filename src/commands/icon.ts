/**
 * `ds icon search <query>` — searches the @labmgm/icons manifest. Matches on
 * slug, name, or tag (case-insensitive substring).
 */

import { code, dim, info } from "../ui/log.js";

interface IconEntry {
  slug: string;
  name: string;
  source: "mgm" | "lucide";
  category: string;
  tags: string[];
}

interface IconsManifest {
  counts?: { total?: number; mgm?: number; lucide?: number };
  icons: IconEntry[];
}

async function loadManifest(): Promise<IconsManifest | null> {
  // Same trick as `ds token list`: resolve the consumer-installed package
  // at runtime via a constructed dynamic import so the CLI's typecheck
  // doesn't require @labmgm/icons in node_modules.
  try {
    const dynamicImport = new Function("s", "return import(s)") as (s: string) => Promise<unknown>;
    const mod = (await dynamicImport("@labmgm/icons")) as
      | ({ default?: IconsManifest } & IconsManifest)
      | undefined;
    if (!mod) return null;
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

export async function iconSearch(query: string): Promise<void> {
  if (!query) {
    info(`Usage: ${code("ds icon search <query>")}`);
    return;
  }
  const manifest = await loadManifest();
  if (!manifest) {
    info(`No icons available. Install ${code("@labmgm/icons")} in this project first.`);
    return;
  }
  const needle = query.toLowerCase();
  const matches = manifest.icons.filter(
    (i) =>
      i.slug.toLowerCase().includes(needle) ||
      i.name.toLowerCase().includes(needle) ||
      i.tags.some((t) => t.toLowerCase().includes(needle)),
  );

  if (matches.length === 0) {
    info(`No matches for ${code(query)}.`);
    return;
  }

  // Print at most 50 results so a vague query doesn't flood the terminal.
  const shown = matches.slice(0, 50);
  for (const match of shown) {
    const tag = match.source === "mgm" ? code("MGM") : dim("lucide");
    console.log(`  ${match.slug.padEnd(28)} ${match.name.padEnd(24)} ${tag}  ${dim(match.tags.join(", "))}`);
  }
  console.log("");
  console.log(dim(`Showing ${shown.length} of ${matches.length} match(es).`));
}
