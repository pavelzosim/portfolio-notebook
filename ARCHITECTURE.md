# Repository architecture

## Styles

`styles/atlas.css` is the only orchestration file. Its import order is intentional:

1. `core.css` — tokens, reset, document shell, typography foundations
2. `commander.css` — command bar, keyboard UI, dialog, search states
3. `media-index.css` — note and project preview records
4. `profile.css` — profile facts, introduction, dotted-paper treatment
5. `navigation.css` — quiet primary navigation and active states
6. `content.css` — resource cards, reel, contacts, responsive refinements

Modules may depend on tokens established by `core.css`, but they should not import one another. New modules are registered only in `atlas.css`.

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
