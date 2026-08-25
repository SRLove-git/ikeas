"use client"

import { AssemblyIcon, DesignIcon, InstallationIcon, TruckIcon } from "@/components/icons"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import type { AssuranceItem } from "@/types"

interface ServicesSectionProps {
  assurances: AssuranceItem[]
}

const iconMap = {
  truck: TruckIcon,
  assembly: AssemblyIcon,
  design: DesignIcon,
  installation: InstallationIcon,
} as const

export function ServicesSection({ assurances }: ServicesSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="services-section space-y-8 lg:space-y-12">
      <div className="rich-text__container rich-text__component">
        <h2>{t("home.ourServices")}</h2>
      </div>
      <div className="pub-assurances">
        {assurances.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <div key={item.title} className="pub-assurances-item">
              <div>
                <div className="pub-assurances-item__head">
                  <i className="pub-assurances-item__icon">
                    <Icon width={24} height={24} />
                  </i>
                  <div className="pub-assurances-item__title">{item.title}</div>
                </div>
                <p className="pub-assurances__desc">{item.description}</p>
              </div>
              <a href={item.ctaHref ?? "#"} className="pub-assurances__link">
                {item.ctaLabel}
              </a>
            </div>
          )
        })}
      </div>
      <div className="pub-button-link is-bolder">
        <Link href="/cn/zh/customer-service/" className="i-btn i-btn--small i-btn--secondary">
          <span className="i-btn__inner">
            <span className="i-btn__label">{t("home.viewAllServices")}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
