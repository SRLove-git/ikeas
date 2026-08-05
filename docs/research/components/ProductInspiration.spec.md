# ProductInspiration Specification

## Overview
- **Target file:** `src/components/ProductInspiration.tsx` (named export `ProductInspiration`)
- **Screenshot:** `docs/design-references/ikea.cn/sections/product-inspiration.png`
- **Interaction model:** click-driven tabs + sticky tab bar + hover shoppable tooltips + load-more button

## DOM Structure
```
div.m-x-5.md:m-x-0 (page body wrapper)
  div.inspiration-feeds
    h2.inspiration-feeds__title (strong 发现更多家居灵感, 24px/700, margin-bottom 24px)
    div.inspiration-feeds__tabs.sticky (sticky top 0, z 20, white bg)
      div.i-tabs.i-tabs--pill
        div.i-tabs__wrapper > div.i-tabs__content > div.i-tabs__inner (1280x40, flex row, gap 8px, overflow-x auto)
          button.i-pill.i-pill--small.i-tabs__item x 13 (全部 active default)
    div.inspiration-feeds__content
      div.i-waterfall
        div.i-waterfall__header (n/a)
        div.i-waterfall-container (1280px wide)
          div.i-waterfall-container__inner (flex row, gap 20px)
            div.i-waterfall-container__column x 3 (each 420px)
              div.col-inner
                div.i-waterfall-container__column__item x N (margin-bottom 10px)
                  div.i-aspect-ratio-box.i-aspect-ratio-box--standard (padding-bottom 100%)
                    div.i-image (image area)
                    div.pub-shoppable-image
                      div.shoppable-image-list
                        div.shoppable-image-item (style left/top %)
                          div.shoppable-image-dot (data-product-id)
                          a.shoppable-image-tooltip.is-top (hidden until hover)
                            div.shoppable-image-card
                              div.shoppable-image-card__tags > div.i-product-tag (tag chip)
                              div.text-wrapper > p.shoppable-image-card__title
                              div.shoppable-image-card__group
                                div.left
                                  p.shoppable-image-card__des
                                  div.i-product-price (price)
                                div.right
                                  button.i-btn.i-btn--xsmall.i-btn--icon-emphasised.cartin-button (add-to-cart)
        div.i-waterfall__footer
  div (load more wrapper, flex center, margin-top 32px)
    button.i-btn.i-btn--small.i-btn--primary 加载更多内容
```

## Computed Styles (desktop 1440)

### h2.inspiration-feeds__title strong
- fontSize: 24px; fontWeight: 700; lineHeight: 36px; color: #111; marginBottom: 24px

### .inspiration-feeds__tabs.sticky
- position: sticky; top: 0; zIndex: 20; backgroundColor: #fff; padding: 12px 0

### .i-tabs__inner
- display: flex; flexDirection: row; gap: 8px; width: 1280px; height: 40px; overflow-x: auto; scrollbar hidden

### Tab pills (.i-pill--small.i-tabs__item)
- height: 40px; padding: 0 24px; margin: 0 4px; borderRadius: 64px
- fontSize: 12px; fontWeight: 700; color: #111; backgroundColor: #f5f5f5
- border: 2px solid transparent
- **Active (.i-pill--active):** border: 2px solid #111111; backgroundColor: #f5f5f5 (verified live)
- transition: opacity .25s cubic-bezier(.4,0,.4,1), transform .25s cubic-bezier(.4,0,.4,1)

### .i-waterfall-container
- width: 1280px; display: block

### .i-waterfall-container__inner
- display: flex; flexDirection: row; gap: 20px

### .i-waterfall-container__column
- width: 420px; display: flex; flexDirection: column

### .i-waterfall-container__column__item
- width: 420px; marginBottom: 10px; position: relative
- class `default-card-animation`: animate on scroll into view (fade-up)

### .i-aspect-ratio-box--standard
- paddingBottom: 100%; position: relative; overflow: hidden; backgroundColor: #f5f5f5

### .shoppable-image-item
- position: absolute; left/top set per product (percent)

### .shoppable-image-dot
- width: 12px; height: 12px; borderRadius: 50%; backgroundColor: #ffffff; border: 2px solid #111111
- Hover: scale 1.2, white border

### .shoppable-image-tooltip
- position: absolute; bottom: 8px (above dot area); left: 0; zIndex: 10; display: none (visible on dot hover)
- `.is-top`: anchored above the dot
- Background #fff, boxShadow 0 4px 20px rgba(0,0,0,.12), borderRadius 8px, padding 12px, width 280px

### .shoppable-image-card__title
- fontSize: 14px; fontWeight: 700; lineHeight: 20px; color: #111

### .shoppable-image-card__des
- fontSize: 12px; color: #484848; lineHeight: 18px

### .i-product-price
- fontSize: 16px; fontWeight: 700; color: #111; `¥` symbol 8px superscript

### .i-product-tag
- fontSize: 12px; fontWeight: 700; padding: 2px 8px; borderRadius: 4px
- 新品: backgroundColor #ca5008; color #fff
- 热卖: backgroundColor #e00751; color #fff

### .cartin-button
- width: 32px; height: 32px; borderRadius: 50%; backgroundColor: #ffdb00; color: #111; display: flex; center
- Hover: scale 1.05

### Load more button
- height: 40px; padding: 0 20px; fontSize: 12px; fontWeight: 700; borderRadius: 64px
- backgroundColor: #0058a3; color: #fff
- Wrapper: display flex; justifyContent center; marginTop: 32px

## States & Behaviors

### Tab switching
- **Trigger:** click a tab pill
- Active pill: transparent border to 2px #111; content grid swaps to that tab's products (reuse same 12-card structure with per-tab product sets; mock data OK)
- **Transition:** content opacity fade ~0.25s

### Shoppable dot hover
- **Trigger:** hover dot
- Tooltip card appears above/below the dot with product info (title, desc, price, tag, add-to-cart)
- **Transition:** opacity/scale ~0.2s

### Load more
- **Trigger:** click 加载更多内容 → appends more cards (mock: append 6 more cards per click)

### Scroll-into-view animation
- Cards have `default-card-animation`: fade-up on entry

## Per-State Content (tab 全部 — 12 cards)
1. IKEA 365+ HJÄLTE 哈特 / 厨用镊子 / ¥29.99 / 新品 / dot 33% 36% / id 20161582
2. RINNIG 林妮格 / 厨房用巾, 45x60 厘米 / ¥24.99/4 条 / 热卖 / dot 42% 53% / id 80476348
3. HÖSTAGILLE 赫斯塔吉尔 / 托盘, 20x28 厘米 / ¥19.99 / 新品 / dot 43% 59% + 碗, 12 厘米 ¥49.99/4 只装 / dot 57% 19% (2 dots)
4. IKEA 365+ / 碟, 24 厘米 / ¥24.99 / 新品 / dot 49% 64% / id 10621358
5. SPJUTFISK 斯尤菲斯 / 刀架, 24x20 厘米 / ¥79.99 / 新品 / dot 32% 90% / id 80630236
6. MELLGRUND 梅尔格伦 / 床架, 180x200 厘米 / ¥1,799.00 / 新品 / dot 43% 43% / id 09613397
7. PÄRKLA 派克拉 / 储物袋, 55x49x19 厘米 / ¥9.99 / no tag / dot 59% 29% / id 10395384
8. SMÅSTAD 斯玛斯塔 / PLATSA 普拉萨 书柜 / ¥1,050.00 / no tag / dot 29% 45% / id 29387807
9. EKET 伊克特 / 柜子, 35x35x35 厘米 / ¥150.00 / no tag / dot 75% 35% / id 60334604
10. HULTARP 胡尔塔普 / 挂杆, 80 厘米 ¥49.99 热卖 (dot 51% 34%) + 挂钩, 7 厘米 ¥19.99/5 个 热卖 (dot 31% 34%) + BERGSHULT 贝利斯胡特 墙搁板 ¥159.00 (dot 49% 16%)
11-12. (remaining cards from waterfall-data.json: `docs/research/waterfall-data.json` — use real names/prices/dots)

Other tabs (卧室 客厅 厨房 书房 浴室 阳台 儿童房 户外 餐厅 门厅 电竞 新品): reuse the same card structure with sample products from `public/images/products/` (mock data acceptable).

## Assets
- Product images: `public/images/products/*.jpg` (map by product id where possible; otherwise nearest match)
- Icons: `CartIcon` (add-to-cart), `ChevronRightIcon`

## Responsive Behavior
- **Desktop (1440px):** 3 columns x 420px, gap 20px
- **Tablet (768px):** 2 columns
- **Mobile (390px):** 1 column, tabs horizontally scrollable, sticky bar retains top 0
