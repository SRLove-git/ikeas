// Header menu hover-panel links, extracted from the live site.

export interface MenuPanelLink {
  label: string;
  href: string;
}

export interface MenuPanelBlock {
  title: string;
  links: MenuPanelLink[];
}

export interface MenuPanel {
  label: string;
  href: string;
  blocks: MenuPanelBlock[];
}

export const menuPanels: MenuPanel[] = [
  {
    label: "房间",
    href: "/cn/zh/rooms/living-room/",
    blocks: [
      {
        title: "按房间探索",
        links: [
          { label: "卧室", href: "/cn/zh/rooms/bedroom/" },
          { label: "餐厅", href: "/cn/zh/rooms/dining/" },
          { label: "书房和办公", href: "/cn/zh/rooms/home-office/" },
          { label: "门厅", href: "/cn/zh/rooms/hallway/" },
          { label: "客厅", href: "/cn/zh/rooms/living-room/" },
          { label: "儿童房", href: "/cn/zh/rooms/childrens-room/" },
          { label: "阳台", href: "/cn/zh/rooms/balcony/" },
          { label: "厨房", href: "/cn/zh/rooms/kitchen/" },
          { label: "浴室", href: "/cn/zh/rooms/bathroom/" },
          { label: "户外", href: "/cn/zh/rooms/outdoor/" },
        ],
      },
    ],
  },
  {
    label: "活动和特惠",
    href: "/cn/zh/campaigns/wo3-men2-de-chao1-zhi2-di1-jia4-pub8b08af40",
    blocks: [
      {
        title: "热门活动",
        links: [
          { label: "我们的超值低价", href: "/cn/zh/campaigns/wo3-men2-de-chao1-zhi2-di1-jia4-pub8b08af40" },
          { label: "更低价格", href: "/cn/zh/campaigns/new-lower-price-pubff11f9fb" },
          { label: "限时特惠", href: "/cn/zh/personalize-channel/LimitedTimeDiscountsChannel" },
        ],
      },
    ],
  },
  {
    label: "设计和服务",
    href: "/cn/zh/planners/",
    blocks: [
      {
        title: "设计工具",
        links: [
          { label: "衣柜设计", href: "/cn/zh/campaigns/suo-you-yi-gui-she-ji-ruan-jian-pub76e14b92" },
          { label: "浴室设计", href: "/cn/zh/planners/bathroom-planner/" },
          { label: "所有设计工具", href: "/cn/zh/planners/" },
        ],
      },
      {
        title: "客户服务",
        links: [
          { label: "送货服务", href: "/cn/zh/customer-service/services/delivery/" },
          { label: "组装服务", href: "/cn/zh/customer-service/services/assembly/" },
          { label: "设计服务", href: "/cn/zh/customer-service/services/kitchen-planning/" },
          { label: "安装服务", href: "/cn/zh/customer-service/services/kitchen-installation/" },
        ],
      },
    ],
  },
  {
    label: "家居灵感",
    href: "/cn/zh/ideas/rooms-inspiration/",
    blocks: [
      {
        title: "房间灵感图库",
        links: [
          { label: "卧室灵感", href: "/cn/zh/rooms/bedroom/gallery/" },
          { label: "客厅灵感", href: "/cn/zh/rooms/living-room/gallery/" },
          { label: "厨房灵感", href: "/cn/zh/rooms/kitchen/gallery/" },
          { label: "餐厅灵感", href: "/cn/zh/rooms/dining/gallery/" },
          { label: "浴室灵感", href: "/cn/zh/rooms/bathroom/gallery/" },
          { label: "儿童房灵感", href: "/cn/zh/rooms/childrens-room/gallery/" },
          { label: "书房和办公灵感", href: "/cn/zh/rooms/home-office/gallery/" },
          { label: "门厅灵感", href: "/cn/zh/rooms/hallway/gallery/" },
          { label: "户外灵感", href: "/cn/zh/rooms/outdoor/gallery/" },
        ],
      },
      {
        title: "灵感专栏",
        links: [
          { label: "不同房间的不同灵感", href: "/cn/zh/ideas/rooms-inspiration/" },
          { label: "一起宜家", href: "/cn/zh/ideas/ikea-plus-you/" },
          { label: "我的艺术展", href: "/cn/zh/ideas/curated-by-me/" },
          { label: "更可持续生活的创意和技巧", href: "/cn/zh/ideas/tips-for-more-sustainable-living/" },
        ],
      },
    ],
  },
  {
    label: "新品",
    href: "/cn/zh/personalize-channel/NewArrivalsChannel/",
    blocks: [
      {
        title: "新品速递",
        links: [
          { label: "探索当季新品", href: "/cn/zh/personalize-channel/NewArrivalsChannel/" },
          { label: "IKEA PS 2026 系列", href: "/cn/zh/new/meet-the-ikea-ps-2026-collection-pubf28e636c" },
          { label: "让家的每个角落都藏着玩趣", href: "/cn/zh/new/let-your-home-come-out-and-play-pubc28e2323" },
          { label: "LASTARE 系列", href: "/cn/zh/rooms/bedroom/LASTARE-serie-pub03fdc74e" },
        ],
      },
    ],
  },
  {
    label: "对公业务",
    href: "/cn/zh/ikea-business/",
    blocks: [
      {
        title: "宜家对公业务",
        links: [
          { label: "宜家对公业务首页", href: "/cn/zh/ikea-business/" },
          { label: "宜家企业会员", href: "/cn/zh/landing-page/5c84c33b5c95414bacf5f529c9d6a960/" },
          { label: "商业空间设计", href: "/cn/zh/ikea-business/pi-liang-cai-gou-pub826b2633" },
          { label: "工程项目及合作", href: "/cn/zh/ikea-business/comprehensive-solutions/gong-cheng-xiang-mu-ji-he-zuo-pub922524e8" },
          { label: "礼品采购", href: "/cn/zh/ikea-business/gift-purchasing/li-pin-cai-gou-pubbd104a34" },
        ],
      },
    ],
  },
];
