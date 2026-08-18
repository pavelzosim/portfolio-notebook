# Atlas SEO, Indexing, and Analytics Contract

Status: canonical

Revision: 2026.08

Rules index: `/content/guides/README.md`

UI and UX contract: `/content/guides/ui-ux-design-system.md`

Read this document before publishing, migrating, renaming, or substantially editing any public page.

## Objectives

1. Give every public article and project one stable, indexable URL.
2. Keep the GitHub Pages preview out of search results while the production domain remains canonical.
3. Make page metadata, structured data, social previews, and internal discovery part of the content record rather than an afterthought.
4. Measure aggregate page usage without exposing analytics credentials or visitor data in the public repository.

SEO is not a separate writing pass. A page is not migrated until its content, metadata, media, URL, registry entry, and validation all agree.

## Environments and publication states

| Environment/state | Indexing rule | Sitemap | Canonical |
| --- | --- | --- | --- |
| Local preview | irrelevant to crawlers | none | production URL may remain in source |
| GitHub Pages preview | `noindex, nofollow` injected at build time | excluded | production `https://www.pavelzosim.com/...` URL |
| Draft or internal page | `noindex, nofollow` | excluded | omit unless a public canonical already exists |
| Public production page | indexable | included | self-referencing production URL |
| Redirected or replaced page | redirect to the replacement | old URL excluded | replacement URL |

The current GitHub Pages workflow already builds with `--noindex`. Keep that behavior until the custom domain is transferred and production launch validation is complete.

`robots.txt` is a crawl-control file, not a privacy mechanism. A page that must not appear in search needs `noindex`; confidential analytics requires authentication. Do not disallow a `noindex` HTML page in `robots.txt`, because a crawler must be able to fetch the page to read the directive.

## Canonical URL and slug rules

- Use lowercase ASCII slugs with words separated by hyphens.
- Prefer short descriptive nouns over dates, IDs, or marketing phrases.
- A published slug is permanent. Do not rename it for cosmetic reasons.
- Preserve the existing Wix public path when it is already meaningful and indexed.
- Pick one trailing-slash convention and use it in canonical tags, internal links, structured data, and the sitemap.
- Remove tracking and preview parameters such as `?rev=`, `?v=`, and `utm_*` from canonical URLs.
- All internal links must point to the canonical URL, never a preview or duplicate path.
- If a URL changes, provide a real server-side redirect before publishing the replacement. A meta refresh or JavaScript redirect is not the canonical migration mechanism.

The final build must generate actual files at the canonical routes. A canonical tag pointing to `/post/example` is insufficient when the deployed page exists only at `/content/posts/atlas-html/example.html`.

## Required registry fields

The content registry is the source of truth. Every public record must provide the following data, directly or through a deterministic default:

| Field | Requirement |
| --- | --- |
| `id` | Stable internal identifier |
| `title` | Unique human-readable title |
| `slug` | Stable public slug |
| `kind` | Article, guide, breakdown, tool, asset, case study, or project |
| `summary` | Unique plain-language description of the page |
| `localPath` | Canonical source file in the repository |
| `publicUrl` | Absolute production URL |
| `image` | Local representative image |
| `imageAlt` | Description of the representative image |
| `tags` | Small relevant controlled vocabulary |
| `datePublished` | Honest ISO 8601 publication date |
| `dateModified` | Honest ISO 8601 date of a substantial update |
| `state` | `draft`, `preview`, `published`, `redirected`, or `archived` |
| `indexable` | Explicit boolean derived from the state |

Do not change `dateModified` for cache busting, formatting-only edits, or automated rebuilds.

## Required HTML head

Every indexable article must have, in the original HTML response:

- `<html lang="en">` or the actual language of the primary content.
- A unique, concise `<title>` that identifies the topic and Pavel Zosim.
- A unique meta description that states the problem, implementation, or result without keyword stuffing.
- A self-referencing absolute canonical URL.
- Open Graph type, title, description, URL, and image.
- `twitter:card` set to `summary_large_image` plus matching title, description, and image.
- JSON-LD using `BlogPosting` for articles and `CreativeWork` for project records.
- A representative local image with an absolute production URL.
- Real publication and modification dates when those dates are shown in structured data.

The visible title, HTML title, Open Graph title, JSON-LD headline/name, registry title, and index-card title may be formatted differently, but they must describe the same record.

## Article structured data

Use `BlogPosting` with:

- `headline`
- `description`
- `url` and `mainEntityOfPage`
- `image`
- `datePublished`
- `dateModified`
- `author` as a `Person` named `Pavel Zosim` with the canonical About/home URL

For project records use `CreativeWork` with `name`, `description`, `url`, `image`, and `author`. Do not invent employer, client, award, responsibility, or production-result properties that are not visibly supported by the page.

Structured data must describe visible page content. It is not a place for hidden SEO copy.

## Content and document requirements

- Exactly one visible `h1` per page.
- Use sequential `h2` and `h3` hierarchy; do not use headings as visual labels.
- Put the primary article/project content in the generated HTML. Client-side JavaScript may enhance navigation or interaction, but must not be the only source of the indexable content.
- Every indexable page must be reachable through ordinary `<a href>` links from a public index.
- Use descriptive anchor text; avoid repeated “click here” labels.
- Keep navigation, breadcrumbs or section context, related records, and previous/next series links consistent.
- Prefer original explanations, measurements, diagrams, code, and production context over generic summaries.
- Clearly distinguish Pavel's contribution from team output.

## Image and video discovery

- Store published media locally under `/public/media/`.
- Give every meaningful image descriptive `alt` text and every technical figure a useful caption.
- Do not crop technical evidence; use the canonical media-frame behavior.
- Do not lazy-load the primary representative image. Other below-the-fold media may be lazy-loaded.
- Social-preview images should be readable when shared at a wide aspect ratio; create a dedicated preview when the article image is unsuitable.
- For stronger article image coverage, retain high-resolution variants suitable for `16:9`, `4:3`, and `1:1` structured-data entries.
- Video needs a poster, accessible nearby description/caption, and a stable local or supported embedded source.

## Sitemap and robots contract

Production must publish:

- `/robots.txt`, allowing the public site and referencing the absolute sitemap URL.
- `/sitemap.xml`, containing canonical production URLs only.

The sitemap generator must:

- read published records from the registry;
- exclude drafts, redirects, preview tools, the Style Guide, admin routes, and any `noindex` page;
- use the same URL as the page's canonical tag;
- write `<lastmod>` only from a real `dateModified` or `datePublished` value;
- fail when two records claim the same public URL.

Do not use sitemap priority or change frequency as a substitute for internal linking and useful content.

## Search Console publication workflow

1. Verify the production domain property in Google Search Console.
2. Submit the production sitemap once it is publicly reachable.
3. For each migration batch, inspect representative canonical URLs with URL Inspection.
4. Confirm successful fetch, intended Google-selected canonical, rendered content, and structured data.
5. Request indexing for a few important changed pages; use the sitemap for batches.
6. Monitor Page Indexing, Core Web Vitals, HTTPS, structured-data enhancements, and search-performance queries.
7. Treat indexing as asynchronous. A submitted page is not guaranteed to be indexed or ranked.

## Required repository tooling

Before bulk migration, the repository needs these deterministic checks:

1. `validate-seo`: checks the registry, title, description, canonical, robots state, social tags, JSON-LD, one `h1`, image existence, and canonical-route output.
2. `generate-public-routes`: builds each public record at its canonical route rather than exposing source-folder URLs.
3. `generate-sitemap`: creates the production sitemap from published registry records.
4. `validate-links`: checks internal links, images, video posters, downloadable files, and fragment targets.
5. Preview build: continues injecting `noindex, nofollow` into every GitHub Pages HTML document.

Validation must report all problems during migration and fail the production build once the first canonical templates are stable.

## Analytics and private administration

Search performance and site usage are different datasets:

- Google Search Console: search queries, impressions, clicks, average position, indexing, and crawl problems.
- Web analytics: visited page, landing page, referrer/channel, country, device class, sessions, and engagement.

Recommended first release:

1. Use Google Search Console for indexing and organic-search performance.
2. Use one analytics provider for aggregate traffic. GA4 directly provides Pages and Screens plus country-level reporting; keep advertising features disabled unless they become necessary.
3. Keep analytics administration in the provider's authenticated dashboard. Do not place measurement API secrets, service-account keys, or raw visitor data in this public repository.
4. Add a short privacy notice and a consent implementation appropriate to the selected provider and visitor regions before enabling non-essential cookies.
5. Never send names, email addresses, CV-download query data containing identity, or other personally identifiable information as analytics parameters.

A static `/admin/` page on GitHub Pages can be hidden from Google with `noindex`, but it cannot be made private. Source files, JavaScript, and embedded credentials remain downloadable. If a custom Atlas-styled dashboard is required later, host it behind real authentication and fetch aggregated analytics through a server-side API. It must also use `noindex`, be absent from the sitemap and public navigation, and expose no credentials to the browser.

## Per-page migration gate

- [ ] Registry contains all required fields and the state is correct.
- [ ] Public slug is stable and the build emits the canonical route.
- [ ] Title, description, canonical, Open Graph, Twitter card, and JSON-LD agree.
- [ ] The page has one `h1` and meaningful heading hierarchy.
- [ ] Primary content is present in generated HTML without requiring interaction.
- [ ] Representative image is local, accessible, and suitable for sharing.
- [ ] All links and media resolve; no Wix media hotlinks remain.
- [ ] The page is linked from its relevant public index.
- [ ] Preview output contains `noindex, nofollow`.
- [ ] Production output is included in the sitemap and passes SEO validation.
- [ ] Desktop/mobile visual checks and Google URL/Rich Results checks pass.
