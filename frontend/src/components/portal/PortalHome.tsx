import Link from "next/link"
import { BrandMark } from "@/components/BrandMark"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { getSiteIntro } from "@/lib/site-intro"
import { getLocale } from "@/i18n/server"
import { HOME_URL, MEDICAL_URL, PORTAL_URL } from "@/lib/site-scope"

interface PortalCopy {
  nav: { medical: string; home: string; account: string; support: string }
  heroCtaMedical: string
  heroCtaHome: string
  medical: { kicker: string; title: string; body: string; cta: string; points: string[] }
  home: { kicker: string; title: string; body: string; cta: string; points: string[] }
  memberEyebrow: string
  memberTitle: string
  memberBody: string
  memberLogin: string
  memberOrders: string
  memberNote: string
  servicesTitle: string
  services: { title: string; body: string }[]
  footer: {
    stores: string
    account: string
    support: string
    medical: string
    home: string
    login: string
    orders: string
    points: string
    customerService: string
    contact: string
    warranty: string
    copyright: string
  }
}

const ZH: PortalCopy = {
  nav: { medical: "医疗健康", home: "家庭生活", account: "会员中心", support: "客户服务" },
  heroCtaMedical: "进入医疗健康站",
  heroCtaHome: "进入家庭生活站",
  medical: {
    kicker: "MEDICAL & HEALTH",
    title: "医疗健康",
    body: "制氧机、呼吸护理、检测试剂、血糖与血压管理，以及康复辅助设备。",
    cta: "前往 medical-sg.com",
    points: ["专业医疗设备", "家庭健康自测", "康复与护理"],
  },
  home: {
    kicker: "HOME & LIVING",
    title: "家庭生活",
    body: "东芝与美的冰箱、洗护、厨房、环境与清洁电器，让日常更轻松。",
    cta: "前往 home-sg.com",
    points: ["东芝家电", "美的家电", "配送与安装"],
  },
  memberEyebrow: "ONE ACCOUNT",
  memberTitle: "一个账号，畅行两站",
  memberBody: "会员等级、积分、余额、优惠券与订单历史在两站之间保持一致，登录一次即可切换。",
  memberLogin: "登录 / 注册",
  memberOrders: "查看我的订单",
  memberNote: "会员数据由统一账户中心管理，支付与售后同样共享。",
  servicesTitle: "统一服务",
  services: [
    { title: "会员权益", body: "等级、积分、余额与优惠券跨站通用。" },
    { title: "支付与订单", body: "同一套收银台与订单中心，状态随时可查。" },
    { title: "配送与售后", body: "全岛配送、保修登记与客服支持。" },
  ],
  footer: {
    stores: "两大赛道",
    account: "会员与订单",
    support: "服务与支持",
    medical: "医疗健康站",
    home: "家庭生活站",
    login: "登录 / 注册",
    orders: "我的订单",
    points: "积分与权益",
    customerService: "客户服务",
    contact: "联系我们",
    warranty: "保修注册",
    copyright: "© CHUNG YIP. All rights reserved.",
  },
}

const EN: PortalCopy = {
  nav: {
    medical: "Medical & Health",
    home: "Home & Living",
    account: "My Account",
    support: "Support",
  },
  heroCtaMedical: "Enter medical store",
  heroCtaHome: "Enter home store",
  medical: {
    kicker: "MEDICAL & HEALTH",
    title: "Medical & Health",
    body: "Oxygen therapy, respiratory care, rapid tests, glucose and blood pressure management, mobility aids and more.",
    cta: "Go to medical-sg.com",
    points: ["Professional equipment", "Home health testing", "Rehab & care"],
  },
  home: {
    kicker: "HOME & LIVING",
    title: "Home & Living",
    body: "Toshiba and Midea refrigeration, laundry, kitchen, air and cleaning appliances for an easier everyday.",
    cta: "Go to home-sg.com",
    points: ["Toshiba appliances", "Midea appliances", "Delivery & install"],
  },
  memberEyebrow: "ONE ACCOUNT",
  memberTitle: "One account across both stores",
  memberBody:
    "Membership tier, points, balance, coupons and order history stay consistent across both stores. Sign in once and switch freely.",
  memberLogin: "Sign in / Register",
  memberOrders: "View my orders",
  memberNote:
    "Membership is managed by the shared account centre; payments and after-sales are shared too.",
  servicesTitle: "Shared services",
  services: [
    { title: "Member benefits", body: "Tier, points, balance and coupons work across stores." },
    { title: "Payments & orders", body: "One checkout and order centre with live status." },
    {
      title: "Delivery & after-sales",
      body: "Islandwide delivery, warranty registration and support.",
    },
  ],
  footer: {
    stores: "Our stores",
    account: "Account & orders",
    support: "Support",
    medical: "Medical store",
    home: "Home store",
    login: "Sign in / Register",
    orders: "My orders",
    points: "Points & benefits",
    customerService: "Customer service",
    contact: "Contact us",
    warranty: "Warranty registration",
    copyright: "© CHUNG YIP. All rights reserved.",
  },
}

/**
 * life-sg.com 品牌门户：两张主入口卡片 + 统一会员/订单入口。
 * 不在这里展示商品目录，商品全部落在 medical-sg.com / home-sg.com。
 */
export async function PortalHome() {
  const locale = await getLocale()
  const intro = getSiteIntro("portal")[locale === "zh-CN" ? "zh" : "en"]
  const copy = locale === "zh-CN" ? ZH : EN

  return (
    <div className="font-ikea min-h-screen overflow-x-clip bg-white text-ikea-black">
      <header className="sticky top-0 z-30 border-b border-ikea-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-page min-w-0 items-center gap-3 lg:h-20">
          <Link href="/" className="min-w-0 shrink-0" aria-label="CHUNG YIP">
            <BrandMark scope="portal" />
          </Link>
          <nav className="ml-8 hidden items-center gap-6 text-sm font-bold md:flex lg:ml-12">
            <a href={MEDICAL_URL} className="hover:underline">
              {copy.nav.medical}
            </a>
            <a href={HOME_URL} className="hover:underline">
              {copy.nav.home}
            </a>
            <Link href="/zh/profile/" className="hover:underline">
              {copy.nav.account}
            </Link>
            <Link href="/zh/customer-service/" className="hover:underline">
              {copy.nav.support}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch />
            <Link
              href="/zh/profile/login/"
              className="hidden h-10 items-center justify-center whitespace-nowrap rounded-full bg-ikea-black px-5 text-xs font-bold text-white transition-colors hover:bg-[#333333] sm:inline-flex"
            >
              {copy.memberLogin}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-ikea-gray-200 bg-[#f7f7f5]">
          <div className="mx-auto grid max-w-page gap-10 py-12 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:py-16">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-ikea-muted">
                {intro.eyebrow}
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
                {intro.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ikea-muted lg:text-lg">
                {intro.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={MEDICAL_URL}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-ikea-black px-7 text-sm font-bold text-white transition-colors hover:bg-[#333333]"
                >
                  {copy.heroCtaMedical}
                </a>
                <a
                  href={HOME_URL}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-ikea-black px-7 text-sm font-bold text-ikea-black transition-colors hover:bg-ikea-gray-200"
                >
                  {copy.heroCtaHome}
                </a>
              </div>
            </div>
            <div className="hidden overflow-hidden rounded-[28px] bg-ikea-black p-7 text-white lg:block">
              <a href={MEDICAL_URL} className="group flex items-center justify-between gap-6 py-2">
                <span>
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-white/50">
                    01 · MEDICAL
                  </span>
                  <span className="mt-2 block text-xl font-bold">{copy.medical.title}</span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg text-ikea-black transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
              <div className="my-5 h-px bg-white/15" />
              <a href={HOME_URL} className="group flex items-center justify-between gap-6 py-2">
                <span>
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-white/50">
                    02 · HOME
                  </span>
                  <span className="mt-2 block text-xl font-bold">{copy.home.title}</span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg text-ikea-black transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
              <p className="mt-7 rounded-2xl bg-white/10 px-4 py-3 text-xs leading-5 text-white/70">
                {copy.memberTitle} · {copy.memberNote}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-page py-12 lg:py-16">
          <div className="grid gap-5 lg:grid-cols-2">
            <a
              href={MEDICAL_URL}
              className="group relative min-h-[500px] overflow-hidden rounded-2xl bg-[#e8f0f6] px-6 pt-7 pb-48 transition-shadow hover:shadow-xl sm:min-h-[400px] sm:p-8 lg:min-h-[440px] lg:p-10"
            >
              <div className="relative z-10 flex h-full max-w-full flex-col sm:max-w-[62%]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ikea-blue">
                  {copy.medical.kicker}
                </p>
                <h2 className="mt-3 text-3xl font-bold lg:text-4xl">{copy.medical.title}</h2>
                <p className="mt-4 text-sm leading-6 text-ikea-muted">{copy.medical.body}</p>
                <ul className="mt-5 space-y-1.5 text-xs font-bold text-ikea-muted">
                  {copy.medical.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex h-11 w-fit items-center justify-center rounded-full bg-ikea-black px-6 text-xs font-bold text-white sm:mt-auto">
                  {copy.medical.cta}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/products/buzud-8885020710465-1.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 bottom-0 h-48 w-[68%] object-contain object-right-bottom drop-shadow-[0_20px_35px_rgba(0,88,163,0.18)] transition-transform duration-500 group-hover:scale-105 sm:-right-4 sm:h-[72%] sm:w-[52%]"
              />
            </a>

            <a
              href={HOME_URL}
              className="group relative min-h-[500px] overflow-hidden rounded-2xl bg-[#f4efe8] px-6 pt-7 pb-48 transition-shadow hover:shadow-xl sm:min-h-[400px] sm:p-8 lg:min-h-[440px] lg:p-10"
            >
              <div className="relative z-10 flex h-full max-w-full flex-col sm:max-w-[62%]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ikea-orange">
                  {copy.home.kicker}
                </p>
                <h2 className="mt-3 text-3xl font-bold lg:text-4xl">{copy.home.title}</h2>
                <p className="mt-4 text-sm leading-6 text-ikea-muted">{copy.home.body}</p>
                <ul className="mt-5 space-y-1.5 text-xs font-bold text-ikea-muted">
                  {copy.home.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex h-11 w-fit items-center justify-center rounded-full bg-ikea-black px-6 text-xs font-bold text-white sm:mt-auto">
                  {copy.home.cta}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/products/midea-mdrf632fid46sg-local.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-5 bottom-0 h-48 w-[62%] object-contain object-right-bottom drop-shadow-[0_20px_35px_rgba(17,17,17,0.16)] transition-transform duration-500 group-hover:scale-105 sm:-right-2 sm:h-[70%] sm:w-[52%]"
              />
            </a>
          </div>
        </section>

        <section className="bg-ikea-black py-14 text-white lg:py-20">
          <div className="mx-auto grid max-w-page gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ikea-yellow">
                {copy.memberEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-bold lg:text-4xl">{copy.memberTitle}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">{copy.memberBody}</p>
              <p className="mt-4 text-xs text-white/50">{copy.memberNote}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/zh/profile/login/"
                className="inline-flex h-12 items-center justify-center rounded-full bg-ikea-yellow px-7 text-sm font-bold text-ikea-black transition-colors hover:bg-[#f2cf00]"
              >
                {copy.memberLogin}
              </Link>
              <Link
                href="/zh/profile/my-orders/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white px-7 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                {copy.memberOrders}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-page px-5 py-12 lg:px-10 lg:py-16">
          <h2 className="text-2xl font-bold lg:text-3xl">{copy.servicesTitle}</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {copy.services.map((service) => (
              <div key={service.title} className="border-t border-ikea-gray-200 pt-5">
                <h3 className="text-base font-bold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ikea-muted">{service.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-ikea-gray-200 bg-ikea-gray-100/60">
        <div className="mx-auto grid max-w-page gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          <div>
            <BrandMark scope="portal" />
            <p className="mt-4 max-w-xs text-xs leading-5 text-ikea-muted">
              {copy.footer.copyright}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ikea-muted">
              {copy.footer.stores}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={MEDICAL_URL} className="hover:underline">
                  {copy.footer.medical}
                </a>
              </li>
              <li>
                <a href={HOME_URL} className="hover:underline">
                  {copy.footer.home}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ikea-muted">
              {copy.footer.account}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/zh/profile/login/" className="hover:underline">
                  {copy.footer.login}
                </Link>
              </li>
              <li>
                <Link href="/zh/profile/my-orders/" className="hover:underline">
                  {copy.footer.orders}
                </Link>
              </li>
              <li>
                <Link href="/zh/profile/" className="hover:underline">
                  {copy.footer.points}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ikea-muted">
              {copy.footer.support}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/zh/customer-service/" className="hover:underline">
                  {copy.footer.customerService}
                </Link>
              </li>
              <li>
                <Link href="/zh/customer-service/contact-us/" className="hover:underline">
                  {copy.footer.contact}
                </Link>
              </li>
              <li>
                <Link
                  href="/zh/customer-service/warranty-registration/"
                  className="hover:underline"
                >
                  {copy.footer.warranty}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ikea-gray-200">
          <div className="mx-auto flex max-w-page flex-col gap-2 px-5 py-5 text-xs text-ikea-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <span>{copy.footer.copyright}</span>
            <span>
              <a href={`${PORTAL_URL}/zh/privacy-policy/`} className="hover:underline">
                Privacy
              </a>
              <span className="mx-2">·</span>
              <a href={`${PORTAL_URL}/zh/conditions-of-use/`} className="hover:underline">
                Terms
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
