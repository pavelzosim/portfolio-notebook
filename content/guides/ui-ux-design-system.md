# Atlas UI and UX Design System Contract

Status: canonical

Revision: 2026.08

Visual reference: `/blog/style-guide/`

Rules index: `/content/guides/README.md`

Read this document before changing layout, navigation, typography, color, interaction, or reusable components.

## Product character

The site is an engineering/editorial portfolio, technical blog, and working R&D notebook. It must feel like documentation built by a technical artist, not a generic product landing page.

Required direction:

- beige dotted-paper workspace;
- JetBrains Mono for technical interface and article content;
- compact editorial rhythm with visible document hierarchy;
- terminal and commander-inspired interface details;
- square geometry, one-pixel rules, restrained dither shadows;
- images, diagrams, video, and code used as technical evidence;
- projects, tools, notes, specialization, About, and Contacts remain easy to reach.

Avoid marketing hero patterns, oversized slogans, decorative gradients, glass cards, pill-button overload, excessive motion, and empty visual spectacle.

## Information architecture

The global navigation order is consistent on every page:

1. Projects
2. Notes
3. Tools
4. Blog
5. About
6. Contacts

The primary item is always `Projects`, never `Active Projects`.

Index pages share the same left navigation:

1. Projects
2. Tools and assets
3. Blog — Breakdowns and lessons

Page-specific filters appear below that shared navigation. An individual article or project adds contextual contents and adjacent-record navigation without replacing the global menu.

Every screen must answer three questions without backtracking:

- Where am I?
- What is this record about?
- Where can I go next?

## Layout system

- Use the shared site shell and canonical content widths.
- Maintain a clear left rail, central document, and optional metadata rail on wide screens.
- Collapse rails deliberately on smaller screens; do not simply squeeze them.
- Keep the main reading column visually dominant.
- Use the spacing rhythm `4 / 8 / 12 / 16 / 22 / 32 / 56` pixels.
- Major sections use a numbered document label, title, optional quiet status, and one-pixel divider.
- End completed H2 blocks with the canonical section break only when the boundary helps scanning.
- End a complete technical record once with the EOF divider.

The dotted background remains visible around the document. Content surfaces may reduce the dots to approximately five-percent visual strength, but must not remove the site-wide paper field.

## Typography

- JetBrains Mono is the canonical technical UI and article face.
- Use the configured serif only for an intentional editorial role; never allow it to appear accidentally through missing font inheritance.
- One `h1` names the document.
- `h2` defines major sections; `h3` and `h4` provide sequential substructure.
- Interface labels are compact and quiet; body text remains comfortably readable.
- Do not imitate hierarchy with arbitrary font-size changes when a semantic heading or component exists.
- Avoid all-uppercase paragraphs. Uppercase is reserved for short system labels, states, and metadata.

## Color

- Paper and ink are the dominant colors.
- `--atlas-accent` (`#0000AA`) identifies selected navigation, focus, and primary interaction.
- `#008181` is the approved hover accent where the component specification uses the teal interaction state.
- `--atlas-crit` (`#8B0000`) is limited to errors, risks, and critical warnings.
- Green indicates confirmed success; amber indicates caution.
- No gradients.
- Color must not be the only way to communicate state.

## Borders, shadows, and surfaces

- Use square corners unless a native control requires otherwise.
- Use one-pixel rules and restrained contrast.
- Dither shadow belongs behind a button or Commander-style interaction. It must never paint over the button face or text.
- Hover may shift the control and reveal the shadow, but must not cause layout movement around the component.
- Avoid nested borders that produce unexplained double or short lines.
- Do not add decorative `border-top` rules to facts, contacts, or two-column layouts when row separators already provide structure.

## Links and actions

- Inline text links use an underline or another clear textual affordance.
- Bracket links such as `[github]` do not also need an underline in their resting state.
- Repeated destination actions use the quiet white button with black outline, lowercase label, dither shadow, and right-aligned arrow.
- Use one list/index action per section. Remove duplicate links that lead to the same destination.
- Filled blue is reserved for the primary action in a local decision context, such as a download.
- Buttons must use real `<a>` links for navigation and `<button>` for actions.
- Focus states must remain visible for keyboard users.

## Content presentation

- Selected Projects, Tools and Assets, and Blog records follow a shared hierarchy.
- Show no more than four image-led highlights in a section; continue with compact text records when more items are needed.
- Recent lists should be dense and readable, not card-heavy.
- Technical images use `object-fit: contain`; do not crop evidence.
- Demo reel video uses a deliberate wide frame rather than an incidental square thumbnail.
- VFX flipbooks are square loop studies with controlled playback, posters, captions, and stable grid sizing.
- Tables are for exact comparable values; diagrams are for topology, ownership, process, and spatial relationships.

## Motion and interaction

- Motion must communicate state or reveal evidence.
- Respect `prefers-reduced-motion`.
- Do not use rapid floating, bouncing, or idle character animation.
- Video loops start only under the component's playback policy and remain controllable.
- Sliders and carousels require working previous/next controls, keyboard access, an announced position, and a non-JavaScript fallback.
- Hover behavior must never reduce text contrast or hide information.
- Do not depend on hover for essential content because touch users do not have hover.

## Responsive behavior

- Validate at desktop, narrow laptop/tablet, and mobile widths.
- Keep tap targets usable and navigation readable.
- Stack metadata facts as label, value, divider on narrow layouts.
- Prevent code, tables, long URLs, and media from expanding the viewport.
- Allow tables and code to scroll within their own frame when necessary.
- Preserve captions and media aspect ratio at every width.

## Accessibility

- Use semantic landmarks: `header`, `nav`, `main`, `article`, `aside`, and `footer`.
- Provide one logical heading hierarchy and a meaningful page title.
- Every meaningful image needs descriptive alt text; decorative images use empty alt text.
- Captions explain what the reader should inspect, not merely the file name.
- Controls require accessible names and visible keyboard focus.
- Do not create keyboard traps in dialogs, sliders, media, or command interfaces.
- Keep text and interactive contrast sufficient in normal, hover, active, and disabled states.
- Use native HTML before adding ARIA.

## CSS contract

- `/styles/atlas.css` is the stylesheet orchestrator.
- Reusable rules belong in `/styles/framework/`; page modules handle composition only.
- Components consume canonical tokens rather than introducing near-duplicate colors and spacing.
- Do not duplicate component CSS inside article HTML.
- Do not use forced declarations. Resolve cascade problems through module order, component scope, and modifier/state classes.
- Do not use inline styles for reusable behavior.
- Increase the relevant cache version when published CSS or JavaScript changes.

## UI/UX review gate

- [ ] The page uses the shared global navigation and site shell.
- [ ] The current location and next destinations are obvious.
- [ ] Visual hierarchy matches the rendered Style Guide.
- [ ] No marketing-landing-page patterns, gradients, or accidental serif text appear.
- [ ] Buttons, links, hover, focus, and dither shadows follow canonical states.
- [ ] Images and videos preserve technical evidence without crop.
- [ ] Desktop, tablet, mobile, keyboard, and reduced-motion behavior are checked.
- [ ] No unexplained duplicate borders, destination buttons, or page-specific component forks remain.
- [ ] CSS uses canonical modules and contains no forced declarations.
