# Design Tokens — ikea.cn 首页

Extracted via getComputedStyle at 1440px desktop.

## Fonts

- Primary stack: `"Noto IKEA Latin", "Noto Ikea SC", "Noto Sans SC", "Noto Sans", Roboto, "Open Sans", system-ui, sans-serif`
- Self-hosted files (public/fonts/, src/app/fonts/):
  - noto-ikea-400.latin.woff2, noto-ikea-700.latin.woff2, noto-ikea-400i.latin.woff2, noto-ikea-700i.latin.woff2
  - NotoIKEASimplifiedChinese-Regular.woff2, NotoIKEASimplifiedChinese-Bold.woff2
- Root html: 16px; body: 14px / 21px line-height.

## Colors

| Token | Value | Notes |
|---|---|---|
| background | #ffffff | |
| foreground | #111111 | primary text |
| muted text | #484848 | secondary text |
| border | #e5e7eb | `rgb(229,231,235)` |
| light gray | #f5f5f5 | search bg, secondary bg |
| gray 150 | #dfdfdf | pill borders |
| IKEA blue | #0058a3 | primary buttons, links |
| IKEA yellow | #ffdb00 | accents, emphasized buttons |
| IKEA red | #cc0008 | destructive / tags |
| IKEA orange | #ca5008 | accents |
| beige theme | #f5deb3 | current homepage theme color (header bg) |

## Spacing / layout

- Content width: 1280px inner (80px page padding each side on 1440 viewport), max 1440.
- Section gap: 32px mobile, 48px desktop.
- Hero height: 600px desktop, 520px mobile.
- Page vertical padding: 32px.

## Radii

- Buttons/pills: 9999px (64px). Cards: 4px (detail-info), 8px+ for product cards.
- Tooltips: 4px.

## Buttons

- `.i-btn--primary`: height 40px, padding 0 20px, font 12px/700, radius 64px, bg #0058a3, white text.
- `.i-btn--xsmall`: 32px.
- `.i-btn--emphasised`: yellow #ffdb00.

## Pills (tabs)

- `.i-pill--small`: height 40px, padding 0 20px, 14px/700, border 1px #dfdfdf, white bg.
- Active: bg #111, border #111, white text.
