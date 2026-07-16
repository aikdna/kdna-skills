import assert from 'node:assert/strict';
import test from 'node:test';
import { findCurrentNameResiduals } from '../../scripts/check-current-names.mjs';

test('current-name scanner rejects exact legacy and generation-style names', async (t) => {
  const hostile = [
    ['old profile', ['judgment-profile', '-v1'].join('')],
    ['old route', ['/v1', '/project'].join('')],
    ['old test path', ['mcp-', 'v1.test.mjs'].join('')],
    ['old capsule', ['kdna.context', '.capsule'].join('')],
    ['old manifest field', ['"kdna_', 'version"'].join('')],
    ['generation label', ['runtime-', 'v2'].join('')],
    ['bare generation label', ['V', '1'].join('')],
    ['camel generation label', ['runtime', 'V', '2'].join('')],
    ['spaced generation label', ['Runtime ', 'V', '3'].join(''), ['V', '3'].join('')],
    ['underscore generation label', ['thing_', 'v4'].join('')],
    ['zero bare generation label', ['V', '0'].join('')],
    ['zero camel generation label', ['runtime', 'V', '0'].join('')],
    ['zero suffix generation label', ['runtime-', 'v0'].join('')],
  ];
  for (const [name, token, observed = token] of hostile) {
    await t.test(name, () => {
      assert.deepEqual(findCurrentNameResiduals([{ path: 'hostile.txt', text: token }]), [
        { path: 'hostile.txt', token: observed },
      ]);
    });
  }
});

test('current-name scanner permits natural semantic versions and mandated MCP protocol versions', () => {
  assert.deepEqual(
    findCurrentNameResiduals([{
      path: 'current.txt',
      text: 'package 0.19.0, tag v0.4.2, protocolVersion 2024-11-05',
    }]),
    [],
  );
});
