export type Role = "admin" | "vendor" | "client";

export type View =
  | "login" | "register"
  | "catalog" | "product-detail" | "cart" | "checkout" | "order-confirm"
  | "client-profile" | "client-orders"
  | "admin-dashboard" | "admin-products" | "admin-inventory"
  | "admin-users" | "admin-clients" | "admin-orders" | "admin-reports" | "admin-rates"
  | "vendor-dashboard" | "vendor-orders" | "vendor-payment";

export interface Product {
  id: string; name: string; category: "Deportes" | "Música";
  subcategory: string; price: number; stock: number; minStock: number;
  description: string; image: string; sku: string; active: boolean;
}

export interface CartItem { product: Product; qty: number; }
export type OrderStatus = "pendiente" | "procesando" | "despachado" | "completado" | "cancelado";
export interface Billing { name: string; docId: string; email: string; phone: string; address: string; method: string; reference: string; }
export type TaxType = "IVA" | "IGTF";

export interface ExchangeRate { id: string; name: string; value: number; active: boolean; updatedAt: string; userId: string; }
export type RateSnap = Pick<ExchangeRate, "name" | "value" | "updatedAt">;

export interface Order {
  id: string; clientId: string; clientName: string; clientEmail: string;
  items: CartItem[]; subtotal: number; tax: number; taxType: TaxType; total: number; status: OrderStatus;
  date: string; address: string; phone: string; billing: Billing;
  receiptNo?: string; paidAt?: string; rejectReason?: string;
  currency: "USD" | "VES"; rate?: RateSnap;
}

export interface InternalUser {
  id: string; name: string; email: string; role: "vendor" | "admin";
  status: "activo" | "inactivo"; phone: string; createdAt: string; password: string;
}

export interface Client {
  id: string; name: string; email: string; phone: string;
  address: string; docId: string; createdAt: string; password: string;
}

export interface Lockout { attempts: number; until: number; }
export type Period = "diario" | "mensual" | "anual";
export type ReportType = "ventas" | "inventario";
export type ChangeStatus = (id: string, status: OrderStatus, extra?: Partial<Order>) => void;
export type AddToCart = (productId: string, qty: number) => boolean;
export type Account = { kind: "staff"; user: InternalUser } | { kind: "client"; user: Client };
