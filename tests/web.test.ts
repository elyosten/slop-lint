// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { mountDemo, renderHighlights, maxLength } from '../web/demo';
import { lint, loadRules } from '../src/core/index';

const yaml = readFileSync('rules/ru.yml', 'utf8') + '\n' + readFileSync('rules/en.yml', 'utf8');
const rules = loadRules(yaml);
const html = readFileSync('docs/index.html', 'utf8');
const text = () => document.querySelector<HTMLTextAreaElement>('#lint-text')!;
const language = () => document.querySelector<HTMLSelectElement>('#lint-language')!;
const findings = () => document.querySelectorAll('#lint-results li');
const summary = () => document.querySelector('#lint-summary')!.textContent;
const click = (id: string) => document.querySelector<HTMLButtonElement>(id)!.click();

function setup(mount = true): void {
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  if (mount) mountDemo(document, yaml);
}
function check(value: string): void {
  text().value = value;
  document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
}

beforeEach(() => setup());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('browser demo', () => {
  it('initializes, runs examples, and selects source offsets', () => {
    expect(summary()).toContain('Paste text');
    click('#lint-sample');
    expect(findings()).toHaveLength(2);
    document.querySelector<HTMLButtonElement>('.finding')!.click();
    expect(document.activeElement).toBe(text());
    expect(text().value.slice(text().selectionStart, text().selectionEnd)).toBe('Важно отметить, что');
  });
  it('filters languages and switches example text', () => {
    check('Важно отметить, что. It is worth noting that.');
    language().value = 'en';
    language().dispatchEvent(new Event('change'));
    expect(findings()).toHaveLength(1);
    expect(document.querySelector('.finding')!.textContent).toContain('en-002');
    click('#lint-sample');
    expect(text().value).toContain('It is important');
  });
  it('masks Markdown while preserving visible original text', () => {
    check('`Важно отметить, что`\nВажно отметить, что');
    expect(findings()).toHaveLength(1);
    expect(document.querySelector('.finding')!.textContent).toContain('2:1');
    expect(document.querySelector('#lint-preview')!.textContent).toBe(text().value);
    document.querySelector<HTMLInputElement>('#lint-markdown')!.click();
    expect(findings()).toHaveLength(2);
  });
  it('clears stale findings during typing and debounces the next check', () => {
    vi.useFakeTimers();
    click('#lint-sample');
    text().value = 'A concrete fact.';
    text().dispatchEvent(new Event('input'));
    expect(findings()).toHaveLength(0);
    expect(summary()).toBe('Checking…');
    vi.advanceTimersByTime(200);
    expect(summary()).toContain('No matches');
    click('#lint-clear');
    expect(text().value).toBe('');
    expect(summary()).toContain('Paste text');
  });
  it('rejects oversized text and recovers', () => {
    check('a'.repeat(maxLength + 1));
    expect(text().getAttribute('aria-invalid')).toBe('true');
    expect(summary()).toContain('too long');
    check('A fact.');
    expect(text().hasAttribute('aria-invalid')).toBe(false);
  });
  it('renders pasted HTML as inert text', () => {
    const input = '<img src=x onerror="alert(1)"> Важно отметить, что <script>alert(1)</script>';
    check(input);
    const preview = document.querySelector<HTMLElement>('#lint-preview')!;
    expect(preview.querySelector('img,script')).toBeNull();
    expect(preview.textContent).toBe(input);
    expect(preview.querySelectorAll('mark')).toHaveLength(1);
  });
  it('preserves text for overlapping findings', () => {
    const input = 'Важно отметить, что';
    const matches = lint(input, [rules[0]!]);
    const target = document.createElement('div');
    renderHighlights(target, input, [...matches, ...matches]);
    expect(target.textContent).toBe(input);
    expect(target.querySelectorAll('mark')).toHaveLength(1);
  });
  it('runs the actual built bundle with networking disabled', () => {
    setup(false);
    const network = vi.fn(() => { throw new Error('Offline'); });
    vi.stubGlobal('fetch', network);
    vi.stubGlobal('XMLHttpRequest', network);
    vi.stubGlobal('WebSocket', network);
    const asset = /src="\.\/(assets\/app-[A-Z0-9]+\.js)"/.exec(readFileSync('site/index.html', 'utf8'))![1];
    window.eval(readFileSync(`site/${asset}`, 'utf8'));
    click('#lint-sample');
    expect(findings()).toHaveLength(2);
    check('Важно отметить, что текст изменился.');
    expect(findings()).toHaveLength(1);
    expect(network).not.toHaveBeenCalled();
  });
  it('preserves Google verification in the built site', () => {
    expect(readFileSync('site/google55d350cd77334786.html', 'utf8'))
      .toBe(readFileSync('docs/google55d350cd77334786.html', 'utf8'));
    expect(readFileSync('site/index.html', 'utf8')).toContain('qsD_8RywlCTfUsVTmS9OKHhYhLbn4EH9sMDFHAySSdU');
  });
});
