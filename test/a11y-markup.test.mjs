import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readRepoFile = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('index.html exposes a skip link that targets the main landmark', async () => {
  const html = await readRepoFile('index.html');
  const skipLink = html.match(/<a class="skip-link" href="#([\w-]+)">/);
  assert.ok(skipLink, 'expected a <a class="skip-link" href="#..."> element');

  const targetId = skipLink[1];
  const mainLandmark = new RegExp(`<main id="${targetId}"`);
  assert.match(html, mainLandmark, `skip link target #${targetId} must match a <main> landmark id`);
});

test('renderList marks the selected stage with aria-current for assistive tech', async () => {
  const source = await readRepoFile('js/main.js');
  assert.match(
    source,
    /aria-current="\$\{item\.id === state\.ui\.selectedId \? 'true' : 'false'\}"/,
    'stage list buttons must expose selection state via aria-current, not color alone',
  );
});
