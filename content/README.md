# Content repository

This directory is the canonical source for portfolio and blog content. Presentation belongs in `styles/`; documents and metadata belong here.

## Layout

- `posts/` — blog articles in Markdown
- `posts/atlas-html/` — canonical HTML post sources
- `projects/` — selected production project records
- `pages/` — long-lived About and Contact copy
- `../public/media/` — repository-owned images, video posters, and downloadable files

## Post contract

Every post uses YAML front matter with at least `title`, `slug`, `published`, `source`, `status`, `categories`, `tags`, and `mediaStatus`.

## Homepage visibility

`posts/index.json` is the registry for migrated HTML posts. The "Latest ..." record-list in three homepage sections is fully automatic, via `window.atlasRenderRecentList` (`scripts/post-registry.js`): every `published`, indexable record is eligible, sorted by `siteDate` (falling back to `datePublished`) descending, newest five shown. Nothing to add or maintain per post — a new post appears at the top on its own, and the oldest one rolls off.

| Section | List scope |
| --- | --- |
| § 02 Recent notes | every published record |
| § 05 Tools and assets ("Latest · in progress") | `resource: true` only |
| § 06 Blog ("Latest · recent notes") | `resource` excluded (keeps it distinct from § 05) |

Only set `siteDate` when a post's `datePublished` is a historical/backdated date (e.g. R&D work written up long after it was made) and you need the post to sort by when it was actually added to the site rather than by that historical date.

**Highlights** (the four-card strips in § 02 and § 05) are still manually curated — add a `homepage` object (or `toolsHome` for § 05) to feature a post there:

```json
"homepage": { "highlight": true, "rank": 10 }
"toolsHome": { "highlight": true, "rank": 10, "highlightKind": "TOOL · PYTHON", "blurb": "Short pitch line" }
```

- `highlight` places the post in the four-card strip.
- `rank` controls the order within the strip; lower values appear first.
- § 06's own four-card strip and § 03 Selected Projects' "Latest · in progress" list are both still hand-authored directly in `index.html` — § 03 isn't a clean 1:1 mapping onto registry records (it mixes project-status narrative with post links), so it's deliberately left out of this automation.
