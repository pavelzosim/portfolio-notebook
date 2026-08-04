# Content repository

This directory is the canonical source for portfolio and blog content. Presentation belongs in `styles/`; documents and metadata belong here.

## Layout

- `posts/` — blog articles in Markdown
- `posts/atlas-html/` — canonical HTML already migrated in `atlas-framework`
- `projects/` — selected production project records
- `pages/` — long-lived About and Contact copy
- `migration/` — Wix URL inventory and migration status
- `../public/media/` — repository-owned images, video posters, and downloadable files

## Post contract

Every post uses YAML front matter with at least `title`, `slug`, `published`, `source`, `status`, `categories`, `tags`, and `mediaStatus`.

During migration, `source` preserves the original Wix URL. Existing files from `atlas-framework` take precedence over scraping Wix again. A post is only marked `ready` after its text, embeds, images, alt text, downloadable files, and internal links have been checked.
