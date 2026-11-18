import { permanentRedirect } from "next/navigation"
import { SITE_SCOPE, absoluteUrl } from "@/lib/site-scope"

export default function ToshibaRedirectPage() {
  permanentRedirect(SITE_SCOPE === "home" ? "/zh/toshiba/" : absoluteUrl("home", "/zh/toshiba/"))
}
