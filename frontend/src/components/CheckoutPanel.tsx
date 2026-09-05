"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"
import { useAuth } from "@/lib/auth"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { apiJson, type Cart, type OrderResponse } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"
import { clearLocalCart, readLocalCart } from "@/lib/local-cart"

const DELIVERY_FEE = 9.9

interface CouponView {
  id: number
  code: string
  name: string
  type: number
  value: number
  minAmount: number
  status: number
  discountAmount: number
}

interface MarketingAccount {
  points: number
  balance: number
  coupons: CouponView[]
}

export function CheckoutPanel() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [marketing, setMarketing] = useState<MarketingAccount | null>(null)
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [usePoints, setUsePoints] = useState(0)
  const [useBalance, setUseBalance] = useState(0)
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    region: "",
    detail: "",
  })

  useEffect(() => {
    if (!ready) return

    let cancelled = false
    const loadCart = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) {
          const local = readLocalCart()
          if (!cancelled) {
            setCart({
              items: local,
              totalQuantity: local.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: local.reduce(
                (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
                0,
              ),
            })
          }
          return
        }
        const data = await apiJson<Cart>("/cart")
        if (!cancelled) setCart(data)
      } catch (ex) {
        if (!cancelled) {
          setError(ex instanceof Error ? ex.message : t("checkout.loadFailed"))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCart()
    return () => {
      cancelled = true
    }
  }, [ready, user, t])

  useEffect(() => {
    if (!ready || !user) return
    let cancelled = false
    const loadMarketing = async () => {
      try {
        const data = await apiJson<MarketingAccount>("/marketing/account")
        if (!cancelled) setMarketing(data)
      } catch {
        if (!cancelled) setMarketing({ points: 0, balance: 0, coupons: [] })
      }
    }
    void loadMarketing()
    return () => {
      cancelled = true
    }
  }, [ready, user])

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const selectedCoupon = marketing?.coupons.find((coupon) => coupon.code === couponCode) ?? null
  const pointDiscount = Math.min(usePoints, marketing?.points ?? 0) * 0.01
  const balanceUsed = Math.max(0, Math.min(useBalance, marketing?.balance ?? 0))
  const discount = Math.max(
    0,
    Math.min(subtotal, (selectedCoupon?.discountAmount ?? 0) + pointDiscount + balanceUsed),
  )
  const total = subtotal + DELIVERY_FEE - discount

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async () => {
    if (!cart || cart.items.length === 0) {
      setError(t("checkout.emptyCart"))
      return
    }
    if (!form.customer.trim() || !form.phone.trim() || !form.region.trim() || !form.detail.trim()) {
      setError(t("checkout.incomplete"))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (!user) {
        const order = await apiJson<OrderResponse>("/orders", {
          method: "POST",
          body: JSON.stringify({
            fromCart: false,
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            deliveryFee: DELIVERY_FEE,
            customer: form.customer.trim(),
            phone: form.phone.trim(),
            address: `${form.region.trim()} ${form.detail.trim()}`.trim(),
            remark: "",
          }),
        })
        clearLocalCart()
        setCreatedOrder(order)
        return
      }
      const order = await apiJson<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          fromCart: true,
          deliveryFee: DELIVERY_FEE,
          couponCode: couponCode || null,
          usePoints,
          useBalance,
          customer: form.customer.trim(),
          phone: form.phone.trim(),
          address: `${form.region.trim()} ${form.detail.trim()}`.trim(),
          remark: "",
        }),
      })
      router.replace(`/zh/profile/my-orders/?created=${encodeURIComponent(order.orderNo)}`)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("checkout.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("checkout.entering")}
      </div>
    )
  }

  if (createdOrder) {
    return (
      <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <Breadcrumbs currentLabel={t("checkout.breadcrumb")} />
          <div className="mx-auto mt-10 max-w-xl rounded bg-white p-8 text-center">
            <h1 className="text-xl font-bold leading-8">{t("checkout.guestSuccessTitle")}</h1>
            <p className="mt-4 text-sm leading-relaxed text-ikea-muted">
              {t("checkout.guestSuccessBody", { orderNo: createdOrder.orderNo })}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/zh/all-products/"
                className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
              >
                {t("checkout.continueShopping")}
              </Link>
              <Link
                href="/zh/profile/login/"
                className="i-btn i-btn--secondary flex h-11 items-center justify-center px-8 text-sm font-bold"
              >
                {t("checkout.loginToView")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("checkout.breadcrumb")} />

        <h1 className="text-2xl font-bold leading-9">{t("checkout.title")}</h1>

        {!user ? (
          <p className="mt-4 rounded border border-ikea-blue/20 bg-ikea-blue/5 px-4 py-3 text-xs leading-relaxed text-ikea-black">
            {t("checkout.guestNote")}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-ikea-blue">1 {t("checkout.stepShipping")}</span>
              <span className="text-ikea-gray-300">›</span>
              <span className="text-ikea-muted">2 {t("checkout.stepDelivery")}</span>
              <span className="text-ikea-gray-300">›</span>
              <span className="text-ikea-muted">3 {t("checkout.stepPayment")}</span>
            </div>

            <section className="bg-white p-6">
              <h2 className="text-base font-bold">{t("checkout.stepShipping")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  value={form.customer}
                  onChange={(event) => update("customer", event.target.value)}
                  placeholder={t("checkout.customerPlaceholder")}
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                />
                <input
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder={t("checkout.phonePlaceholder")}
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                />
                <input
                  value={form.region}
                  onChange={(event) => update("region", event.target.value)}
                  placeholder={t("checkout.regionPlaceholder")}
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue sm:col-span-2"
                />
                <input
                  value={form.detail}
                  onChange={(event) => update("detail", event.target.value)}
                  placeholder={t("checkout.detailPlaceholder")}
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue sm:col-span-2"
                />
              </div>
            </section>

            <section className="bg-white p-6">
              <h2 className="text-base font-bold">{t("checkout.stepDelivery")}</h2>
              <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-ikea-gray-200 p-4">
                <span className="flex items-center gap-3">
                  <input type="radio" name="delivery" defaultChecked className="accent-ikea-blue" />
                  <span>
                    <span className="block text-sm font-bold">
                      {t("checkout.standardDelivery")}
                    </span>
                    <span className="mt-0.5 block text-xs text-ikea-muted">
                      {t("checkout.standardDeliveryHint")}
                    </span>
                    <span className="mt-1 block text-xs text-ikea-muted">
                      {t("checkout.etaHint")}{" "}
                      <Link
                        href="/zh/customer-service/services/aftersales/"
                        className="font-bold text-ikea-blue hover:underline"
                      >
                        {t("checkout.returnsHint")}
                      </Link>
                    </span>
                  </span>
                </span>
                <span className="text-sm font-bold">{formatPrice(DELIVERY_FEE)}</span>
              </label>
            </section>
          </div>

          <aside className="h-fit bg-white p-6">
            <h2 className="text-base font-bold">{t("checkout.orderSummary")}</h2>

            {loading ? (
              <p className="py-10 text-center text-sm text-ikea-muted">{t("checkout.loading")}</p>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-ikea-muted">{t("checkout.empty")}</p>
                <Link
                  href="/zh/all-products/"
                  className="mt-3 inline-block text-sm font-bold text-ikea-blue hover:underline"
                >
                  {t("checkout.browseProducts")}
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3">
                      <SiteImage
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 bg-white"
                        imgClassName="h-full w-full object-contain object-[50%_20%]"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="line-clamp-1 text-sm font-bold">{product.name}</span>
                        <span className="mt-0.5 text-xs text-ikea-muted">
                          {t("checkout.quantity", { count: quantity })}
                        </span>
                        <span className="mt-auto text-sm font-bold">
                          {formatPrice((product.price ?? 0) * quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {user ? (
                  <div className="mt-6 space-y-3 border-t border-ikea-gray-200 pt-4">
                    <label className="block">
                      <span className="text-xs font-bold text-ikea-muted">
                        {t("checkout.coupon")}
                      </span>
                      <select
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        className="mt-1 h-10 w-full border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
                      >
                        <option value="">{t("checkout.noCoupon")}</option>
                        {marketing?.coupons.map((coupon) => (
                          <option key={coupon.id} value={coupon.code}>
                            {coupon.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold text-ikea-muted">
                          {t("checkout.points", { count: marketing?.points ?? 0 })}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={marketing?.points ?? 0}
                          value={usePoints}
                          onChange={(event) => setUsePoints(Number(event.target.value))}
                          className="mt-1 h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-ikea-muted">
                          {t("checkout.balance", {
                            value: formatPrice(marketing?.balance ?? 0),
                          })}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={marketing?.balance ?? 0}
                          step="0.01"
                          value={useBalance}
                          onChange={(event) => setUseBalance(Number(event.target.value))}
                          className="mt-1 h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 space-y-2 border-t border-ikea-gray-200 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">{t("checkout.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">{t("checkout.deliveryFee")}</span>
                    <span>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-green-700">
                      <span>{t("checkout.discount")}</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-ikea-gray-200 pt-3 text-base font-bold">
                    <span>{t("checkout.total")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || loading || totalQuantity === 0}
                  className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? t("checkout.submitting") : t("checkout.submitOrder")}
                </button>
                <p className="mt-3 text-center text-xs text-ikea-muted">
                  {t("checkout.submitHint")}
                </p>
              </>
            )}

            {error ? (
              <p className="mt-4 rounded bg-red-50 px-4 py-3 text-center text-xs text-red-600">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
