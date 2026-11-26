import { ImageResponse } from "next/og"
import { SITE_SCOPE } from "@/lib/site-scope"

export const alt = "CHUNG YIP — Medical, health and home living"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  const isPortal = SITE_SCOPE === "portal"
  const title = isPortal
    ? `Health and home,
better connected.`
    : SITE_SCOPE === "home"
      ? "Home & Living"
      : "Medical & Health"
  const accent = isPortal ? "#dce9e5" : SITE_SCOPE === "home" ? "#e7ded1" : "#dce9e5"

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0d0d0d",
        color: "#f2f0ea",
        padding: "58px 68px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 20, letterSpacing: "0.24em", fontWeight: 700 }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: accent }} />
        CHUNG YIP
      </div>
      <div style={{ display: "flex", whiteSpace: "pre-wrap", fontFamily: "serif", fontSize: 92, lineHeight: 0.96, letterSpacing: "-0.035em", maxWidth: 900 }}>
        {title}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,.25)", paddingTop: 24, fontSize: 17, letterSpacing: "0.12em", color: "rgba(255,255,255,.62)" }}>
        <span>{isPortal ? "MEDICAL & HEALTH  /  HOME & LIVING" : "CHUNG YIP SINGAPORE"}</span>
        <span>LIFE-SG.COM</span>
      </div>
    </div>,
    size,
  )
}
