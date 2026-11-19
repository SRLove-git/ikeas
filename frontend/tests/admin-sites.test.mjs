import assert from "node:assert/strict"
import test from "node:test"
import { adminPath, isAdminSite, loginDestination } from "../src/lib/admin-sites.ts"

test("each site has its own homepage and shares operational pages under that site's URL", () => {
  for (const site of ["portal", "home", "medical"]) {
    assert.ok(isAdminSite(site))
    assert.equal(adminPath(site), `/admin/${site}/homepage/`)
    assert.equal(adminPath(site, "pages/contact"), `/admin/${site}/pages/contact/`)
  }
  assert.equal(isAdminSite("other"), false)
})

test("old catalogue links open the site that owns the catalogue", () => {
  assert.equal(adminPath("portal", "brands"), "/admin/home/brands/")
  assert.equal(adminPath("home", "products/123"), "/admin/medical/products/123/")
})

test("sign-in returns to the selected admin record or the portal homepage", () => {
  const path = adminPath("home", "brands")
  assert.equal(loginDestination(path), path)
  for (const invalid of [null, "/", "https://example.com/", "//example.com", "/admin/other/"]) {
    assert.equal(loginDestination(invalid), adminPath("portal"))
  }
})
