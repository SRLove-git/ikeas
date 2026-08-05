# VisualPillSlider Specification

## Overview
- **Target file:** `src/components/VisualPillSlider.tsx` (named export `VisualPillSlider`)
- **Screenshot:** `docs/design-references/ikea.cn/ikea-desktop-fullpage.png` (room slider ~y 2522–2923; sustainability slider ~y 5666–6067)
- **Interaction model:** click-driven + horizontal scroll (arrow buttons scroll the list)
- Used twice on the page: rooms (从房间开始探索) and sustainability (更可持续生活的创意和技巧).

## Props
```ts
interface VisualPillSliderProps {
  title: string;
  items: { label: string; href: string; color?: string; textColor?: string; isCta?: boolean }[];
}
```

## DOM Structure
```
section.pub-visual-pill-slider
  div.visualpillslider-panel-title (h2 title)
  div.i-scrollbar (relative)
    arrows: div.i-scrollbar__arrow.is-left / .is-right (absolute, black circle buttons w/ chevron)
    div.i-scrollbar__wrap > div.i-scrollbar__view
      div.visualpillslider-content (flex row)
        div.visualpillslider-li (margin-right 20px)
          a.visualpillslider-item
            div.visualpillslider-item-image (231.75×308.98, aspect-ratio 3:4 portrait)
              div.i-aspect-ratio-box--portrait (gray placeholder / image)
              div.visualpillslider-btn-container (absolute bottom, flex center)
                div.visualpillslider-btn (white pill 56×40) > p (label)
            — OR for the CTA item —
            div.visualpillslider-color (colored block) > div.visualpillslider-color-desc + div.visualpillslider-item-next (arrow)
```

## Computed Styles (desktop 1440)

### Section / title
- width: 1280px; height: 401px
- `.visualpillslider-panel-title`: font-size 24px; font-weight 700; line-height 32px; color #111

### Item
- `.visualpillslider-li`: width 231.75px; height 308.98px; margin 0 20px 0 0
- `.visualpillslider-item` (a): display block; width/height 100%

### Image + label pill
- Image box: aspect ratio 3:4 (231.75 × 308.98); placeholder bg #f5f5f5 (live site images empty)
- `.visualpillslider-btn-container`: position absolute; top 236.98px; left/right 0; bottom 32px; height 40px; padding 0 32px; display flex; justify-content center; align-items center; z-index 5
- `.visualpillslider-btn`: width 56px; height 40px; background #fff; border-radius 64px; padding 0 16px; display flex; center
- Label `p`: font-size 12px; font-weight 700; line-height 14px; color #111

### CTA item (last tile)
- `.visualpillslider-color`: width 231.75px; height 308.98px; padding 40px 30px 30px
  - Rooms CTA: background #b83e33; text `浏览房间灵感图库` color #ffffff; href /cn/zh/ideas/rooms-inspiration/
  - Sustainability CTA: background #37b886; text `更多可持续创意` color #111111; href /cn/zh/ideas/tips-for-more-sustainable-living/
- `.visualpillslider-color-desc`: font-size 16px; font-weight 700; line-height 24px
- `.visualpillslider-item-next`: arrow (ChevronRightIcon) bottom-right

### Arrows
- `.i-scrollbar__arrow`: absolute, left -20px / right -20px, height 340.98px, flex center, z-index 50
- Button: 40×40 circle, bg #111, white chevron icon 24px (use `ChevronLeftIcon` / `ChevronRightIcon`)

## Content (verbatim)
### Rooms — title `从房间开始探索`
1. 客厅 → /cn/zh/rooms/living-room/
2. 卧室 → /cn/zh/rooms/bedroom/
3. 厨房 → /cn/zh/rooms/kitchen/
4. 餐厅 → /cn/zh/rooms/dining/
5. 儿童 → /cn/zh/rooms/childrens-room/
6. 浴室 → /cn/zh/rooms/bathroom/
7. 书房和办公 → /cn/zh/rooms/home-office/
8. 门厅 → /cn/zh/rooms/hallway/
9. 户外 → /cn/zh/h5page/?url=https://www.ikea.cn/cn/zh/rooms/outdoor/
10. 阳台 → /cn/zh/rooms/balcony/
11. CTA: 浏览房间灵感图库 (color #b83e33, text #fff) → /cn/zh/ideas/rooms-inspiration/

### Sustainability — title `更可持续生活的创意和技巧`
1. 节约能源 → /cn/zh/ideas/tips-for-more-sustainable-living/quick-tricks-to-save-energy-at-home-pubad783f90
2. 节约水源 → /cn/zh/ideas/tips-for-more-sustainable-living/smart-solutions-to-save-water-at-home-pubfdfe8c45
3. 可持续饮食 → /cn/zh/ideas/tips-for-more-sustainable-living/easy-wins-to-eating-more-sustainably-pubdbfa9a20
4. 减少浪费 → /cn/zh/ideas/tips-for-more-sustainable-living/simple-ways-to-reduce-waste-at-home-pubb645fb53
5. 延长家具使用寿命 → /cn/zh/ideas/tips-for-more-sustainable-living/
6. CTA: 更多可持续创意 (color #37b886, text #111) → /cn/zh/ideas/tips-for-more-sustainable-living/

## Assets
- No real images on the live site — gray placeholder blocks.
- Icons: `ChevronLeftIcon`, `ChevronRightIcon` from `src/components/icons.tsx`.

## Responsive Behavior
- Desktop: 231.75px items, horizontal scroll with arrow buttons (scroll by ~1 page).
- Mobile (390px): items ~163px wide (3.2 visible), horizontal scroll, arrows hidden, thumb bar visible; title 24px.
