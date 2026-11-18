import { permanentRedirect } from "next/navigation"
import { SITE_SCOPE, absoluteUrl } from "@/lib/site-scope"

export default function MideaRedirectPage() {
  permanentRedirect(SITE_SCOPE === "home" ? "/zh/midea/" : absoluteUrl("home", "/zh/midea/"))
}
