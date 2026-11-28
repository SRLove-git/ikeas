import assert from "node:assert/strict"
import test from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import puppeteer from "puppeteer-core"

// Run against a local NEXT_PUBLIC_SITE_SCOPE=portal server with PORTAL_TEST_ORIGIN.
const origin = process.env.PORTAL_TEST_ORIGIN
const company = "[data-portal-company]"
const stores = `${company} .portal-destinations a`
const companyChapter = '.portal-motion[data-portal-flip-active="01"]'
const medicalChapter = '.portal-motion[data-portal-flip-active="02"]'
const opening = "[data-portal-opening]"
const desktop = { width: 1280, height: 800 }
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true }

// Evaluated in the browser so an offscreen or obscured link cannot pass.
function visibleStoreCountIs(selector, count) {
  const anchors = [...document.querySelectorAll(selector)]
  return (
    anchors.length === 2 &&
    anchors.filter((anchor) => {
      const { left, top, width, height } = anchor.getBoundingClientRect()
      return (
        anchor.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
        anchor.contains(document.elementFromPoint(left + width / 2, top + height / 2))
      )
    }).length === count
  )
}

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
        anchors.map((a) => a.href),
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
    "the first wheel slides both store links up and the next gesture opens Medical",
    async (t) => {
      const page = await newPage(t)
      await open(page, "/en/")
      await page.waitForSelector(opening, { hidden: true })
      assert.equal(await page.evaluate(visibleStoreCountIs, stores, 0), true)
      const previousTops = await page.$$eval(stores, (anchors) =>
        anchors.map((a) => a.getBoundingClientRect().top),
      )

      await page.mouse.wheel({ deltaY: 120 })
      // Residual trackpad events belong to this gesture, even after the links start moving.
      for (const deltaY of [76, 54, 38, 24, 14, 8, 4]) {
        await delay(35)
        await page.mouse.wheel({ deltaY })
      }
      await page.waitForFunction(visibleStoreCountIs, {}, stores, 2)
      await page.waitForSelector(companyChapter)
      const settledTops = await page.$$eval(stores, (anchors) =>
        anchors.map((a) => a.getBoundingClientRect().top),
      )
      assert.ok(settledTops.every((top, i) => top < previousTops[i] - 8))

      await delay(1000)
      await page.mouse.wheel({ deltaY: 120 })
      await page.waitForSelector(medicalChapter)
    },
  )

  await t.test(
    "the opening plays and the logo replays it with the stores folded again",
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

      await page.click('[data-portal-progress-item="02"]')
      await page.waitForSelector(medicalChapter)
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 })
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.click(".portal-header .portal-wordmark"),
      ])
      assert.equal(new URL(page.url()).hash, "")
      await page.waitForSelector(companyChapter)
      await page.waitForSelector(opening, { visible: true })
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 })
      await page.mouse.wheel({ deltaY: 120 })
      await page.waitForSelector(opening, { hidden: true })
      await page.waitForFunction(visibleStoreCountIs, {}, stores, 2)
      await page.waitForSelector(companyChapter)
    },
  )

  for (const key of ["PageDown", "Enter"]) {
    await t.test(
      `keyboard users can open the stores with ${key} and tab between them`,
      async (t) => {
        const page = await newPage(t)
        await open(page, "/en/")
        await page.waitForSelector(opening, { hidden: true })
        if (key === "Enter") {
          await page.focus(`${company} a[href="/en/company/"]`)
          await page.keyboard.press("Tab")
          assert.equal(
            await page.$eval("[data-store-cue]", (el) => el === document.activeElement),
            true,
          )
        }
        await page.keyboard.press(key)
        await page.waitForFunction(visibleStoreCountIs, {}, stores, 2)
        await page.waitForSelector(companyChapter)
        assert.equal(
          await page.$$eval(stores, (links) => links[0] === document.activeElement),
          true,
        )
        await page.keyboard.press("Tab")
        assert.equal(
          await page.$$eval(stores, (links) => links[1] === document.activeElement),
          true,
        )
      },
    )
  }

  await t.test("reduced motion shows the company without a curtain or scroll lock", async (t) => {
    const page = await newPage(t)
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
    await open(page, "/en/")
    await page.waitForSelector(opening, { hidden: true })
    await page.waitForSelector(`${company} h1`, { visible: true })
    assert.notEqual(await page.$eval("html", (el) => el.dataset.portalFlip), "true")
    await page.mouse.wheel({ deltaY: 300 })
    await page.waitForFunction(() => window.scrollY > 0)
    await page.waitForFunction(visibleStoreCountIs, {}, stores, 2)
  })

  await t.test("the mobile company introduction scrolls with a vertical swipe", async (t) => {
    const page = await newPage(t, mobile)
    await open(page, "/zh/")
    await page.waitForSelector(opening, { hidden: true })
    await page.waitForSelector(`${company} h1`, { visible: true })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.evaluate(visibleStoreCountIs, stores, 0), true)
    const cdp = await page.createCDPSession()
    const x = mobile.width / 2
    const y = mobile.height * 0.7
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - 24 * step }],
      })
      await delay(30)
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await page.waitForFunction(() => window.scrollY > 0)
    await page.waitForFunction(visibleStoreCountIs, {}, stores, 2)
    assert.equal(new URL(page.url()).pathname, "/zh/")
  })
})
