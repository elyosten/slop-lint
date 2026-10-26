import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { lint, loadRules, type Rule } from '../src/core/index';
import { maskMarkdown } from '../src/markdown/index';

const rules = loadRules(readFileSync('rules/ru.yml', 'utf8') + '\n' + readFileSync('rules/en.yml', 'utf8'));
const base = rules[0]!;
const pack = (overrides: Partial<Rule> = {}) => JSON.stringify([{ ...base, ...overrides }]);

describe('rule validation', () => {
  it('accepts valid YAML and an empty pack', () => {
    expect(loadRules(pack())).toHaveLength(1);
    expect(loadRules('[]')).toEqual([]);
  });
  it('rejects malformed YAML', () => expect(() => loadRules('- [broken')).toThrow('Invalid rules YAML'));
  it('rejects invalid fields', () => expect(() => loadRules(pack({ severity: 'fatal' as Rule['severity'] }))).toThrow('Invalid rules'));
  it('rejects unknown fields', () => expect(() => loadRules(JSON.stringify([{ ...base, typo: true }]))).toThrow('Invalid rules'));
  it('rejects duplicates', () => expect(() => loadRules(JSON.stringify([base, base]))).toThrow('Duplicate'));
  it('rejects invalid regex', () => expect(() => loadRules(pack({ pattern: '(' }))).toThrow('invalid pattern'));
  it('rejects mismatched languages', () => expect(() => loadRules(pack({ lang: 'en' }))).toThrow('must start'));
});

describe('matching and positions', () => {
  it.each(rules.map(rule => [rule.id, rule] as const))('%s matches bad and accepts good', (_, rule) => {
    const enabled = { ...rule, disabled_by_default: false };
    expect(lint(rule.examples.bad, [enabled])).not.toHaveLength(0);
    expect(lint(rule.examples.good, [enabled])).toEqual([]);
  });
  it('preserves CRLF and UTF-16 offsets', () => {
    const text = 'Первый факт.\r\n  ВАЖНО ОТМЕТИТЬ, ЧТО рынок растёт.';
    const [finding] = lint(text, [base]);
    expect(finding).toMatchObject({ start: 16, line: 2, column: 3 });
    expect(text.slice(finding!.start, finding!.end)).toBe('ВАЖНО ОТМЕТИТЬ, ЧТО');
  });
  it('folds ё while preserving original offsets', () => {
    const rule = { ...base, type: 'phrase' as const, pattern: 'всё растёт' };
    expect(lint('ВСЕ РАСТЕТ', [rule])[0]).toMatchObject({ start: 0, end: 10 });
  });
  it('does not match substrings of Cyrillic or Latin words', () => {
    const rule = { ...base, type: 'phrase' as const, pattern: 'вода' };
    expect(lint('подвода водами aвода вода2 _вода', [rule])).toEqual([]);
    expect(lint('(Вода).', [rule])).toHaveLength(1);
  });
  it('treats phrase punctuation literally', () => {
    const rule = { ...base, type: 'phrase' as const, pattern: 'a+b' };
    expect(lint('a+b aaab', [rule])).toHaveLength(1);
  });
  it('does not change offsets after Unicode case expansions', () => {
    expect(lint('İ Важно отметить, что', [base])[0]?.start).toBe(2);
  });
  it('reports multiple matches in source order', () => {
    const result = lint('It is worth noting that. Важно отметить, что. It is worth noting that.', rules);
    expect(result.map(x => x.ruleId)).toEqual(['en-002', 'ru-001', 'en-002']);
  });
  it('skips disabled rules', () => expect(lint(base.examples.bad, [{ ...base, disabled_by_default: true }])).toEqual([]));
  it('terminates on empty regex matches', () => expect(lint('hello', [{ ...base, pattern: 'a*' }])).toEqual([]));
});

describe('Markdown exclusions', () => {
  const phrase = base.examples.bad;
  it.each([
    `---\r\ntitle: ${phrase}\r\n---\r\n`,
    `\`${phrase}\``,
    `\`\`\`text\n${phrase}\n\`\`\``,
    `~~~text\n${phrase}\n~~~`,
    `    ${phrase}\n`,
    `> \`\`\`\n> ${phrase}\n> \`\`\``,
    `<!-- slop-lint-disable -->\n${phrase}\n<!-- slop-lint-enable -->`,
    `<!-- slop-lint-disable -->\n${phrase}`,
  ])('masks excluded syntax while retaining positions', input => {
    const masked = maskMarkdown(input);
    expect(masked.length).toBe(input.length);
    expect(lint(masked, [base])).toEqual([]);
    expect(masked.split('\n').map(x => x.length)).toEqual(input.split('\n').map(x => x.length));
  });
  it('resumes after enable', () => {
    const input = `<!-- slop-lint-disable -->\n${phrase}\n<!-- slop-lint-enable -->\n${phrase}`;
    expect(lint(maskMarkdown(input), [base])[0]?.line).toBe(4);
  });
  it('ignores directives inside code', () => {
    const input = `\`<!-- slop-lint-disable -->\`\n${phrase}`;
    expect(lint(maskMarkdown(input), [base])).toHaveLength(1);
  });
});
