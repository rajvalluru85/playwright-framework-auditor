const path = require('path');

const CATEGORY = 'Resilience';

function run(repo) {
  const results = [];
  const { playwrightConfig, rootDir } = repo;
  const content = playwrightConfig?.content || '';
  const ref = playwrightConfig ? [path.relative(rootDir, playwrightConfig.path)] : [];

  const retriesMatch = /retries\s*:\s*([^\n,}]+)/.exec(content);
  const hasRetries = !!retriesMatch && !/\b0\b/.test(retriesMatch[1].trim()) ;
  results.push({
    id: 'retries-configured',
    category: CATEGORY,
    label: 'Retries configured for CI (retries > 0)',
    weight: 3,
    pass: hasRetries,
    why: 'Retries distinguish a genuine defect from environmental flakiness and prevent a single flaky run from blocking a release.',
    refs: ref,
  });

  const hasActionTimeout = /actionTimeout\s*:/.test(content);
  const hasNavTimeout = /navigationTimeout\s*:/.test(content);
  results.push({
    id: 'explicit-timeouts',
    category: CATEGORY,
    label: 'Explicit actionTimeout / navigationTimeout set',
    weight: 2,
    pass: hasActionTimeout || hasNavTimeout,
    why: 'Explicit timeouts (vs. framework defaults) give you predictable, intentional failure behavior instead of surprises under CI load.',
    refs: ref,
  });

  const hasScreenshot = /screenshot\s*:\s*['"]/.test(content);
  const hasVideo = /video\s*:\s*['"]/.test(content);
  const hasTrace = /trace\s*:\s*['"]/.test(content);
  results.push({
    id: 'failure-artifacts',
    category: CATEGORY,
    label: 'Screenshot / video / trace captured on failure',
    weight: 3,
    pass: hasScreenshot || hasVideo || hasTrace,
    why: 'Without failure artifacts, every flaky or failing test in CI requires reproducing the issue locally from scratch.',
    refs: ref,
    detail: `screenshot:${hasScreenshot} video:${hasVideo} trace:${hasTrace}`,
  });

  return results;
}

module.exports = { run, CATEGORY };
