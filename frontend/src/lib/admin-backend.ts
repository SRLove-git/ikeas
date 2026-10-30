import "server-only"
import type { SyncProduct } from "@/lib/product-sync"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080").replace(/\/$/, "")

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin"
}

export class AdminBackendSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdminBackendSyncError"
  }
}

async function backendRequest(path: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/v1/admin/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminKey(),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    throw new AdminBackendSyncError(
      `后端商品同步失败: ${error instanceof Error ? error.message : "网络连接失败"}`,
    )
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`
    throw new AdminBackendSyncError(`后端商品同步失败: ${message}`)
  }
  return body
}

export async function upsertBackendProduct(
  product: SyncProduct,
  existingId?: string,
): Promise<void> {
  await backendRequest(existingId ? `products/${encodeURIComponent(existingId)}` : "products", {
    method: existingId ? "PUT" : "POST",
    body: JSON.stringify(product),
  })
}

export async function deleteBackendProduct(idOrSlug: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/v1/admin/products/${encodeURIComponent(idOrSlug)}`, {
      method: "DELETE",
      headers: { "X-Admin-Key": adminKey() },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    throw new AdminBackendSyncError(
      `后端商品删除同步失败: ${error instanceof Error ? error.message : "网络连接失败"}`,
    )
  }
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => null)
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`
    throw new AdminBackendSyncError(`后端商品删除同步失败: ${message}`)
  }
}
