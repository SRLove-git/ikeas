# ProductInspiration Specification

## Overview
- **Target file:** `src/components/ProductInspiration.tsx` (named export `ProductInspiration`)
- **Screenshot:** `docs/research/components/inspiration-feeds-desktop.png`
- **Interaction model:** click-driven — tab pills swap the waterfall grid; sticky tab bar; "加载更多内容" button.

## DOM Structure
```
div.inspiration-feeds (width 1280px)
  h2.inspiration-feeds__title (24px/700 #111, margin-bottom 24px)
    strong 发现更多家居灵感
  div.inspiration-feeds__tabs.sticky (position sticky, top 0, z 20, bg white, padding-top 24px)
    div.i-tabs > div.i-tabs__content > div.i-tabs__inner (flex row, gap 8px)
      button.i-pill.i-pill--small.i-tabs__item (height 40px, radius 64px, padding 0 24px,
        font 12px/700, bg #f5f5f5, color #111; active: bg #111, color #fff)
      tabs: 全部 卧室 客厅 厨房 书房 浴室 阳台 儿童房 户外 餐厅 门厅 电竞 新品
  div.inspiration-feeds__content
    div.i-waterfall
      div.i-waterfall-container__inner (display grid, grid-template-columns repeat(3, 1fr), gap 10px)
        div.i-waterfall-container__column.waterfall-column
          div.col-inner
            div.i-waterfall-container__column__item (margin-bottom 10px)
              div.i-aspect-ratio-box--standard.inspiration-feeds-item__wrapper (position relative,
                padding-bottom 100%, bg #f5f5f5, radius 8px, overflow hidden)
                div.i-image > img (absolute cover, width 100%, height 100%)
                div.pub-shoppable-image
                  div.shoppable-image-list
                    div.shoppable-image-item (position absolute; left/top % from data)
                      div.shoppable-image-dot (data-product-id; 16px white dot with ring)
                      a.shoppable-image-tooltip.is-top (absolute card, visible on hover/click:
                        width 200px, bg white, radius 8px, padding 12px, box-shadow, z 10)
                        div.shoppable-image-card
                          div.shoppable-image-card__tags — tag chip (i-product-tag, font 12px/700,
                            inline style gives bg + border + text color; e.g. 新品 #ca5008)
                          p.shoppable-image-card__title (14px/700 #111)
                          p.shoppable-image-card__des (12px/400 #484848)
                          div.shoppable-image-card__group (flex row, space-between, align end)
                            div.left — price (i-price--small, 14px/700 #111)
                            div.right — button.cartin-button (32x32, radius 50%, bg #ffdb00,
                              CartIcon #111; hover bg #f5e900)
      div.i-waterfall__footer > button 加载更多内容 (i-btn--secondary, height 40px, radius 64px,
        padding 0 20px, border 1px #111, bg white, font 14px/700; hover bg #f5f5f5)
```

## Data
- Import `feedProducts` from `src/data/homepage.ts` — `Record<tabName, FeedProduct[]>`.
- Each FeedProduct: `{ left, top, href, tooltipPosition, title, desc, price, tags, tagStyle, image }`.
- Tab labels in order: 全部 卧室 客厅 厨房 书房 浴室 阳台 儿童房 户外 餐厅 门厅 电竞 新品.
- Images: `/images/feeds/*.jpg`.

## Behavior
- Clicking a tab sets active pill (bg #111, white text) and swaps the waterfall items (fade/opacity 0.25s).
- 加载更多内容 appends the next chunk of cards (mock: reveal more items from the same tab list; hide the button once all shown).
- Add-to-cart button: hover bg #f5e900; click is decorative.
- Tooltips: hovering a dot shows the product card; position `is-top` = card above the dot.

## Responsive Behavior
- Desktop: 3-column grid (420px columns, gap 10px), sticky tabs.
- Mobile: single column; tab bar horizontally scrollable with hidden scrollbar; sticky at top 0.
