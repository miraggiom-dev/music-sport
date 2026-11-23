
import type { Billing, Order, OrderStatus } from "@/types";

const API_URL = "/api/orders";

interface OrderResponse {
  success: boolean;
  message?: string;
  orders?: Order[];
  order?: Order;
}

async function request(
  endpoint: string,
  options: RequestInit = {},
): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: OrderResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Ocurrió un error al gestionar la orden.");
  }

  return data;
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    const data = await request("");
    return data.orders || [];
  },

  async create(
    billing: Billing,
    items: { productId: string; qty: number }[],
    rate?: { name: string; value: number; updatedAt: string },
  ): Promise<Order> {
    const data = await request("", {
      method: "POST",
      body: JSON.stringify({ billing, items, rate }),
    });

    if (!data.order) {
      throw new Error("El servidor no devolvió la orden creada.");
    }

    return data.order;
  },

  async changeStatus(
    id: string,
    status: OrderStatus,
    extra: Partial<Order> = {},
  ): Promise<Order> {
    const data = await request(`/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        rejectReason: extra.rejectReason,
      }),
    });

    if (!data.order) {
      throw new Error("El servidor no devolvió la orden actualizada.");
    }

    return data.order;
  },
};
