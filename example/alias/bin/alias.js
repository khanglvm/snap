#!/usr/bin/env node
import { runCli } from '../dist/cli-entry.js';

runCli(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Unknown alias CLI error'}\n`);
    process.exitCode = 1;
  });
