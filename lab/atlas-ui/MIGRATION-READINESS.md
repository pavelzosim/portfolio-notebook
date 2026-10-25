# Canonical migration readiness — 2026-10-25

The approved Atlas design is integrated into the public build in the current branch. No merge, commit, push or deployment has been performed. Local built-site review: http://127.0.0.1:8767/.

## Build implementation

- Default `python scripts/build_github_pages.py` materializes the shared canonical shell at existing public routes. `--legacy` remains a comparison build for the prior design.
- Rendered HTML includes complete article/project/index content and existing canonical, social and structured metadata. Public links use stable paths rather than lab queries. Approved branch editorial revisions are included.
- The same component owners supply lab and public output. Assets under `/ui/atlas/` have a content-derived release version. Independent per-document JSON inputs prevent runtime self-fetch loops; public composition enables the original interactive behaviour.
- Lab review UI and review footer are excluded. Indexable pages retain indexability; 404, Style Guide, internal templates and isolated notebook game remain noindex. The isolated game does not load a second analytics instance.
- If interactive composition fails, static article content remains visible. JavaScript is needed for interactive controls, not for reading/indexing the page.
- CI installs the pinned browser renderer, builds, checks algorithms/contracts, audits public SEO/links and runs browser checks before uploading the site artifact.

## Verification

- Canonical browser audit covers 58 public routes with JavaScript disabled and enabled, desktop/mobile overflow and slider navigation.
- Real public-DOM exports verified for Sprite Sheet PNG, Image Compressor PNG and Noise Generator normal-map PNG.
- Shared component/media/related records, navigation, analytics consent, CSS contract and all three tool engines: 42 unit tests passed.
- Production SEO/link audit: 66 HTML documents, 42 posts, 56 sitemap URLs; zero errors and warnings.
- Local screenshot review: Home at 1440 px, memory panel, compact Enemy System article at 390 px. Runtime-failure check retains article heading and diagram.
- Original external shader/video URLs are retained. Build-time snapshot generation blocks third-party requests; it does not certify third-party service availability.
- JackPressed is archived and excluded from published/indexable discovery. Its old public URL redirects to Image Compressor using the site's HTML fallback, not an HTTP 301. Archived authoring source remains in the repository.

## Release procedure

Review the built site, then use the existing merge/deployment process when explicitly authorized. Preserve the previous deployed commit/artifact for rollback. After deployment, smoke-check real canonical URLs, analytics consent and downloads on the production host. No public host was changed during this work.
