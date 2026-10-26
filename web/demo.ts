import { lint, loadRules, type Finding } from '../src/core/index';
import { maskMarkdown } from '../src/markdown/index';

export const maxLength = 30_000;

/** Plain-text DOM rendering keeps pasted HTML inert, including highlighted spans. */
export function renderHighlights(target: HTMLElement, text: string, findings: readonly Finding[]): void {
  target.replaceChildren();
  let cursor = 0;
  for (const finding of findings) {
    // Findings from different rules can overlap: render their union once.
    if (finding.end <= cursor) continue;
    target.append(document.createTextNode(text.slice(cursor, Math.max(cursor, finding.start))));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(Math.max(cursor, finding.start), finding.end);
    target.append(mark);
    cursor = finding.end;
  }
  target.append(document.createTextNode(text.slice(cursor)));
}

export function mountDemo(root: ParentNode, yaml: string): void {
  const get = <T extends Element>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing demo control: ${selector}`);
    return element;
  };
  const editor = get<HTMLTextAreaElement>('#lint-text');
  const language = get<HTMLSelectElement>('#lint-language');
  const markdown = get<HTMLInputElement>('#lint-markdown');
  const form = get<HTMLFormElement>('#lint-form');
  const summary = get<HTMLElement>('#lint-summary');
  const preview = get<HTMLElement>('#lint-preview');
  const results = get<HTMLOListElement>('#lint-results');
  const check = get<HTMLButtonElement>('#lint-check');
  const count = get<HTMLElement>('#lint-count');
  const sample = get<HTMLButtonElement>('#lint-sample');
  const clear = get<HTMLButtonElement>('#lint-clear');
  const rules = loadRules(yaml);
  const samples: Record<string, string> = {
    ru: 'Важно отметить, что сборка ускорилась вдвое.\nЭтот инструмент открывает новые горизонты.',
    en: 'It is important to note that the build is twice as fast.\nThese tools unlock a world of possibilities.',
    all: 'Важно отметить, что сборка ускорилась вдвое.\nIt is worth noting that the API has changed.',
  };
  let timer: ReturnType<typeof setTimeout> | undefined;

  function run(): void {
    clearTimeout(timer);
    const text = editor.value;
    count.textContent = `${text.length.toLocaleString('en-US')} / ${maxLength.toLocaleString('en-US')}`;
    results.replaceChildren();
    editor.removeAttribute('aria-invalid');
    if (text.length > maxLength) {
      editor.setAttribute('aria-invalid', 'true');
      preview.textContent = '';
      summary.textContent = `Text is too long. Use at most ${maxLength.toLocaleString('en-US')} characters.`;
      return;
    }
    const selected = rules.filter(rule => language.value === 'all' || rule.lang === language.value);
    const findings = lint(markdown.checked ? maskMarkdown(text) : text, selected);
    renderHighlights(preview, text, findings);
    summary.textContent = !text.trim() ? 'Paste text or load an example to begin.'
      : findings.length ? `${findings.length} ${findings.length === 1 ? 'suggestion' : 'suggestions'} · ${selected.length} rules checked`
      : `No matches in ${selected.length} starter rules. This is not a guarantee of writing quality.`;
    for (const finding of findings) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'finding';
      const location = document.createElement('span');
      location.className = 'finding-location';
      location.textContent = `${finding.severity} · ${finding.ruleId} · ${finding.line}:${finding.column}`;
      const quote = document.createElement('strong');
      quote.textContent = text.slice(finding.start, finding.end);
      const message = document.createElement('span');
      message.textContent = finding.message;
      const suggestion = document.createElement('span');
      suggestion.className = 'finding-advice';
      suggestion.textContent = finding.suggest;
      button.append(location, quote, message, suggestion);
      button.addEventListener('click', () => {
        editor.focus();
        editor.setSelectionRange(finding.start, finding.end);
      });
      item.append(button);
      results.append(item);
    }
  }
  editor.addEventListener('input', () => {
    clearTimeout(timer);
    // Remove stale positions as soon as text changes.
    results.replaceChildren();
    preview.textContent = '';
    summary.textContent = 'Checking…';
    timer = setTimeout(run, 200);
  });
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  language.addEventListener('change', run);
  markdown.addEventListener('change', run);
  sample.addEventListener('click', () => {
    editor.value = samples[language.value] ?? samples.all!;
    run();
    editor.focus();
  });
  clear.addEventListener('click', () => { editor.value = ''; run(); editor.focus(); });
  check.disabled = false;
  sample.disabled = false;
  clear.disabled = false;
  run();
}
