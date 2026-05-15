/**
 * Tiny logging surface. Wraps `picocolors` so the rest of the CLI stays
 * colour-blind; honours `NO_COLOR` per https://no-color.org.
 *
 * `clack` provides its own prompt UI — these helpers cover the in-between
 * lines (results, hints, errors) where we want consistent typography.
 */
import pc from "picocolors";

export const c = pc;

export function info(msg: string): void {
  console.log(`${pc.dim("›")} ${msg}`);
}

export function success(msg: string): void {
  console.log(`${pc.green("✓")} ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${pc.yellow("!")} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${pc.red("✗")} ${msg}`);
}

export function dim(msg: string): string {
  return pc.dim(msg);
}

export function code(text: string): string {
  return pc.cyan(text);
}
