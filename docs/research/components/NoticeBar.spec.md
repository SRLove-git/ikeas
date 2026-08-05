# NoticeBar Specification

## Overview
- **Target file:** `src/components/NoticeBar.tsx` (named export `NoticeBar`)
- **Screenshot:** `docs/research/components/notice-bar-desktop.png`
- **Interaction model:** time-driven (vertical autoplay carousel of messages, ~3s per slide)

## DOM Structure
```
div.nav-header-message (height 40px, full width, bg #111)
  div.swiper.i-notice__carousel (vertical, loop, autoplay ~3000ms)
    div.swiper-wrapper (translateY animates -40px per slide)
      a.swiper-slide (height 40px, center) — each message is a link
```

## Computed Styles (desktop 1440)
- Container `.nav-header-message`: height 40px; width 1440px; display flex; align-items center; justify-content center; background-color #111111.
- Slide links: font-size 14px; font-weight 400; line-height 21px; color #ffffff; text-align center; white-space nowrap.
- The carousel is a vertical Swiper: slides stack in a column, one visible at a time, transition translateY by 40px per slide.
- Hover on a message link: no special state (plain link).

## Content (verbatim, in order)
1. `无锡商场发票事宜沟通` → https://www.ikea.cn/cn/zh/landing-page/8e76bbd12f634c62bbac91972d4bc04f/
2. `宜家在中国召回部分批次BÄSINGEN 巴辛根 淋浴椅` → https://www.ikea.cn/cn/zh/customer-service/product-support/recalls/yi-jia-zai-zhong-guo-zhao-hui-bu-fen-pi-ci-ae-ba-xin-gen-lin-yu-yi-pub076c4a6a

## Data
- Import `noticeMessages` from `src/data/homepage.ts`.

## Implementation approach
- Client component with `useEffect`: rotate through messages every 3s using a translateY transition on the track (one visible 40px row, track height 40px, `overflow: hidden`). Loop back to 0 after the last.
- Transition: transform 300-500ms ease (matches Swiper default `transition-duration: 300ms` behavior; vertical carousel translates by slide height).

## Responsive Behavior
- Desktop & mobile: same 40px black bar; messages centered. On mobile, text may be truncated with ellipsis at ~90vw.
