import { describe, it, expect } from "vitest";

import { render } from "../src/templating.js";

describe("render", () => {
  it("substitutes one variable", () => {
    expect(render("hello {{name}}", { name: "world" })).toBe("hello world");
  });

  it("substitutes multiple", () => {
    expect(render("{{a}} & {{b}}", { a: "x", b: "y" })).toBe("x & y");
  });

  it("ignores plain braces / partial markers", () => {
    expect(render("{ not a var }", { name: "x" })).toBe("{ not a var }");
    expect(render("{{ }}", { name: "x" })).toBe("{{ }}");
  });

  it("throws for missing variables (catches typos early)", () => {
    expect(() => render("{{missing}}", { name: "x" })).toThrow(/missing/);
  });
});
