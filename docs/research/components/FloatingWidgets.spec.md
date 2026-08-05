# FloatingWidgets Specification

## Overview
- **Target file:** `src/components/FloatingWidgets.tsx` (named export `FloatingWidgets`)
- **Screenshots:** use `docs/design-references/ikea-desktop-viewport.png` (cookie bar visible) and mobile full-page for bottom nav
- **Interaction model:** click-driven + scroll-driven (back-to-top appears after scrolling)

## Desktop widgets
### Cookie consent bar (`.cloud.slide`, fixed bottom, z 1000)
- White bar, border-top 1px #e5e7eb, full width, padding 16px 32px, flex row space-between.
- Text: `宜家官网使用Cookies来为你提供更好的服务。继续使用本网站，即表示你同意我们按照本政策使用Cookies。`
- Buttons: 设置 (secondary, 40px pill border #111) and 我接受 (primary, 40px pill bg #0058a3 white text).
- Dismissible (fades out on 我接受).

### Chat button (`.chat-menu`, fixed bottom-right 56x56, z 20)
- Circle 56x56, bg #0058a3, white ChatIcon 28px; hover bg #004a8c.
- Click opens a chat panel (320x420, white, radius 8px, shadow): header 宜家客服 + close; body with a mock welcome message.

### Back-to-top (`.i-back-top`, fixed bottom-right, above chat, 40x40 circle bg #111 white ChevronUp)
- Appears with fade after scrollY > 300; click scrolls smoothly to top.

## Mobile-only widgets
### App download banner (`.app-download-banner__wrapper`, top, height 64px)
- bg #0058a3; left: h5 logo + text 使用宜家APP，购物更方便 / IKEA 宜家家居; right: 前往购买 link + close X.

### Bottom navigation (`.i-layout__bottom-navigation`, fixed bottom, height 56px, z 100, bg white, border-top)
- 5 items: 首页 (HomeIcon), 分类 (CategoryIcon), 发现 (CompassIcon), 购物袋 (CartBagIcon), 我的 (UserIcon); active item color #0058a3, labels 10px/400.

### Float app button (`.float-app-button`, fixed bottom-right, 44px wide × 200px tall, radius 22px, bg #0058a3)
- Vertical text 打开宜家APP, white, 12px/700; above bottom nav on mobile.

## Data
- No data imports needed; copy text verbatim from above.
- Icons needed (add to `src/components/icons.tsx` if missing): `HomeIcon`, `CategoryIcon`, `CompassIcon`, `ChevronUpIcon`.
