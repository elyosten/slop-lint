# GitHub Pages and Search Console

The project site is published from `main` → `/docs` at:
https://elyosten.github.io/slop-lint/

Keep `google55d350cd77334786.html` in this publishing directory permanently.
It must be served unchanged at:
https://elyosten.github.io/slop-lint/google55d350cd77334786.html

The homepage also includes the Google verification meta tag supplied by the owner.
In Google Search Console, add a URL-prefix property for the Pages site URL above,
then complete HTML-file verification. The GitHub repository URL is a different
resource and cannot be verified using files published on GitHub Pages.

Future website builds must preserve the verification file and meta tag in their
deployed output. The current homepage is a project introduction, not the planned
interactive lint demo. `.nojekyll` disables Jekyll processing for these static files.
