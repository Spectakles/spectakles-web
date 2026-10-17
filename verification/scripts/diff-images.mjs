import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export function exactImageDiff(expectedBytes, actualBytes) {
  const expected = PNG.sync.read(expectedBytes);
  const actual = PNG.sync.read(actualBytes);
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return { pixels: Infinity, expectedSize: [expected.width, expected.height], actualSize: [actual.width, actual.height] };
  }
  const diff = new PNG({ width: expected.width, height: expected.height });
  const overlay = new PNG({ width: expected.width, height: expected.height });
  const pixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0, includeAA: true });
  let minX = expected.width, minY = expected.height, maxX = 0, maxY = 0, maxChannelDelta = 0;
  for (let offset = 0; offset < expected.data.length; offset += 4) {
    const different = [0, 1, 2, 3].some(channel => expected.data[offset + channel] !== actual.data[offset + channel]);
    for (let channel = 0; channel < 4; channel++) maxChannelDelta = Math.max(maxChannelDelta, Math.abs(expected.data[offset + channel] - actual.data[offset + channel]));
    if (different) { const index = offset / 4; const x = index % expected.width, y = Math.floor(index / expected.width); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let channel = 0; channel < 3; channel++) overlay.data[offset + channel] = Math.round((expected.data[offset + channel] + actual.data[offset + channel]) / 2);
    overlay.data[offset + 3] = 255;
  }
  return { pixels, maxChannelDelta, bounds: pixels ? { minX, minY, maxX, maxY } : null, diff: PNG.sync.write(diff), overlay: PNG.sync.write(overlay) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const [before, after, output] = process.argv.slice(2);
  const result = exactImageDiff(fs.readFileSync(before), fs.readFileSync(after));
  fs.mkdirSync(output, { recursive: true });
  if (result.diff) fs.writeFileSync(path.join(output, 'diff.png'), result.diff);
  if (result.overlay) fs.writeFileSync(path.join(output, 'overlay.png'), result.overlay);
  const { diff, overlay, ...summary } = result;
  fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}
