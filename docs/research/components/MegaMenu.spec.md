# MegaMenu Specification

## Overview
- **Target file:** `src/components/MegaMenu.tsx` (named export `MegaMenu`)
- **Part of:** Header hover dropdown (`Header.tsx`)
- **Screenshot:** `docs/design-references/ikea.cn/sections/header.png`
- **Interaction model:** hover-driven (hover a top menu item to show panel; hover a category row to swap sub-list)

## DOM Structure
```
div.header_container_bottom (absolute below header, width 100%, white)
  div.header_container_bottom_content
    div.nav-header-card-container (padding 0 80px, width 1440, height 720)
      div.nav-header-category
        div.nav-header-category-box
          div.main-list
            ul.category-list (width 179px, padding-right 20px)
              li x 24
                a.name (14px/700, #111; active: #0058a3)
          div.sub-list (flex row, margin-right -18px)
            a.sub-title (14px/700, padding 10px 0 0 40px, height 31px)
            div.sub-list-li x N
              a.category-box (flex column)
                div.img-bg (image 80px tall)
                div.category-box-name (14px, #111)
      div.nav-header-card-li x N (promo card columns, right side)
        div.card-container__menu
          div.component > div.pub-columns (2-3 columns with promo links)
        div.card-container__resource
          div.navigation-advertisements-page
            div.inspiration-cards (swiper of inspiration tiles)
            div.pub-image (ad image 300px)
```

## Computed Styles (desktop 1440)

### .header_container_bottom
- position: absolute; top: 133.5px (below header); left: 0; width: 100%; backgroundColor: #fff
- default hidden (max-height 0 / opacity 0); visible on hover of a menu item

### .nav-header-card-container
- padding: 0 80px; width: 1440px; maxWidth: 1440px; height: 720px
- display: flex (category list + promo cards)

### .category-list
- width: 179px; height: 699px; paddingRight: 20px; marginRight: -20px; overflow-y: auto

### .category-list li
- height: 46px; display: flex; alignItems: center

### .category-list a.name
- fontSize: 14px; fontWeight: 700; color: #111
- Active row: color #0058a3; row has light-blue tint background

### .sub-list
- display: flex; flexDirection: row; flexWrap: wrap; marginRight: -18px; width: 1138px; height: 699px

### .sub-title
- display: block; fontSize: 14px; fontWeight: 700; padding: 10px 0 0 40px; height: 31px

### .sub-list-li
- padding: 10px 18px 0 0; width: ~185px

### .category-box
- display: flex; flexDirection: column; gap: 8px

### .category-box .img-bg
- width: 100%; height: 80px; backgroundColor: #f5f5f5 (image placeholder)

### .category-box-name
- fontSize: 14px; fontWeight: 400; color: #111

### .nav-header-card-li
- margin-left: 32px; width: ~280px
- contains `.card-container__menu` promo columns + `.card-container__resource` inspiration/ad area

## States & Behaviors

### Category hover swap
- **Trigger:** hover on a category-list row
- Active row text turns #0058a3; the right `.sub-list` swaps to that category's children
- **Transition:** ~0.2s color change

### Panel open/close
- **Trigger:** hover on parent menu item (mouseenter/mouseleave with small delay)
- Panel: max-height 0 to 720px, opacity 0 to 1, ~0.3s ease

## Per-State Content
### Menu: 所有商品 (category list, verbatim — 24 items)
沙发和扶手椅 (active default) | 桌子和椅子 | 书桌和书桌椅 | 储物家具 | 储物收纳用品 | 床和床垫 | 纺织品 | 窗帘和卷帘 | 婴儿和儿童 | 餐具和厨具 | 整体厨房和电器 | 浴室家具和收纳 | 灯具照明 | 装饰品 | 清洁及晾晒用品 | 智能家居 | 家用电子产品 | 户外产品 | 花盆和植物 | 家居修缮 | 瑞典美食屋 | 季节节日 | 宠物用品

### Sub-list for 沙发和扶手椅 (verbatim)
沙发 / 沙发床 / 扶手椅 / 贵妃椅 / 脚凳 / 座垫和头枕 / 沙发套和扶手椅套 / 沙发和扶手椅支腿 / 模块沙发

### Other menus (sample sub-lists consistent with IKEA structure)
- 房间: 客厅 / 卧室 / 厨房 / 餐厅 / 儿童房 / 浴室 / 书房和办公 / 门厅 / 户外 / 阳台
- 活动和特惠: 最新优惠 / 必逛好物 / 新品 / 更低价格 / 优惠手册
- 设计和服务: 全屋设计 / 厨房设计 / 卧室设计 / 在线设计工具 / 测量服务 / 组装服务 / 送货服务
- 家居灵感: 房间灵感 / 小空间设计 / 儿童房间 / 可持续生活
- 新品: 全部新品 / 家具新品 / 家居用品新品
- 对公业务: 企业会员 / 批量采购 / 办公室家具 / 商用厨房

## Assets
- Category images: gray placeholders (#f5f5f5 80px blocks) — live site images not loaded
- Promo card images: placeholders as in PromoInspirationCard
- Icons: `ChevronRightIcon`

## Responsive Behavior
- **Desktop (1440px):** 720px panel with category list + sub-list + promo cards
- **Mobile (390px):** mega menu not used (mobile nav replaces it)
