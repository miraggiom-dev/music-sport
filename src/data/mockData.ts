import type { Client, ExchangeRate, InternalUser, Order, Product } from "@/types";

export const initProducts: Product[] = [];

export const initUsers: InternalUser[] = [
  { id: "U001", name: "Administrador", email: "admin@musicsport.com", role: "admin", status: "activo", phone: "", createdAt: "2026-01-01", password: "admin123" },
  { id: "U002", name: "Vendedor", email: "vendedor@musicsport.com", role: "vendor", status: "activo", phone: "", createdAt: "2026-01-01", password: "vendor123" },
];

export const initClients: Client[] = [
  { id: "C001", name: "Cliente", email: "cliente@demo.com", phone: "", address: "", docId: "", createdAt: "2026-01-01", password: "cliente123" },
];

export const initOrders: Order[] = [];
export const initRates: ExchangeRate[] = [];
