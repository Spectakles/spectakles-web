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
// Render the actual room component without microphone, network or providers.
function sourceModule(path) {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} }; cache.set(path, module);
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const localRequire = specifier => {
    if (specifier.endsWith('.css')) return {};
    if (specifier.endsWith('.svg')) return { default: '/test-logo.svg' };
    if (!specifier.startsWith('.')) return require(specifier);
    const base = resolve(dirname(path), specifier);
    const file = [base + '.ts', base + '.tsx'].find(value => { try { readFileSync(value); return true; } catch { return false; } });
    if (!file) throw new Error(`Cannot resolve ${specifier}`);
    return sourceModule(file);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}


const { default: DiscussionRoom } = sourceModule(resolve(root, 'src/gd-room/DiscussionRoom.tsx'));
const { isSpeaking } = sourceModule(resolve(root, 'src/gd-room/room-model.ts'));
const participants = [
  { id: 'arjun', name: 'Arjun', role: 'Analyst', color: 'lavender' },
  { id: 'sahil', name: 'Sahil', role: 'Problem solver', color: 'peach' },
  { id: 'user', name: 'Jay', role: 'You', color: 'yellow' },
];
function fixture(phase = 'idle', patch = {}) {
  return { participants, topic: 'AI: boon or bane', status: 'online', clock: '12:00', preparationSeconds: 120, durationSeconds: 720,
    state: { phase, owner: 'arjun', providers: {}, transcript: [], allow_preparation_skip: true, end_reason: '', notice: '' },
    microphone: { snapshot: { phase: 'idle', speaking: false, rms: 0 }, selectedDeviceId: '', permission: { busy: false, error: '' }, deviceList: { devices: [], error: '', loading: false } },
    live: { phase: 'listening', playback: { phase: 'ready', played: 0 }, sessionUrl: '', message: '' },
    captionsOn: false, captionStatus: '', humanCaption: '', notes: '', canStart: true,
    onNotes() {}, onCaptions() {}, onStart() {}, onReady() {}, onEnd() {}, onLeave() {}, ...patch,
  };
}
function render(props) { return renderToStaticMarkup(createElement(DiscussionRoom, props)); }
test('product room has captions, notes and audio settings without developer diagnostics', () => {
  const html = render(fixture());
  for (const label of ['Audio settings', 'Turn captions on', 'Open private notes', 'Begin preparation', 'Show 3 participants']) assert.ok(html.includes(label), label);
  assert.doesNotMatch(html, /Developer controls|Apply time|Time remaining \(mm:ss\)|Skip preparation \(next round\)|Audio test details|utterance-0001/);
  assert.doesNotMatch(html, />Mute<|>Unmute<|>Share screen<|>Camera</);
});
test('preparation exposes private notes and permits skipping only when policy allows it', () => {
  const props = fixture('preparing');
  assert.match(render(props), /id="meet-private-notes"/);
  assert.equal((render(props).match(/>Start discussion /g) || []).length, 1);
  assert.doesNotMatch(render(props), /I’m ready|meet-prep-ready|meet-prep-footer/);
  assert.doesNotMatch(render({ ...props, state: { ...props.state, allow_preparation_skip: false } }), />Start discussion /);
});
test('bot speaking highlight follows played audio and clears outside the discussion', () => {
  const props = fixture('discussion'); const person = participants[0];
  assert.equal(isSpeaking(person, props.microphone.snapshot, props.live, props.state), false);
  const live = { phase: 'replying', playback: { phase: 'playing', played: 100 } };
  assert.equal(isSpeaking(person, props.microphone.snapshot, live, props.state), true);
  assert.equal(isSpeaking(person, props.microphone.snapshot, { ...live, playback: { ...live.playback, played: 0 } }, props.state), false);
  assert.equal(isSpeaking(person, props.microphone.snapshot, live, { ...props.state, phase: 'ended' }), false);
  assert.equal(isSpeaking(person, props.microphone.snapshot, live, { ...props.state, owner: 'sahil' }), false);
});
test('captions stay optional and escape participant speech as text', () => {
  const props = fixture('discussion');
  props.state.transcript = [{ speaker: 'arjun', text: '<script>unsafe</script>' }];
  assert.doesNotMatch(render(props), /unsafe/);
  const html = render({ ...props, captionsOn: true });
  assert.match(html, /aria-label="Discussion captions"/);
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>unsafe/);
});
test('room renders every supported panel size and disables mid-round device changes', () => {
  for (const count of [2, 3, 5]) {
    const props = fixture('discussion', { participants: [...Array.from({ length: count }, (_, i) => ({ id: `bot${i}`, name: `Bot ${i}`, role: 'AI participant', color: 'mint' })), participants[2]] });
    const html = render(props);
    assert.equal((html.match(/<article /g) || []).length, count + 1);
    assert.match(html, /<select id="meet-microphone" disabled=""/);
  }
});
test('finished and error states offer a fresh round with no fabricated evaluation', () => {
  for (const phase of ['ended', 'error']) {
    const html = render(fixture(phase));
    assert.equal((html.match(/>New discussion /g) || []).length, 1);
    assert.match(html, /Back to workspace/);
    assert.doesNotMatch(html, /overall score|fluency score|evaluation complete/i);
  }
});

test('curated AI portraits preserve explicit AI labels and unknown participants use initials', () => {
  const html = render(fixture());
  assert.match(html, /src="\/gd-avatars\/arjun-v3.jpg"/);
  assert.match(html, /src="\/gd-avatars\/sahil-v3.jpg"/);
  assert.doesNotMatch(html, /src="\/gd-avatars\/user/);
  assert.ok(html.includes('AI'));
  const unknown = render(fixture('idle', { participants: [{ id: 'new-person', name: 'New participant', role: 'Analyst', color: 'mint' }] }));
  assert.doesNotMatch(unknown, /meet-portrait/);
  assert.ok(unknown.includes('NP'));
});
