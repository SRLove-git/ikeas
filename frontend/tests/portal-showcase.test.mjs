import assert from "node:assert/strict"
import test from "node:test"
import puppeteer from "puppeteer-core"

// Run against a local NEXT_PUBLIC_SITE_SCOPE=portal server with PORTAL_TEST_ORIGIN.
const origin = process.env.PORTAL_TEST_ORIGIN
const company = "[data-portal-company]"
const opening = "[data-portal-opening]"
const desktop = { width: 1280, height: 800 }
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true }

test("portal company introduction", { skip: !origin && "set PORTAL_TEST_ORIGIN" }, async (t) => {
  const browser = await puppeteer.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" },
  )
  t.after(() => browser.close())

  async function newPage(t, viewport = desktop) {
    const page = await browser.newPage()
    t.after(() => page.close())
    await page.setViewport(viewport)
    return page
  }

  async function open(page, path) {
    await page.goto(new URL(path, origin).href, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".portal-motion-ready")
  }

  for (const locale of ["en", "zh"]) {
    await t.test(`company introduction, photo and destinations on /${locale}/`, async (t) => {
      const page = await newPage(t)
      await open(page, `/${locale}/`)
      await page.waitForSelector(opening, { hidden: true })
      const heading = await page.$eval(`${company} h1`, (el) => el.innerText.replace(/\s+/g, " "))
      assert.equal(heading.trim(), "CHUNG YIP")

      const photo = await page.$eval(`${company} img`, async (img) => {
        await img.decode()
        return { url: img.currentSrc, width: img.naturalWidth }
      })
      assert.equal(photo.url, new URL("/images/cms/buzud-about-image.jpg", origin).href)
      assert.ok(photo.width > 0)

      const links = await page.$$eval("#portal-act-01 a[href]", (anchors) =>
        anchors.filter((a) => a.getClientRects().length && a.innerText.trim()).map((a) => a.href),
      )
      assert.ok(links.includes(new URL(`/${locale}/company/`, origin).href))
      for (const store of [
        process.env.NEXT_PUBLIC_MEDICAL_URL || "https://medical-sg.com",
        process.env.NEXT_PUBLIC_HOME_URL || "https://home-sg.com",
      ]) {
        assert.ok(links.includes(new URL(store).href), `Missing store link to ${store}`)
      }
    })
  }

  await t.test(
    "opening plays, the first wheel opens Medical, and the logo replays it",
    async (t) => {
      const page = await newPage(t)
      const cdp = await page.createCDPSession()
      await cdp.send("Animation.enable")
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 })
      await open(page, "/en/")
      await page.waitForSelector(opening, { visible: true })
      assert.ok(await page.$eval(opening, (el) => el.getAnimations().length > 0))
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 })
      await page.waitForSelector(opening, { hidden: true })

      await page.mouse.wheel({ deltaY: 120 })
      await page.waitForSelector('.portal-motion[data-portal-flip-active="02"]')
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 })
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.click(".portal-header .portal-wordmark"),
      ])
      await page.waitForSelector('.portal-motion[data-portal-flip-active="01"]')
      assert.equal(new URL(page.url()).hash, "")
      await page.waitForSelector(opening, { visible: true })
      await page.mouse.wheel({ deltaY: 120 })
      await page.waitForSelector(opening, { hidden: true })
      await page.waitForSelector('.portal-motion[data-portal-flip-active="02"]')
    },
  )

  await t.test("reduced motion shows the company without a curtain or scroll lock", async (t) => {
    const page = await newPage(t)
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
    await open(page, "/en/")
    await page.waitForSelector(opening, { hidden: true })
    await page.waitForSelector(`${company} h1`, { visible: true })
    assert.notEqual(await page.$eval("html", (el) => el.dataset.portalFlip), "true")
    await page.mouse.wheel({ deltaY: 300 })
    await page.waitForFunction(() => window.scrollY > 0)
  })

  await t.test("the mobile company introduction scrolls with a vertical swipe", async (t) => {
    const page = await newPage(t, mobile)
    await open(page, "/zh/")
    await page.waitForSelector(opening, { hidden: true })
    await page.waitForSelector(`${company} h1`, { visible: true })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const cdp = await page.createCDPSession()
    const x = mobile.width / 2
    const y = mobile.height * 0.7
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - 24 * step }],
      })
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await page.waitForFunction(() => window.scrollY > 0)
    assert.equal(new URL(page.url()).pathname, "/zh/")
  })
})
