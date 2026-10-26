# slop-lint project context

## Purpose

An open-source prose linter that flags formulaic wording and suggests concrete edits.
One browser-compatible TypeScript core will power a CLI, GitHub Action, browser demo,
and an agent skill. Russian and English first; Kazakh after native-speaker review.
The launch target is 1,000 GitHub stars in 90 days, an aspiration rather than a product guarantee.

## Current milestone

Initial foundation: plan stages 0–3 and a starter rule pack, with CI added early.
The public repository is https://github.com/elyosten/slop-lint.
The unscoped npm name `slop-lint` is occupied (0.8.0 on 2026-10-26).
The provisional package name is `@elyosten/slop-lint`; the CLI binary is `slop-lint`.
The scoped package has not been published. GitHub identity does not establish ownership
of the same npm scope; verify npm login and scope ownership before a release.

## Decisions

- Node >=20.19, TypeScript strict, ESM, tsup, Vitest 4 (supports Node 20).
- Override transitive esbuild to >=0.28.1 to avoid the Windows dev-server advisory.
- Core API: `loadRules(yamlString)` and `lint(text, rules)`; no Node APIs in core.
- YAML is validated against schema/rules.schema.json with Ajv, followed by duplicate-ID,
  language-prefix, and regex syntax checks. Regex packs are trusted executable configuration;
  syntax validation does not establish ReDoS safety.
- Phrase matching escapes regex syntax; both types use Unicode letter/number/underscore
  boundaries, case-insensitive matching, and length-preserving ё/е normalization.
- Offsets are zero-based UTF-16 code units, end-exclusive. Line/column are one-based;
  columns count UTF-16 units, matching JavaScript string offsets.
- The default core input is plain text. CLI masks Markdown code, frontmatter, and
  disable/enable regions, preserving all offsets. It uses a CommonMark parser.
- CLI: --lang ru|en|all, --format text|json, --strict, --rules, --help.
  Custom packs replace the bundled packs. Exit codes: 0 success, 1 strict findings,
  2 invalid arguments, rules, or file operations. JSON output is a flat array with file paths.
- Directories include .md, .markdown, .mdx, .txt; explicit files can have other extensions.
  Symlinks and dependency/build directories are skipped. MDX is parsed as CommonMark;
  JSX-specific semantics are not implemented.
- Five starter rules per language are examples, not a corpus-validated production pack.

## Structure

src/core — engine and loader; src/markdown — syntax masking; src/cli — filesystem and output.
rules — language packs; schema — public rule schema; tests — core, Markdown, and built CLI.
.github/workflows — CI; docs — milestones and release checks.

## v0.1 acceptance criteria still to complete

- 30 reviewed rules per language and a documented 20 AI / 20 human text corpus evaluation.
- Browser demo, GitHub Pages, and offline-after-load verification.
- GitHub Action annotations and a test-repository run.
- Agent skill and at least one real agent integration check.
- Bilingual documentation, GIF, social image, and launch drafts.
- Clean-install package verification, npm ownership/2FA, publication, tag, GitHub release.
- Ten good-first-issue tasks and Discussions setup.

No AI rewriting, morphology, editor plugins, PR API comments, or shipped Kazakh rules in v0.1.
Use docs/ROADMAP.md to track progress. Do not claim corpus validation, public availability,
or a completed release before collecting the corresponding evidence.
