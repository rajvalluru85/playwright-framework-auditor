const path = require('path');

const CATEGORY = 'Locator Strategy';

function relLine(filePath, root, content, index) {
  const lineNum = content.slice(0, index).split('\n').length;
  return `${path.relative(root, filePath)}:${lineNum}`;
}

function findAll(content, filePath, root, regex) {
  const hits = [];
  let m;
  const re = new RegExp(regex);
  while ((m = re.exec(content)) !== null) {
    hits.push(relLine(filePath, root, content, m.index));
  }
  return hits;
}

function run(repo) {
  const results = [];
  const { specFiles, rootDir } = repo;

  const waitForTimeoutHits = [];
  const userFacingHits = [];
  const brittleSelectorHits = [];
  const testIdHits = [];

  for (const spec of specFiles) {
    if (!spec.content) continue;
    waitForTimeoutHits.push(
      ...findAll(spec.content, spec.path, rootDir, /\.waitForTimeout\s*\(/g)
    );
    userFacingHits.push(
      ...findAll(
        spec.content,
        spec.path,
        rootDir,
        /\.(getByRole|getByLabel|getByText|getByPlaceholder)\s*\(/g
      )
    );
    testIdHits.push(...findAll(spec.content, spec.path, rootDir, /\.getByTestId\s*\(/g));
    // brittle: raw CSS/XPath via page.locator('div > span') or page.$('xpath=...')
    brittleSelectorHits.push(
      ...findAll(spec.content, spec.path, rootDir, /\.locator\s*\(\s*['"](?:\/\/|\.|#)/g)
    );
  }

  results.push({
    id: 'no-hard-waits',
    category: CATEGORY,
    label: 'No hard-coded waitForTimeout() calls',
    weight: 3,
    pass: waitForTimeoutHits.length === 0,
    why: 'Hard sleeps are the single biggest cause of flaky and slow suites — Playwright\'s auto-waiting makes them unnecessary almost everywhere.',
    refs: waitForTimeoutHits,
    count: waitForTimeoutHits.length,
  });

  const totalLocatorCalls = userFacingHits.length + brittleSelectorHits.length + testIdHits.length;
  const userFacingRatio = totalLocatorCalls > 0 ? userFacingHits.length / totalLocatorCalls : 1;
  results.push({
    id: 'user-facing-locators',
    category: CATEGORY,
    label: 'Majority of locators are user-facing (role/label/text)',
    weight: 2,
    pass: totalLocatorCalls === 0 || userFacingRatio >= 0.5,
    why: 'getByRole/getByLabel/getByText locators track accessibility and intent, so they survive UI refactors that break CSS/XPath selectors.',
    refs: userFacingHits.slice(0, 5),
    count: userFacingHits.length,
    detail: `${userFacingHits.length} user-facing vs ${brittleSelectorHits.length} brittle selector calls found`,
  });

  results.push({
    id: 'brittle-selectors',
    category: CATEGORY,
    label: 'Low use of brittle CSS/XPath selectors',
    weight: 2,
    pass: brittleSelectorHits.length === 0 || userFacingRatio >= 0.5,
    why: 'CSS/XPath chains break silently on markup changes and are the top cause of test maintenance burden.',
    refs: brittleSelectorHits,
    count: brittleSelectorHits.length,
  });

  // Locators abstracted into page objects vs inline in specs
  const inlineLocatorDensity = specFiles.length
    ? totalLocatorCalls / specFiles.length
    : 0;
  results.push({
    id: 'locators-abstracted',
    category: CATEGORY,
    label: 'Locators abstracted into page objects, not inline in specs',
    weight: 2,
    pass: inlineLocatorDensity < 5,
    why: 'When locators live directly in test specs instead of page objects, a single UI change requires updating every test file instead of one class.',
    refs: [],
    detail: `~${inlineLocatorDensity.toFixed(1)} raw locator calls per spec file (lower is better; page-object-based suites are typically under 5)`,
  });

  return results;
}

module.exports = { run, CATEGORY };
