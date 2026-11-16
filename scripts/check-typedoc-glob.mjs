import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { glob } from '../node_modules/typedoc/dist/node-utils.js';

test('TypeDoc traverses partial paths with the pinned Minimatch API', () => {
  const root = mkdtempSync(join(tmpdir(), 'typedoc-glob-'));
  try {
    for (const file of ['src/one/index.ts', 'src/two/index.ts', 'src/two/nested/extra.ts', 'src/two/other.js', 'unrelated/index.ts', 'node_modules/vendor/index.ts']) {
      const path = join(root, file);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, 'export {};\n');
    }
    const paths = (pattern) => glob(join(root, pattern), root).map((path) => relative(root, path)).sort();
    assert.deepEqual(paths('src/{one,two}/index.ts'), ['src/one/index.ts', 'src/two/index.ts']);
    assert.deepEqual(paths('src/**/*.ts'), ['src/one/index.ts', 'src/two/index.ts', 'src/two/nested/extra.ts']);
    assert.deepEqual(paths('src/missing/*.ts'), []);
    assert.deepEqual(paths('**/*.ts'), ['src/one/index.ts', 'src/two/index.ts', 'src/two/nested/extra.ts', 'unrelated/index.ts']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
