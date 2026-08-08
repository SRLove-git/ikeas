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

function cleanText(text: string | null | undefined): string {
  const entities: Record<string, string> = {
    nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
    ldquo: "\u201C", rdquo: "\u201D", lsquo: "\u2018", rsquo: "\u2019",
    hellip: "\u2026", mdash: "\u2014", ndash: "\u2013",
    bull: "\u2022", middot: "\u00B7", times: "\u00D7", divide: "\u00F7",
    raquo: "\u00BB", laquo: "\u00AB", copy: "\u00A9", reg: "\u00AE",
    deg: "\u00B0", plusmn: "\u00B1", frac12: "\u00BD", frac14: "\u00BC",
    frac34: "\u00BE", eacute: "\u00E9", egrave: "\u00E8", uuml: "\u00FC",
    ouml: "\u00F6", auml: "\u00E4", aring: "\u00E5", oslash: "\u00F8",
    ccedil: "\u00E7", szlig: "\u00DF", euro: "\u20AC", pound: "\u00A3",
    yen: "\u00A5", cent: "\u00A2", scaron: "\u0161", Scaron: "\u0160",
    oacute: "\u00F3", Oacute: "\u00D3", aacute: "\u00E1", Aacute: "\u00C1",
    iacute: "\u00ED", Iacute: "\u00CD", uacute: "\u00FA", Uacute: "\u00DA",
    ntilde: "\u00F1", Ntilde: "\u00D1", agrave: "\u00E0", Agrave: "\u00C0",
    acirc: "\u00E2", ecirc: "\u00EA", icirc: "\u00EE", ocirc: "\u00F4",
    ucirc: "\u00FB", yacute: "\u00FD", Yacute: "\u00DD",
    oelig: "\u0153", OElig: "\u0152", yuml: "\u00FF", Yuml: "\u0178",
    radic: "\u221A", zwnj: "\u200C", zwj: "\u200D", rsaquo: "\u203A",
    lsaquo: "\u2039", rarr: "\u2192", larr: "\u2190", uarr: "\u2191",
    darr: "\u2193", harr: "\u2194", sdot: "\u22C5", infin: "\u221E",
    ne: "\u2260", le: "\u2264", ge: "\u2265", sup2: "\u00B2", sup3: "\u00B3",
  };
  return (text ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/<[^>]*$/g, "")
    .replace(/>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title: string | null | undefined): string {
  const t = cleanText(title);
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
  const columns = block.columns ?? [];
  if (columns.length > 0) {
    return (
      <div className="grid gap-10 md:grid-cols-2">
        {columns.map((column, i) => (
          <div key={i} className="flex flex-col">
            {column.heading ? (
              <h3 className="text-lg font-bold">{column.heading}</h3>
            ) : null}
            {column.image ? (
              <div className="mt-3 overflow-hidden">
                <SiteImage
                  src={column.image}
                  alt={column.heading ?? ""}
                  className="aspect-[16/9] w-full"
                />
              </div>
            ) : null}
            {column.text ? (
              <p className="mt-3 text-sm leading-6 text-ikea-muted">{column.text}</p>
            ) : null}
            {column.href ? (
              <div className="mt-4">
                <BlockLink
                  href={column.href}
                  className="i-btn i-btn--small i-btn--primary inline-flex h-9 items-center px-5 text-xs font-bold text-white"
                >
                  了解详情
                </BlockLink>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }
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
  const fallbackColumns = Array.from({ length: n }, (_, i) => ({
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
      {fallbackColumns.map((col, i) => (
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

function GalleryBlock({
  block,
  index = 0,
}: {
  block: ContentBlock;
  index?: number;
}) {
  const items = block.items ?? [];
  const hasLongText = block.texts.some((t) => t.length > 80);
  const singleImage = items.filter((i) => i.image).length === 1;
  if (block.title && hasLongText && singleImage) {
    const item = items.find((i) => i.image) ?? items[0];
    const imageLeft = index % 2 === 1;
    return (
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div
          className={imageLeft ? "md:order-1" : "md:order-2"}
        >
          {item?.image ? (
            <SiteImage
              src={item.image}
              alt={block.title}
              className="aspect-[4/3] w-full"
            />
          ) : null}
        </div>
        <div className={imageLeft ? "md:order-2" : "md:order-1"}>
          <h2 className="text-xl font-bold leading-8">{block.title}</h2>
          <p className="mt-3 text-sm leading-7 text-ikea-muted">
            {block.texts.find((t) => t.length > 80) ?? block.texts[0] ?? ""}
          </p>
        </div>
      </section>
    );
  }
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
  const raw = block.items ?? [];
  const items: (ContentBlockItem | Item)[] =
    raw.length > 0 ? raw : pairItems(block, 24);
  if (items.length === 0) return null;
  return (
    <div>
      {block.title ? (
        <h2 className="mb-5 text-xl font-bold">{block.title}</h2>
      ) : null}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group">
            <div className="overflow-hidden bg-ikea-gray-100">
              {item.image ? (
                <SiteImage
                  src={item.image}
                  alt={item.title ?? item.text ?? ""}
                  className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="aspect-square w-full" />
              )}
            </div>
            {item.title ? (
              <p className="mt-2 line-clamp-2 text-sm text-ikea-black">
                {item.title}
              </p>
            ) : item.text ? (
              <p className="mt-2 line-clamp-2 text-sm text-ikea-black">
                {item.text}
              </p>
            ) : null}
            {item.title && item.text ? (
              <p className="mt-0.5 text-sm font-bold">{item.text}</p>
            ) : null}
          </BlockLink>
        ))}
      </div>
    </div>
  );
}

function ButtonLinkBlock({ block }: { block: ContentBlock }) {
  const link = block.links[0];
  if (!link?.href) return null;
  const candidates = block.texts
    .map((t) => cleanText(t))
    .filter(
      (t) =>
        t.length > 0 &&
        t.length < 30 &&
        !/^(\/|https?:|ikea:|[{])/.test(t),
    );
  const label =
    link.text || candidates.at(-1) || block.title || "了解更多";
  return (
    <div className="flex justify-center">
      <BlockLink
        href={link.href}
        className="i-btn i-btn--primary inline-flex h-10 items-center px-6 text-xs font-bold text-white"
      >
        {label}
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
  const items = block.items ?? [];
  if (items.length > 0 && items.some((item) => item.image)) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <BlockLink key={i} href={item.href ?? "#"} className="group block">
            <div className="overflow-hidden bg-ikea-gray-100">
              <SiteImage
                src={item.image}
                alt={item.title}
                className="aspect-[16/9] w-full transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-bold leading-5 group-hover:underline">
                {item.title}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0 text-ikea-muted transition-colors group-hover:text-ikea-blue"
              >
                <path d="m20 12-8-8-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20z" />
              </svg>
            </div>
          </BlockLink>
        ))}
      </div>
    );
  }
  const paired = pairItems(block);
  if (paired.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {paired.map((item, i) => (
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
  const raw = block.items ?? [];
  const items: (ContentBlockItem | Item)[] =
    raw.length > 0 ? raw : pairItems(block, 4);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {items.map((item, i) => (
        <BlockLink key={i} href={item.href ?? "#"} className="group">
          <div className="flex flex-col items-center gap-2 text-center">
            {item.image ? (
              <SiteImage
                src={item.image}
                alt=""
                className="h-12 w-12"
                imgClassName="h-full object-contain"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ikea-gray-100 text-ikea-blue">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5zm0 2.1L18 6.8v4.2c0 4.2-2.5 7.6-6 8.9-3.5-1.3-6-4.7-6-8.9V6.8zM11 7h2v6h-2zm0 7h2v2h-2z" />
                </svg>
              </span>
            )}
            <p className="text-xs font-bold group-hover:underline">
              {cleanTitle(item.title) || cleanText(item.text) || block.texts[i] || block.title}
            </p>
          </div>
        </BlockLink>
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
  const cleanedBlocks = blocks.map((block) => ({
    ...block,
    title: cleanTitle(block.title) || null,
    texts: block.texts.map((t) => cleanText(t)).filter(Boolean),
    items: (block.items ?? []).map((item) => ({
      ...item,
      title: cleanTitle(item.title),
      text: cleanText(item.text),
    })),
  }));
  return (
    <div className="space-y-10">
      {cleanedBlocks.map((block, i) => {
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
            return <GalleryBlock key={i} block={block} index={i} />;
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
