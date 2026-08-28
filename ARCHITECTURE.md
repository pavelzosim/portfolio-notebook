# Repository architecture

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
