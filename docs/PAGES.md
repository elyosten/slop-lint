# GitHub Pages and Search Console

The project site is built from `main` by `.github/workflows/pages.yml` and published at:
https://elyosten.github.io/slop-lint/

Keep `google55d350cd77334786.html` in `docs/` permanently. The build copies it verbatim.
It must be served unchanged at:
https://elyosten.github.io/slop-lint/google55d350cd77334786.html

The homepage also includes the Google verification meta tag supplied by the owner.
In Google Search Console, add a URL-prefix property for the Pages site URL above,
then complete HTML-file verification. The GitHub repository URL is a different
resource and cannot be verified using files published on GitHub Pages.

## Build and deployment

GitHub repository Settings → Pages → Source must be **GitHub Actions**.
Run `npm run build:web` to produce `site/`. Only this generated directory is deployed.
The HTML source lives in `docs/index.html`; `web/main.ts` mounts the browser UI and
bundles the shared core, Markdown masking, and both YAML rule packs using esbuild.
The JavaScript filename contains a content hash to prevent stale bundle caches.
The build copies only explicit publishable files, excluding scratch files in `docs/`.

The demo offers language selection, Markdown exclusions, highlights, and source selection.
It never uploads or persists user text. All rules and code are in one bundle, so checks
continue offline after loading while the tab remains open. Offline reloads are not promised;
there is no service worker. Tests run the built bundle with network APIs disabled.

Future website builds must preserve the verification file and meta tag. Automated tests
check both in the deployed output.
