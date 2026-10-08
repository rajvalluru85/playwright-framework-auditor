const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const IGNORE = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'];

async function findFile(rootDir, patterns) {
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: rootDir, ignore: IGNORE, nodir: true });
    if (matches.length > 0) return path.join(rootDir, matches[0]);
  }
  return null;
}

async function findFiles(rootDir, patterns) {
  const all = new Set();
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: rootDir, ignore: IGNORE, nodir: true });
    matches.forEach((m) => all.add(path.join(rootDir, m)));
  }
  return Array.from(all);
}

function readSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function scanRepo(rootDir) {
  const absRoot = path.resolve(rootDir);
  if (!fs.existsSync(absRoot)) {
    throw new Error(`Path not found: ${absRoot}`);
  }

  const tsconfigPath = await findFile(absRoot, ['tsconfig.json', '**/tsconfig.json']);
  const playwrightConfigPath = await findFile(absRoot, [
    'playwright.config.ts',
    'playwright.config.js',
    '**/playwright.config.ts',
    '**/playwright.config.js',
  ]);
  const specFiles = await findFiles(absRoot, [
    '**/*.spec.ts',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.test.js',
  ]);
  const ciFiles = await findFiles(absRoot, [
    '.github/workflows/*.yml',
    '.github/workflows/*.yaml',
    '.gitlab-ci.yml',
    'azure-pipelines.yml',
  ]);
  const dirs = await glob('**/', { cwd: absRoot, ignore: IGNORE });

  return {
    rootDir: absRoot,
    tsconfig: tsconfigPath ? { path: tsconfigPath, content: readSafe(tsconfigPath) } : null,
    playwrightConfig: playwrightConfigPath
      ? { path: playwrightConfigPath, content: readSafe(playwrightConfigPath) }
      : null,
    specFiles: specFiles.map((f) => ({ path: f, content: readSafe(f) })),
    ciFiles: ciFiles.map((f) => ({ path: f, content: readSafe(f) })),
    dirNames: dirs,
  };
}

module.exports = { scanRepo, findFile, findFiles, readSafe };
