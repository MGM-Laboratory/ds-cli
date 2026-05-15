/**
 * Tiny mustache-style templater. We avoid pulling in handlebars/etc. — the
 * substitution surface is just `{{appName}}` and `{{leadColor}}`, so a
 * single regex replace is enough.
 */

export type TemplateVars = Record<string, string>;

export function render(source: string, vars: TemplateVars): string {
  return source.replace(/\{\{\s*([a-zA-Z][\w]*)\s*\}\}/g, (_match, key: string) => {
    if (!(key in vars)) {
      throw new Error(`Template references unknown variable: {{${key}}}`);
    }
    return vars[key] ?? "";
  });
}
