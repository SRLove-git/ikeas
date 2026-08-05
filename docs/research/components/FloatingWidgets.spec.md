# FloatingWidgets Specification

## Overview
- **Target file:** `src/components/FloatingWidgets.tsx` (named export `FloatingWidgets`)
- **Screenshots:** `docs/design-references/ikea.cn/ikea-desktop-fullpage.png`, `ikea-mobile-fullpage.png`
- **Interaction model:** fixed overlays — cookie consent (dismissible), chat button (opens panel), back-to-top (appears on scroll), mobile app banner (dismissible), mobile bottom nav, float app button

## DOM Structure (desktop)
```
div.ikeacn-cookie-consent-body
  div#ikeacn-consent-modal.cloud.slide (fixed bottom bar)
    div#ikeacn-consent-modal__container (max-width 1440, flex row, space-between)
      div#ikeacn-consent-modal__content
        div#ikeacn-consent-modal__title 宜家官网使用Cookies... (16px)
        div#ikeacn-consent-modal__description (13px, #484848)
      div#ikeacn-consent-modal__action
        button#ikeacn-consent-modal__action--primary 设置
        button#ikeacn-consent-modal__action--secondary 我接受
div.chat-menu.fixed.pc-chat-menu (56x56, bottom-right)
  div.chat-menu-white-button (white circle, chat icon + 客服 label)
  div.chat-menu-tips (hover bubble: 需要帮助？小宜随时恭候)
div.i-back-top (fixed bottom-right, appears after scroll, black circle with up arrow)
```

## Computed Styles (desktop 1440)

### Cookie consent bar (.cloud.slide)
- position: fixed; bottom: 0; left: 0; width: 100%; zIndex: 1002
- backgroundColor: #ffffff; boxShadow: 0 -4px 20px rgba(0,0,0,.08)
- Title: fontSize 16px; color #111
- Description: fontSize 13px; color #484848
- Buttons: `设置` (border 1px #111, transparent bg) / `我接受` (bg #0058a3, white text); height 40px; radius 64px

### Chat button (.chat-menu)
- position: fixed; right: 22px; bottom: 30px; width: 56px; height: 56px; zIndex: 20
- `.chat-menu-white-button`: 56x56 white circle, border 1px #dfdfdf, shadow; chat SVG 24x24 #111 + `客服` 12px/700
- `.chat-menu-tips`: hover bubble white, radius 8px, text `需要帮助？小宜随时恭候`

### Back-to-top (.i-back-top)
- position: fixed; right: 22px; bottom: 100px; width: 40px; height: 40px; borderRadius: 50%
- backgroundColor: #111; color: #fff; opacity 0 default; appears (opacity 1) after scrollY > 400

## Mobile-only overlays (390px)
### App download banner (.app-download-banner__wrapper)
- position: fixed/absolute top; height: 64px; backgroundColor: #fff; borderBottom 1px #e5e7eb
- Content: close button (16px X icon), logo img 32x32 (`public/images/logo/h5-logo.svg` or 43b094f...png), text `使用宜家APP，购物更方便` (14px/700) + `IKEA 宜家家居` (12px #484848), CTA `前往购买` button (bg #0058a3, white 12px/700)

### Bottom navigation (.i-layout__bottom-navigation / .i-nav-mobile)
- position: fixed; bottom: 0; left: 0; width: 100%; height: 56px; backgroundColor: #fff; zIndex: 900
- borderTop: 1px solid #e5e7eb; 5 items evenly spaced
- Each item: icon 20px + label 10px/700 (#111; active item color #0058a3)
- Items: 首页 (home icon) / 分类 (search icon) / 发现 (doc icon) / 购物袋 (cart icon) / 我的 (user icon)

### Float app button (.float-app-button)
- position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%); height: 44px
- backgroundColor: #0058a3; borderRadius: 22px; color: #fff; fontSize 14px/700
- Content: `打开宜家APP` + close X icon; width ~200px

## States & Behaviors
- Cookie bar: dismissible via 我接受 (state hidden)
- Chat: hover shows tips bubble; click opens chat panel (mock: toggle a small panel or no-op)
- Back-to-top: appears at scrollY > 400, click scrolls to top
- Mobile banner: dismissible (close button)
- Mobile float button: dismissible

## Content (verbatim)
- Cookie: `宜家官网使用Cookies,让浏览器更简单。` / `查看更多有关浏览器Cookies。` / `若您继续保持浏览宜家官网，我们将默认您接受Cookies。` / `设置` `我接受`
- Chat: `客服` / `需要帮助？小宜随时恭候`
- Mobile banner: `使用宜家APP，购物更方便` / `IKEA 宜家家居` / `前往购买`
- Bottom nav: `首页` `分类` `发现` `购物袋` `我的`
- Float: `打开宜家APP`

## Assets
- Icons from icons.tsx: ChatIcon, ArrowUpIcon, CloseIcon, HomeIcon, SearchIcon, DiscoverIcon, CartIcon, UserIcon
- `public/images/cms/43b094f1d4844966b8d69a3d461efc9b.png` (app logo, mobile banner)

## Responsive Behavior
- Desktop: cookie bar + chat + back-to-top only
- Mobile: banner + bottom nav + float app button; chat hidden
