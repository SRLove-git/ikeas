# Page Topology — ikea.cn 首页 (https://www.ikea.cn/cn/zh/)

Extracted at 1440px desktop (page height ~7696px) and 390px mobile (page height ~9169px, mobile UA).

## Global structure

```
body.font-ikea
  main
    .font-ikea
      .i-layout
        .i-layout__header   (desktop: notice bar + nav header, 174px; mobile: separate)
        .i-layout__body     (desktop: hero + main content + footer placeholder)
        .i-layout__footer   (footer, 585px)
```

Desktop `main` content wrapper: `.max-w-page` = max-width 1440px, min-width 1100px, padding 0 80px,
padding-top/bottom 32px, margin auto. Section spacing: `space-y-8` (32px) mobile, `lg:space-y-12` (48px) desktop.

## Desktop sections (top → bottom, with page-y offset at 1440px)

| # | Section | Working name | Height | Interaction model |
|---|---------|--------------|--------|-------------------|
| 0 | `.nav-header-message` | NoticeBar | 40px | time-driven (vertical autoplay carousel, ~3s) |
| 1 | `.nav-header` | Header (logo/search/actions + menu) | 134px | click/hover (mega menu dropdown, app-promo hover) |
| 2 | `header_container_copy` | (spacer) | 0px | static |
| 3 | `.mb-8.lg:mb-12` hero carousel | HeroCarousel | 600px desktop / 520px mobile | time-driven autoplay + click pagination bullets |
| 4 | `.pub-inspiration-card` (1) | PromoInspirationCard | 704px | static (4 promo tiles) |
| 5 | `.pub-columns.three-columns` | ServiceColumns | 257px desktop / stacks mobile | static |
| 6 | `.ranking-container` | RankingSection | 515px | click-driven (category pills switch product lists) |
| 7 | `.pub-visual-pill-slider` (1) | RoomPillSlider | 401px | click-driven + horizontal scroll |
| 8 | `.pub-inspiration-card` (2) | InspirationTipsCard | 704px | static |
| 9 | `.m-x-5.md:m-x-0` | ProductInspiration | 1894px desktop / 1287px mobile | click-driven tabs + sticky tab bar; add-to-cart; load more |
| 10 | `.pub-visual-pill-slider` (2) | SustainabilityPillSlider | 401px | click-driven + horizontal scroll |
| 11 | `.rich-text__container` | ServicesHeading | 35px | static |
| 12 | `.pub-assurances` | ServicesAssurances | 218px | static (4 cards) |
| 13 | `.pub-button-link` | ViewAllServicesButton | 40px | static |
| 14 | `.pub-page-list` | ProductNotices | 480px | static (recall notices) |
| 15 | `.i-layout__footer` | Footer | 585px | static + hover links |

## Floating / fixed layers (desktop)

- `.nav-header-mask` — fixed, z 1001, hidden by default (mega-menu mask)
- `.i-modal-wrapper` — fixed, z 1000 (inspiration detail / cart side sheets)
- `.inspiration-feeds__tabs.sticky` — sticky top:0 z:20 (product inspiration tab bar)
- `.chat-menu.fixed.pc-chat-menu` — fixed bottom-right 56x56 z:20 (客服 chat button)
- `.i-back-top` — fixed, appears after scrolling (back-to-top)
- `.cloud.slide` — fixed bottom cookie-consent banner
- `.bar.left.slide` — cookie settings full-screen overlay (hidden)
- `.box.bottom.slide` — privacy-policy modal (hidden)
- `.draggable-container` — chat widget
- `.popup_card.bottom-left` — promo popup

## Mobile-only layers (390px, mobile UA)

- `.app-download-banner__wrapper` — top banner 64px (使用宜家APP，购物更方便 / IKEA 宜家家居 / 前往购买 + close)
- `.i-layout__bottom-navigation` / `.i-nav-mobile` — fixed bottom 56px (首页 分类 发现 购物袋 我的)
- `.float-app-button` — fixed bottom "打开宜家APP" 44x200px
- `.popup-card.animate__animated` — 全屋设计服务 promo popup (fixed bottom, 327px)
- Search bar + h5 logo overlaid on mobile hero (`.searchBox`, `.absolute.z-10 ... top-7 left-6 w-14`)

## Breakpoints

- Desktop: min-width 1100px forced on `.max-w-page`; header/hero layout fixed (1000px min).
- Tablet 768px (desktop UA): same desktop layout (horizontal overflow to 1000px).
- Mobile: served only to mobile user agents (isMobile viewport); different header, hero (390x520),
  columns stack (flex-column), product grid waterfall single column, bottom nav fixed.
