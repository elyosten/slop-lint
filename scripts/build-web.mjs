import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, readdir, unlink } from 'node:fs/promises';

// Only publish this explicit list; never include scratch files from docs/.
await mkdir('site/assets', { recursive: true });
for (const file of ['.nojekyll', 'google55d350cd77334786.html']) {
  await copyFile(`docs/${file}`, `site/${file}`);
}
const result = await build({
  entryPoints: ['web/main.ts'], outdir: 'site/assets', entryNames: 'app-[hash]',
  bundle: true, minify: true, platform: 'browser', format: 'iife',
  target: ['chrome90', 'firefox90', 'safari16.4'],
  loader: { '.yml': 'text' }, metafile: true, logLevel: 'info',
});
const script = Object.keys(result.metafile.outputs).find(path => path.endsWith('.js'));
if (!script) throw new Error('Browser bundle was not produced');
for (const name of await readdir('site/assets')) {
  if (/^app-[A-Z0-9]+\.js$/.test(name) && !script.endsWith(`/${name}`)) {
    await unlink(`site/assets/${name}`);
  }
}
const html = await readFile('docs/index.html', 'utf8');
if (!html.includes('<!-- browser-bundle -->')) throw new Error('Missing browser bundle placeholder');
await writeFile('site/index.html', html.replace('<!-- browser-bundle -->',
  `<script defer src="./${script.replace('site/', '')}"></script>`));
