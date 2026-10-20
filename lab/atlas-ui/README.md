# Atlas canonical UI — isolated review

Open `http://127.0.0.1:8766/lab/atlas-ui/` on the existing local source server.

Five fixtures use real repository content: Home, Online Tools index, Procedural Travel Resolution article, NASA First Woman project and the working Sprite Sheet tool. The header's review switcher stays in the lab; normal content links may open existing public/local pages. “Compare original” opens the corresponding existing implementation.

The sixth review tab, Components, exercises shared action geometry, long labels, fields, an engineering-scale range, disabled controls and empty/warning/error messages. Its form validates locally and its slider responds to keyboard input; the action variants above it are visual examples, not application commands. “Compare original” opens the existing Style Guide.

## Isolation boundary

- No `atlas.css`, legacy entry points or page CSS are loaded.
- `tokens.css`: tokens, reset and base typography.
- `shell.css`: one implementation of header, columns, rails and Commander.
- `components.css`: shared component geometry and states.
- `fixtures.css`: composition adapters for existing content markup.
- `preview.js`: content-only imports and preview routing; existing sprite algorithms are reused without edits.
- `navigation.js`: one owner for outline selection, anchor focus/offset and Commander keyboard behavior. The sticky-header offset is measured, not duplicated as page-specific pixel values.
- No production file is replaced. `lab/` is outside the production builder's directory allowlist and has no sitemap entry. HTML is explicitly noindex and has no analytics.

This is a review harness, not a second production system. It requires JavaScript to read source fixtures. The later migration must render public content in HTML at existing canonical routes. Real article content is included, but MathJax/Prism/media enhancements are not yet migrated. Home now includes all ten source sections and current registry highlights/recent lists. No migration approval is implied.

## Complete Home review

Home imports the complete source main and rail content, not a manually abbreviated copy. Existing registry renderers and the wireframe drawing are reused without their styles. `home.js` owns the candidate's local filtering, manual online-tool carousel and VFX playback/show-all. VFX auto-plays muted when visible and pauses offscreen or when the page is hidden. Per the latest user request, these showcase loops auto-play even under a reduced-motion browser profile. A single keyboard-accessible section pause/resume action replaces per-video toggles; other reduced-motion CSS behavior is unchanged. The search filters rendered record cards; submitting opens the full Blog search. Buttons, cards, section flow and shell still have their single style owners. Production URLs remain on non-fixture content links; the Sprite Sheet destination stays inside the lab.

Full Home verification includes all ten sections, completed registry rendering before search binding, zero-result filtering and reset, one visible online-tool slide, initial 8/show-all 22 VFX loops, store expansion, and no viewport overflow at 390 / 1140 / 1830 px. Existing article/project/tool/control checks remain required.

## Homepage review batch: 13 annotations

- Shelf slides occupy one grid cell: the tallest slide reserves height. Hidden slides remain invisible and inert; controls and the following shelf stay stationary. Solid paper containers group each shelf, with a compact outlined Buy action.
- VFX removes file-name/duration caption fragments and native control bars. Visible-loop autoplay, offscreen pause and keyboard-accessible group pause/resume are verified.
- Highlight images fill a fixed-height preview using centered cover instead of squeezing portrait sources into thin strips. This treatment is for thumbnail navigation only; full technical article media is not cropped.
- Project rows have four explicit columns; mobile hides the type column. Record metadata aligns to the title's first baseline.
- Search and profile strip both measure 36 px on a wide desktop; mobile may wrap naturally.
- Stack links have no resting underline, specialization tags have hover/focus states, and the redundant second contact sentence is removed in the lab adapter only.

Regression checks passed for both shelf control positions over six switches, profile/search height equality, first-row arrow alignment, tag hover, caption cleanup, VFX playback/offscreen pause/group pause-resume, and complete responsive Home interactions. Production source content remains unchanged.

Follow-up: rail tags and carousel arrows share hover/focus tint; Online Tools controls have a 16 px gap below the preview. Candidate CSS and JS entry points/imports carry matching review revisions to avoid stale modules during annotation; source-content requests bypass the HTTP cache. Reload the preview after each delivered review batch.

## Decisions retained from the latest user review

Keep Gumroad/Online Tools shelves on Home, email first without GitHub, full-area catalog links without button faces, plain rail lists and yellow Coffee action. These supersede the older corresponding sidebar recommendations in the Markdown contract. Review and reconcile that contract before production migration.

## Migration gate

Review all five fixtures at 390 / 1140 / 1830 px, keyboard, focus, long content and tool upload/export. Approve the shell first. Then replace old owners by template type and remove superseded rules; do not layer this over the current CSS. Do not publish or merge without explicit approval.

## Rhythm under review

The shared spacing scale is 4 / 8 / 12 / 16 / 22 / 32 / 56 px. A content flow uses 16 px, a grouped element or media break 22 px, and a section boundary/inset 32 px. Document heads and sections own their child spacing rather than accumulating native paragraph margins. Article prose is limited to 72ch; technical media can use the full document width. At mobile width the content inset becomes 18 px while type sizes and internal flow remain stable. Colors, decorative details and full feature parity are not approved by this pass.

## Verification

`node --test lab/atlas-ui/contract.test.cjs` checks the isolation and module ownership boundary. Initial Edge browser verification covered all five fixtures at 390 / 1140 / 1830 px: one h1, no legacy stylesheet, no horizontal viewport overflow or JavaScript errors. Sprite Sheet upload, PNG download and clear passed using an 8×8 fixture. This does not replace visual approval or complete production feature-parity testing.

Navigation verification: article outline Enter moves focus to the heading; scrolling updates the selected outline entry; anchor targets clear the measured sticky header on desktop and mobile. Tool selects Commander F9, F6 navigates to the article fixture, and function keys do not navigate while editing an input. Native history/hash behavior is retained; scroll selection does not rewrite the URL.

Commander uses shared `--command-rest: #008181` and `--command-hover: #0000AA` on every command at all breakpoints. Hover and keyboard focus share the blue face; the current-location marker remains independent. Review-17 versions CSS and module imports together.
