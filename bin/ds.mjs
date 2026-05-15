#!/usr/bin/env node
// The published binary entry. Forwards to the built CLI.
import("../dist/index.js")
  .then(({ run }) => run(process.argv))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
