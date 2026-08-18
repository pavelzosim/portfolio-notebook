# Atlas Rules Index

Status: canonical entry point

Revision: 2026.08

This folder is the single place to start before designing, writing, migrating, publishing, or reviewing any page in the portfolio notebook.

## Required contracts

1. [UI and UX Design System](ui-ux-design-system.md)

   Visual direction, layout, navigation, components, interaction, responsive behavior, and accessibility.

2. [Article Authoring Contract](article-authoring.md)

   Article structure, technical writing, canonical components, media, and per-article validation.

3. [SEO, Indexing, and Analytics Contract](seo-indexing-analytics.md)

   Slugs, metadata, canonical routes, structured data, sitemap, Search Console, and analytics safety.

## Visual and architectural references

- Rendered component catalogue: `/blog/style-guide/`
- CSS and repository architecture: `/ARCHITECTURE.md`
- Canonical stylesheet orchestrator: `/styles/atlas.css`
- Content registry: `/content/posts/index.json`
- Article template: `/content/templates/atlas-post.html`
- Project template: `/content/templates/project-page.html`

The rendered Style Guide is the visual reference. The Markdown contracts in this directory are the implementation and review rules. When they disagree, stop and reconcile them before creating another page-specific exception.

## Required reading by task

| Task | Read first |
| --- | --- |
| New or redesigned page | UI/UX + SEO |
| New technical article | UI/UX + Article Authoring + SEO |
| Wix article migration | all three contracts |
| Project page migration | UI/UX + SEO, then the project template |
| New reusable component | UI/UX, rendered Style Guide, and repository architecture |
| Production release | SEO release gate plus visual/accessibility validation |
| Analytics change | SEO/Analytics contract; never expose credentials client-side |

## Non-negotiable repository rules

- Do not create isolated page-specific design systems.
- Do not add forced CSS declarations to solve cascade problems.
- Do not hotlink Wix media in a finished page.
- Do not publish a page without a stable canonical route and registry record.
- Do not use the GitHub Pages preview as the public canonical site.
- Do not place analytics secrets or private visitor data in the repository.
- Do not invent production facts, responsibilities, clients, awards, or measurements.
