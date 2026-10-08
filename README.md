# Playwright Framework Auditor

Scans an existing Playwright test suite and scores it against the guardrails a
production-grade framework should have: type safety, locator strategy,
architecture, resilience, and CI/reporting.

Built from 13+ years auditing QA frameworks in regulated banking and
card-payment environments — this is the same checklist applied by hand,
automated.

## Usage

```bash
npx playwright-framework-auditor ./path/to/your/repo
```

Point it at the root of any repo containing Playwright `.spec.ts` / `.test.ts`
files. It runs entirely locally — nothing is uploaded, nothing leaves your
machine.

### Free report

```bash
npx playwright-framework-auditor .
```

Gives you:
- Overall score (0–100) and letter grade
- Category breakdown (5 categories, 19 checks)
- Your top 3 highest-impact issues

### Full report

```bash
npx playwright-framework-auditor . --full
```

Gives you everything in the free report, plus:
- Every check's pass/fail status with exact file + line references
- The "why it matters" reasoning behind each failed check
- A prioritized fix order (what to fix first for the biggest score jump)

### Export raw results

```bash
npx playwright-framework-auditor . --json report.json
```

Writes the full structured result (all checks, all refs) to a JSON file —
useful for tracking score history over time or feeding into your own CI gate.

## What it checks

| Category | Examples |
|---|---|
| Type Safety & Config | `strict: true`, no `@ts-ignore` in specs |
| Locator Strategy | no hard-coded `waitForTimeout()`, user-facing locators over brittle CSS/XPath, locators abstracted into page objects |
| Architecture | page-object structure, fixtures over duplicated setup, dedicated test-data layer |
| Resilience | retries configured, explicit timeouts, failure artifacts (screenshot/video/trace) |
| CI & Reporting | CI pipeline present and actually running tests, structured reporter, parallel execution |

## How scoring works

Each check has a weight (1–3) reflecting how much it matters — guardrails
that prevent flakiness or maintenance pain (retries, hard waits, page
objects) are weighted higher than nice-to-haves (parallel execution).
The overall score is the percentage of total weight your repo earns.

## Roadmap

- [ ] Hosted score history (opt-in — local-first by default)
- [ ] GitHub Action to post the score as a PR comment
- [ ] Additional checks: visual regression setup, API-first test patterns
- [ ] Team/corporate audit mode (scan multiple repos, aggregate report)

## License

MIT
