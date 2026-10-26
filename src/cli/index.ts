#!/usr/bin/env node
import { readFile, readdir, lstat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { lint, loadRules, type Finding } from '../core/index';
import { maskMarkdown } from '../markdown/index';

const extensions = new Set(['.md', '.markdown', '.mdx', '.txt']);
const excluded = new Set(['.git', 'node_modules', 'dist', 'coverage']);
async function collect(path: string, explicit = true): Promise<string[]> {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) return [];
  if (stat.isFile()) return explicit || extensions.has(extname(path).toLowerCase()) ? [resolve(path)] : [];
  if (!stat.isDirectory()) return [];
  const files: string[] = [];
  for (const entry of (await readdir(path)).sort()) {
    if (!excluded.has(entry)) files.push(...await collect(join(path, entry), false));
  }
  return files;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    lang: { type: 'string', default: 'all' }, format: { type: 'string', default: 'text' },
    strict: { type: 'boolean', default: false }, rules: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log('Usage: slop-lint [--lang ru|en|all] [--format text|json] [--strict] [--rules pack.yml] <files or directories...>');
    return;
  }
  if (!['ru', 'en', 'all'].includes(values.lang!)) throw new Error('--lang must be ru, en, or all');
  if (!['text', 'json'].includes(values.format!)) throw new Error('--format must be text or json');
  if (!positionals.length) throw new Error('Provide a file or directory. Use --help for usage.');
  const packPaths = values.rules ? [resolve(values.rules)] : ['ru', 'en'].map(lang =>
    fileURLToPath(new URL(`../../rules/${lang}.yml`, import.meta.url)));
  const rules = loadRules((await Promise.all(packPaths.map(path => readFile(path, 'utf8')))).join('\n'))
    .filter(rule => values.lang === 'all' || rule.lang === values.lang);
  const files = [...new Set((await Promise.all(positionals.map(path => collect(path)))).flat())].sort();
  if (!files.length) throw new Error('No supported files found. Expected Markdown or .txt files.');
  const results: (Finding & { file: string })[] = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const input = extname(file).toLowerCase() === '.txt' ? text : maskMarkdown(text);
    results.push(...lint(input, rules).map(finding => ({ file, ...finding })));
  }
  if (values.format === 'json') console.log(JSON.stringify(results, null, 2));
  else {
    const color = process.stdout.isTTY && !process.env.NO_COLOR;
    for (const item of results) {
      const level = color ? `\u001b[33m${item.severity}\u001b[0m` : item.severity;
      console.log(`${item.file}:${item.line}:${item.column}  ${level}  ${item.message}  (${item.ruleId})\n  ${item.suggest}`);
    }
    console.log(`${results.length} finding(s) in ${files.length} file(s).`);
  }
  if (values.strict && results.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`slop-lint: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
});
