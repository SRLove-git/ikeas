# ServiceColumns Specification

## Overview
- **Target file:** `src/components/ServiceColumns.tsx` (named export `ServiceColumns`)
- **Screenshot:** `docs/design-references/ikea.cn/ikea-desktop-fullpage.png` (section ~y 1654–1911)
- **Interaction model:** static (links only)

## DOM Structure
```
section.pub-columns.three-columns (flex row)
  div.pub-columns__item × 3
    div.pub-columns__content
      div.pub-image.component-wrapper
        a > div.i-aspect-ratio-box.i-aspect-ratio-box--standard (gray image placeholder 232px)
        p (caption)
```

## Computed Styles (desktop 1440)

### Container .pub-columns
- display: flex; flex-direction: row; width: 1280px; height: 257px; position: relative
- gap between columns: 20px (3 × 413.33 + 2 × 20 = 1280)

### .pub-columns__item
- width: 413.33px; height: 257px; display: block

### .i-aspect-ratio-box--standard
- width: 413.33px; height: 232.48px; background: #f5f5f5 (image placeholder; images are empty on the live site)
- padding-bottom technique: 232.48px

### Caption p
- font-size: 14px; font-weight: 400; line-height: 21px; color: #111111; margin-top: 4px (24px total gap under image: image 232.48 + caption 21 + 4 = ~257)

## Content (verbatim)
1. Caption: `宜家全屋设计 | 1对1专业服务，为您打造理想的家`
   Link: `/cn/zh/h5page/?url=https://store-companion.ikea.cn/design-leads/wrd.html?channel=EC_websit`
2. Caption: `宜家对公业务|企业会员礼、特享满额返券等权益焕新升级`
   Link: `/cn/zh/ikea-business/`
3. Caption: `宜家厨房 | 专业品质，厨房焕新，最快3天`
   Link: `/cn/zh/h5page/?url=https://store-companion.ikea.cn/kitchen?channel=kitchen_IRW%20M2&cl_sr=IR`

## Assets
- Real images (extracted from CMS payload):
  1. `public/images/cms/8b766d590aa74599957006b42a5d6ffd.jpg` (宜家全屋设计)
  2. `public/images/cms/fadeb411053d49f18472baf81ffec5a4.jpg` (宜家对公业务)
  3. `public/images/cms/293f4299997441d79e57236ccad79b55.jpg` (宜家厨房)
- Image area: 413.33 x 232.48 (16:9-ish, aspect-ratio box), `object-fit: cover`, background `#f5f5f5` while loading.

## Data
- Import `serviceColumns` from `src/data/homepage.ts` (title/caption, ctaHref, backgroundImage).

## Responsive Behavior
- Desktop (1440px): 3 columns, 413.33px each, 20px gap.
- Mobile (390px): container flex-direction column; items full width (390px minus page padding); image area ~ (390-40) × 0.5625 = ~197px tall; caption below.
- Tablet (768px): stacks to column as well (observed flex-direction: column, child width 568 at 768 viewport).
