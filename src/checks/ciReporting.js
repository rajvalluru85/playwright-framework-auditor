const path = require('path');

const CATEGORY = 'CI & Reporting';

function run(repo) {
  const results = [];
  const { ciFiles, playwrightConfig, rootDir } = repo;
  const pwContent = playwrightConfig?.content || '';
  const pwRef = playwrightConfig ? [path.relative(rootDir, playwrightConfig.path)] : [];

  results.push({
    id: 'ci-pipeline-present',
    category: CATEGORY,
    label: 'CI workflow file present (GitHub Actions / GitLab CI / Azure)',
    weight: 3,
    pass: ciFiles.length > 0,
    why: 'Without a CI gate, broken tests can merge to main, defeating the purpose of having an automated suite at all.',
    refs: ciFiles.map((f) => path.relative(rootDir, f.path)),
  });

  const ciRunsPlaywright = ciFiles.some((f) => f.content && /playwright/i.test(f.content));
  results.push({
    id: 'ci-runs-tests-on-pr',
    category: CATEGORY,
    label: 'CI pipeline actually invokes Playwright tests',
    weight: 2,
    pass: ciRunsPlaywright,
    why: 'A CI file existing is not the same as it running your suite — this confirms the pipeline actually calls Playwright.',
    refs: ciFiles.filter((f) => f.content && /playwright/i.test(f.content)).map((f) => path.relative(rootDir, f.path)),
  });

  const hasHtmlOrAllureReporter = /reporter\s*:\s*(\[|['"])(html|allure)/i.test(pwContent) || /['"]html['"]/.test(pwContent) || /['"]allure/i.test(pwContent);
  results.push({
    id: 'reporter-configured',
    category: CATEGORY,
    label: 'HTML or Allure reporter configured',
    weight: 2,
    pass: hasHtmlOrAllureReporter,
    why: 'Without a structured reporter, test results live only in console logs, making trend tracking and stakeholder visibility impossible.',
    refs: pwRef,
  });

  const hasParallel = /fullyParallel\s*:\s*true/.test(pwContent) || /workers\s*:/.test(pwContent);
  results.push({
    id: 'parallel-execution',
    category: CATEGORY,
    label: 'Parallel execution configured (fullyParallel / workers)',
    weight: 1,
    pass: hasParallel,
    why: 'Serial execution is the most common reason CI feedback loops are slow enough that engineers stop trusting or waiting for them.',
    refs: pwRef,
  });

  return results;
}

module.exports = { run, CATEGORY };
