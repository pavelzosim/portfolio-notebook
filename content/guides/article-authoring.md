# Atlas Article Authoring Contract

Status: canonical

Revision: 2026.08

Visual reference: `/blog/style-guide/`

Read this document before drafting, converting, or editing a technical article in this repository.

## Purpose

Atlas articles are engineering records: implementation notes, R&D logs, breakdowns, references, and reusable production knowledge. They must read like technical documentation, not product landing pages.

## Required document order

1. Context or problem.
2. Production constraints and assumptions.
3. Technical approach and implementation.
4. Evidence: code, measurements, diagrams, images, or video.
5. Result, limitations, and reusable lessons.
6. References.

Omit a section only when it genuinely does not apply. Do not invent missing information.

## Canonical shell

- Use the shared top navigation from the site.
- Register the article in `/content/posts/index.json`.
- Load `/styles/atlas.css` and the appropriate article stylesheet.
- Load `/scripts/article-page.js`; it builds article contents, metadata, tags, adjacent-article navigation, and local footer links.
- Use local repository paths for media and documents.
- Keep slugs lowercase and hyphen-separated.

## Typography

- JetBrains Mono is the article font.
- One `h1` identifies the document.
- `h2` defines major article sections and populates the left navigation.
- `h3` defines subsections.
- `h4` is a small local label; do not use it to skip hierarchy.
- Keep paragraphs focused. Prefer concrete implementation language over promotional claims.
- Use `.atlas-code-inline` for identifiers, file names, API calls, and short expressions.

## Components

| Purpose | Canonical markup |
| --- | --- |
| Article content | `.atlas-container > .content-block` |
| Neutral note | `.atlas-callout.atlas-callout--note` |
| Critical limitation | `.atlas-callout.atlas-callout--important` |
| Caution | `.atlas-callout.atlas-callout--warning` |
| Validated result | `.atlas-callout.atlas-callout--success` |
| Quote/reference point | `.atlas-callout.atlas-callout--quote` |
| Code | `pre.atlas-code-block > code` |
| Formula | `.atlas-math-block` |
| Comparison | `.comparison-matrix > .comp-col` |
| Data table | `.atlas-table-frame > table.atlas-table` |
| Single image/video | `figure.media-frame` |
| Gallery | `.media-frame > .gallery-grid` |
| Image slider | `.media-frame.atlas-image-slider[data-image-slider]` |
| Article header | `#site-passport > .passport-bp` |
| Article footer | `#atlas-footer > .atlas-footer-wrapper` |
| Primary action | `.atlas-btn` |
| Secondary action | `.atlas-btn--ghost` or `.atlas-btn--bracket` |
| References | `.atlas-refs > .atlas-ref-list` |
| Major divider | `.atlas-section-break` |
| Document end | `.atlas-eof-divider` |
| Table of contents | `.atlas-toc > .atlas-toc__list` |
| System diagram | `.atlas-uml-diag` |
| Interactive parameter UI | `.atlas-shader-panel` |

## Media rules

- Copy media into `/public/media/posts/<slug>/`.
- Use meaningful filenames when practical.
- Every image needs descriptive `alt` text.
- Every evidentiary image or video needs a caption explaining what to inspect.
- Use `object-fit: contain`; do not crop technical evidence.
- Use `loading="lazy"` except for the first important image.
- Prefer WebM/MP4 for video loops and PNG/JPEG/WebP/GIF only when appropriate to the source.
- Never hotlink Wix media in a finished local record.

## Color and geometry

- Beige paper background and low-opacity dotted grid.
- Square corners and one-pixel borders.
- Black/near-black text.
- Use `--atlas-accent` (`#0000AA`) only for interactive UI: buttons, focus, selected navigation, and link hover.
- Use `--atlas-crit` (`#8B0000`) only for errors, breaking changes, production risks, and critical callouts.
- Green for confirmed success, amber for caution.
- Use the spacing rhythm `4 / 8 / 12 / 16 / 22 / 32 / 56` pixels.
- No decorative gradients, glass effects, floating cards, or marketing hero treatments.
- Dithering is allowed only as a deliberate Commander-style interaction shadow/pattern.

## Content integrity

- Do not invent clients, awards, measurements, responsibilities, outcomes, or tools.
- Distinguish personal contribution from team output.
- Preserve confidentiality and label intentionally omitted production details.
- Link primary technical sources when available.
- Remove Wix-only navigation and source-record links after migration.
- Validate every local link and asset before publication.

## Minimal article skeleton

```html
<header class="article-shellbar">...</header>
<main class="post-shell">
  <header class="post-header">
    <p class="post-path">~/blog/article-slug.md</p>
    <h1>Article title</h1>
    <p class="post-summary">Concrete one-sentence summary.</p>
    <div class="post-meta"><span>AUTHOR</span><span>DATE</span><span>#TAG</span></div>
  </header>
  <article class="atlas-container">
    <div class="content-block">
      <h2 id="context">Context</h2>
      <p>...</p>
      <h2 id="implementation">Implementation</h2>
      <p>...</p>
      <div class="atlas-refs">...</div>
      <div class="atlas-eof-divider">...</div>
    </div>
  </article>
</main>
<script src="/scripts/article-page.js"></script>
```

## Validation checklist

- [ ] Registry entry, title, description, slug, canonical URL, and tags agree.
- [ ] Heading hierarchy is sequential and produces a useful sidebar.
- [ ] All media is local, uncropped, captioned, and accessible.
- [ ] Code is text, not an image.
- [ ] Links point to local indexes or valid external primary sources.
- [ ] Desktop and mobile layouts have been visually checked.
- [ ] GitHub Pages build validation passes.
