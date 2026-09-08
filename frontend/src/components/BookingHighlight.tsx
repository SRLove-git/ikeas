import Link from "next/link"
import { ArrowRightIcon } from "@/components/icons"

interface BookingHighlightProps {
  eyebrow: string
  title: string
  description: string
  cta: string
  services: string[]
  image: string
  imageAlt: string
  href: string
}

export function BookingHighlight({
  eyebrow,
  title,
  description,
  cta,
  services,
  image,
  imageAlt,
  href,
}: BookingHighlightProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-ikea-gray-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-6 py-7 md:px-10 md:py-10 lg:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ikea-blue">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold leading-9 text-ikea-black md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ikea-muted md:text-base">
            {description}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {services.map((service) => (
              <li
                key={service}
                className="rounded-full bg-ikea-gray-100 px-3 py-1.5 text-xs font-semibold text-ikea-black"
              >
                {service}
              </li>
            ))}
          </ul>
          <div className="mt-7 inline-flex">
            <Link href={href} className="i-btn i-btn--emphasised i-btn--small">
              <span className="i-btn__inner">
                <span className="i-btn__label">{cta}</span>
                <ArrowRightIcon width={16} height={16} />
              </span>
            </Link>
          </div>
        </div>
        <div className="flex min-h-[240px] items-center justify-center bg-ikea-gray-100 p-6 md:min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={imageAlt}
            className="h-full max-h-[320px] w-full object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
