import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeNext } from './safe-redirect';

test('same-site paths are allowed', () => {
  assert.equal(safeNext('/workspace'), '/workspace');
  assert.equal(safeNext('/workspace?tab=history'), '/workspace?tab=history');
});

test('anything that could leave the site falls back', () => {
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', '', undefined, null, ['/workspace']]) {
    assert.equal(safeNext(bad), '/workspace', `should reject ${JSON.stringify(bad)}`);
  }
});
