# Site revision — 5 October 2026

## Scope

Generated production HTML, shared loading pipeline, homepage navigation, catalogues, article routes, media references and SEO discovery. Existing article prose was not rewritten as part of this technical revision.

## Findings and changes

- Catalogue bodies waited for two network requests. Embed their shared template and registry during the production build; keep the source-preview fallback.
- Homepage widgets waited for the post registry. Embed published records and reuse a shared in-page promise.
- CSS entrypoints recursively imported shared modules, including notebook layout twice. Flatten local imports at build time, rebase asset URLs, deduplicate modules within each page, and use content-hashed bundle URLs. Source modules remain the editing architecture.
- Homepage active navigation queried an empty selector for links without a fragment. Resolve only nonempty fragments by ID.
- Found 12 groups of byte-identical public media. Production references share one URL per group; original files remain available for existing external links.
- No duplicate DOM IDs, repeated script tags or repeated stylesheet links found across generated HTML.

## Validation

Production SEO/internal-link audit: 58 HTML documents, 42 canonical posts, 54 sitemap entries; zero errors or warnings. Analytics and sprite tool checks: 10 passing tests. Browser review covers homepage, blog, tools, projects, online tools and two long-form articles at desktop and mobile widths, including no overflow, one primary header, one H1 and no script exceptions.

## Editorial follow-up

Homepage highlights and recent lists intentionally repeat selected records for different browsing tasks. Related articles and project maps intentionally refer to the same series. These are navigation surfaces rather than duplicate published routes. A separate editorial change could reduce their prominence, but removing them automatically would change the content hierarchy.
