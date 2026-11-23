import type { OrderStatus, TaxType } from "@/types";

export const TAX_RATES: Record<TaxType, number> = { IVA: 0.16, IGTF: 0.03 };
export const ORDER_STATUSES: OrderStatus[] = ["pendiente", "procesando", "despachado", "completado", "cancelado"];
export const PAID_STATUSES: OrderStatus[] = ["procesando", "despachado", "completado"];
export const OPEN_STATUSES: OrderStatus[] = ["pendiente", "procesando", "despachado"];
export const BS_METHODS: readonly string[] = ["Transferencia", "Pago móvil"];
export const LOCK_ATTEMPTS = 3;
export const LOCK_MINUTES = 5;
export const IDLE_MINUTES = 15;
export const RATE_STALE_HOURS = 24;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente de pago",
  procesando: "Pagada · procesando",
  despachado: "Despachado",
  completado: "Completado",
  cancelado: "Cancelado",
};
