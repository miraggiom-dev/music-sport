import type { ExchangeRate, Order, OrderStatus, Period } from "@/types";
export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const fmt = (n: number) => `$${n.toFixed(2)}`;
export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const fmtBs = (n: number) =>
  `Bs. ${round2(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
export const fmtDateTime = (iso: string) =>
  `${fmtDay(iso)} ${new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`;
export const RATE_STALE_HOURS = 24;
export const rateAgeHours = (r: ExchangeRate) =>
  (Date.now() - new Date(r.updatedAt).getTime()) / 3600000;
export const PAID_STATUSES: OrderStatus[] = [
  "procesando",
  "despachado",
  "completado",
];
export const OPEN_STATUSES: OrderStatus[] = [
  "pendiente",
  "procesando",
  "despachado",
];
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["procesando", "cancelado"],
  procesando: ["despachado", "cancelado"],
  despachado: ["completado"],
  completado: [],
  cancelado: [],
};
export const ORDER_STATUSES: OrderStatus[] = [
  "pendiente",
  "procesando",
  "despachado",
  "completado",
  "cancelado",
];
export const statusLabel: Record<OrderStatus, string> = {
  pendiente: "Pendiente de pago",
  procesando: "Pagada · procesando",
  despachado: "Despachado",
  completado: "Completado",
  cancelado: "Cancelado",
};
export const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isValidPhone = (v: string) =>
  /^\+?[\d\s\-().]{7,20}$/.test(v.trim());
export const isValidName = (v: string) => v.trim().length >= 3;
export const isValidSku = (v: string) =>
  /^[A-Za-z0-9\-_]{2,20}$/.test(v.trim());
export const isValidPrice = (v: number) => v > 0 && v <= 999999;
export const isValidStock = (v: number) => Number.isInteger(v) && v >= 0;
export const isValidPass = (v: string) => v.length >= 6 && v.length <= 50;
export const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eef0f5"/></svg>',
  );
export const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
};
export const escapeHtml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const currentPeriodKey = (p: Period) => {
  const d = toISODate(new Date());
  return p === "diario" ? d : p === "mensual" ? d.slice(0, 7) : d.slice(0, 4);
};
export const periodName: Record<Period, string> = {
  diario: "Hoy",
  mensual: "Este mes",
  anual: "Este año",
};
export const salesTrend = (orders: Order[], p: Period) =>
  Array.from(
    { length: p === "diario" ? 7 : p === "mensual" ? 6 : 5 },
    (_, i) => ({
      label: String(i + 1),
      ventas: orders
        .filter((o) => PAID_STATUSES.includes(o.status))
        .reduce((a, o) => a + o.total, 0),
      ordenes: 0,
    }),
  );

import { useContext, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { toast as notify } from "sonner";
import logoImg from "@/imports/Logo.png";
import { RateContext } from "@/contexts/RateContext";
import type { CartItem, TaxType } from "@/types";
export const TAX_RATES: Record<TaxType, number> = { IVA: 0.16, IGTF: 0.03 };
export const taxLabel = (t: TaxType) => `${t} (${TAX_RATES[t] * 100}%)`;
export const calcTotals = (items: CartItem[], taxType: TaxType) => {
  const subtotal = round2(
    items.reduce((a, i) => a + i.product.price * i.qty, 0),
  );
  const tax = round2(subtotal * TAX_RATES[taxType]);
  return { subtotal, tax, taxType, total: round2(subtotal + tax) };
};
export function BsRef({
  usd,
  className = "",
}: {
  usd: number;
  className?: string;
}) {
  const rate = useContext(RateContext);
  if (!rate) return null;
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      <span className="font-semibold text-gray-700">
        {fmtBs(usd * rate.value)}
      </span>{" "}
      · Tasa {rate.name} al {fmtDay(rate.updatedAt)}
    </p>
  );
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pendiente: "bg-amber-50 text-amber-700",
    procesando: "bg-blue-50 text-blue-700",
    despachado: "bg-indigo-50 text-indigo-700",
    completado: "bg-green-50 text-green-700",
    cancelado: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  if (props.type !== "password") return <input {...props} />;
  return (
    <div className="relative w-full">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${props.className ?? ""} !pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
export function Logo({
  size = 40,
  white = false,
}: {
  size?: number;
  white?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logoImg}
        alt="Music&Sport DSS logo"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
        <div
          className={`font-bold leading-tight ${white ? "text-white" : "text-[#000080]"}`}
          style={{ fontSize: size * 0.38 }}
        >
          Music&amp;Sport
        </div>
        <div
          className={`leading-none font-semibold tracking-widest ${white ? "text-white/70" : "text-[#C8102E]"}`}
          style={{ fontSize: size * 0.22 }}
        >
          DSS, C.A.
        </div>
      </div>
    </div>
  );
}
export function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
export function StatusFilter({
  value,
  onChange,
  orders,
}: {
  value: string;
  onChange: (s: string) => void;
  orders: Order[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["todas", ...ORDER_STATUSES].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap ${value === s ? "bg-[#000080] text-white" : "bg-white text-gray-600 border border-gray-200"}`}
        >
          {s}
          <span className="ml-2 text-[11px]">
            {s === "todas"
              ? orders.length
              : orders.filter((o) => o.status === s).length}
          </span>
        </button>
      ))}
    </div>
  );
}
export function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="px-6 py-4 bg-[#000080] flex justify-between">
          <h2 className="text-white font-bold">Detalle: {order.id}</h2>
          <button onClick={onClose} className="text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.product.name} × {item.qty}
              </span>
              <span>{fmt(item.product.price * item.qty)}</span>
            </div>
          ))}
          <div className="font-bold">Total: {fmt(order.total)}</div>
        </div>
      </div>
    </div>
  );
}
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        {children}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#C8102E] text-white rounded-lg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
import { printDocument } from "@/lib/generatePDF";
export async function printReceipt(order: import("@/types").Order) {
  try {
    const b = order.billing;
    const receiptNumber = order.receiptNo ?? order.id;
    const paymentDate = order.paidAt ?? order.date;
    const money = (value: number) => `$${value.toFixed(2)}`;
    const itemRows = order.items
      .map(
        (item) => `
    <tr>
      <td>${escapeHtml(item.product.name)}</td>
      <td>${escapeHtml(item.product.sku)}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${money(item.product.price)}</td>
      <td class="right">${money(item.product.price * item.qty)}</td>
    </tr>`,
      )
      .join("");
    const rateLine = order.rate
      ? `<p class="muted">Referencia en bolívares: ${escapeHtml(fmtBs(order.total * order.rate.value))} · Tasa ${escapeHtml(order.rate.name)} al ${fmtDay(order.rate.updatedAt)}</p>`
      : "";

    printDocument(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Recibo ${escapeHtml(receiptNumber)}</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @media print { .brand, .section-title, th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    body { margin: 0; color: #20202e; font: 10px Arial, sans-serif; }
    .page { max-width: 760px; margin: 0 auto; }
    .topline { display: flex; justify-content: space-between; color: #555; font-size: 9px; margin-bottom: 10px; }
    .brand { height: 66px; padding: 10px 18px; display: flex; align-items: center; gap: 12px; color: white; border-radius: 5px; background-color: #000080; background-image: linear-gradient(105deg, #000080 0%, #19127f 48%, #c8102e 100%); }
    .brand img { width: 42px; height: 42px; object-fit: contain; }
    .brand-name { font-size: 20px; font-weight: 700; letter-spacing: .2px; }
    .brand-subtitle { margin-top: 2px; color: #d9d9ec; font-size: 9px; letter-spacing: .7px; }
    h1 { margin: 12px 0 8px; padding-left: 8px; border-left: 4px solid #c8102e; color: #000080; font-size: 15px; }
    .meta { margin: 0 0 12px; color: #555; font-size: 9px; }
    .customer { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 40px; margin-bottom: 12px; }
    .field { min-height: 22px; }
    .label { display: block; color: #999; font-size: 8px; text-transform: uppercase; }
    .value { display: block; margin-top: 1px; font-size: 9px; }
    .section-title { padding: 7px 9px; color: white; background-color: #000080; background: #000080; font-weight: 700; font-size: 9px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 5px 7px; color: white; background-color: #000080; background: #000080; text-align: left; font-size: 8px; }
    td { padding: 6px 7px; border-bottom: 1px solid #ddd; font-size: 8px; }
    .center { text-align: center; } .right { text-align: right; }
    .totals { width: 42%; margin: 0 0 0 auto; }
    .totals td { padding: 4px 7px; border: 0; color: #555; }
    .totals tr:last-child td { border-top: 2px solid #000080; color: #c8102e; font-size: 12px; font-weight: 700; }
    .thanks { margin: 15px 0 8px; color: #777; text-align: center; font-size: 9px; }
    footer { display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #ddd; color: #999; font-size: 8px; }
    .muted { color: #777; font-size: 8px; }
  </style>
</head>
<body>
  <main class="page">
    <div class="topline"><span>${escapeHtml(fmtDateTime(paymentDate))}</span><span>Recibo ${escapeHtml(receiptNumber)}</span></div>
    <div class="brand"><img src="${logoImg}" alt="Music&Sport"><div><div class="brand-name">Music&amp;Sport DSS, C.A.</div><div class="brand-subtitle">GESTIÓN DE INVENTARIO Y VENTAS</div></div></div>
    <h1>Recibo de pago ${escapeHtml(receiptNumber)}</h1>
    <p class="meta">Orden ${escapeHtml(order.id)} · Emitido ${escapeHtml(order.date)} · Pago aprobado ${escapeHtml(paymentDate)} · Estado: ${escapeHtml(statusLabel[order.status])}</p>
    <section class="customer">
      <div class="field"><span class="label">Facturar a</span><span class="value">${escapeHtml(b.name)}</span></div>
      <div class="field"><span class="label">Cédula / RIF</span><span class="value">${escapeHtml(b.docId || "No especificado")}</span></div>
      <div class="field"><span class="label">Correo</span><span class="value">${escapeHtml(b.email)}</span></div>
      <div class="field"><span class="label">Teléfono</span><span class="value">${escapeHtml(b.phone || "No especificado")}</span></div>
      <div class="field"><span class="label">Dirección</span><span class="value">${escapeHtml(b.address || order.address || "No especificada")}</span></div>
      <div class="field"><span class="label">Método de pago</span><span class="value">${escapeHtml(b.method)}${b.reference ? ` · Ref. ${escapeHtml(b.reference)}` : ""}</span></div>
    </section>
    <div class="section-title">DETALLE</div>
    <table>
      <thead><tr><th>Producto</th><th>SKU</th><th class="center">Cant.</th><th class="right">P. unit.</th><th class="right">Importe</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td class="right">${money(order.subtotal)}</td></tr>
      <tr><td>${escapeHtml(taxLabel(order.taxType))}</td><td class="right">${money(order.tax)}</td></tr>
      <tr><td>TOTAL</td><td class="right">${money(order.total)}</td></tr>
    </table>
    ${rateLine}
    <p class="thanks">¡Gracias por su compra en Music&amp;Sport DSS, C.A.!</p>
    <footer><span>Music&amp;Sport DSS, C.A.</span><span>Generado el ${escapeHtml(fmtDateTime(new Date().toISOString()))}</span></footer>
  </main>
</body>
</html>`);
  } catch {
    notify.error("No se pudo preparar el recibo para imprimir");
  }
}

export const BS_METHODS = ["Transferencia", "Pago móvil"];
export const rateNote = (r: import("@/types").RateSnap) =>
  `Tasa ${r.name} al ${fmtDay(r.updatedAt)}`;
export const isValidDocId = (v: string) =>
  /^[VEJGP]-?\d{6,9}(-?\d)?$/i.test(v.trim());
export const useRate = () => useContext(RateContext);
