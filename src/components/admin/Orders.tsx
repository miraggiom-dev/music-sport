import {
  BsRef,
  StatusBadge,
  Logo,
  Input,
  StatCard,
  ConfirmDialog,
  round2,
  taxLabel,
  ORDER_STATUSES,
  printReceipt,
  FALLBACK_IMG,
  NEXT_STATUS,
  OPEN_STATUSES,
  PAID_STATUSES,
  RATE_STALE_HOURS,
  currentPeriodKey,
  escapeHtml,
  fmt,
  fmtDateTime,
  fmtDay,
  fmtBs,
  isValidEmail,
  isValidName,
  isValidPass,
  isValidPhone,
  isValidPrice,
  isValidSku,
  isValidStock,
  onImgError,
  periodName,
  rateAgeHours,
  salesTrend,
  statusLabel,
  toISODate,
  IMG_TYPES,
  IMG_MAX_MB,
  statusColor,
  statusIcon,
} from "./shared";
import { Image as ImageIcon, Upload, Lock, Printer } from "lucide-react";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Coins,
  DollarSign,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Mail,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toast as notify } from "sonner";
import type {
  ChangeStatus,
  Client,
  ExchangeRate,
  InternalUser,
  Order,
  OrderStatus,
  Period,
  Product,
  ReportType,
  View,
} from "@/types";
import { printDocument } from "@/lib/generatePDF";
function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const b = order.billing;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="px-6 py-4 bg-[#000080] flex items-center justify-between rounded-t-2xl sticky top-0">
          <h2
            className="text-white font-bold"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.2rem",
            }}
          >
            Detalle: {order.id}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Facturar a</p>
              <p className="font-medium">{b.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Cédula / RIF</p>
              <p className="font-medium">{b.docId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium break-all">{b.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Teléfono</p>
              <p className="font-medium">{b.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400">Dirección</p>
              <p className="font-medium">{b.address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pago</p>
              <p className="font-medium">
                {b.method}
                {b.reference && ` · Ref. ${b.reference}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Fecha</p>
              <p className="font-medium">{order.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Estado</p>
              <StatusBadge status={order.status} />
            </div>
            {order.receiptNo && (
              <div>
                <p className="text-xs text-gray-400">Recibo</p>
                <p className="font-medium font-mono">{order.receiptNo}</p>
              </div>
            )}
            {order.rejectReason && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">Motivo de rechazo</p>
                <p className="font-medium text-red-600">{order.rejectReason}</p>
              </div>
            )}
          </div>
          <div className="border-t pt-3">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">
              Artículos
            </h4>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center gap-3 text-sm py-1.5 border-b border-gray-50"
                >
                  <span className="text-gray-700">
                    {item.product.name} × {item.qty}
                  </span>
                  <span className="font-semibold shrink-0">
                    {fmt(item.product.price * item.qty)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-gray-500 pt-1">
                <span>Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{taxLabel(order.taxType)}</span>
                <span>{fmt(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#C8102E] pt-1">
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>
          {order.receiptNo && (
            <button
              onClick={() => printReceipt(order)}
              className="w-full py-2.5 rounded-xl bg-[#000080] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#0000a0]"
            >
              <Printer size={15} />
              Imprimir recibo (PDF)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusFilter({
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
      {["todas", ...ORDER_STATUSES].map((s) => {
        const n =
          s === "todas"
            ? orders.length
            : orders.filter((o) => o.status === s).length;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors flex items-center gap-2
              ${value === s ? "bg-[#000080] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {s}
            <span
              className={`text-[11px] px-1.5 rounded-full ${value === s ? "bg-white/20" : "bg-gray-100"}`}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AdminOrders({
  orders,
  changeStatus,
}: {
  orders: Order[];
  changeStatus: ChangeStatus;
}) {
  const [statusFilter, setStatusFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = orders.find((o) => o.id === detailId) ?? null;
  const filtered = orders
    .filter((o) => statusFilter === "todas" || o.status === statusFilter)
    .filter((o) =>
      `${o.id} ${o.clientName} ${o.clientEmail}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por orden o cliente..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
        />
      </div>
      <StatusFilter
        value={statusFilter}
        onChange={setStatusFilter}
        orders={orders}
      />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Orden",
                  "Cliente",
                  "Productos",
                  "Total",
                  "Estado",
                  "Fecha",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#000080] font-semibold whitespace-nowrap">
                    {o.id}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 whitespace-nowrap">
                      {o.clientName}
                    </p>
                    <p className="text-xs text-gray-400">{o.clientEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {o.items.reduce((a, i) => a + i.qty, 0)} artículo(s)
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-800">
                    {fmt(o.total)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {o.date}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailId(o.id)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                        aria-label="Ver detalle"
                      >
                        <Eye size={14} />
                      </button>
                      {o.receiptNo && (
                        <button
                          onClick={() => printReceipt(o)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-[#000080]"
                          aria-label="Imprimir recibo"
                        >
                          <Printer size={14} />
                        </button>
                      )}
                      {NEXT_STATUS[o.status].length > 0 && (
                        <select
                          value=""
                          onChange={(e) =>
                            e.target.value &&
                            changeStatus(o.id, e.target.value as OrderStatus)
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="">Cambiar a…</option>
                          {NEXT_STATUS[o.status].map((s) => (
                            <option key={s} value={s}>
                              {s === "procesando"
                                ? "Aprobar pago"
                                : s === "cancelado"
                                  ? "Cancelar"
                                  : s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-400 text-sm"
                  >
                    No hay órdenes con este estado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {detail && (
        <OrderDetailModal order={detail} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
