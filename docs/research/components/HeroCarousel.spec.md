# HeroCarousel Specification

## Overview
- **Target file:** `src/components/HeroCarousel.tsx` (named export `HeroCarousel`)
- **Screenshots:** `docs/design-references/ikea.cn/sections/hero.png`, `hero-carousel.png`
- **Interaction model:** time-driven autoplay carousel + click pagination dots (loop)

## DOM Structure
```
div.mb-8.lg:mb-12 (margin-bottom 48px desktop)
  div.i-carousel.i-carousel__navigation
    div.swiper.swiper-initialized.swiper-horizontal
      div.swiper-wrapper (flex row, height 600px)
        a.swiper-slide.carousel-gallery__item × N (loop duplicates)
          div.i-aspect-ratio-box.i-aspect-ratio-box--standard
            div.i-image > img (cover, full slide)
      div.swiper-pagination.swiper-pagination-bullets (dots, bottom center)
      div.swiper-scrollbar (2px #dfdfdf progress bar)
    button.i-carousel__navigation__button.prev (40x40 black circle, chevron-left, hidden on desktop)
    button.i-carousel__navigation__button.next (40x40 black circle, chevron-right, hidden on desktop)
```

## Computed Styles (desktop 1440)

### Container
- height: 600px; width: 100%; marginBottom: 48px (desktop)
- position: relative

### .swiper-slide a
- display: block; width: 100%; height: 100%
- image: objectFit: cover; width/height 100%

### .swiper-pagination
- position: absolute; bottom: 0; left: 50% (translateX(-50%)); zIndex 10

### .swiper-pagination-bullet
- width: 5px; height: 5px; borderRadius: 50%; backgroundColor: #dfdfdf; margin: 0 6px
- Active (.swiper-pagination-bullet-active): backgroundColor: #111111 (verified live)

### .swiper-scrollbar
- height: 2px; backgroundColor: #dfdfdf; width: 98%; position: absolute; bottom: 8px
- Drag progress thumb: #111111

### .i-carousel__navigation__button
- width: 40px; height: 40px; borderRadius: 50%; backgroundColor: #111; color: #fff
- position: absolute; top: 50%; left: 16px / right: 16px; transform: translateY(-50%); zIndex 10
- Desktop: `display: none` (dots are the primary control); show on mobile if present

## States & Behaviors

### Autoplay
- **Trigger:** time-driven, 5000ms interval (`inter-time="5000"` attribute on the carousel; slide advance observed within ~4.5-5s)
- **Transition:** slides slide horizontally (600px per slide), loop-enabled (duplicate slides)
- **Implementation approach:** client component with `setInterval` + translateX on a flex track, or a lightweight `swiper`-like hook. Loop: duplicate first/last slides or reset without animation.

### Pagination click
- **Trigger:** click a bullet → jump to that slide
- Active dot: #dfdfdf → #111111 (5px circle)

## Per-State Content
### Slide 1
- Image: `public/images/cms/f542ce7fc67d4d9d99bb35dc7b490a48.jpg` (2880x1199)
- Link: `/cn/zh/campaigns/hopeful-summer-pub72b864f3`
### Slide 2
- Image: `public/images/cms/da3aab9e81d54880bf80639fd4d738d1.jpg` (2880x1199)
- Link: `/cn/zh/personalize-channel/LimitedTimeDiscountsChannel/?topProductIds=90407137`
### Slide 3
- Image: `public/images/cms/ce9846584ee74e6b9da50d5a6ed2aa1c.png` (1728x720)
- Link: `/cn/zh/h5page/?url=https://store-companion.ikea.cn/design-leads/wrd.html?channel=EC_website&cl_sr=cn_activity_page`
### Slide 4
- Image: `public/images/cms/1b23af63650e4a9d81c6bf2ed31570b7.jpg` (2592x1080)
- Link: `/cn/zh/landing-page/23f07ce063c141f682fdb2e7bc541c7f/`

## Assets
- `public/images/cms/f542ce7fc67d4d9d99bb35dc7b490a48.jpg`
- `public/images/cms/da3aab9e81d54880bf80639fd4d738d1.jpg`
- `public/images/cms/ce9846584ee74e6b9da50d5a6ed2aa1c.png`
- `public/images/cms/1b23af63650e4a9d81c6bf2ed31570b7.jpg`
- Icons: `ChevronLeftIcon`, `ChevronRightIcon`

## Responsive Behavior
- **Desktop (1440px):** 600px tall; dots bottom center; nav buttons hidden
- **Mobile (390px):** 520px tall (`.mb-8.lg:mb-12` with mobile height 520); search box + h5 logo overlay at top-left (handled by page assembly / mobile header overlay, see FloatingWidgets spec)
