# ServicesSection Specification

## Overview
- **Target file:** `src/components/ServicesSection.tsx` (named export `ServicesSection`)
- **Screenshots:** `docs/research/components/services-heading-desktop.png`, `services-assurances-desktop.png`, `services-button-desktop.png`
- **Interaction model:** static (links)

## DOM Structure
```
div.rich-text__container (h2: " 我们的服务", 24px/700 #111, margin-bottom 24px)
div.pub-assurances (width 1280px, flex row, gap 20px)
  a.pub-assurances__item ×4 (flex 1, bg #0058a3, radius 8px, padding 32px 24px, color #fff,
    min-height 218px, flex column, justify space-between; hover bg #004a8c)
    div.i-svg-icon (40x40 icon: TruckIcon / AssemblyIcon / DesignIcon / InstallationIcon)
    h3 (20px/700)
    p (14px/400, opacity 0.9)
    span (14px/700 underline)
div.pub-button-link (margin-top 24px, text-align center)
  a.i-btn--secondary (height 40px, radius 64px, padding 0 20px, border 1px #111,
    font 14px/700, bg white, color #111; hover bg #f5f5f5)
```

## Data
- Import `assurances` from `src/data/homepage.ts` (title, description, ctaLabel, ctaHref, icon).
- Icon map: truck→TruckIcon, assembly→AssemblyIcon, design→DesignIcon, installation→InstallationIcon from `src/components/icons.tsx`.
- Button: label 查看所有服务 → /cn/zh/landing-page/cn--zh--9bdb3af1c07611e8affa0d09be91682d?web_new=1

## Responsive Behavior
- Desktop: 4 columns in a row (each ~305px, gap 20px), height 218px.
- Mobile: stacks to 1 column (full width cards).
