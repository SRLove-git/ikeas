"use client"

import { useState } from "react"
import { SiteImage } from "@/components/SiteImage"

interface ProductGalleryProps {
  images: (string | null)[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const valid = images.filter((img): img is string => Boolean(img))

  if (valid.length === 0) {
    return (
      <SiteImage
        src={null}
        alt={name}
        className="aspect-square w-full"
        imgClassName="h-full w-full object-contain object-[50%_20%] drop-shadow-[0_8px_16px_rgba(17,17,17,0.12)]"
      />
    )
  }

  return (
    <div className="flex flex-col">
      <SiteImage
        key={valid[active]}
        src={valid[active]}
        alt={name}
        className="aspect-square w-full"
        imgClassName="h-full w-full object-contain object-[50%_20%] drop-shadow-[0_8px_16px_rgba(17,17,17,0.12)]"
      />
      {valid.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {valid.map((img, index) => (
            <button
              key={img}
              type="button"
              aria-label={`查看第 ${index + 1} 张图片`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${
                index === active ? "border-ikea-blue" : "border-ikea-gray-200"
              }`}
              onClick={() => setActive(index)}
            >
              <SiteImage
                src={img}
                alt=""
                className="h-full w-full"
                imgClassName="h-full w-full object-contain object-[50%_20%]"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
