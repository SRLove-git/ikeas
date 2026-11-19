"use client"

import { useParams } from "next/navigation"
import type { SiteScope } from "@/lib/site-scope"

export function useAdminSite() {
  return useParams<{ site: SiteScope }>().site
}
