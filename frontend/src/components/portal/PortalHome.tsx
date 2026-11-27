import Image from "next/image"
import Link from "next/link"
import { CartIcon, SearchIcon } from "@/components/icons"
import { PortalMobileNav } from "@/components/portal/PortalMobileNav"
import { PortalMotion } from "@/components/portal/PortalMotion"
import { PortalFlipDeck } from "@/components/portal/PortalFlipDeck"
import contact from "@/data/contact.json"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { PORTAL_LOCALE_PATHS, portalLocalizedHref } from "@/i18n/config"
import { getLocale } from "@/i18n/server"
import { getSiteIntro } from "@/lib/site-intro"
import { HOME_URL, MEDICAL_URL } from "@/lib/site-scope"

interface PortalCopy {
  nav: { medical: string; home: string; account: string; orders: string; support: string }
  utilities: { menu: string; close: string; search: string; cart: string; login: string }
  eyebrow: string
  medical: { label: string; title: string; cta: string; points: string[] }
  home: { label: string; title: string; cta: string; points: string[] }
  member: {
    label: string
    title: string
    groupLabel: string
    railLabel: string
    login: string
    orders: string
  }
  services: {
    groupLabel: string
    items: { number: string; title: string; href: string; link: string }[]
  }
  footer: { copyright: string; privacy: string; terms: string; email: string }
  skip: string
}

const ZH: PortalCopy = {
  nav: {
    medical: "医疗健康",
    home: "家庭生活",
    account: "会员中心",
    orders: "我的订单",
    support: "客户服务",
  },
  utilities: {
    menu: "打开导航",
    close: "关闭导航",
    search: "搜索",
    cart: "购物袋",
    login: "登录 / 注册",
  },
  eyebrow: "01 — 同一集团 · 两种生活 · 新加坡",
  medical: {
    label: "01 / MEDICAL & HEALTH",
    title: "医疗健康",
    cta: "进入医疗健康站",
    points: ["健康监测", "呼吸护理", "康复辅助"],
  },
  home: {
    label: "02 / HOME & LIVING",
    title: "家庭生活",
    cta: "进入家庭生活站",
    points: ["厨房家电", "洗护清洁", "舒适环境"],
  },
  member: {
    label: "04 / ACCOUNT & SUPPORT",
    title: "会员、订单与服务，集中在一处",
    groupLabel: "账户",
    railLabel: "账户与支持",
    login: "登录或注册",
    orders: "查看订单",
  },
  services: {
    groupLabel: "客户服务",
    items: [
      {
        number: "01",
        title: "配送说明",
        href: "/zh/customer-service/services/delivery/",
        link: "查看配送说明",
      },
      {
        number: "02",
        title: "保修登记",
        href: "/zh/customer-service/warranty-registration/",
        link: "登记产品保修",
      },
      {
        number: "03",
        title: "门店与客服",
        href: "/zh/customer-service/contact-us/#stores",
        link: "查看联系方式",
      },
    ],
  },
  footer: {
    copyright: "© CHUNG YIP HOLDING PTE. LTD.",
    privacy: "隐私政策",
    terms: "使用条款",
    email: "客户服务",
  },
  skip: "跳至主要内容",
}

const EN: PortalCopy = {
  nav: {
    medical: "Medical",
    home: "Home",
    account: "Account",
    orders: "Orders",
    support: "Support",
  },
  utilities: {
    menu: "Open navigation",
    close: "Close navigation",
    search: "Search",
    cart: "Shopping bag",
    login: "Sign in / Register",
  },
  eyebrow: "01 — ONE GROUP · TWO WORLDS · SINGAPORE",
  medical: {
    label: "01 / MEDICAL & HEALTH",
    title: "Medical & Health",
    cta: "Enter the medical store",
    points: ["Health monitoring", "Respiratory care", "Rehab support"],
  },
  home: {
    label: "02 / HOME & LIVING",
    title: "Home & Living",
    cta: "Enter the home store",
    points: ["Kitchen", "Laundry & cleaning", "Home comfort"],
  },
  member: {
    label: "04 / ACCOUNT & SUPPORT",
    title: "Membership, orders and service in one place",
    groupLabel: "Account",
    railLabel: "Account & support",
    login: "Sign in or register",
    orders: "View orders",
  },
  services: {
    groupLabel: "Customer care",
    items: [
      {
        number: "01",
        title: "Delivery information",
        href: "/zh/customer-service/services/delivery/",
        link: "View delivery information",
      },
      {
        number: "02",
        title: "Warranty registration",
        href: "/zh/customer-service/warranty-registration/",
        link: "Register a warranty",
      },
      {
        number: "03",
        title: "Stores and support",
        href: "/zh/customer-service/contact-us/#stores",
        link: "View contact details",
      },
    ],
  },
  footer: {
    copyright: "© CHUNG YIP HOLDING PTE. LTD.",
    privacy: "Privacy",
    terms: "Terms",
    email: "Customer care",
  },
  skip: "Skip to main content",
}

function Arrow() {
  return (
    <span aria-hidden="true" className="portal-arrow">
      →
    </span>
  )
}

export async function PortalHome() {
  const locale = await getLocale()
  const isZh = locale === "zh-CN"
  const intro = getSiteIntro("portal")[isZh ? "zh" : "en"]
  const copy = isZh ? ZH : EN
  const currentLocaleHref = isZh ? PORTAL_LOCALE_PATHS["zh-CN"] : PORTAL_LOCALE_PATHS.en
  const localizedHref = (href: string) => portalLocalizedHref(locale, href)
  const titleParts = intro.title.split(isZh ? "，" : ",")
  const titleLead = titleParts[0] + (titleParts.length > 1 ? (isZh ? "，" : ", ") : "")
  const titleTail = titleParts
    .slice(1)
    .join(isZh ? "，" : ",")
    .trim()
  const acts = [
    { number: "01", label: "CHUNG YIP" },
    { number: "02", label: copy.nav.medical },
    { number: "03", label: copy.nav.home },
    { number: "04", label: copy.member.railLabel },
  ]

  return (
    <PortalMotion>
      <div
        className="portal-rn min-h-screen overflow-x-clip bg-[#0d0d0d] text-[#f2f0ea]"
        data-locale={isZh ? "zh" : "en"}
      >
        <a href="#portal-main" className="portal-skip-link">
          {copy.skip}
        </a>

        <header className="portal-header fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/95">
          <div className="mx-auto flex h-[76px] max-w-[1800px] items-center px-5 sm:px-8 lg:px-12">
            <Link href={currentLocaleHref} className="portal-wordmark" aria-label="CHUNG YIP home">
              <i /> CHUNG YIP
            </Link>

            <nav
              className="mx-auto hidden items-center gap-9 text-[11px] font-medium tracking-[0.16em] text-white/60 lg:flex"
              aria-label={copy.utilities.menu}
            >
              <a href={MEDICAL_URL}>{copy.nav.medical}</a>
              <a href={HOME_URL}>{copy.nav.home}</a>
              <Link href={localizedHref("/zh/profile/")}>{copy.nav.account}</Link>
              <Link href={localizedHref("/zh/customer-service/")}>{copy.nav.support}</Link>
            </nav>

            <div className="ml-auto hidden items-center gap-5 lg:flex">
              <LanguageSwitch className="portal-language" hrefs={PORTAL_LOCALE_PATHS} />
              <Link
                href={localizedHref("/zh/search/products/")}
                className="portal-header-icon"
                aria-label={copy.utilities.search}
              >
                <SearchIcon width={19} height={19} />
              </Link>
              <Link
                href={localizedHref("/zh/pay/cart/")}
                className="portal-header-icon"
                aria-label={copy.utilities.cart}
              >
                <CartIcon width={19} height={19} />
              </Link>
              <Link href={localizedHref("/zh/profile/login/")} className="portal-header-login">
                {copy.utilities.login}
              </Link>
            </div>

            <div className="ml-auto flex items-center lg:hidden">
              <PortalMobileNav
                labels={{
                  menu: copy.utilities.menu,
                  close: copy.utilities.close,
                  medical: copy.nav.medical,
                  home: copy.nav.home,
                  account: copy.nav.account,
                  orders: copy.nav.orders,
                  support: copy.nav.support,
                  login: copy.utilities.login,
                  search: copy.utilities.search,
                  cart: copy.utilities.cart,
                }}
                medicalUrl={MEDICAL_URL}
                homeUrl={HOME_URL}
                languageHrefs={PORTAL_LOCALE_PATHS}
                locale={locale}
              />
            </div>
          </div>
        </header>

        <aside className="portal-act-progress" aria-hidden="true">
          <ol>
            {acts.map((act, index) => (
              <li
                key={act.number}
                data-portal-progress-item={act.number}
                data-active={index === 0 ? "true" : undefined}
              >
                <span>{act.number}</span>
                <i />
                <strong>{act.label}</strong>
              </li>
            ))}
          </ol>
        </aside>

        <main id="portal-main">
          <section id="portal-act-01" className="portal-act portal-hero" data-portal-act="01">
            <div className="portal-hero__inner">
              <div className="portal-hero__copy">
                <p className="portal-eyebrow portal-hero__eyebrow" data-delay="0">
                  {copy.eyebrow}
                </p>
                <h1 className="portal-hero__title">
                  <span className="portal-hero__title-line" data-delay="80">
                    <span>{titleLead}</span>
                  </span>
                  {titleTail ? (
                    <span className="portal-hero__title-line" data-delay="160">
                      <span className={isZh ? undefined : "portal-hero__title-italic"}>
                        {titleTail}
                      </span>
                    </span>
                  ) : null}
                </h1>
                <p className="portal-hero__description portal-hero__intro-item" data-delay="260">
                  {intro.description}
                </p>
              </div>

              <div className="portal-destinations portal-hero__intro-item" data-delay="340">
                <a className="group" href={MEDICAL_URL}>
                  <span>01</span>
                  <strong>{copy.medical.cta}</strong>
                  <Arrow />
                </a>
                <a className="group" href={HOME_URL}>
                  <span>02</span>
                  <strong>{copy.home.cta}</strong>
                  <Arrow />
                </a>
              </div>

              <PortalFlipDeck isZh={isZh} />
            </div>
          </section>

          <section
            id="portal-act-02"
            className="portal-act portal-world portal-world--medical"
            data-portal-act="02"
            aria-labelledby="portal-act-02-title"
          >
            <div className="portal-world__inner">
              <div className="portal-world__copy">
                <p
                  className="portal-eyebrow portal-eyebrow--dark"
                  data-portal-reveal
                  data-delay="0"
                >
                  {copy.medical.label}
                </p>
                <div
                  className="portal-title-mask"
                  data-portal-title-mask
                  data-portal-reveal
                  data-delay="70"
                >
                  <h2 id="portal-act-02-title" data-portal-title>
                    {copy.medical.title}
                  </h2>
                </div>
                <ol className="portal-world__list">
                  {copy.medical.points.map((point, index) => (
                    <li key={point} data-portal-reveal data-delay={210 + index * 70}>
                      <span>0{index + 1}</span>
                      {point}
                    </li>
                  ))}
                </ol>
                <a
                  href={MEDICAL_URL}
                  className="portal-text-link"
                  data-portal-reveal
                  data-delay="420"
                >
                  {copy.medical.cta}
                  <Arrow />
                </a>
              </div>
              <div
                className="portal-world__visual portal-world__visual--medical"
                data-portal-reveal
                data-delay="70"
              >
                <Image
                  src="/images/portal/section-medical.png"
                  alt={
                    isZh
                      ? "BUZUD 多参数病人监护仪 8000C"
                      : "BUZUD multi-parameter patient monitor 8000C"
                  }
                  width={753}
                  height={788}
                  sizes="(max-width: 767px) 88vw, 48vw"
                />
              </div>
            </div>
          </section>

          <section
            id="portal-act-03"
            className="portal-act portal-world portal-world--home"
            data-portal-act="03"
            aria-labelledby="portal-act-03-title"
          >
            <div className="portal-world__inner portal-world__inner--reverse">
              <div
                className="portal-world__visual portal-world__visual--home"
                data-portal-reveal
                data-delay="70"
              >
                <Image
                  src="/images/products/midea-mdrf632fid46sg-local.webp"
                  alt={isZh ? "美的多门冰箱" : "Midea multi-door refrigerator"}
                  width={799}
                  height={1000}
                  sizes="(max-width: 767px) 72vw, 40vw"
                />
              </div>
              <div className="portal-world__copy">
                <p
                  className="portal-eyebrow portal-eyebrow--dark"
                  data-portal-reveal
                  data-delay="0"
                >
                  {copy.home.label}
                </p>
                <div
                  className="portal-title-mask"
                  data-portal-title-mask
                  data-portal-reveal
                  data-delay="70"
                >
                  <h2 id="portal-act-03-title" data-portal-title>
                    {copy.home.title}
                  </h2>
                </div>
                <ol className="portal-world__list">
                  {copy.home.points.map((point, index) => (
                    <li key={point} data-portal-reveal data-delay={210 + index * 70}>
                      <span>0{index + 1}</span>
                      {point}
                    </li>
                  ))}
                </ol>
                <a href={HOME_URL} className="portal-text-link" data-portal-reveal data-delay="420">
                  {copy.home.cta}
                  <Arrow />
                </a>
              </div>
            </div>
          </section>

          <section
            id="portal-act-04"
            className="portal-act portal-account"
            data-portal-act="04"
            aria-labelledby="portal-act-04-title"
          >
            <div className="portal-account__inner">
              <div className="portal-account__head">
                <p className="portal-eyebrow" data-portal-reveal data-delay="0">
                  {copy.member.label}
                </p>
                <div
                  className="portal-title-mask"
                  data-portal-title-mask
                  data-portal-reveal
                  data-delay="70"
                >
                  <h2 id="portal-act-04-title" data-portal-title>
                    {copy.member.title}
                  </h2>
                </div>
              </div>

              <div className="portal-account__group" data-portal-reveal data-delay="140">
                <p className="portal-account__label">{copy.member.groupLabel}</p>
                <div className="portal-account__links">
                  <Link
                    href={localizedHref("/zh/profile/login/")}
                    className="portal-text-link portal-text-link--light"
                  >
                    {copy.member.login}
                    <Arrow />
                  </Link>
                  <Link
                    href={localizedHref("/zh/profile/my-orders/")}
                    className="portal-text-link portal-text-link--light"
                  >
                    {copy.member.orders}
                    <Arrow />
                  </Link>
                </div>
              </div>

              <div className="portal-account__group" data-portal-reveal data-delay="210">
                <p className="portal-account__label">{copy.services.groupLabel}</p>
                <div className="portal-account__rows">
                  {copy.services.items.map((item) => (
                    <a key={item.number} href={localizedHref(item.href)} aria-label={item.link}>
                      <span>{item.number}</span>
                      <strong>{item.title}</strong>
                      <em>
                        {item.link}
                        <Arrow />
                      </em>
                    </a>
                  ))}
                </div>
              </div>

              <div className="portal-contact-strip" data-portal-reveal data-delay="300">
                <span>{contact.stores[0].address}</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
          </section>
        </main>

        <footer className="portal-footer">
          <span>{copy.footer.copyright}</span>
          <div>
            <a href={`mailto:${contact.email}`}>{copy.footer.email}</a>
            <a href={localizedHref("/zh/privacy-policy/")}>{copy.footer.privacy}</a>
            <a href={localizedHref("/zh/conditions-of-use/")}>{copy.footer.terms}</a>
          </div>
        </footer>
      </div>
    </PortalMotion>
  )
}
