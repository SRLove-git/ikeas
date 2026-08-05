# Footer Specification

## Overview
- **Target file:** `src/components/Footer.tsx` (named export `Footer`)
- **Screenshot:** `docs/research/components/footer-desktop.png`
- **Interaction model:** static + hover links

## DOM Structure & Styles (desktop 1440)
```
div.nav-footer (bg #f5f5f5, width 100%, padding 80px 100px 0)
  div.nav-footer-container-row (max-width 1240px, flex row, justify space-between)
    div.nav-footer_featured-links (width 285px, flex column, gap 20px)
      div.nav-footer_featured-link ×2
        h3 (22px/700 #111)
        p (14px/400 #111, line-height 21px)
        a.join-btn (inline-block, margin-top 20px, height 40px, radius 64px,
                    border 1px #111, padding 0 20px, font 14px/700, line-height 38px;
                    hover bg #111 color #fff)
    div.nav-footer_linkGroups (flex row, gap 0, width ~818px)
      div.nav-footer_linkGroup ×4 (width 204px)
        h3 (14px/700 #111, margin-bottom 20px)
        ul > li (margin-bottom 12px)
          a (14px/400 #484848; hover color #0058a3)
  div.nav-footer-container-other
    div.nav-footer-container-other-row (flex row, align center, padding-top 18px, gap 16px)
      ul share icons: img ×3 (weChat.svg 24px, sina.svg 24px, xiaohongshu.svg 24px)
      div.lang-selector-container (position relative, width 100px)
        select.lang-selector (width 100px, height 40px, radius 64px, bg #f5f5f5,
          border 1px #dfdfdf, font 12px/400, padding 0 12px, appearance none)
        span chevron (absolute right 16px, top 50%, transform translateY(-50%))
      options: 中文 (zh) / EN (en)
    div.nav-footer-container-other-row (flex row, justify space-between, align center)
      div.nav-footer-container-other-edition (font 12px/400, color #484848)
        © Inter IKEA Systems B.V. 1999-2026
      div.nav-footer-container-other-service > ul (flex row, gap 24px, font 12px/400 #111)
        links: 隐私政策 | 缺陷披露政策 | 使用条款 | (business-license link)
```

## Data
- Import `footerFeaturedCards`, `footerLinkGroups`, `socialIcons`, `legalBar` from `src/data/homepage.ts`.
- Social icons: `/images/footer/weChat.svg`, `/images/footer/sina.svg`, `/images/footer/xiaohongshu.svg`.

## Responsive Behavior
- Desktop: 1240px content, featured column 285px + 4 link groups.
- Mobile: link groups collapse to accordions (single column, title row + toggled list); featured cards stack; legal bar wraps.
