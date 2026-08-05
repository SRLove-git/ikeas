# RankingSection Specification

## Overview
- **Target file:** `src/components/RankingSection.tsx` (named export `RankingSection`)
- **Screenshot:** `docs/research/components/ranking-desktop.png`
- **Interaction model:** click-driven — category pills switch product lists; horizontal scroll with arrow buttons.

## DOM Structure
```
div.ranking-container (width 1280px, height 515px, bg white)
  div.pub-ranking-list
    div.title-container-nova.container (padding 40px 0 0 24px)
      div.i-scrollbar (position relative, height 435px)
        div.i-scrollbar__arrow.is-left (absolute left 0, 40px wide, flex center, z 50)
          button 40x40 circle bg #111 ChevronLeftIcon white
        div.i-scrollbar__arrow.is-right (absolute right 0, same, ChevronRightIcon)
        div.i-scrollbar__wrap > div.i-scrollbar__view
          div.pub-ranking-list__content (flex row, gap 20px)
            div.pub-ranking-list__item (width 400px, flex-shrink 0)
              div.ranking-panel
                div.pub-ranking-item
                  div.pub-ranking-item-header (height 48px, flex row, justify space-between,
                    align center, padding 0 16px, white text, bg = per-category color)
                    div.pub-ranking-item-header-desc
                      label.pub-ranking-item-header-category (12px/400, opacity 0.8)
                      label.pub-ranking-item-header-title (18px/700)
                    div.pub-ranking-item-header-nav > button 30x30 (ChevronRightIcon, white)
                  div.pub-ranking-item-product-list
                    a.pub-ranking-item-product (flex row, align center, gap 12px,
                      padding 14px 16px; hover bg #f5f5f5)
                      div.pub-ranking-item-product__icon > img (20x20 rank icon)
                      div.pub-ranking-item-product__image > img (60x60, object-fit cover)
                      div.pub-ranking-item-product__desc
                        span.product-name (14px/400, color #111, 2-line clamp)
                        div.pub-ranking-item-product__desc_price > em.i-price (14px/700, color #111)
        div.i-scrollbar__bar.is-horizontal (height 12px, relative, z 50)
          div.i-scrollbar__thumb.is-horizontal (height 2px, bg #111, radius 4px)
```

## Data
- Import `rankingSections` from `src/data/homepage.ts`: each has `{ id, name, backgroundColor, products: [{name, price, image, icon}] }`.
- Rank icons are in `public/images/cms/` (b4f6c510 = 1st, bdd794 = 2nd, 80635e = 3rd) — map index 0/1/2.
- Product images in `public/images/products/`.

## Styles (exact)
- Header height: 48px; title 18px/700; category label 12px/400; nav button 30x30.
- Product row: padding 14px 16px; image 60x60; icon 20x20; gap 12px; hover background #f5f5f5.
- Product name: 14px/400 #111; price: 14px/700 #111.
- Panel width: 400px; gap between panels 20px; container padding-left 24px; scrollbar thumb 2px #111.
- Active panel hover: arrow button rotates -90deg on hover (ChevronRight points down when open).

## States & Behaviors
- **Category switching:** the visible panel set scrolls horizontally; arrows scroll by ~400px. (On the live desktop page the panels are in a horizontal scroll rail; implement arrow scrolling + thumb.)
- **Hover:** product row background #f5f5f5.

## Responsive Behavior
- Desktop: horizontal rail with arrows as above.
- Mobile: same rail, arrows hidden, drag to scroll; panel width ~350px.
