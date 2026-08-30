"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SiteImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectClassName?: string;
}

/** 阿里云 OSS 图片按需缩放压缩，减少移动端流量；已带处理参数或非 OSS 图片原样返回。 */
function optimizedSrc(src: string): string {
  if (src.includes("aliyuncs.com") && !src.includes("x-oss-process")) {
    const separator = src.includes("?") ? "&" : "?"
    return `${src}${separator}x-oss-process=image/resize,w_900,quality,q_80`
  }
  return src
}

/**
 * Renders an image from a local path or the original CDN URL. If the image
 * fails to load (or the URL is missing), a neutral IKEA-styled placeholder is
 * shown instead, so the site never depends on every asset being downloaded.
 */
export function SiteImage({
  src,
  alt,
  className,
  imgClassName,
  aspectClassName,
}: SiteImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        showPlaceholder ? "bg-ikea-gray-100" : "bg-transparent",
        className,
      )}
    >
      {showPlaceholder ? (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-2 px-4 py-10 text-center",
            aspectClassName,
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-10 w-10 text-ikea-gray-300"
            aria-hidden="true"
          >
            <path d="M4 5h16v14H4zM5.5 6.5v11h13v-11zM8 9a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 8 9zm9.5 7.5-3-4-2.5 3-2-2.5-2.5 3.5z" />
          </svg>
          {alt ? (
            <span className="line-clamp-2 max-w-[80%] text-xs text-ikea-muted">
              {alt}
            </span>
          ) : null}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedSrc(src)}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-contain object-center", imgClassName)}
        />
      )}
    </div>
  );
}
