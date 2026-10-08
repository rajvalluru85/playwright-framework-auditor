const path = require('path');

const CATEGORY = 'Type Safety & Config';

function relLine(filePath, root, content, index) {
  const lineNum = content.slice(0, index).split('\n').length;
  return `${path.relative(root, filePath)}:${lineNum}`;
}

function run(repo) {
  const results = [];
  const { tsconfig, specFiles, rootDir } = repo;

  // Check 1: tsconfig exists at all
  results.push({
    id: 'ts-config-exists',
    category: CATEGORY,
    label: 'tsconfig.json present',
    weight: 2,
    pass: !!tsconfig,
    why: 'TypeScript config is the foundation every other type-safety check depends on.',
    refs: tsconfig ? [path.relative(rootDir, tsconfig.path)] : [],
  });

  const tsContent = tsconfig?.content || '';
  let parsed = null;
  try {
    // tsconfig.json often has comments; strip them crudely for parsing
    const stripped = tsContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    parsed = JSON.parse(stripped);
  } catch {
    parsed = null;
  }
  const compilerOpts = parsed?.compilerOptions || {};

  results.push({
    id: 'ts-strict',
    category: CATEGORY,
    label: '"strict": true enabled',
    weight: 3,
    pass: compilerOpts.strict === true,
    why: 'Strict mode catches null/undefined errors and enforces solid parameter contracts across page objects and fixtures.',
    refs: tsconfig ? [path.relative(rootDir, tsconfig.path)] : [],
  });

  results.push({
    id: 'ts-no-implicit-any',
    category: CATEGORY,
    label: 'noImplicitAny set (or implied by strict)',
    weight: 1,
    pass: compilerOpts.strict === true || compilerOpts.noImplicitAny === true,
    why: 'Prevents untyped values from silently leaking through test utilities and page objects.',
    refs: tsconfig ? [path.relative(rootDir, tsconfig.path)] : [],
  });

  // Check: @ts-ignore usage across spec files
  const tsIgnoreHits = [];
  for (const spec of specFiles) {
    if (!spec.content) continue;
    const regex = /@ts-ignore|@ts-nocheck/g;
    let m;
    while ((m = regex.exec(spec.content)) !== null) {
      tsIgnoreHits.push(relLine(spec.path, rootDir, spec.content, m.index));
    }
  }
  results.push({
    id: 'ts-ignore-usage',
    category: CATEGORY,
    label: 'No @ts-ignore / @ts-nocheck in test files',
    weight: 2,
    pass: tsIgnoreHits.length === 0,
    why: 'Suppressing the type checker in test files hides the exact bugs strict mode exists to catch.',
    refs: tsIgnoreHits,
    count: tsIgnoreHits.length,
  });

  return results;
}

module.exports = { run, CATEGORY };
