# Canonical design system

The user approved the Atlas Style Guide on 2026-10-23 as the single source of truth for visual components and article styling.

- Before UI work or article authoring, read `lab/atlas-ui/REVIEW-RULES.md` and inspect `/lab/atlas-ui/?page=components`.
- Reuse approved components and shared implementations. Do not create page-specific visual variants or duplicate style definitions.
- A new visual element must first be reviewed by the user. After approval, add its example and rules to the Style Guide and its implementation to the shared owner, then use it on pages.
- Articles must follow `content/guides/article-authoring.md` and the approved catalogue. Do not invent article-local CSS.
- Shared owners: `lab/atlas-ui/tokens.css` for tokens, `shell.css` for shell, `components.css` for component faces, shared JS modules for behaviour. Existing rules in `fixtures.css` must be consolidated, not extended with override layers.
- Public `/blog/style-guide/` is the eventual public entry point. Until migration is authorized, the approved lab catalogue takes precedence over legacy public styles. Never import legacy CSS into it.
- Catalogue approval does not authorize production migration, commits or pushes. Apply it to subsequent in-scope work without changing unrelated approved layouts.
