import type { ProductData } from "./pages-types";
import { loadDataJson } from "@/lib/data-files";
import { productsById } from "@/data/products-index";

export interface OrderItem {
  productId: string;
  qty: number;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  customer?: string | null;
  phone?: string | null;
  address?: string | null;
  deliveryFee?: number | null;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderWithProducts extends Order {
  products: ProductData[];
  subtotal: number;
  total: number;
}

export function orders(): Order[] {
  return loadDataJson<Order[]>("orders.json");
}

export function findOrder(id: string): Order | undefined {
  return orders().find((order) => order.id === id);
}

export function orderWithProducts(order: Order): OrderWithProducts {
  const byId = productsById();
  const products = order.items
    .map((item) => byId.get(item.productId))
    .filter((product): product is ProductData => Boolean(product));
  const subtotal = products.reduce(
    (sum, product, index) => sum + (product.price ?? 0) * (order.items[index]?.qty ?? 1),
    0,
  );
  const deliveryFee = order.deliveryFee ?? 9.9;
  return {
    ...order,
    products,
    subtotal,
    total: subtotal + deliveryFee,
  };
}
