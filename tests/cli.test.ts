import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const folder = mkdtempSync(join(tmpdir(), 'slop-lint-'));
const cli = resolve('dist/cli/index.js');
const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: tmpdir() });
beforeAll(() => {
  writeFileSync(join(folder, 'bad.md'), 'Intro.\nВажно отметить, что тест работает.\n');
  writeFileSync(join(folder, 'clean.txt'), 'Сборка занимает 10 секунд.');
  mkdirSync(join(folder, 'node_modules'));
  writeFileSync(join(folder, 'node_modules', 'ignored.md'), 'Важно отметить, что');
});
afterAll(() => rmSync(folder, { recursive: true, force: true }));
describe('built CLI outside project directory', () => {
  it('reports JSON, positions and strict status', () => {
    const result = run('--format', 'json', '--lang', 'ru', '--strict', join(folder, 'bad.md'));
    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)[0]).toMatchObject({ ruleId: 'ru-001', line: 2, column: 1 });
  });
  it('recurses, deduplicates and skips dependencies', () => {
    const result = run('--format', 'json', folder, join(folder, 'bad.md'));
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveLength(1);
  });
  it('returns 0 for clean text with strict mode', () => expect(run('--strict', join(folder, 'clean.txt')).status).toBe(0));
  it('reports operational errors with exit code 2', () => {
    expect(run('--format', 'xml', folder).status).toBe(2);
    expect(run(join(folder, 'missing.md')).status).toBe(2);
    expect(run().status).toBe(2);
  });
  it('supports custom packs', () => {
    const custom = join(folder, 'custom.yml');
    writeFileSync(custom, JSON.stringify([{ id: 'en-custom', lang: 'en', type: 'phrase', pattern: 'Intro', severity: 'error', message: 'Specific opening needed', suggest: 'Start with the fact', tags: [], examples: { bad: 'Intro', good: 'Fact' } }]));
    const result = run('--rules', custom, '--format', 'json', join(folder, 'bad.md'));
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)[0].ruleId).toBe('en-custom');
  });
  it('shows help', () => expect(run('--help').stdout).toContain('Usage:'));
});
