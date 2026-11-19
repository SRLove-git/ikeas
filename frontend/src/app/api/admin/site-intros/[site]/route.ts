import { adminGuard } from "@/lib/admin-auth"
import { appendChangelog, updateSiteIntro } from "@/lib/admin-store"
import type { IntroText, SiteIntro } from "@/lib/site-intro"

function validText(value: unknown): value is IntroText {
  if (!value || typeof value !== "object") return false
  return (
    ["eyebrow", "title", "description"].every((field) => {
      const text: unknown = Reflect.get(value, field)
      return typeof text === "string" && text.trim().length > 0 && text.length <= 1000
    }) && Object.keys(value).length === 3
  )
}

function validIntro(value: unknown): value is SiteIntro {
  return (
    !!value &&
    typeof value === "object" &&
    "en" in value &&
    "zh" in value &&
    validText(value.en) &&
    validText(value.zh) &&
    Object.keys(value).length === 2
  )
}

export async function PUT(request: Request, { params }: { params: Promise<{ site: string }> }) {
  const guard = await adminGuard()
  if (guard) return guard
  const { site } = await params
  if (site !== "home" && site !== "portal") return new Response(null, { status: 404 })
  const body = await request.json().catch(() => null)
  if (!validIntro(body?.original) || !validIntro(body?.value)) {
    return Response.json({ error: "Invalid homepage text" }, { status: 400 })
  }
  if (!(await updateSiteIntro(site, body.original, body.value))) {
    return Response.json({ error: "Content changed" }, { status: 409 })
  }
  await appendChangelog({
    user: "admin",
    action: "update",
    resource: "homepage",
    target: site,
    summary: `更新${site === "home" ? "家庭站" : "门户站"}首页文案`,
  })
  return Response.json({ ok: true })
}
