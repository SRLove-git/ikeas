# InspirationTipsCard Specification

## Overview
- **Target file:** `src/components/InspirationTipsCard.tsx` (named export `InspirationTipsCard`)
- **Screenshot:** `docs/design-references/ikea.cn/ikea-desktop-fullpage.png` (section ~y 2971–3675)
- **Interaction model:** static.

## DOM Structure
Same as PromoInspirationCard: h2 + 3 cards (413px), each: 413x413 gray image placeholder + desc block (padding 30px, light blue bg) with h3 + p + circle arrow button.

## Computed Styles
- h2: 24px/700, margin-bottom 24px. Title: `查看更多家居布置小贴士`.
- Cards: 413px wide, 644px tall, margin-right 20px; image placeholder 413x413 #f5f5f5.
- Desc block: height 231px, padding 30px, background #acd6f2 (light blue), color #111; h3 20px/700; p 14px/400; circle button 40x40 white bg + #111 arrow.

## Content (verbatim)
1. 为有序生活设计 / 桌面不再凌乱，墙面井然有序 → /cn/zh/ideas/rooms-inspiration/a-small-kitchen-made-big-with-space-saving-ideas-pub995d19f6
2. 为孩子设计 / 小小家庭用餐区，满足用餐和其它需求 → /cn/zh/ideas/rooms-inspiration/a-small-family-dining-room-for-more-than-just-meals-pub3b9d089b
3. 为小空间设计 / 七合一的房间设计 → /cn/zh/ideas/rooms-inspiration/your-first-own-home-with-room-for-everyone-you-know-pub853aa386

## Responsive
- Same as PromoInspirationCard (horizontal scroll on mobile, cards ~70vw).
