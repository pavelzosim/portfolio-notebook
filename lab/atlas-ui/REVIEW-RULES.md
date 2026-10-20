# Page-by-page canonical review

Production migration is deferred until the site's page types are reviewed and their rules approved. Preparing a candidate or passing tests is not user approval. Do not replace production CSS during this phase.

## Home — APPROVED

The user confirmed the complete Home fixture as canonical on 2026-10-20. Preserve its accepted visual hierarchy, interactions and latest annotation fixes. Shared shell: 220 px left / flexible main / 200 px right, 12 px navigation, 11 px rail headings, 14 px body, shared spacing scale. Commander: teal rest, blue hover/focus, yellow key digits. Production migration has not occurred.

## Online Tools Index — CANDIDATE / awaiting annotations

Review route: `/lab/atlas-ui/?page=index`. Original comparison: `/online-tools/`.

- Reuse the approved shell, header, Commander and spacing; no independent index chrome.
- One document h1 and one image/texture category containing the three live tools. No upcoming tools or empty categories.
- Two equal-width columns on desktop/tablet; one below 760 px. Card footer aligns to the bottom regardless of description length.
- A card is a single native link over its complete area, not a button face. One keyboard tab stop, title as its accessible name; no nested buttons or links. No shadow, translation or animated resizing.
- Keep compact procedural diagrams, stable IDs and full descriptions. The quiet `open →` cue is not a second control.
- Left: Index + current local tool directory, with stable tool IDs. No duplicate global site map or redundant filters for three tools in one category.
- Right: only the approved Home `[TOOL_STORE]` carousel, reusing its content, stable-height container and outlined Buy action. Do not add Processing, Catalog or Source blocks to this index.
- Below 1100 px, the store follows the document; below 760 px, the local directory wraps above it. Store navigation remains available on mobile.
- Counts come from published/indexable registry entries. Validate against actual cards rather than silently showing stale counts.

Candidate decisions remain open to user annotations. Home remains approved; no approval is implied for tools, other indexes, project/article fixtures or Components.
