const typeSafety = require('./checks/typeSafety');
const locators = require('./checks/locators');
const architecture = require('./checks/architecture');
const resilience = require('./checks/resilience');
const ciReporting = require('./checks/ciReporting');

const CHECK_MODULES = [typeSafety, locators, architecture, resilience, ciReporting];

function gradeFor(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function evaluate(repo) {
  const allResults = CHECK_MODULES.flatMap((mod) => mod.run(repo));

  const totalWeight = allResults.reduce((sum, r) => sum + r.weight, 0);
  const earnedWeight = allResults.reduce((sum, r) => sum + (r.pass ? r.weight : 0), 0);
  const overallPct = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  const byCategory = {};
  for (const r of allResults) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { earned: 0, total: 0, results: [] };
    }
    byCategory[r.category].total += r.weight;
    byCategory[r.category].earned += r.pass ? r.weight : 0;
    byCategory[r.category].results.push(r);
  }

  const categorySummaries = Object.entries(byCategory).map(([name, data]) => ({
    name,
    pct: data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0,
    results: data.results,
  }));

  const failedChecks = allResults.filter((r) => !r.pass);
  // Prioritize by weight desc, then by issue count desc, for "fix this first" ordering
  const prioritized = [...failedChecks].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return (b.count || 0) - (a.count || 0);
  });

  return {
    rootDir: repo.rootDir,
    overallScore: overallPct,
    grade: gradeFor(overallPct),
    categories: categorySummaries,
    allResults,
    failedChecks,
    prioritizedFixes: prioritized,
  };
}

module.exports = { evaluate, gradeFor, CHECK_MODULES };
