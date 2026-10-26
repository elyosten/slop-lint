import { fromMarkdown } from 'mdast-util-from-markdown';

interface Node {
  type: string;
  value?: string;
  position?: { start: { offset?: number }; end: { offset?: number } };
  children?: Node[];
}

/** Replace excluded regions with spaces, retaining all offsets and line endings. */
export function maskMarkdown(text: string): string {
  const chars = text.split('');
  const mask = (start: number, end: number): void => {
    for (let i = start; i < end; i++) if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
  };
  const frontmatter = /^(?:\uFEFF)?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/.exec(text);
  if (frontmatter) mask(0, frontmatter[0].length);
  const tree = fromMarkdown(chars.join(''));
  let disabled: number | undefined;
  const visit = (node: Node): void => {
    const start = node.position?.start.offset, end = node.position?.end.offset;
    if (start !== undefined && end !== undefined) {
      if (node.type === 'code' || node.type === 'inlineCode') mask(start, end);
      if (node.type === 'html') {
        const directives = /<!--\s*slop-lint-(disable|enable)\s*-->/g;
        for (const directive of (node.value ?? '').matchAll(directives)) {
          const at = start + directive.index;
          if (directive[1] === 'disable' && disabled === undefined) disabled = at;
          if (directive[1] === 'enable' && disabled !== undefined) {
            mask(disabled, at + directive[0].length);
            disabled = undefined;
          }
          mask(at, at + directive[0].length);
        }
      }
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  if (disabled !== undefined) mask(disabled, text.length);
  return chars.join('');
}
