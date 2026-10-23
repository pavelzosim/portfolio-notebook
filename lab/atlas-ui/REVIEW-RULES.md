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

## Projects Index — APPROVED

Review route: `/lab/atlas-ui/?page=projects`. Original comparison: `/projects/`.

- Approved shell and Commander. All five registry projects, no invented claims.
- Two-column image-led directory; one column below 760 px. One native link per card, with summary, role and environment.
- Left: local project anchors. Right: shared Tool Store followed by the approved Home Online Tools carousel, with stable slide height and working navigation.
- Achievements are quiet metadata below the role/environment, separated by a fine rule, without badges. Reuse approved Home wording and registry facts; the airport record shows validated 24/7 operation rather than an invented award.
- NASA opens the isolated project fixture; other cards retain original detail routes until reviewed.

The user approved Projects Index on 2026-10-21, including quiet achievement lines and both sidebar carousels.

## Blog Index — APPROVED

Review route: `/lab/atlas-ui/?page=blog`. Original: `/blog/`.

- Complete published/indexable registry, newest first; one native link per record.
- Approved Home record-row rhythm with date, kind, title, summary and tags. No nested controls.
- Search combines with registry topic selection and Newest/Title sorting; URL preserves state. Empty results provide reset.
- Left topic filters; right shared Tool Store and Online Tools. No redundant counts in the sidebar.
- Records are grouped into stable numbered topic volumes using registry groups, with headings and per-volume counts. Left navigation links to visible volumes; search and topic filters hide empty volumes. Sorting is within each volume, not across the entire directory.
- Within volumes, use quieter h3 subcategories for actual series and related workflows (From File to Pixel, ShaderLab Cheatsheet, C# Variables, etc.). Each record occurs exactly once; no empty chapters. Sorting applies within each chapter. This candidate taxonomy lives in the lab until approved.
- Each main volume has a one-sentence content summary under its heading, using the shared muted section-intro style rather than another emphasis level.
- Existing isolated article opens for Procedural Travel Resolution; other articles retain original routes pending detail review.

Quick filters All/Houdini/Unreal/Unity/Foundation combine with search and topic selection. Nested outline links jump to subcategories with stable name-based IDs. The user approved Blog Index on 2026-10-21.

## Article — APPROVED

Review route: `/lab/atlas-ui/?page=article`. Full Procedural Travel Resolution article, not abbreviated sample content.

- Approved shell; article prose uses the entire inner document width rather than a separate 72ch limit. Shared reading measure remains unchanged elsewhere. Left section outline retains keyboard focus and anchor offsets.
- Media frames retain the legacy engineering-container composition: labelled header, inset uncropped media and separated caption, all sized with candidate tokens.
- Project Map / related write-ups is a separate bordered panel with its own header and inset list, not loose links in the prose.
- Article passport is an inset bordered container. Utility headers (passport status, TOC, media, diagrams and Project Map) share compact 4 px vertical padding and a paper-token fill, distinct from their surface-token body. This is article-scoped and applies across breakpoints.
- Panel bodies use an article-scoped warm tint (#f3ede6); headers retain paper fill. Passport tags are 12 px outlined native links with 32 px minimum height and hover/focus feedback. Diagram headers have zero caption margin, flush with the container top.
- Passport metadata now lives entirely in the compact filled container header, replacing the decorative terminal/status line: project, module, WEB format, log ID, author, created and revision. No duplicate metadata grid below the title. If no explicit article version exists, revision uses the actual dateModified value, not an invented version number. Header fields wrap naturally on narrow screens.
- Latest refinement: remove module and WEB format fields. Tags match the supplied legacy reference: uppercase bold 12 px blue text, thin gray border, surface fill, compact 26 px minimum height; retain hover/focus. This supersedes the earlier 32 px tag treatment.
- Latest annotations: tags use 10 px metadata size; reduce summary vertical padding to 8 px. Log ID precedes project; author/created/revision align to the right and wrap naturally.
- TOC follows the supplied reference with bold 14 px titles, dotted leaders and dashed row separators. Schematics use paper fill, bold labels and black note labels. Section boundaries have numbered `// § NN` rules; section titles have an aria-hidden section mark. Remove the redundant Watch on YouTube caption link, not the embedded player's own UI.
- Latest refinement: TOC titles 12 px / 600, numbers 10 px / 500; diagram canvas pale neutral gray #eeece9. Paragraph spacing 22 px. Summary top padding 4 px; tags have 2 px vertical padding and compact 21 px minimum height, with the tag row shifted upward. These rules are article-scoped at all responsive sizes.
- Latest exact annotations supersede prior values: diagram canvas and note background use shared surface #EEE7DF; passport h1 vertical padding 0; tag-row padding top 0 / bottom 11 px; summary prefixed Summary: with top 0 / bottom 16 px. Apply consistently across viewport widths, keeping responsive horizontal insets.
- Utility panel headers use #696969 / 400, not bold ink; article section headings retain hierarchy. Project Map links have no underline, with hover/focus feedback. An explicit Share panel follows the article EOF, with LinkedIn/Facebook/Twitter share URLs using the canonical public record URL (never the local lab URL); these are native outbound links, not automatic posting.
- Share follows the supplied visual: no enclosing border or filled header; [SHARE] left and Share this record right above a fine rule, then outlined [linkedin] / [facebook] / [twitter] links. Shared responsive wrapping and hover/focus remain.
- Project Map hover and link keyboard focus tint the complete linked row, not only the title text. The non-linked current record has no interactive hover treatment.
- Each linked Project Map row is now one full-width native anchor containing number/status/title, not a text-only link. Share links use 10 px text and no Share this record subtitle. Remove Published sidebar status; replace generic Read Next with other published/indexable records in the current registry group, excluding the current article.
- All article panel bodies now resolve to shared surface #EEE7DF, replacing the earlier warm panel tint. TOC row links explicitly use the same rest background; hover/focus remains distinct and utility headers retain paper fill.
- Readability normalization requested by the user: article-only muted #5f5b57, metadata/utility labels 12 px, body 16 px / 1.65, tag targets at least 28 px high. Full-width prose remains as approved; larger text reduces characters per line. Load actual 500 font weight. Remove superseded declarations from identical top-level selectors without changing media-query order. No change to approved other page types and no claim of complete WCAG certification.
- Preserve article diagrams, technical images, tables, code and captions. Diagrams and screenshots are never cropped; wide tables/code scroll locally.
- Restore the original article passport composition (terminal status bar, title, project/module/version/ID, author/date, tags), adapting typography to new tokens. Keep an actual h1, 24–32 px responsive.
- Restore the in-body numbered table of contents alongside the rail. Native links have hover/focus and keyboard anchor targeting. References, EOF marker, inline code, media captions and diagrams reuse the new spacing/type/color system; never load the legacy stylesheet wholesale.
- User approved the article detail as canonical on 2026-10-21. Production migration remains deferred.
- User refinement after readability review: article body is 14 px / 1.65 across widths, not 16 px. Preserve the improved contrast, 12 px metadata, paragraph spacing and 28 px tag targets.
- Section divider is an end marker for the preceding section, not a duplicate introduction: // § 06 closes section 06 before heading 07. Final // § 09 closes article text before Project Map. Spacing is tighter above the end marker and larger below it.
- Article h3/h4 subheadings have a small muted > prefix, marked aria-hidden so accessible heading names remain unchanged.
- Project detail candidate: `/lab/atlas-ui/?page=project`, NASA First Woman. Complete registry scope, constraints, role, solutions, media, locations, results, awards and ISS video. Preserve uncropped media; two-column galleries become one below 760 px. Full-size images open through native links; videos have controls and do not autoplay. This page awaits user approval.
- Project gallery correction: preserve carousel UX rather than rendering dozens of images in a grid. One uncropped fixed-height image per topical slider; explicit Prev/Next, live counter, Arrow/Home/End keyboard navigation and full-size native links. No autoplay; hidden slides are inert. All original media retained.
- Project information architecture follows the supplied legacy reference: numbered sections with quiet context labels; concise Overview, paired Scope/Constraints bordered lists, separate footage, full-width contribution/solution rows, tool chips above solutions and metrics beside results. Context columns stack below 760 px. Do not flatten useful legacy UX into plain text or an image wall.
- Project detail now reuses the approved Article detail style owner via data-detail: same passport, TOC, typography, muted labels, panel surface and closing section rules. Preserve paired context lists and topical sliders. Right rail contains role/environment plus related projects (shared XR type or engine) and published non-resource notes matching production-tool tags. No invented project dates or duplicated tool list. Article remains approved; Project remains a candidate.
- Project passports must not imply sole authorship of collaborative work: omit auth. Personal contribution belongs in My role. Article authorship is separate and unchanged.
- Move project role/environment into the passport's right-aligned metadata group with client; remove the duplicate Record sidebar block. Long values wrap naturally, including on mobile. Sidebar starts with related projects and notes.
- Project rhythm refinement: production stack is plain text with dot separators, never fake buttons. Keep context paired/bordered; contribution uses light two-column left-rule entries (one column on mobile); solutions use numbered open rows; results use metrics and lighter supporting facts. Shared Article passport/type/section markers remain unchanged; no content omitted.
- Latest project simplification: passport strip contains only log_id, client and status; move role and stack to the rail and remove duplicated tool tags. Rail order is Record (id/client/status/role), Stack, Related (up to three projects and three notes). No internal project TOC; retain sticky left outline and keep Article TOC unchanged. Media layout, section markers and data-driven contribution groups remain separate pending work.
- Follow-up: UI/badges/robot/locations use two-column contain galleries (one column on mobile), not four carousels. Remove repetitive media labels and project closing section markers. Contribution grouping and solution headings now come from lab-local project-layouts.json; unmatched source content is preserved. Production registry remains untouched.
- Latest user correction supersedes the grid experiment: retain four topical image sliders, not an image wall. Restore Article-style ruled closing markers after project sections. Keep the simplified project passport/rail and data-driven grouping. Never remove these UX elements without an explicit new decision.
- Project spacing uses Article rhythm: heading-to-content 16 px; subheading-to-text 12 px; closing rule 22 px after content and 32 px before the next section. Section flow-root and zero final-child margin prevent compounded gaps; no leading margin on grouped role/solution/context headings. Slider controls follow media by 12 px. Same scale at all widths.
- Latest user annotations restore the in-body Project TOC using Article styling and keyboard anchor behavior, and add END OF ARTICLE / EOF after the final section marker. Remove the Spanish NASA+ link, retaining ISS video/caption credit. Remove the Home pause-loops button at user request; offscreen/document-hidden pauses remain. This removal is not a claim of WCAG motion-control compliance.
## NASA First Woman / Project detail — APPROVED

User approved the final project candidate on 2026-10-23. Preserve the latest annotations over earlier experiments: short passport, Record/Stack/Related rail, both outlines, topical sliders, Article-style closing rules and EOF, no Spanish NASA+ link, no sole-author claim. Data-driven role groups and solution headings remain lab-local until migration. Production is unchanged.

## Sprite Sheet Assembly / Tool detail — CANDIDATE

Review route: `/lab/atlas-ui/?page=tool`. Source comparison: `/online-tools/sprite-sheet-assembly/`. Uses real upload/preview/export behavior with isolated candidate styling. Check keyboard controls, empty/loaded states, settings and output at desktop/mobile widths. Await explicit approval; no production migration yet.
- Tool detail: after Export, add Article-style Share links using the canonical tool URL, then an Other online tools carousel from the published registry excluding the current tool. Native full-card links, Prev/Next/counter and arrow keys; no autoplay. Tool upload/export behavior remains unchanged.
- Other online tools refinement: show all alternatives as compact native-link preview cards, two columns above 760 px and one below. No carousel, hidden alternatives, arrows or counter. Keep current tool excluded.
- Other tools compact reference: contiguous two-column grid with horizontal thumbnail/text cards; 96 px contain thumbnail, 12 px title, two-line muted summary, quiet open cue. One column with 88 px thumbnails below 760 px. Native link keeps full title/summary in the DOM. Support note has 16 px gap before the donation action.
- Other-tool cards latest density: 114 px baseline minimum height, text inset 6×8 px, 3 px internal gap. Preview fills the height of its narrow column with cover/center (horizontal cropping allowed only for these navigation thumbnails). Height remains content-driven for wrapping/zoom; never clip link text to enforce an exact screenshot height.
## Sprite Sheet Assembly — APPROVED

User approved on 2026-10-23 after Share, compact related-tool cards, support spacing and preview alignment refinements. Preserve working upload/export/clear. No production migration.

## Image Compressor — CANDIDATE

Route `/lab/atlas-ui/?page=compressor`. Real source controls and compression scripts; isolated candidate CSS only. Reuse Share and compact related-tool cards, excluding current tool. Await user approval.
- Compressor rail includes How to use, Source (actual local processing/interface source links, no invented repository/license) and Support after existing metadata. Remove duplicated main-column support panel; preserve 16 px note-to-action gap.
- Latest Compressor annotation removes Source entirely: no Processing core / Tool interface links. Keep How to use and Support; do not add a Source block without meaningful user-facing information.
- Tool Support is one shared renderer and one component stylesheet owner across Sprite Sheet/Compressor, using the accepted yellow action and 16 px note gap. Remove page-specific support spacing overrides. Compressor header has no duplicate workflow list; instructions belong in How to use. Do not introduce alternate component faces during content import.
- Compressor settings use shared control-panel/control-group components with semantic Workflow → Encoding → Dimensions → Transparency fieldsets. Original control IDs/handlers remain. Explain disabled PNG quality and matte dependencies inline; move processing status next to the batch action. No automatic processing or changed encoder behavior. Validate upload/process/download as well as responsive layout.
- Compact settings refinement: three stacked-field columns (Workflow & encoding, Dimensions, Transparency); two columns below 1250 px, one below 760 px. Quality follows Output format. POT checkbox uses left-aligned input/caption with hint below. Preview background/channel controls share a two-column toolbar, stacking on mobile. Shared component modifiers own geometry, not per-page override chains.
- Settings fieldsets stretch to the same height within each responsive row, with fields packed at the top. Settings explanatory paragraphs use the existing Style Guide atlas-callout--note contract, canonically styled in components.css; dynamic warning ID remains intact. Do not invent new note variants per page.
- Tool release baseline is 0.1, owned once in lab/tool-release.json and used by candidate tool titlebars and online-tool cards. Preserve this source for future tool fixtures; no hardcoded independent version labels. Preview help paragraphs also use shared System Note, retaining loupe-help ID and accessible descriptions.
- Compressor settings are an initially open native disclosure; status and Process batch remain visible outside it. Remove duplicate action hint. Preview toolbar follows images; loupe instructions are visually hidden but retain aria-describedby target. Export guidance uses System Note. Preset labels describe colour/albedo, data maps and pixel art without claiming GPU texture compression or changing existing encoder algorithms.
- Settings native summary includes visible Collapse/Expand action text, synced to open state. Technical boundaries ends with a mailto suggestion invitation using the existing public contact pavel.zosim@protonmail.com.
## Image Compressor — APPROVED

User confirmed as canonical on 2026-10-23. Preserve compact equal-height settings, disclosure, status/action row, System Notes, preview toolbar placement, shared support/share/related cards and v0.1. No production migration.

## Noise Generator — CANDIDATE

## Style Guide — APPROVED (2026-10-23)

Home rail motion approved on 2026-10-23: Tool Store cycles every 3 seconds, Online Tools every 5 seconds, smooth 450 ms horizontal transitions, no Play/Pause buttons. Pause temporarily for hover/focus/hidden document. Wireframe retains pointer interaction and click-to-change with slow axial drift (0.12 radians/second); reduced motion suppresses the drift. These behaviours are shared catalogue contracts, not page-specific alternatives. Next review candidates: compact record previews and record rows.

User confirmed `/lab/atlas-ui/?page=components` as the single source of truth for styles and components. This decision supersedes earlier conflicting visual notes in this chronological log. Apply approved components to subsequent page work. Before article authoring, inspect the catalogue and follow the authoring contract. New unique elements require user review before registration in the Style Guide and shared implementation, then reuse. Do not create local overrides or parallel style sources. Public migration, commits and pushes remain separately authorized actions. The implementation still contains legacy candidate rules to consolidate during application; approval does not mean that consolidation is already complete.

## Noise Generator — CANDIDATE (continued)

Route `/lab/atlas-ui/?page=noise`. Uses actual worker generation, material preview and map exports with isolated canonical styling. Shared version/support/share/related cards. Await user review.
- Noise settings reuse shared control groups: Surface, Noise & fractal, Detail & direction, Normals. Both Noise/Compressor use the same native disclosure factory and Collapse/Expand labels. Noise actions remain outside the disclosure; map-specific controls are a nested disclosure. Preserve all input nodes and worker bindings.
