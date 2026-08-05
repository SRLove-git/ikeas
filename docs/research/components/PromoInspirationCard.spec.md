# PromoInspirationCard Specification

## Overview
- **Target file:** `src/components/PromoInspirationCard.tsx` (named export `PromoInspirationCard`)
- **Screenshot:** `docs/design-references/ikea.cn/ikea-desktop-fullpage.png` (section ~y 902–1606)
- **Interaction model:** static (whole card links; horizontal scroll on narrow screens)

## DOM Structure
```
section.pub-inspiration-card.is-standard
  h2 (title)
  div.i-scrollbar (position relative)
    div.i-scrollbar__wrap > div.i-scrollbar__view
      div.pub-inspiration-card__content (flex row)
        div.pub-inspiration-card__item × 3 (margin-right 20px, last 0)
          a.pub-inspiration-card__link (flex column)
            div.pub-inspiration-card__multi-media (413×413 gray placeholder)
            div.pub-inspiration-card__desc (padding 30px, flex column)
              div.desc-title > h3 + p
              div.desc-operation > button.i-btn--small.i-btn--icon-primary(-inverse) (40×40 circle w/ arrow icon)
```

## Computed Styles (desktop 1440)

### Section
- width: 1280px; height: 704px; display: block

### h2 title
- font-size: 24px; font-weight: 700; line-height: 36px; color: #111; margin: 0 0 24px

### .pub-inspiration-card__content
- display: flex; flex-direction: row

### .pub-inspiration-card__item
- width: 413px; height: 644px; margin: 0 20px 0 0 (last item 0)

### .pub-inspiration-card__link
- display: flex; flex-direction: column; position: relative

### .pub-inspiration-card__multi-media / .i-aspect-ratio-box--standard
- width: 413px; height: 413px; background: #f5f5f5 (image placeholder — live site has no image)

### .pub-inspiration-card__desc
- height: 231px; padding: 30px; display: flex; flex-direction: column; color: #111
- Card 1 (大减价): background #ffdb00
- Card 2 (探索当季新品): background #ca5008, title color #fff
- Card 3 (更低价格): background #cc0008, title color #fff

### h3 title
- font-size: 20px; font-weight: 700; line-height: 30px

### p description
- font-size: 14px; font-weight: 400; line-height: 21px

### desc-operation button
- 40×40, border-radius 64px
- On yellow card: button bg #111, arrow icon white (`i-btn--icon-primary`)
- On orange/red cards: button bg #fff, arrow icon #111 (`i-btn--icon-primary-inverse`)

## Content (verbatim)
1. 大减价 / 2026.7.29-8.18，数百款商品5折起！ → /cn/zh/personalize-channel/LimitedTimeDiscountsChannel/
2. 探索当季新品 / 全新设计，打造更美好的日常生活 → /cn/zh/personalize-channel/NewArrivalsChannel/?topProductIds=20628774
3. 更低价格 / 超150款精选好物，给生活更多 → /cn/zh/personalize-channel/NewLowerPriceChannel/?topProductIds=20440654

## Assets
- No images on live site — 413px gray (#f5f5f5) placeholder blocks.
- Icons: `ChevronRightIcon` or `ArrowRightIcon` from `src/components/icons.tsx` for the circle button.

## Responsive Behavior
- Desktop: 3 columns × 413px, 20px gap.
- Mobile (390px): card full width (~350px content), image area ~350px, desc 231px; horizontal scroll enabled (overflow-x auto with hidden scrollbar); title stays 24px.
