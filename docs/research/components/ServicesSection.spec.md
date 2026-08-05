# ServicesSection Specification

## Overview
- **Target file:** `src/components/ServicesSection.tsx` (named export `ServicesSection`)
- **Screenshots:** `docs/research/components/services-heading-desktop.png`, `services-assurances-desktop.png`, `services-button-desktop.png`
- **Interaction model:** static (links)

## DOM Structure
```
div.rich-text__container (h2 "我们的服务", 24px/700 #111, line-height 34.8px, margin-bottom 24px)
div.pub-assurances (width 1280px, flex row, justify-center)
  div.pub-assurances-item x4 (width 320px, height 216px, bg #f5f5f5,
    flex column, center, padding 40px, margin-bottom 2px)
    div
      div.pub-assurances-item__head (flex column, justify center, margin-bottom 8px)
        i.pub-assurances-item__icon (24x24 icon, margin-bottom 5px, color #111)
        div.pub-assurances-item__title (16px/700 #111, line-height 24px)
      p.pub-assurances__desc (14px/400 #484848, line-height 21px, margin-bottom 12px)
    a.pub-assurances__link (了解详情, 14px/400 #484848, line-height 21px)
div.pub-button-link.is-bolder (text-align center, margin 0 20px 20px)
  a.i-btn.i-btn--small.i-btn--secondary (width 120px, height 40px, radius 64px, centered)
    span.i-btn__inner (padding 0 24px, 12px/700 #111, box-shadow inset 0 0 0 1px #111)
      span.i-btn__label 查看所有服务
```

## Computed Styles (desktop 1440, exact values from getComputedStyle)

### .pub-assurances
- width 1280px; height 218px; display flex; flex-direction row; justify-content center

### .pub-assurances-item
- width 320px; height 216px; padding 40px; margin-bottom 2px; background #f5f5f5
- display flex; flex-direction column; justify-content center; align-items center; color #484848; text-align center

### Icon
- 24x24; color #111111 (TruckIcon / AssemblyIcon / DesignIcon / InstallationIcon from icons.tsx)

### Title
- font-size 16px; font-weight 700; line-height 24px; color #111111

### Description
- font-size 14px; font-weight 400; line-height 21px; color #484848; margin-bottom 12px

### Link
- font-size 14px; font-weight 400; line-height 21px; color #484848

### Button
- a.i-btn--secondary: width 120px; height 40px; border-radius 64px; box-shadow inset 0 0 0 1px #111111
- inner: padding 0 24px; font-size 12px; font-weight 700; line-height 16px; color #111111

## Content (verbatim)
- Heading: 我们的服务
- Cards:
  1. 送货服务 / 无论在实体店还是线上下单，我们都为你送货到指定地点。 / 了解详情
  2. 组装服务 / 上门服务，帮你组装家具。 / 了解详情
  3. 设计服务 / 专业设计人员满足你的家装需求。 / 了解详情
  4. 安装服务 / 为你提供完整厨房和浴室的安装服务。 / 了解详情
- Button: 查看所有服务 → /cn/zh/landing-page/cn--zh--9bdb3af1c07611e8affa0d09be91682d?web_new=1

## Data
- Import `assurances` from `src/data/homepage.ts` (icon key: truck/assembly/design/installation).
- Icon map: truck→TruckIcon, assembly→AssemblyIcon, design→DesignIcon, installation→InstallationIcon.

## Responsive Behavior
- Desktop (1440px): 4 cards in a row, 320px each.
- Mobile (390px): cards stack to a single column (flex-direction column), full width; heading 24px.
