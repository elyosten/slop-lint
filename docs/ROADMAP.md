# Roadmap and release evidence

This follows the user-provided project plan. Checked items indicate implemented work;
unchecked items are not claims of completion.

- [x] Public GitHub repository and MIT license
- [x] CONTEXT.md, strict TypeScript project, locked dependencies
- [x] YAML schema, loader validation, phrase and regex rules
- [x] Unicode boundaries, ё/е matching, exact source positions
- [x] CLI, custom packs, recursive paths, JSON output and exit statuses
- [x] Markdown exclusions and disable/enable comments
- [x] Tests including automatic bad/good examples
- [x] CI workflow for Linux and Windows, Node 20 and 22
- [x] Confirm initial CI is green on GitHub
- [ ] 30 Russian and 30 English rules
- [ ] Evaluate on 20 AI and 20 human texts; document false positives and corpus permissions
- [x] Browser demo with shared core, highlights, language selection, and Markdown masking
- [x] Built-bundle offline test with network APIs disabled
- [x] Deploy interactive demo via GitHub Actions and verify live UI
- [ ] GitHub Action annotations and integration check in a sample repository
- [ ] Agent skill and agent integration check
- [ ] GIF, social image, complete bilingual release documentation
- [ ] npm scope ownership and 2FA; clean-machine install test
- [ ] Publish npm package, tag v0.1.0, GitHub release
- [ ] Ten good-first-issue issues and Discussions
- [ ] Launch drafts for Show HN, Habr, and Reddit

The public package name `slop-lint` was occupied when checked on 2026-10-26.
The provisional scoped package `@elyosten/slop-lint` returned npm 404; ownership of
that npm scope remains unverified. Do not instruct users to install the other package.

Later: PR comments, editor integrations, morphology, Kazakh and other language packs.

## Browser demo evidence (2026-10-26)

- [Website deployment](https://github.com/elyosten/slop-lint/actions/runs/40326144444) succeeded.
- [CI](https://github.com/elyosten/slop-lint/actions/runs/40326144335) passed with 50 tests.
- Verified the live bilingual example, highlighted matches, and source selection by clicking a finding.
- Checked 375px layout locally and executed the built bundle with network APIs disabled.
- Homepage, browser bundle, and unchanged Google verification file all returned HTTP 200.

