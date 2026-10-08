const path = require('path');

const CATEGORY = 'Architecture';

function run(repo) {
  const results = [];
  const { dirNames, specFiles, rootDir } = repo;

  const dirSet = dirNames.map((d) => d.toLowerCase());
  const hasDir = (name) => dirSet.some((d) => d.includes(name));

  results.push({
    id: 'page-object-structure',
    category: CATEGORY,
    label: 'Page Object folder structure present (pages/, core/, etc.)',
    weight: 3,
    pass: hasDir('page') || hasDir('core'),
    why: 'A dedicated page-object layer means UI changes require one update instead of edits scattered across every test file.',
    refs: dirNames.filter((d) => d.toLowerCase().includes('page') || d.toLowerCase().includes('core')),
  });

  results.push({
    id: 'fixtures-present',
    category: CATEGORY,
    label: 'Custom fixtures used for setup (not duplicated per-file)',
    weight: 3,
    pass: hasDir('fixture'),
    why: 'Fixtures centralize setup/teardown and auth state, preventing the same login/setup code from being copy-pasted across dozens of spec files.',
    refs: dirNames.filter((d) => d.toLowerCase().includes('fixture')),
  });

  results.push({
    id: 'data-layer',
    category: CATEGORY,
    label: 'Dedicated test-data layer (data/ or similar)',
    weight: 1,
    pass: hasDir('data') || hasDir('fixtures'),
    why: 'Centralized test data factories avoid hard-coded values scattered through specs, which is a common source of flaky, environment-coupled tests.',
    refs: dirNames.filter((d) => d.toLowerCase().includes('data')),
  });

  // Detect duplicated login/setup blocks across spec files as a DRY proxy
  const loginPatterns = specFiles
    .map((s) => (s.content && /page\.goto\(.*login/i.test(s.content) ? s.path : null))
    .filter(Boolean);
  const usesBeforeEachOrFixture = specFiles.some(
    (s) => s.content && (/beforeEach/.test(s.content) || /test\.use\(/.test(s.content) || /test\.extend/.test(s.content))
  );
  results.push({
    id: 'setup-not-duplicated',
    category: CATEGORY,
    label: 'Setup logic not repeated inline across every spec',
    weight: 2,
    pass: loginPatterns.length <= 1 || usesBeforeEachOrFixture,
    why: 'Repeating login/navigation setup in every spec file instead of a fixture or beforeEach is a direct DRY violation that multiplies maintenance cost.',
    refs: loginPatterns.map((p) => path.relative(rootDir, p)),
    count: loginPatterns.length,
  });

  return results;
}

module.exports = { run, CATEGORY };
