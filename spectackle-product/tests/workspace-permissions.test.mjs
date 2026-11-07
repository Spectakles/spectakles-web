import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { StaticRouter } = require('react-router-dom');
const root = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
// Compile the actual TSX modules for a DOM-free render check. CSS is irrelevant
// to this permission test. Firebase functions are imported but never invoked.
function sourceModule(path) {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} }; cache.set(path, module);
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { fileName: path, compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const localRequire = specifier => {
    if (specifier.endsWith('.css')) return {};
    if (!specifier.startsWith('.')) return require(specifier);
    const base = resolve(dirname(path), specifier);
    const file = [base + '.ts', base + '.tsx'].find(value => { try { readFileSync(value); return true; } catch { return false; } });
    if (!file) throw new Error(`Cannot resolve ${specifier}`);
    return sourceModule(file);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

test('organization form requires an explicit server permission', () => {
  const { default: Workspace } = sourceModule(resolve(root, 'src/pages/Workspace.tsx'));
  const { Context } = sourceModule(resolve(root, 'src/platform/context.ts'));
  const fixture = { ready: true, error: '', status: { enabled: true, emulator: true }, auth: null, user: { uid: 'test-user', email: 'student@spectakles.test' }, selected: null, select() {}, token: async () => undefined, request: async () => { throw new Error('Unexpected request during render'); }, reload: async () => {} };
  for (const [label, profile, expected] of [
    ['student', { organizations: [{ id: 'alpha', role: 'student' }], permissions: { can_create_organization: false } }, false],
    ['unaffiliated account', { organizations: [], permissions: { can_create_organization: false } }, false],
    ['organization owner without platform permission', { organizations: [{ id: 'alpha', role: 'owner' }] }, false],
    ['older backend response', { organizations: [] }, false],
    ['profile loading', null, false],
    ['authorized provisioning account', { organizations: [], permissions: { can_create_organization: true } }, true],
  ]) {
    const html = renderToStaticMarkup(createElement(StaticRouter, { location: '/workspace' }, createElement(Context.Provider, { value: { ...fixture, profile: profile && { ...profile, user: { uid: 'test-user', name: 'Test participant' } } } }, createElement(Workspace))));
    assert.equal(html.includes('<h2>Create an organization</h2>'), expected, label);
    assert.equal(html.includes('>Create organization</button>'), expected, label);
  }
});


test('institution portal admits staff roles and keeps learner accounts out', () => {
  const { Context } = sourceModule(resolve(root, 'src/platform/context.ts'));
  const { default: InstitutionAdmin } = sourceModule(resolve(root, 'src/pages/InstitutionAdmin.tsx'));
  for (const role of ['student', 'trainer', 'admin', 'owner']) {
    const profile = { user: { uid: 'test-user', name: 'Test participant' }, organizations: [{ id: 'alpha', name: 'Alpha Academy', role }], permissions: { can_create_organization: false } };
    const html = renderToStaticMarkup(createElement(StaticRouter, { location: '/admin' }, createElement(Context.Provider, { value: { ready: true, user: { uid: 'test-user' }, status: { enabled: true }, profile, request: async () => {} } }, createElement(InstitutionAdmin))));
    assert.equal(html.includes('Create an assignment'), role !== 'student', role);
    assert.equal(html.includes('Staff access required'), role === 'student', role);
    assert.equal(html.includes('Loading institution data…'), role !== 'student', role);
  }
});


test('report coaching actions follow actual server availability', () => {
  const { CoachingAction } = sourceModule(resolve(root, 'src/pages/SessionReport.tsx'));
  for (const enabled of [false, true]) {
    const html = renderToStaticMarkup(createElement(CoachingAction, { enabled, disabled: false, onGenerate() {} }));
    assert.equal(html.includes('Generate coaching feedback</button>'), enabled);
    assert.equal(html.includes('being set up'), !enabled);
    assert.equal(html.includes('provider call'), false);
  }
});
