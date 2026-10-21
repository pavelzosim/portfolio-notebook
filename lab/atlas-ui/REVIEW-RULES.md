# Page-by-page canonical review

Production migration is deferred until the site's page types are reviewed and their rules approved. Preparing a candidate or passing tests is not user approval. Do not replace production CSS during this phase.

## Home — APPROVED

The user confirmed the complete Home fixture as canonical on 2026-10-20. Preserve its accepted visual hierarchy, interactions and latest annotation fixes. Shared shell: 220 px left / flexible main / 200 px right, 12 px navigation, 11 px rail headings, 14 px body, shared spacing scale. Commander: teal rest, blue hover/focus, yellow key digits. Production migration has not occurred.

## Online Tools Index — APPROVED

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

The user confirmed this index after the sidebar was reduced to Tool Store. Preserve this approved composition. Production migration remains deferred.

## Tools & Assets — APPROVED

Review route: `/lab/atlas-ui/?page=tools`. Original comparison: `/tools/`.

- Approved shell, typography, rails and Commander; F5 is the active command.
- Complete published/indexable resource registry, grouped into Tools and Assets. No invented records or omitted entries.
- One native full-area link per resource with thumbnail, stable ID, title, summary and tags. Opens its implementation/article page; no duplicate download/buy control inside a row.
- Search by title, summary or tag, actual type filters All/Tools/Assets and sort Newest/Title. Counts reflect visible records. Empty results offer a reset.
- Platform selection combines with the type/search filters: All, CLI and Houdini are enabled and use exact registry tags. Unreal and Unity are visible but natively disabled and labelled Planned; they must not imply existing releases. Platform state survives reload and Reset filters clears it.
- Left: local sections and working type filters, not another global navigation bar.
- Right: only the approved Tool Store component; no redundant Groups block.
- Material Path Manager uses a frame from its own workflow demonstration as its thumbnail.
- Search/filter/sort parameters survive reload. Group anchors remain valid after filtering. No native submit navigation or full-page body replacement.
- Narrow screens stack the search controls and place metadata/store below the document. Images stay bounded; titles and summaries are not truncated.

The user approved Tools & Assets on 2026-10-21. No production migration yet.

## Projects Index — CANDIDATE

Review route: `/lab/atlas-ui/?page=projects`. Original comparison: `/projects/`.

- Approved shell and Commander. All five registry projects, no invented claims.
- Two-column image-led directory; one column below 760 px. One native link per card, with summary, role and environment.
- Left: local project anchors. Right: shared Tool Store followed by the approved Home Online Tools carousel, with stable slide height and working navigation.
- Achievements are quiet metadata below the role/environment, separated by a fine rule, without badges. Reuse approved Home wording and registry facts; the airport record shows validated 24/7 operation rather than an invented award.
- NASA opens the isolated project fixture; other cards retain original detail routes until reviewed.

Projects Index and remaining page types await individual approval. Migration remains deferred.
