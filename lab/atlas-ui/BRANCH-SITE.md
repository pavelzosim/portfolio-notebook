# Complete branch site

Open `/lab/atlas-ui/?page=review` for the full page list. This is the complete registry-backed review view, not a set of eleven representative fixtures. The live published site is unchanged.

## Routes

- `?page=article&slug=<registry slug>` — every published/indexable record from `content/posts/index.json`.
- `?page=project&slug=<project slug>` — every project from `content/projects/index.json`.
- `?page=home`, `blog`, `projects`, `tools`, `index`, `tool`, `compressor`, `noise`, `privacy`, `notfound`, `components` — page types and working tools. The 404 game remains an isolated interactive document inside the approved media frame; its gameplay is not rewritten.

Internal links resolve to their branch equivalents, including dynamically filtered lists. Purchase URLs, downloads and outside references retain their real destinations. Compare original opens the corresponding source page.

## Ownership

The Style Guide and branch pages consume the same token, shell, component and shared behaviour owners. Source content is read from existing registries/articles, not copied into a second manually maintained content tree. No legacy page CSS or orchestration scripts are imported into the canonical view. Article content adapters preserve every authored sibling content block, text, images and code while mapping known controls and sliders to approved components. Existing Prism/MathJax dependencies are allowed only for code/math rendering; external renderer failure is reported without removing the underlying text.

## Review and delivery

Automated checks are not visual approval. Review each record, including code, mathematics, figures, embedded content and downloads. Record requested changes before accepting that record. Source-specific elements without an approved equivalent must be reviewed before introducing a new component.

This view remains noindex. Commit, merge, static release packaging and deployment require separate explicit authorization. Do not merge the current branch merely because structural tests pass.

Run `node lab/atlas-ui/branch-site.audit.cjs` with the local server on port 8766. It checks every route at desktop/mobile widths and compares article heading, image and code coverage against the original source. This is a review application over retained source content, not an already published static-site replacement.
