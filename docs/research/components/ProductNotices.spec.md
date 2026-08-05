# ProductNotices Specification

## Overview
- **Target file:** `src/components/ProductNotices.tsx` (named export `ProductNotices`)
- **Screenshot:** `docs/research/components/product-notices-desktop.png`
- **Interaction model:** static (linked rows)

## DOM Structure
```
div.pub-page-list (width 1280px, height 480px, position relative)
  h2 "产品信息及通知" (24px/700 #111, line-height 36px, margin-bottom 24px)
  div.pub-page-list-content.is-list
    a.pub-list-list--item.pub__list (full width, height 84px, block)
      div.pub__list__info (flex row, justify space-between, align center,
                           height 84px, padding 30px 0)
        div.pub__list__text-wrapper (flex row, align center)
          span.pub__list__title (14px/700 #111, line-height 22px, padding-right 40px)
        span.pub__list__icon-wrapper (24x24, flex center, margin-right 16px, radius 64px)
          ChevronRightIcon 24px
```

## Computed Styles (desktop 1440, exact values)
- Section: width 1280px; height 480px; NO external margins (page assembly adds spacing)
- h2: font-size 24px; font-weight 700; line-height 36px; color #111111; margin 0 0 24px
- Row link: width 100%; height 84px; display block; position relative
- .pub__list__info: height 84px; padding-top/bottom 30px; flex row; justify-content space-between; align-items center
- Title span: font-size 14px; font-weight 700; line-height 22px; color #111111; padding-right 40px
- Chevron wrapper: 24x24; border-radius 64px; margin-right 16px; flex center; icon color #111111

## Content (verbatim, in order)
1. 宜家在中国召回部分批次BÄSINGEN 巴辛根 淋浴椅 → /cn/zh/customer-service/product-support/recalls/yi-jia-zai-zhong-guo-zhao-hui-bu-fen-pi-ci-ae-ba-xin-gen-lin-yu-yi-pub076c4a6a
2. 宜家在中国召回特定批次FLISAT 福丽萨特儿童桌
3. 宜家召回IKEA 365+ VÄRDEFULL 瓦福 压蒜器（黑色）
4. 宜家宣布召回部分VARMFRONT 旺芙荣 移动电源
5. 宜家正在召回ÅSKSTORM 奥斯通40W USB充电器 深灰色

(rows 2-5 target /cn/zh/customer-service/product-support/recalls/)

## Assets
- Icons: `ChevronRightIcon` from src/components/icons.tsx (24px, color #111)

## Responsive Behavior
- Desktop (1440px): rows full width 1280px, title left, chevron right.
- Mobile (390px): same structure; title truncates with ellipsis; section width auto.
