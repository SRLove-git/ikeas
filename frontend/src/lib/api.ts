// Client/server helpers for the Spring Boot backend (server/).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
export const API_V1 = `${API_BASE}/api/v1`;

const TOKEN_KEY = "ikea_token";

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ProductLabel {
  text: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  productType?: string | null;
  designText?: string | null;
  price: number | null;
  originalPrice?: number | null;
  image: string | null;
  labels: ProductLabel[];
  detail?: unknown;
  categoryNames?: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

export interface Favorites {
  items: Product[];
  ids: string[];
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API_V1}${path}`, { ...options, headers });
}

export async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message ?? `请求失败 (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return body as T;
}
