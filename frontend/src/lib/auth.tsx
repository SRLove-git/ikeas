"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  apiJson,
  clearAuthTokens,
  getRefreshToken,
  getToken,
  setAuthTokens,
  type AuthResponse,
  type User,
} from "@/lib/api"
import { clearLocalCart, readLocalCart } from "@/lib/local-cart"

export interface LoginInput {
  account: string
  password: string
  referralCode?: string
}

export interface RegisterInput {
  account: string
  password: string
  email: string
  emailCode: string
  name?: string
  referralCode?: string
}

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function mergeLocalCartIntoAccount(): Promise<void> {
  const items = readLocalCart()
  if (items.length === 0) return
  await apiJson("/cart/merge", {
    method: "POST",
    body: JSON.stringify({
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }),
  })
  clearLocalCart()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      await Promise.resolve()
      if (!getToken() && !getRefreshToken()) {
        if (!cancelled) setReady(true)
        return
      }
      try {
        const me = await apiJson<User>("/auth/me")
        if (!cancelled) setUser(me)
      } catch {
        clearAuthTokens()
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const startSession = useCallback(async (response: AuthResponse) => {
    setAuthTokens(response.token, response.refreshToken ?? null)
    try {
      await mergeLocalCartIntoAccount()
    } catch {
      // 登录仍然成功；保留本地购物袋，避免合并失败时丢失商品。
    }
    setUser(response.user)
    return response.user
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await apiJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          account: input.account,
          password: input.password,
          referralCode: input.referralCode ?? null,
        }),
      })
      return startSession(response)
    },
    [startSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await apiJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          account: input.account,
          password: input.password,
          email: input.email,
          emailCode: input.emailCode,
          name: input.name ?? null,
          referralCode: input.referralCode ?? null,
        }),
      })
      return startSession(response)
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await apiJson("/auth/logout", { method: "POST" })
    } catch {
      // Token already invalid or backend unreachable: clear locally anyway.
    } finally {
      clearAuthTokens()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
