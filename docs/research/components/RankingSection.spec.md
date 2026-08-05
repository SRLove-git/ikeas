# RankingSection Specification

## Overview
- **Target file:** `src/components/RankingSection.tsx` (named export `RankingSection`)
- **Screenshot:** `docs/research/components/ranking-desktop.png`
- **Interaction model:** click-driven horizontal scroll rail of category panels (arrow buttons + thumb); verified live 2026-08-05

## DOM Structure
```
div.ranking-container (width 1280px, height 515px, bg white, overflow hidden)
  div.pub-ranking-list
    div.title-container-nova.container (padding 40px 24px, overflow hidden)
      div.content (empty; header pills not rendered on current live page)
      div.i-scrollbar (position relative, height 435px)
        div.i-scrollbar__arrow.is-left (absolute, 40px wide, full height, flex center, z 50)
          button 40x40 circle bg #111 ChevronLeftIcon white 24px
        div.i-scrollbar__arrow.is-right (absolute right -20px, same, ChevronRightIcon)
        div.i-scrollbar__wrap (overflow-x auto) > div.i-scrollbar__view
          div.pub-ranking-list__content (flex row)
            div.pub-ranking-list__item (width 397px, flex-shrink 0)
              div.ranking-panel
                div.pub-ranking-item
                  div.pub-ranking-item-header (height 97px, flex row, justify space-between,
                    align center, padding 20px 24px, white text, bg = per-category color)
                    div.pub-ranking-item-header-desc
                      label.pub-ranking-item-header-category (14px/400, line-height 22px)
                      label.pub-ranking-item-header-title (18px/700, line-height 28px)
                    div.pub-ranking-item-header-nav > button 30x30 (ChevronRightIcon 18px, white)
                  div.pub-ranking-item-product-list
                    a.pub-ranking-item-product (flex row, align center, gap 12px,
                      padding 14px 16px; hover bg #f5f5f5)
                      div.pub-ranking-item-product__icon > img (20x20 rank icon)
                      div.pub-ranking-item-product__image > img (100x100, object-fit cover)
                      div.pub-ranking-item-product__desc
                        span.product-name (14px/700, color #111, line-height 21px)
                        div.pub-ranking-item-product__desc_price (14px/400, color #111, padding-top 4px)
        div.i-scrollbar__bar.is-horizontal (height 12px, margin-top 24px, relative, z 50)
          div.i-scrollbar__thumb.is-horizontal (height 2px, bg #111, radius 4px)
```

## Data
- Import `rankingSections` from `src/data/homepage.ts`: `{ id, name, backgroundColor, products: [{ name, price, image, icon }] }`.
- Rank icons in `public/images/cms/`: b4f6c510...png = 1st, bdd794...png = 2nd, 80635e...png = 3rd (map index 0/1/2; repeat after 3).
- Product images in `public/images/products/`.

## Styles (exact, verified live 2026-08-05)
- Container .title-container-nova.container: padding 40px 24px; overflow hidden
- Scroll wrap .i-scrollbar__wrap: overflow-x auto; content scrollWidth ~4153px vs client 1232px
- Panel (.pub-ranking-item): width 397.33px; height 399px; display flex; flex-direction column
- Header: height 97px; padding 20px 24px; flex row; space-between; align-items center; white text; bg per-category:
  食品储存与收纳 #807151 · 抽屉和隔板 #807d75 · 杯子和马克杯 #807f7f · 抹布及海绵清洁刷 #807f73 · 斗柜 #80756d · 烹饪准备用具 #806846 · 浴室储物盒和篮子 #807d74 · 落地灯 #807569 · 碗 #556080 · 弹簧床垫 #7e7e80
- Category label: 14px/400, line-height 22px
- Title: 18px/700, line-height 28px
- Nav button: 30x30, ChevronRightIcon (18px, white)
- Product row: padding 14px 16px; image 100x100; rank icon 20x20; gap 12px; hover background #f5f5f5
- Product name: 14px/700 #111, line-height 21px
- Price: 14px/400 #111, padding-top 4px
- Panel gap: 20px (397 + 20 = 417 step); scrollbar bar 12px tall; thumb 2px #111, radius 4px
- Arrows: 40x40 circle, bg #111, white 24px chevrons, absolutely positioned at rail edges (left -20px / right -20px), z-index 50, vertically centered; hidden when at the end (left arrow display none at scroll 0)

## States & Behaviors
- **Category switching:** panels sit in a horizontal scroll rail; clicking the right/left 40x40 arrow scrolls the wrap by ~1230px per click (verified scrollLeft 0 → 1230); the thumb bar shows progress and supports drag.
- **Header nav arrow:** each panel header has a 30x30 nav button with a chevron; on the live site it navigates within the rail (wire to scroll to the next panel).
- **Hover:** product row background #f5f5f5.

## Responsive Behavior
- Desktop: horizontal rail with arrows as above.
- Mobile: same rail, arrows hidden, native drag/touch scroll; panel width ~350px; header/padding scale down.
