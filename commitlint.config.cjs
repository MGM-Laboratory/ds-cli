module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "chore", "refactor", "test", "ci", "build", "perf", "revert"],
    ],
    "subject-case": [0],
  },
};
