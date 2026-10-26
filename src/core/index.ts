import Ajv from 'ajv';
import { parse } from 'yaml';
import schema from '../../schema/rules.schema.json';

export interface Rule {
  id: string;
  lang: 'ru' | 'en' | 'kk';
  type: 'phrase' | 'regex';
  pattern: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
  suggest: string;
  tags: string[];
  disabled_by_default?: boolean;
  examples: { bad: string; good: string };
}

export interface Finding {
  ruleId: string;
  start: number;
  end: number;
  line: number;
  column: number;
  severity: Rule['severity'];
  message: string;
  suggest: string;
}

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile<Rule[]>(schema);
// This replacement preserves UTF-16 offsets. Do not lowercase whole strings:
// some Unicode case mappings change their length.
const normalize = (text: string): string => text.replace(/[ёЁ]/g, c => c === 'ё' ? 'е' : 'Е');

function compile(rule: Rule): RegExp {
  const pattern = normalize(rule.pattern);
  const source = rule.type === 'phrase' ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : pattern;
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`, 'giu');
}

export function loadRules(yamlString: string): Rule[] {
  let value: unknown;
  try { value = parse(yamlString, { maxAliasCount: 50 }); }
  catch (error) { throw new Error(`Invalid rules YAML: ${error instanceof Error ? error.message : String(error)}`); }
  if (!validate(value)) throw new Error(`Invalid rules: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
  const ids = new Set<string>();
  for (const rule of value) {
    if (ids.has(rule.id)) throw new Error(`Duplicate rule id: ${rule.id}`);
    ids.add(rule.id);
    if (!rule.id.startsWith(`${rule.lang}-`)) throw new Error(`Rule ${rule.id}: id must start with ${rule.lang}-`);
    try { compile(rule); }
    catch (error) { throw new Error(`Rule ${rule.id}: invalid pattern: ${String(error)}`); }
  }
  return value;
}

export function lint(text: string, rules: readonly Rule[]): Finding[] {
  const normalized = normalize(text);
  const lines = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') lines.push(i + 1);
  const findings: Finding[] = [];
  for (const rule of rules) {
    if (rule.disabled_by_default) continue;
    for (const match of normalized.matchAll(compile(rule))) {
      if (!match[0].length) continue;
      const start = match.index;
      let low = 0, high = lines.length;
      while (low + 1 < high) {
        const middle = (low + high) >>> 1;
        if (lines[middle]! <= start) low = middle;
        else high = middle;
      }
      findings.push({ ruleId: rule.id, start, end: start + match[0].length,
        line: low + 1, column: start - lines[low]! + 1,
        severity: rule.severity, message: rule.message, suggest: rule.suggest });
    }
  }
  return findings.sort((a, b) => a.start - b.start || a.ruleId.localeCompare(b.ruleId));
}
