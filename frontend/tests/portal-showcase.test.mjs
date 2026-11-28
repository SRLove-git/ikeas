import assert from "node:assert/strict"
import test from "node:test"
import puppeteer from "puppeteer-core"

// Run against a local NEXT_PUBLIC_SITE_SCOPE=portal server with PORTAL_TEST_ORIGIN.
const origin = process.env.PORTAL_TEST_ORIGIN
const activeProduct = '[data-product-gallery] a[data-stage="active"]'

test("portal product gallery", { skip: !origin && "set PORTAL_TEST_ORIGIN" }, async (t) => {
  const browser = await puppeteer.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
  )
  t.after(() => browser.close())

  async function openPage(viewport, reduced = false) {
    const page = await browser.newPage()
    await page.setViewport(viewport)
    if (reduced) {
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
    }
    await page.goto(new URL("/en/", origin).href)
    await page.waitForSelector(".portal-motion-ready")
    return page
  }

  async function expectProduct(page, path) {
    await page.waitForFunction(
      (selector, suffix) => {
        return document.querySelector(selector)?.pathname.endsWith(suffix)
      },
      {},
      activeProduct,
      path,
    )
  }

  await t.test(
    "the opening hands off to the gallery and can be dismissed on the first gesture",
    async () => {
      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 800 })
      const cdp = await page.createCDPSession()
      await cdp.send("Animation.enable")
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 })
      await page.goto(new URL("/en/", origin).href)
      await page.waitForSelector(".portal-motion-ready")
      const curtain = "[data-portal-opening]"
      assert.equal(await page.$eval(curtain, (el) => getComputedStyle(el).display), "block")
      await page.$eval(curtain, (el) =>
        el.getAnimations().forEach((animation) => animation.finish()),
      )
      await page.waitForSelector(curtain, { hidden: true })
      await page.reload()
      await page.waitForSelector(".portal-motion-ready")
      await page.mouse.wheel({ deltaY: 120 })
      await expectProduct(page, "/toshiba/p/eb-t500apw/")
      await page.waitForSelector(curtain, { hidden: true })
      await page.close()
    },
  )

  await t.test(
    "opening respects reduced motion and replays when returning home from a chapter",
    async () => {
      const page = await openPage({ width: 1280, height: 800 }, true)
      await page.waitForSelector("[data-portal-opening]", { hidden: true })
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }])
      await page.goto(new URL("/zh/#portal-act-03", origin).href)
      await page.waitForSelector('.portal-motion[data-portal-flip-active="03"]')
      await page.waitForSelector("[data-portal-opening]", { hidden: true })
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.click(".portal-wordmark"),
      ])
      assert.equal(new URL(page.url()).hash, "")
      await page.waitForSelector('.portal-motion[data-portal-flip-active="01"]')
      await page.waitForSelector("[data-portal-opening]", { visible: true })
      await page.close()
    },
  )

  await t.test(
    "wheel selects products and a fresh gesture after the last one opens Medical",
    async () => {
      const page = await openPage({ width: 1440, height: 900 })
      await page.focus(activeProduct)
      await page.mouse.wheel({ deltaY: 120 })
      await expectProduct(page, "/toshiba/p/eb-t500apw/")
      assert.equal(
        await page.$eval(activeProduct, (image) => document.activeElement === image),
        true,
      )
      for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight")
      await expectProduct(page, "/p/buzud-fingertip-pulse-oximeter-70b-8885020711479/")
      await new Promise((resolve) => setTimeout(resolve, 220))
      await page.mouse.wheel({ deltaY: 120 })
      await expectProduct(page, "/toshiba/p/dw-14f7-ss-sg/")
      await page.mouse.wheel({ deltaY: 90 })
      assert.equal(await page.$eval(".portal-motion", (el) => el.dataset.portalFlipActive), "01")
      await new Promise((resolve) => setTimeout(resolve, 220))
      await page.mouse.wheel({ deltaY: 120 })
      await page.waitForSelector('.portal-motion[data-portal-flip-active="02"]')
      await page.close()
    },
  )

  await t.test("touch swipes on the image switch product and vertical swipes scroll", async () => {
    const page = await openPage({ width: 390, height: 844, isMobile: true, hasTouch: true })
    const cdp = await page.createCDPSession()
    async function swipe(dx, dy) {
      const rect = await page
        .locator("[data-product-gallery]")
        .waitHandle()
        .then((el) => el.boundingBox())
      const start = { x: rect.x + rect.width * 0.65, y: rect.y + rect.height * 0.75 }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] })
      for (let step = 1; step <= 8; step++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: start.x + (dx * step) / 8, y: start.y + (dy * step) / 8 }],
        })
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    }
    await swipe(-145, 0)
    await expectProduct(page, "/toshiba/p/eb-t500apw/")
    await page.evaluate(async () => {
      await Promise.all(
        document
          .querySelector("[data-product-gallery]")
          .getAnimations({ subtree: true })
          .map((a) => a.finished),
      )
    })
    await swipe(0, -145)
    await page.waitForFunction(() => window.scrollY > 0)
    assert.equal(new URL(page.url()).pathname, "/en/")
    await page.close()
  })

  await t.test("reduced motion supports keyboard selection with a static gallery", async () => {
    const page = await openPage({ width: 1440, height: 900 }, true)
    await page.focus(activeProduct)
    await page.keyboard.press("ArrowRight")
    await expectProduct(page, "/toshiba/p/eb-t500apw/")
    assert.equal(
      await page.$eval(activeProduct, (el) => getComputedStyle(el).transitionProperty),
      "none",
    )
    assert.notEqual(await page.$eval("html", (el) => el.dataset.portalFlip), "true")
    await page.close()
  })
})
