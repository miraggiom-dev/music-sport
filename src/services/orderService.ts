import type { Order, OrderStatus } from "@/types";
import { initOrders } from "@/data/mockData";
export interface OrderService { list(): Order[]; changeStatus(order: Order, status: OrderStatus): Order; }
export const orderService: OrderService = {
  list: () => [...initOrders],
  changeStatus: (order, status) => ({ ...order, status }),
};
