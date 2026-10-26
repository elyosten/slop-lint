# slop-lint

[![CI](https://github.com/elyosten/slop-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/elyosten/slop-lint/actions/workflows/ci.yml)

A Russian and English prose linter for formulaic wording. Rules live in YAML; findings
include source positions and editing suggestions. All text processing runs locally.

Project website: [elyosten.github.io/slop-lint](https://elyosten.github.io/slop-lint/).
The interactive browser demo is still planned.

**Development preview:** CLI and core work locally. The package is not published to npm.
There are five starter rules per language; corpus review and the full v0.1 pack are pending.
The existing unscoped npm package `slop-lint` belongs to a different project.

## Run from source

Requires Node.js 20.19 or newer.

```sh
git clone https://github.com/elyosten/slop-lint.git
cd slop-lint
npm ci
npm run check
node dist/cli/index.js --lang ru README.md
node dist/cli/index.js --lang all --format json --strict docs/
```

Example input: `Важно отметить, что рынок растёт.`

```text
article.md:1:1  warn  Вводная фраза откладывает основной факт.  (ru-001)
  Начните предложение с самого факта.
1 finding(s) in 1 file(s).
```

The suggestion is to write `Рынок растёт.` The linter does not change your file.

| Interface | Status |
| --- | --- |
| TypeScript core | Implemented |
| CLI | Implemented |
| GitHub Action | Planned |
| Browser demo / Pages | Planned |
| Agent skill | Planned |

## CLI

```text
slop-lint [--lang ru|en|all] [--format text|json] [--strict] [--rules pack.yml] <paths...>
```

Default language is `all`. Custom rules replace bundled rules. Directories are traversed
recursively for `.md`, `.markdown`, `.mdx`, and `.txt`; symlinks, `.git`, `node_modules`,
`dist`, and `coverage` are skipped. Explicit paths are deduplicated.
`--strict` returns 1 on any finding; input/configuration errors return 2. Otherwise exit is 0.
Text reports use color in a terminal unless `NO_COLOR` is set.

Markdown fenced/indented code, inline code, and leading YAML frontmatter are ignored.
Use these comments to disable a section:

```markdown
<!-- slop-lint-disable -->
Text intentionally excluded from linting.
<!-- slop-lint-enable -->
```

MDX currently uses CommonMark parsing; JSX-specific syntax is not supported.

## Core API

```ts
import { lint, loadRules } from '@elyosten/slop-lint';

const rules = loadRules(yamlText);
const findings = lint(text, rules);
```

This import is available when installing the local packed package. Publication is pending.
Offsets use zero-based UTF-16 units with an exclusive end; line and column start at 1.
Core treats input as plain text. Phrase matches use Unicode boundaries; case and ё/е
differences are ignored. Only load regex rule packs you trust: regex syntax validation
does not guarantee bounded execution time.

## Add a rule

1. Add an original rule to `rules/ru.yml` or `rules/en.yml` using [the schema](schema/rules.schema.json).
2. Include `bad` and `good` examples, a clear message, and a concrete suggestion.
3. Run `npm run check`; every rule's examples are tested automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [the roadmap](docs/ROADMAP.md).

## Purpose and limits

These patterns can appear in human writing too. Findings are editorial suggestions,
not evidence of AI authorship. The tool is intended to improve clarity, not evade
authorship checks. Starter rules have not yet been evaluated on a representative corpus.

## По-русски

slop-lint отмечает шаблонные обороты в русских и английских текстах и предлагает правки.
Проверка выполняется локально. Совпадение с правилом не доказывает, что текст написал ИИ.

Сейчас готовы ядро, CLI и по пять стартовых правил. npm-пакет пока не опубликован;
команда `npx slop-lint` устанавливает чужой проект. Для разработки используйте команды
из раздела Run from source. Рабочее имя нашего пакета — `@elyosten/slop-lint`.

`--lang ru` выбирает русский язык, `--format json` даёт машинный отчёт, `--strict`
возвращает код 1 при замечаниях, `--rules` подключает свой YAML вместо встроенных правил.
Код и фронтматтер Markdown пропускаются. Полный план следующего этапа — в
[docs/ROADMAP.md](docs/ROADMAP.md).

MIT License.
