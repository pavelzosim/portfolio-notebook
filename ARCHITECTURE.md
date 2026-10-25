# Repository architecture

## Canonical public design (2026-10-25)

The approved component owners in `lab/atlas-ui/` now supply the production build as well as the isolated review harness. `scripts/build_github_pages.py` renders the public shell with `scripts/render_canonical_site.cjs`, retaining the existing canonical URLs and SEO metadata. Public HTML contains complete static content; JavaScript reuses the same composition/behaviour modules to enable controls. The browser audit checks both static and interactive output.

Build assets live under `_site/ui/atlas/` with a content-derived release version. Authoring HTML is packaged as per-document JSON inputs with a source map, avoiding recursive requests to the rendered public routes. Approved editorial revisions are applied through the same adapter used in review. Legacy source styles are not imported into the canonical shell. The legacy templates described below remain authoring inputs during this transition; use `--legacy` only for comparison builds.

Build requires Python, Node.js and Playwright Chromium (the Windows local workflow also supports installed Edge). CI installs the pinned renderer before building and audits canonical public routes and all three tool exports before uploading an artifact. The lab itself stays noindex and is not copied as a public route. Deployment remains a separate workflow action.

## Styles

`styles/atlas.css` orchestrates the shared Atlas framework and homepage composition styles. Section and record entry points (`indexes.css`, `projects.css`, `posts.css`, and `legacy-posts.css`) load only their specialised modules.

1. `framework/01–10` — canonical Atlas tokens, typography, headers, code, tables, callouts, media, interactive controls, shader panels, and TOC
2. `home/core.css` — document shell and homepage layout
3. `home/commander.css` — command bar, keyboard UI, dialog, search states
4. `home/media-index.css` — note and project preview records
5. `home/profile.css` — profile facts, introduction, dotted-paper treatment
6. `home/navigation.css` — quiet primary navigation and active states
7. `home/content.css` — resource cards, reel, contacts, responsive refinements
8. `notebook-layout.css` — canonical workspace width, left navigation, document column, metadata rail, record inset, and responsive geometry shared by indexes, projects, and articles

Homepage modules consume the original `--atlas-*` tokens. They should not import one another. Page-specific entry points must use `notebook-layout.css` instead of redefining workspace or rail geometry.

`home.css` remains as a compatibility shim for existing Wix embeds and cached URLs.

Navigation state colors have one source: `styles/theme/navigation-tokens.css`.
The common `notebook-layout.css` imports it for all page types, including standalone
legacy articles that do not load the homepage theme. Do not redefine these tokens
in article CSS. `scripts/css-contract.test.cjs` checks this dependency for each
stylesheet entry point, the absence of forced declarations, and the single shared
visually-hidden heading definition in `styles/framework/accessibility.css`.

## Content

Content is independent from templates and CSS:

```text
content/
├── posts/       Markdown blog entries
├── projects/    project records and project index
└── pages/       stable About and Contact copy

public/media/
├── posts/<slug>/
├── projects/<slug>/
├── reel/
└── shared/
```
