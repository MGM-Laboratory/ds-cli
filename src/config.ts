/**
 * Resolved configuration shared by every command.
 *
 * `DS_REGISTRY_URL` overrides the default registry — useful for self-hosted
 * deployments or local testing against `ds-web` running on :3000.
 */

const DEFAULT_REGISTRY = "https://design.labmgm.org/registry";

export interface CliConfig {
  /** Registry root. Components live at `${registry}/<name>.json`. */
  registry: string;
}

export function loadConfig(): CliConfig {
  return {
    registry: process.env["DS_REGISTRY_URL"] ?? DEFAULT_REGISTRY,
  };
}
