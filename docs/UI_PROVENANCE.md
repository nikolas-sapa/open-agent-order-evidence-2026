# UI source and adaptations

Order Evidence uses a static semantic HTML/CSS/JavaScript port of selected source structures from Nikolas's local `design-demos` library, read before implementation on October 22, 2026. This is a product workspace, not a copy of the demos' fictional marketing claims.

## Layout source

- `~/Developer/misc/design-demos/app/src/pages/Ledger.tsx`, lines 65–84: top bar, 24px square brand mark, horizontal alignment and hairline separation.
- Same file, lines 134–193: bordered overview frame, compact chrome/header and separated interior groups.
- Same file, lines 249–270: source activity-row structure with an aligned leading marker, flexible text column and trailing metadata. Adapted to evidence strips and immutable source references.
- Same library's `components/ui/button.tsx` and `input.tsx`: native control dimensions, rounded 6px control geometry, visible keyboard focus and disabled-state behavior. Translated to CSS/native elements; no Radix/React runtime copied.
- `Circuit.tsx` and `Atlas.tsx` were read for comparison. Their terminal/orbit/globe/marketing structures were not used.

The layout retains Ledger's dark neutral surfaces, hairline grouping, compact metadata and split content proportions. Product adaptations: no hero marketing claims/charts, no decorative registry effects, useful evidence disclosures instead of animated feed items, source fields rendered from actual revision data, responsive single-column flow. Muted text is raised to `#8f8f8f` for contrast. Geist type, blue `#006bff` primary action, neutral disabled controls and one accent action follow the current Design DNA. No gradient backgrounds or emoji.

The original decorative React components (`ShineBorder`, `AnimatedList`, `NumberTicker`, etc.) were deliberately not imported or approximated. The static HTML/CSS translation needs no UI runtime dependencies. All API strings use DOM `textContent`; evidence references open native disclosures and retain keyboard focus.

## Fonts

Geist Sans (regular 400, medium 500, semibold 600) and Geist Mono (regular 400) are local, unmodified TTF files downloaded from Google's font CDN. Font family stylesheet observed October 22, 2026:

`https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`

Font URLs:

- `https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4nQ.ttf`
- `https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4nQ.ttf`
- `https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RQuQ4nQ.ttf`
- `https://fonts.gstatic.com/s/geistmono/v6/or3yQ6H-1_WfwkMZI_qYPLs1a-t7PU0AbeE9KJ5T.ttf`

SIL Open Font License texts retained alongside fonts as `OFL-Geist.txt` and `OFL-Geist-Mono.txt`, from Google's official `google/fonts` repository (`ofl/geist/OFL.txt`, `ofl/geistmono/OFL.txt`). No third-party font requests occur during workspace use.

## Verification status

JavaScript syntax checked during implementation. Actual browser screenshots, keyboard navigation and HTTP integration are separate root verification gates; this note does not assert that they passed.
