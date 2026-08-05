# Header Specification

## Overview
- **Target file:** `src/components/Header.tsx` (named export `Header`)
- **Screenshot:** `docs/design-references/ikea.cn/sections/header.png`
- **Interaction model:** hover-driven (mega menu panels + app-promo QR panel), click for actions (non-functional in clone)

## DOM Structure
```
div.i-layout__header (position relative, zIndex 900)
  div.nav-header (beige #f5deb3 background)
    div.nav-header_container (white background, min-width 1000px)
      div.move-hover
        div.header_container_top (padding 0 80px, flex column, space-between)
          div.header_container_top_content
            div.header_container_top_content__inner (flex row, space-between, align center, height 84px)
              div.header_container_left
                div.header_container_center
                  div.header_container_center_Logo
                    img (logo 100x40)
              div.search-bar-container (flex 0.8, margin -12px 0 0 30px)
                div.search-input (height 40, position relative)
                  input.s-input (40px, radius 24px, bg #f5f5f5, padding-left 52px, 13px/700)
                  svg (search icon 24px, absolute left 16px, top 50% translateY(-50%))
                  div.s-header-notice (absolute, padding-left 55px, height 30, top 7px)
                    div.i-notice (vertical carousel of hints, 13px/700 #111)
              div.header_container_right
                div.header_container_right_img (flex row)
                  span.i-tooltip x 4 (pill buttons)
                    span.i-tooltip__custom-trigger-wrapper
                      div (pill: icon + optional label)
                      div.i-tooltip__body (white tooltip, 4px radius, 12px text)
          div.header_container_menu_content (flex row, space-between, align center, height 49.5)
            ul.header_container_center_ul (flex row, center, gap 40px, 14px/700)
              span.active-bar (blue 3px underline, absolute, animated)
              li (所有商品 + new_feature_mark)
              li 房间
              li 活动和特惠
              li 设计和服务
              li 家居灵感
              li 新品
              li 对公业务
              li.nav-header-message-app-promotion
                div.basic-content > div.basic-title > span 下载APP
                div.detail-info-container (QR panel, absolute, hidden until hover)
  div.nav-header-mask (fixed, rgba(17,17,17,.4), z 1001, hidden until mega menu open)
```

## Computed Styles (desktop 1440)

### .i-layout__header
- position: relative; zIndex: 900; height: 133.5px

### .nav-header
- backgroundColor: #f5deb3; height: 133.5px

### .nav-header_container
- backgroundColor: #ffffff; minWidth: 1000px; height: 133.5px

### .header_container_top
- padding: 0 80px; display: flex; flexDirection: column; justifyContent: space-between

### .header_container_top_content__inner
- display: flex; flexDirection: row; justifyContent: space-between; alignItems: center; height: 84px

### Logo
- `public/images/logo/logo.svg` — width 100px; height 40px; objectFit: cover

### .search-bar-container
- flex: 0.8 1 auto; margin: -12px 0 0 30px; width: 773.8px; height: 50px

### .search-input
- width: 773.8px; height: 40px; position: relative

### input.s-input
- width: 100%; height: 40px; padding: 0 5px 0 52px; borderRadius: 24px
- backgroundColor: #f5f5f5; border: 1px solid #f5f5f5; fontSize: 13px; fontWeight: 700; color: #111

### Search icon
- width: 24px; height: 24px; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #111

### .s-header-notice (rotating hint overlay)
- position: absolute; left: 0; top: 7px; height: 30px; paddingLeft: 55px; fontSize: 13px; fontWeight: 700; color: #111
- Vertical autoplay carousel of search hints (~3s); hints: 沙发, 床垫, 书桌 (real sample hints)

### .header_container_right
- width: 239px; height: 48px; whiteSpace: nowrap

### Action pills (.header_container_right_img > .i-tooltip)
- 4 buttons in a row: 登录宜家账号 (143x48, icon + text), 我的个人档案 (48x48 icon), 我的收藏 (48x48), 购物袋 (48x48)
- Pill style: height 40px; padding 10px; borderRadius 24px; backgroundColor #f5f5f5
- Hover: backgroundColor darkens (#111 with white icon on hover)
- Icons 24x24 from icons.tsx: `UserIcon`, `HeartIcon`, `CartIcon`, `UserIcon`

### .i-tooltip__body
- white bg, borderRadius 4px, fontSize 12px, padding 4px 8px, absolute below button
- Labels: 登录宜家账号 / 我的个人档案 / 我的收藏 / 购物袋

### .header_container_menu_content
- display: flex; justifyContent: space-between; alignItems: center; height: 49.5px

### .header_container_center_ul
- display: flex; justifyContent: center; alignItems: center; marginLeft: 10px; height: 24px

### li
- fontSize: 14px; fontWeight: 700; lineHeight: 24px; color: #111; marginRight: 40px; cursor: pointer
- span marginLeft: -7px

### .active-bar
- position: absolute; top: 130.5px; height: 3px; backgroundColor: #0058a3; zIndex: 2
- transition: width .55s, transform .55s, opacity .35s; width 0 default; opacity 0 default
- On hover of a menu item: width = item width, transform = translateX(item x), opacity 1

### 下载APP (.nav-header-message-app-promotion)
- fontSize: 13px; fontWeight: 700; lineHeight: 20px; display: flex; center; position: relative; cursor: pointer
- Hover shows `.detail-info-container` (see MegaMenu spec for QR panel)

### .nav-header-mask
- position: fixed; inset: 0; backgroundColor: rgba(17,17,17,.4); zIndex: 1001
- Hidden (opacity 0 / pointer-events none) until a mega menu opens

## States & Behaviors

### Mega menu (all menu items except 下载APP)
- **Trigger:** hover on li (mouseenter)
- **State A (default):** panel hidden; mask hidden
- **State B (hover):** panel visible below header (720px tall, white); mask visible
- **Transition:** panel slides/fades in ~0.3s; mask fades in
- Each menu item has its own panel content (see MegaMenu.spec.md)

### 下载APP QR panel
- **Trigger:** hover on 下载APP
- **State A:** `.detail-info-container` hidden
- **State B:** 262x102 white panel, 4px radius, shadow; QR image 74x74 (`public/images/cms/20210303.png`) + description text + close button

### Action pills
- **Hover:** tooltip appears below; bg darkens to #111, icon turns white

### Active bar
- **Trigger:** hover on any menu li
- Blue 3px underline animates (width + translateX) to the hovered item, opacity 1; returns to hidden on leave

## Content (verbatim)
- Search placeholder/hints (rotating): 沙发 / 床垫 / 书桌
- Menu: `所有商品` `房间` `活动和特惠` `设计和服务` `家居灵感` `新品` `对公业务` `下载APP`
- Right actions: `登录宜家账号` `我的个人档案` `我的收藏` `购物袋`
- QR panel: `扫码下载宜家APP`

## Assets
- `public/images/logo/logo.svg`
- Icons: `SearchIcon`, `UserIcon`, `HeartIcon`, `CartIcon` (from icons.tsx)

## Responsive Behavior
- **Desktop (1440px):** as above
- **Tablet (768px):** same layout, min-width 1000px forces horizontal overflow
- **Mobile (390px):** header replaced by mobile variant (app banner + search overlay + bottom nav — see FloatingWidgets.spec.md); desktop header hidden
