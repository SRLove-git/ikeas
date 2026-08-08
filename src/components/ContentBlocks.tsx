import Link from "next/link";
import type { ContentBlock, ContentBlockItem } from "@/data/pages-types";
import { SiteImage } from "@/components/SiteImage";

function isInternal(href: string) {
  return href.startsWith("/");
}

function BlockLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (isInternal(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

interface Item {
  image?: string | null;
  text?: string;
  href?: string;
  title?: string;
  backgroundColor?: string | null;
}

const PLACEHOLDER_TITLES = new Set(["alt for image", "名称"]);

function cleanTitle(title: string | null | undefined): string {
  const t = (title ?? "").trim();
  return PLACEHOLDER_TITLES.has(t) ? "" : t;
}

/** Pair images/texts/links into card-like items for galleries and lists. */
function pairItems(block: ContentBlock, max = 12): Item[] {
  const items: Item[] = [];
  const n = Math.max(block.images.length, block.texts.length, block.links.length);
  for (let i = 0; i < n && items.length < max; i++) {
    const item: Item = {};
    if (block.links[i]) {
      item.href = block.links[i].href;
      if (block.links[i].text) item.text = block.links[i].text;
    }
    if (block.images[i]) item.image = block.images[i];
    if (!item.text && block.texts[i]) item.text = block.texts[i];
    items.push(item);
  }
  // Fall back to any leftover links/images not aligned by index.
  if (items.length === 0) {
    const all = Math.max(block.images.length, block.links.length);
    for (let i = 0; i < all && items.length < max; i++) {
      const item: Item = {
        image: block.images[i] ?? null,
        href: block.links[i]?.href,
        text: block.links[i]?.text,
      };
      items.push(item);
    }
  }
  return items;
}

function HeroBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null;
  const text = block.texts[0] ?? null;
  const link = block.links[0] ?? null;
  return (
    <section className="relative overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={block.title ?? ""}
          className="h-[300px] w-full md:h-[420px] lg:h-[520px]"
          imgClassName="h-full object-cover"
        />
      ) : null}
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        {block.title ? (
          <h1 className="text-2xl font-bold leading-9 lg:text-4xl">{block.title}</h1>
        ) : null}
        {text ? <p className="mt-3 max-w-2xl text-sm leading-6 text-ikea-muted">{text}</p> : null}
        {link?.href ? (
          <div className="mt-6">
            <BlockLink
              href={link.href}
              className="i-btn i-btn--primary inline-flex h-10 items-center px-5 text-xs font-bold text-white"
            >
              {link.text || "了解更多"}
            </BlockLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ImageBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null;
  const caption = block.texts.find((t) => t.length < 120) ?? block.title;
  return (
    <figure className="overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={caption ?? ""}
          className="aspect-[4/3] w-full"
        />
      ) : null}
      {caption ? (
        <figcaption className="px-4 py-3 text-xs text-ikea-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="space-y-3">
      {block.title ? (
        <h2 className="text-xl font-bold leading-8 lg:text-2xl">{block.title}</h2>
      ) : null}
      {block.texts.map((t, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-6 text-ikea-muted">
          {t}
        </p>
      ))}
      {block.links.length > 0 ? (
        <div className="flex flex-wrap gap-3 pt-1">
          {block.links.slice(0, 3).map((l, i) => (
            <BlockLink
              key={i}
              href={l.href}
              className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
            >
              {l.text || "了解更多"}
            </BlockLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ColumnsBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? [];
  if (items.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
              <SiteImage
                src={item.image}
                alt={cleanTitle(item.title)}
                className="aspect-[4/3] w-full"
              />
            {cleanTitle(item.title) ? (
              <p className="mt-2 text-sm font-bold group-hover:underline">
                {cleanTitle(item.title)}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    );
  }
  const n = Math.max(1, Math.min(4, block.texts.length || block.images.length || 2));
  const columns = Array.from({ length: n }, (_, i) => ({
    text: block.texts[i] ?? null,
    image: block.images[i] ?? null,
    link: block.links[i] ?? null,
  }));
  return (
    <div
      className={`grid gap-8 ${
        n === 1 ? "grid-cols-1" : n === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
      }`}
    >
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-3">
          {col.image ? (
            <SiteImage
              src={col.image}
              alt={col.text ?? ""}
              className="aspect-[4/3] w-full"
            />
          ) : null}
          {col.text ? <p className="text-sm leading-6 text-ikea-muted">{col.text}</p> : null}
          {col.link?.href ? (
            <BlockLink
              href={col.link.href}
              className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
            >
              {col.link.text || "了解更多"}
            </BlockLink>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function GalleryBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? [];
  if (items.length > 0) {
    return (
      <div>
        {block.title ? <h2 className="mb-4 text-xl font-bold">{block.title}</h2> : null}
        {block.texts[0] ? (
          <p className="mb-5 max-w-2xl text-sm leading-6 text-ikea-muted">
            {block.texts[0]}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <BlockLink key={i} href={item.href ?? "#"} className="group">
              <SiteImage
                src={item.image}
                alt={cleanTitle(item.title)}
                className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
              />
              {cleanTitle(item.title) ? (
                <p className="mt-2 line-clamp-2 text-sm font-bold group-hover:underline">
                  {cleanTitle(item.title)}
                </p>
              ) : null}
            </BlockLink>
          ))}
        </div>
      </div>
    );
  }
  const paired = pairItems(block);
  if (paired.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {paired.map((item, i) => (
        <div key={i} className="group overflow-hidden bg-ikea-gray-100">
          {item.image ? (
            <SiteImage
              src={item.image}
              alt={item.text ?? ""}
              className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {item.text ? (
            <p className="truncate px-3 py-2 text-xs text-ikea-muted">{item.text}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProductGridBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block, 24);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <BlockLink key={i} href={item.href ?? "#"} className="group">
          <div className="overflow-hidden bg-ikea-gray-100">
            {item.image ? (
              <SiteImage
                src={item.image}
                alt={item.text ?? ""}
                className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="aspect-square w-full" />
            )}
          </div>
          {item.text ? (
            <p className="mt-2 line-clamp-2 text-sm text-ikea-black">{item.text}</p>
          ) : null}
        </BlockLink>
      ))}
    </div>
  );
}

function ButtonLinkBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0];
  if (!link?.href) return null;
  return (
    <div className="flex justify-center">
      <BlockLink
        href={link.href}
        className="i-btn i-btn--primary inline-flex h-10 items-center px-6 text-xs font-bold text-white"
      >
        {link.text || block.title || "了解更多"}
      </BlockLink>
    </div>
  );
}

function QuoteBlock({ block }: { block: ContentBlock }) {
  const text = block.texts[0] ?? block.title;
  if (!text) return null;
  return (
    <blockquote className="border-l-4 border-ikea-yellow pl-6">
      <p className="text-lg font-bold leading-8 lg:text-xl">{text}</p>
      {block.texts[1] ? (
        <cite className="mt-2 block text-sm not-italic text-ikea-muted">
          {block.texts[1]}
        </cite>
      ) : null}
    </blockquote>
  );
}

function PageTitleBlock({ block }: { block: ContentBlock }) {
  return (
    <div>
      <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{block.title}</h1>
      {block.texts[0] ? (
        <p className="mt-2 text-sm text-ikea-muted">{block.texts[0]}</p>
      ) : null}
    </div>
  );
}

function PageListBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block);
  if (items.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, i) => (
        <BlockLink
          key={i}
          href={item.href ?? "#"}
          className="group flex items-center gap-4 border border-ikea-gray-200 p-4 hover:border-ikea-black"
        >
          {item.image ? (
            <SiteImage
              src={item.image}
              alt=""
              className="h-16 w-16 shrink-0"
              imgClassName="h-full object-cover"
            />
          ) : null}
          <div>
            {item.text ? (
              <p className="text-sm font-bold group-hover:underline">{item.text}</p>
            ) : null}
            {block.links[i]?.text && block.links[i].text !== item.text ? (
              <p className="mt-1 text-xs text-ikea-muted">{block.links[i].text}</p>
            ) : null}
          </div>
        </BlockLink>
      ))}
    </div>
  );
}

function VideoLinkBlock({ block }: { block: ContentBlock }) {
  const image = block.images[0] ?? null;
  const link = block.links[0] ?? null;
  const text = block.title ?? block.texts[0] ?? null;
  return (
    <BlockLink href={link?.href ?? "#"} className="group relative block overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={text ?? ""}
          className="aspect-video w-full"
        />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6 text-ikea-blue">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      {text ? (
        <p className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-2 text-sm font-bold text-white">
          {text}
        </p>
      ) : null}
    </BlockLink>
  );
}

function BannerBlock({ block }: { block: ContentBlock }) {
  const image = (block.items ?? [])[0]?.image ?? block.images[0] ?? null;
  const link = block.links[0] ?? null;
  return (
    <section className="relative overflow-hidden bg-ikea-gray-100">
      {image ? (
        <SiteImage
          src={image}
          alt={block.title ?? ""}
          className="h-64 w-full md:h-80"
          imgClassName="h-full object-cover"
        />
      ) : null}
      <div className="max-w-page mx-auto flex flex-col items-start gap-4 px-5 py-10 lg:px-10">
        {block.title ? <h2 className="text-xl font-bold lg:text-2xl">{block.title}</h2> : null}
        {block.texts[0] ? (
          <p className="max-w-xl text-sm leading-6 text-ikea-muted">{block.texts[0]}</p>
        ) : null}
        {link?.href ? (
          <BlockLink
            href={link.href}
            className="i-btn i-btn--primary inline-flex h-10 items-center px-5 text-xs font-bold text-white"
          >
            {link.text || "了解更多"}
          </BlockLink>
        ) : null}
      </div>
    </section>
  );
}

function PillSliderBlock({ block }: { block: ContentBlock }) {
  const raw = block.items ?? [];
  const items: (ContentBlockItem | Item)[] =
    raw.length > 0 ? raw : pairItems(block);
  if (items.length === 0) return null;
  return (
    <div>
      {block.title ? <h2 className="mb-5 text-xl font-bold">{block.title}</h2> : null}
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group w-32 shrink-0">
            <div
              className="overflow-hidden rounded-full border-4 border-transparent transition-colors group-hover:border-ikea-blue"
              style={{ backgroundColor: item.backgroundColor ?? "#f5f5f5" }}
            >
              <SiteImage
                src={item.image}
                alt={item.title ?? item.text ?? ""}
                className="aspect-square w-full rounded-full"
              />
            </div>
            {item.title ? (
              <p className="mt-2 text-center text-xs font-bold group-hover:underline">
                {item.title}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  );
}

function RankingBlock({ block }: { block: ContentBlock }) {
  return (
    <section className="bg-ikea-gray-100 px-6 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold lg:text-xl">
          {block.title ?? block.texts[0] ?? "热销榜单"}
        </h2>
        <BlockLink
          href={block.links[0]?.href ?? "/cn/zh/all-products/"}
          className="text-sm font-bold text-ikea-blue hover:underline"
        >
          {block.links[0]?.text || "查看完整榜单"}
        </BlockLink>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {["#1", "#2", "#3", "#4", "#5"].map((rank, i) => (
          <div
            key={rank}
            className="flex aspect-square flex-col items-center justify-center text-white"
            style={{ backgroundColor: ["#5AA58A", "#5097BF", "#D4973B", "#A36C9F", "#B84A4A"][i] }}
          >
            <span className="text-2xl font-bold">{rank}</span>
            <span className="mt-1 text-xs opacity-90">卧室热销</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImageWithTextBoxBlock({ block }: { block: ContentBlock }) {
  const item = (block.items ?? [])[0];
  const image = item?.image ?? block.images[0] ?? null;
  const title = item?.title ?? block.title;
  const link = item?.href ?? block.links[0]?.href ?? null;
  return (
    <BlockLink href={link ?? "#"} className="group relative block">
      <SiteImage
        src={image}
        alt={title ?? ""}
        className="aspect-[16/9] w-full"
      />
      <div className="absolute bottom-0 left-0 m-5 max-w-xs bg-white p-4 shadow-md">
        {title ? (
          <h3 className="text-base font-bold group-hover:underline">{title}</h3>
        ) : null}
        {item?.text || block.texts[0] ? (
          <p className="mt-1 text-xs leading-5 text-ikea-muted">
            {item?.text || block.texts[0]}
          </p>
        ) : null}
      </div>
    </BlockLink>
  );
}

function InspirationCardBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block);
  if (items.length === 0) return null;
  return (
    <div>
      {block.title ? <h2 className="mb-5 text-xl font-bold lg:text-2xl">{block.title}</h2> : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <div className="overflow-hidden bg-ikea-gray-100">
              {item.image ? (
                <SiteImage
                  src={item.image}
                  alt={item.text ?? ""}
                  className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
            </div>
            {item.text ? (
              <p className="mt-2 line-clamp-2 text-sm font-bold group-hover:underline">{item.text}</p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  );
}

function ExpandableBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block, 8);
  const rows =
    items.length > 0
      ? items.map((item, i) => ({ title: item.text ?? block.texts[i] ?? `第 ${i + 1} 项`, body: "" }))
      : block.texts.slice(1).map((t, i) => ({ title: block.texts[0] ?? `第 ${i + 1} 项`, body: t }));
  return (
    <div className="divide-y divide-ikea-gray-200 border-y border-ikea-gray-200">
      {rows.map((row, i) => (
        <details key={i} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
            {row.title}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 transition-transform duration-300 group-open:rotate-180"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </summary>
          {row.body ? <p className="mt-3 text-sm leading-6 text-ikea-muted">{row.body}</p> : null}
        </details>
      ))}
    </div>
  );
}

function PillNavBlock({ block }: { block: ContentBlock }) {
  if (block.links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {block.links.map((l, i) => (
        <BlockLink
          key={i}
          href={l.href}
          className="i-pill i-pill--small inline-flex h-10 items-center border border-ikea-gray-150 px-5 text-sm font-bold text-ikea-black hover:border-ikea-black"
        >
          {l.text || block.texts[i] || "查看"}
        </BlockLink>
      ))}
    </div>
  );
}

function AssurancesBlock({ block }: { block: ContentBlock }) {
  const items = pairItems(block, 4);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-2 text-center">
          {item.image ? (
            <SiteImage
              src={item.image}
              alt=""
              className="h-12 w-12"
              imgClassName="h-full object-contain"
            />
          ) : null}
          <p className="text-xs font-bold">{item.text || block.texts[i] || block.title}</p>
        </div>
      ))}
    </div>
  );
}

function PlannerBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0];
  return (
    <section className="flex flex-col items-center gap-4 border border-ikea-gray-200 bg-ikea-gray-100 px-6 py-14 text-center">
      <h2 className="text-xl font-bold">{block.title ?? "规划工具"}</h2>
      {block.texts[0] ? <p className="max-w-xl text-sm text-ikea-muted">{block.texts[0]}</p> : null}
      {link?.href ? (
        <BlockLink
          href={link.href}
          className="i-btn i-btn--emphasised inline-flex h-10 items-center bg-ikea-yellow px-6 text-xs font-bold text-ikea-black"
        >
          {link.text || "开始规划"}
        </BlockLink>
      ) : null}
    </section>
  );
}

function GenericBlock({ block }: { block: ContentBlock }) {
  const items = block.items ?? [];
  if (items.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <SiteImage
              src={item.image}
              alt={item.title}
              className="aspect-[4/3] w-full"
            />
            {item.title ? (
              <p className="mt-2 text-sm font-bold group-hover:underline">
                {item.title}
              </p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    );
  }
  const image = block.images[0] ?? null;
  return (
    <div className="flex flex-col gap-4">
      {block.title ? <h2 className="text-xl font-bold">{block.title}</h2> : null}
      {image ? (
        <SiteImage src={image} alt="" className="aspect-[4/3] w-full" />
      ) : null}
      {block.texts.map((t, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-6 text-ikea-muted">
          {t}
        </p>
      ))}
      {block.links.map((l, i) => (
        <BlockLink
          key={i}
          href={l.href}
          className="text-sm font-bold text-ikea-blue underline underline-offset-4 hover:text-ikea-black"
        >
          {l.text || "了解更多"}
        </BlockLink>
      ))}
    </div>
  );
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "pub-hero":
          case "pub-standardised-hero":
            return <HeroBlock key={i} block={block} />;
          case "pub-image":
          case "image":
            return <ImageBlock key={i} block={block} />;
          case "pub-text":
          case "rich-text":
            return <TextBlock key={i} block={block} />;
          case "pub-columns":
            return <ColumnsBlock key={i} block={block} />;
          case "pub-curated-gallery":
            return <GalleryBlock key={i} block={block} />;
          case "pub-product-shelf":
          case "pub-product-list":
          case "product-list":
            return <ProductGridBlock key={i} block={block} />;
          case "pub-button-link":
            return <ButtonLinkBlock key={i} block={block} />;
          case "pub-horizontal-line":
            return <hr key={i} className="border-ikea-gray-200" />;
          case "pub-quote":
          case "pub-standardised-quote":
            return <QuoteBlock key={i} block={block} />;
          case "pub-page-title":
            return <PageTitleBlock key={i} block={block} />;
          case "pub-page-list":
          case "pub-pdf-list":
            return <PageListBlock key={i} block={block} />;
          case "pub-video-link":
          case "video":
            return <VideoLinkBlock key={i} block={block} />;
          case "pub-banner":
            return <BannerBlock key={i} block={block} />;
          case "pub-inspiration-card":
            return <InspirationCardBlock key={i} block={block} />;
          case "pub-expandable-area":
            return <ExpandableBlock key={i} block={block} />;
          case "pub-visual-pill-slider":
            return <PillSliderBlock key={i} block={block} />;
          case "pub-visual-navigation":
          case "anchor-navigation":
            return <PillNavBlock key={i} block={block} />;
          case "ranking":
            return <RankingBlock key={i} block={block} />;
          case "pub-image-with-text-box":
            return <ImageWithTextBoxBlock key={i} block={block} />;
          case "pub-assurances":
            return <AssurancesBlock key={i} block={block} />;
          case "pub-planner":
            return <PlannerBlock key={i} block={block} />;
          default:
            return <GenericBlock key={i} block={block} />;
        }
      })}
    </div>
  );
}
