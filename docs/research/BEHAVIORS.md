# Behaviors — ikea.cn 首页

Verified via Playwright automation (desktop 1440x900 and mobile 390x844).

## Header

- Header is NOT sticky: `.i-layout__header` position relative; at scrollY 400 it scrolls off-screen.
- `.nav-header` background is IKEA beige `rgb(245, 222, 179)`; inner container white.
- Notice bar (`.nav-header-message`): black `#111`, white 14px text, height 40px, vertical autoplay carousel of messages, ~3s interval.
- Search input (`.s-input`): 40px tall, radius 24px, bg `#f5f5f5`, font 13px/700, padding-left 52px, with a search icon (24px, absolute left) and a rotating vertical hint carousel overlay (`s-header-notice`, 30px).
- Right actions are pill buttons (`.hover`, radius 24px, padding 10px, 24px icons):
  - 登录宜家账号 (icon + text, 133px wide)
  - 我的个人档案 (48px icon)
  - 我的收藏 (48px icon)
  - 购物袋 (48px icon)
  - Each has a tooltip below (`.i-tooltip__body`, white, 4px radius, 12px text).
- Menu row: `UL.header_container_center_ul` — 7 items, font 14px/700: 所有商品, 房间, 活动和特惠, 设计和服务, 家居灵感, 新品, 对公业务, plus 下载APP (13px/700) with hover QR panel.
- Hover on a menu item opens `.header_container_bottom` mega panel (720px tall): left category list (46px rows, active row has `.active.name` bold) + right sub-list with category images (80px tall) and sub-title.
- Hover on 下载APP opens `.detail-info-container` (262x102, white, radius 4, QR image 74x74 + desc text).

## Hero carousel (desktop)

- 3 real slides (6 DOM slides incl. loop duplicates), 600px tall, full-width, images from file.app.ikea.cn CMS.
- Autoplay confirmed (active slide index advanced within 4.5s).
- Pagination: `.swiper-pagination-bullets` horizontal, clickable bullets. No arrow buttons.
- Container: `.mb-8.lg:mb-12`, margin-bottom 48px desktop.

## Mobile hero

- 390x520 slides (different image set), with a search box overlay ("你在找什么?") and h5 logo overlay (56x24 at top-7 left-6).

## Notice carousel (header search hints + top bar)

- Vertical swiper, autoplay, ~3s, slides transition by translating Y.

## Ranking section

- **CORRECTED 2026-08-05:** The live section is a horizontally scrollable strip of 10 category panels (397px each, brown header + 3-product column), NOT pill-switched content. Arrow buttons scroll the strip. (Earlier observation of pills was stale.)
- Header per panel: `热销榜` + category name in white on `#807151`; padding 20px 24px; height 97px.
- Categories: 食品储存与收纳, 抽屉和隔板, 杯子和马克杯, 抹布及海绵清洁刷, 斗柜, 烹饪准备用具, 浴室储物盒和篮子, 落地灯, 碗, 弹簧床垫 (+ more).
- Product cards: image 100x100 (s3 images), name, price ¥ (12 products per category visible).
- Desktop: horizontal scroll of panels with arrow buttons (`i-scrollbar-arrow__button`).

## Product inspiration (发现更多家居灵感)

- Tab bar `.inspiration-feeds__tabs.sticky` — sticky at top:0, z-index 20 (sticks when section scrolls under it).
- Tabs: `i-pill i-pill--small i-tabs__item` — 全部 卧室 客厅 厨房 书房 浴室 阳台 儿童房 户外 餐厅 门厅 电竞 新品; active tab = `i-pill--active` (bg #f5f5f5 + 2px #111 border, NOT black bg — corrected 2026-08-05).
- Clicking a tab swaps the product grid content (client-side; e.g. 卧室 shows bedroom products).
- Products: name + price + tag chips (新品/热卖/即将下架) + add-to-cart icon button (`cartin-button`, 32px).
- "加载更多内容" button loads more products.
- Desktop grid: masonry/waterfall (`.i-waterfall`), mobile single column.

## Visual pill sliders (房间 / 可持续)

- Horizontal scrollable pill list (`.visualpillslider-item`), click-driven navigation buttons on desktop.

## Footer

- 585px tall. Featured cards (加入宜家俱乐部 / 加入宜家企业会员) with 查看更多 / 立即加入或登录 links.
- 4 link groups: 常用链接, 客户服务, 关于宜家, 宜家新闻.
- Social icons (weChat.svg, sina.svg, xiaohongshu.svg).
- Bottom legal bar.

## Floating widgets

- Cookie consent bar fixed bottom (`.cloud.slide`): "宜家官网使用Cookies..." with 设置 / 我接受 buttons.
- Chat button fixed bottom-right 56x56 (`.chat-menu`), opens draggable chat panel (宜家客服).
- Back-to-top `.i-back-top` appears after scroll.
- Mobile: bottom navigation fixed (56px), app-download banner, 打开宜家APP float button, 全屋设计服务 promo popup (auto-shown, dismissible).

## Scroll behavior

- No Lenis / Locomotive smooth scroll; no scroll-snap.
- The product-inspiration tab bar is the only sticky element in content (sticks at top:0).
