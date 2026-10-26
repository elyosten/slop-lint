# Contributing

Use Node.js >=20.19. Run `npm ci` and `npm run check` before submitting a change.
`npm test` expects the built CLI and website; run `npm run build` and `npm run build:web`
after changing code. `npm run check` runs all builds and tests in the correct order.

## Adding rules

Add an entry to rules/ru.yml or rules/en.yml. Use a unique language-prefixed id,
`phrase` for literal text or `regex` for patterns, and severity info/warn/error.
Required fields are documented in schema/rules.schema.json.

```yaml
- id: en-006
  lang: en
  type: phrase
  pattern: at the end of the day
  severity: info
  message: A stock transition may hide the conclusion.
  suggest: State the conclusion directly.
  tags: [transition]
  disabled_by_default: true
  examples:
    bad: At the end of the day, the second option costs less.
    good: The second option costs less.
```

Write original examples, avoid nested regex quantifiers, and include counterexamples
from natural prose when evaluating false positives. Tests execute each bad/good pair.
For disabled rules, explicitly enable the rule in the example test.
Suggestions must preserve the author's meaning; avoid labeling a writer or guessing authorship.
Proposed rules require corpus review before inclusion in the release-quality pack.

Русские правила обсуждаем по-русски. Для казахского пакета нужен носитель языка;
пока rules/kk.yml — пустая заготовка.
