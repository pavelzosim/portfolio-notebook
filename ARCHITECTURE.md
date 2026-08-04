# Repository architecture

## Styles

`styles/atlas.css` is the only orchestration file. It loads the original Atlas framework first, followed by homepage composition styles.

1. `framework/01–10` — canonical Atlas tokens, typography, headers, code, tables, callouts, media, interactive controls, shader panels, and TOC
2. `home/core.css` — document shell and homepage layout
3. `home/commander.css` — command bar, keyboard UI, dialog, search states
4. `home/media-index.css` — note and project preview records
5. `home/profile.css` — profile facts, introduction, dotted-paper treatment
6. `home/navigation.css` — quiet primary navigation and active states
7. `home/content.css` — resource cards, reel, contacts, responsive refinements

Homepage modules consume the original `--atlas-*` tokens. They should not import one another; new modules are registered only in `atlas.css`.

`home.css` remains as a compatibility shim for existing Wix embeds and cached URLs.

## Content

Content is independent from templates and CSS:

```text
content/
├── posts/       Markdown blog entries
├── projects/    project records and project index
├── pages/       stable About and Contact copy
└── migration/   Wix source map and migration state

public/media/
├── posts/<slug>/
├── projects/<slug>/
├── reel/
└── shared/
```

## Wix migration states

- `inventory` — source URL is recorded
- `migrated-draft` — text and metadata are local; media or embeds still need review
- `ready` — body, metadata, media, captions, alt text, embeds, downloads, and links are verified
- `redirected` — the new route is public and the Wix URL has a redirect plan

Migration is additive. Nothing is removed from Wix until a local post is `ready`, its route has been tested, and the redirect has been recorded.
