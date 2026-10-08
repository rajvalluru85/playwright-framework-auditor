const chalk = require('chalk');

const BAR_WIDTH = 24;

function bar(pct) {
  const filled = Math.round((pct / 100) * BAR_WIDTH);
  const color = pct >= 80 ? chalk.green : pct >= 60 ? chalk.yellow : chalk.red;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(BAR_WIDTH - filled));
}

function gradeColor(grade) {
  if (grade === 'A') return chalk.green.bold(grade);
  if (grade === 'B') return chalk.greenBright.bold(grade);
  if (grade === 'C') return chalk.yellow.bold(grade);
  if (grade === 'D') return chalk.rgb(255, 165, 0).bold(grade);
  return chalk.red.bold(grade);
}

function printHeader(result) {
  console.log('');
  console.log(chalk.bold.cyan('  Playwright Framework Auditor'));
  console.log(chalk.gray(`  ${result.rootDir}`));
  console.log('');
  console.log(
    `  Overall Score: ${chalk.bold(result.overallScore + '/100')}   Grade: ${gradeColor(result.grade)}`
  );
  console.log('');
}

function printCategoryBars(result) {
  console.log(chalk.bold('  Category Breakdown'));
  for (const cat of result.categories) {
    const label = cat.name.padEnd(22, ' ');
    console.log(`  ${label} ${bar(cat.pct)} ${String(cat.pct).padStart(3)}%`);
  }
  console.log('');
}

function printFreeTier(result) {
  printHeader(result);
  printCategoryBars(result);

  const top3 = result.prioritizedFixes.slice(0, 3);
  console.log(chalk.bold('  Top Issues Found'));
  if (top3.length === 0) {
    console.log(chalk.green('  No major issues found — nice work.'));
  } else {
    top3.forEach((issue, i) => {
      const countStr = issue.count ? ` (${issue.count} instance${issue.count === 1 ? '' : 's'})` : '';
      console.log(`  ${i + 1}. ${chalk.red('✗')} ${issue.label}${countStr}`);
    });
  }

  console.log('');
  console.log(chalk.gray(`  ${result.failedChecks.length} total issues found across ${result.allResults.length} checks.`));
  console.log(
    chalk.cyan.bold('  Run with --full to see exact file/line references and a prioritized fix order.')
  );
  console.log(chalk.gray('  (Full report: one-time unlock — see README for details)'));
  console.log('');
}

function printFullTier(result) {
  printHeader(result);
  printCategoryBars(result);

  for (const cat of result.categories) {
    console.log(chalk.bold(`  ${cat.name}`));
    for (const r of cat.results) {
      const icon = r.pass ? chalk.green('✓') : chalk.red('✗');
      console.log(`    ${icon} ${r.label}`);
      if (!r.pass) {
        console.log(chalk.gray(`        why: ${r.why}`));
        if (r.refs && r.refs.length > 0) {
          const shown = r.refs.slice(0, 5);
          console.log(chalk.gray(`        at: ${shown.join(', ')}${r.refs.length > 5 ? ` (+${r.refs.length - 5} more)` : ''}`));
        }
        if (r.detail) {
          console.log(chalk.gray(`        detail: ${r.detail}`));
        }
      }
    }
    console.log('');
  }

  console.log(chalk.bold('  Prioritized Fix Order'));
  result.prioritizedFixes.forEach((issue, i) => {
    console.log(`  ${i + 1}. [weight ${issue.weight}] ${issue.label} — ${issue.category}`);
  });
  console.log('');
}

function printReport(result, { full }) {
  if (full) {
    printFullTier(result);
  } else {
    printFreeTier(result);
  }
}

function toJSON(result) {
  return JSON.stringify(result, null, 2);
}

module.exports = { printReport, toJSON };
