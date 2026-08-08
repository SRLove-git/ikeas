import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--lang=zh-CN"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3200/cn/zh/profile/login/", { waitUntil: "networkidle0", timeout: 60000 });
await page.type("input[placeholder='请输入手机号']", "13800138000");
await page.type("input[placeholder='验证码']", "1234");
await page.click("input[type='checkbox']");
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("登录 / 注册"));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 2500));
console.log("URL after login:", page.url());
const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent || "");
console.log("profile h1:", h1);
const header = await page.evaluate(() => document.body.innerHTML.includes("宜家会员") ? "header shows member name" : "header NOT updated");
console.log(header);
await page.screenshot({ path: "/Users/srlove/Documents/Code/ikeas/docs/design-references/qa-compare/profile-logged-in.png" });
await browser.close();
