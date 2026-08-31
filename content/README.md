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

`posts/index.json` is the registry for migrated HTML posts.

**Recent notes** (the compact list under "Recent notes") is fully automatic: every `published`, indexable record is eligible, sorted by `siteDate` (falling back to `datePublished`) descending, newest six shown. Nothing to add or maintain per post — a new post appears at the top on its own, and the oldest one rolls off. Only set `siteDate` when a post's `datePublished` is a historical/backdated date (e.g. R&D work written up long after it was made) and you need the post to sort by when it was actually added to the site rather than by that historical date.

**Highlights** (the four-card strip) is still manually curated — add a `homepage` object to feature a post there:

```json
"homepage": { "highlight": true, "rank": 10 }
```

- `highlight` places the post in the four-card Highlights strip.
- `rank` controls the order within the strip; lower values appear first.
