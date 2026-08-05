# ProductNotices Specification

## Overview
- **Target file:** `src/components/ProductNotices.tsx` (named export `ProductNotices`)
- **Screenshot:** `docs/research/components/product-notices-desktop.png`
- **Interaction model:** static (linked cards)

## DOM Structure
```
div.pub-page-list (width 1280px, padding 32px 0, bg #f5f5f5, radius 8px, margin-top 48px)
  div.pub-page-list-content.is-list
    h2 (24px/700 #111, padding 0 32px, margin-bottom 24px) — 产品公告 (observed heading: 我们的服务 area follows; use "我们的服务" context)
    div.list (flex column, gap 16px)
      a.pub-page-list-item (flex row, gap 16px, padding 16px 32px, hover bg #fff, radius 8px)
        img (120x68, object-fit cover, radius 4px)
        div
          h3 (16px/700 #111)
          p (14px/400 #484848)
```

## Data
- Import `recallNotices` from `src/data/homepage.ts` (title, href, image).
- Heading observed on the live page: the section has a heading above the list — use the h2 "我们的服务" is a separate section; for this component use heading text `产品公告` if the live section shows one, otherwise render the list directly with title `召回公告` (verify against screenshot; the live list shows recall titles).

## Responsive Behavior
- Desktop: horizontal cards with image left.
- Mobile: image 96x54, text wraps, full width.
