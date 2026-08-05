"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: (string | null)[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const valid = images.filter((img): img is string => Boolean(img));

  if (valid.length === 0) {
    return <div className="aspect-square w-full bg-ikea-gray-100" />;
  }

  return (
    <div className="flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden bg-ikea-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={valid[active]}
          src={valid[active]}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
      {valid.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {valid.map((img, index) => (
            <button
              key={img}
              type="button"
              aria-label={`查看第 ${index + 1} 张图片`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${
                index === active
                  ? "border-ikea-blue"
                  : "border-ikea-gray-200"
              }`}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
