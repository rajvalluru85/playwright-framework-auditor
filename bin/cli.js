#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { scanRepo } = require('../src/scanner');
const { evaluate } = require('../src/scoring');
const { printReport, toJSON } = require('../src/report');

const program = new Command();

program
  .name('playwright-framework-auditor')
  .description('Scans a Playwright test suite and scores it against production-grade guardrails.')
  .version(require('../package.json').version)
  .argument('[path]', 'Path to the repo to scan', '.')
  .option('--full', 'Show the full report (file/line refs + prioritized fix order)')
  .option('--json <file>', 'Write the raw result as JSON to a file')
  .action(async (targetPath, options) => {
    try {
      console.log(chalk.gray(`  Scanning ${targetPath} ...`));
      const repo = await scanRepo(targetPath);

      if (repo.specFiles.length === 0) {
        console.log(
          chalk.yellow(
            `  No .spec.ts / .spec.js / .test.ts files found under ${targetPath}. Nothing to score.`
          )
        );
        process.exit(1);
      }

      const result = evaluate(repo);
      printReport(result, { full: !!options.full });

      if (options.json) {
        fs.writeFileSync(options.json, toJSON(result));
        console.log(chalk.gray(`  Full JSON result written to ${options.json}`));
      }
    } catch (err) {
      console.error(chalk.red(`  Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
