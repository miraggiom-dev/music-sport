import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Home,
  Info,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  Phone,
  Printer,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  User,
  Users,
  X,
  XCircle,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  KeyRound,
  Lock,
  Clock,
} from "lucide-react";
import { toast as notify } from "sonner";
import type {
  TaxType,
  Account,
  AddToCart,
  Billing,
  CartItem,
  ChangeStatus,
  Client,
  InternalUser,
  Lockout,
  Order,
  Product,
  Role,
  View,
} from "@/types";
import {
  BsRef,
  fmt,
  fmtBs,
  fmtDateTime,
  fmtDay,
  isValidEmail,
  isValidName,
  isValidPass,
  isValidPhone,
  isValidSku,
  onImgError,
  PAID_STATUSES,
  OPEN_STATUSES,
  ORDER_STATUSES,
  printReceipt,
  statusLabel,
  StatusBadge,
  Logo,
  Input,
  StatCard,
  StatusFilter,
  OrderDetailModal,
} from "@/components/shared";
import {
  FALLBACK_IMG,
  calcTotals,
  taxLabel,
  toISODate,
  ConfirmDialog,
  BS_METHODS,
  isValidDocId,
  useRate,
  rateNote,
} from "@/components/shared";
import logoImg from "@/imports/Logo.png";
export function ClientOrders({
  orders,
  clientId,
  changeStatus,
}: {
  orders: Order[];
  clientId: string;
  changeStatus: ChangeStatus;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("todas");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const myOrders = orders
    .filter((o) => o.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const rangeError =
    from && to && from > to
      ? "La fecha inicial no puede ser posterior a la final"
      : "";
  const filtered = rangeError
    ? []
    : myOrders.filter(
        (o) =>
          (!from || o.date >= from) &&
          (!to || o.date <= to) &&
          (status === "todas" || o.status === status),
      );
  const hasFilters = from || to || status !== "todas";
  const spent = filtered
    .filter((o) => PAID_STATUSES.includes(o.status))
    .reduce((a, o) => a + o.total, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1
        className="text-3xl font-black text-[#000080] mb-6"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        Historial de compras
      </h1>
      {myOrders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No tienes órdenes aún</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                  <Calendar size={12} />
                  Desde
                </label>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${rangeError ? "border-red-400" : "border-gray-200"}`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1">
                  <Calendar size={12} />
                  Hasta
                </label>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${rangeError ? "border-red-400" : "border-gray-200"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm capitalize"
                >
                  {["todas", ...ORDER_STATUSES].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setStatus("todas");
                }}
                disabled={!hasFilters}
                className="py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Limpiar
              </button>
            </div>
            {rangeError && <p className="text-red-500 text-xs">{rangeError}</p>}
            <p className="text-xs text-gray-400">
              {filtered.length} orden(es) · {fmt(spent)} pagado
            </p>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No hay órdenes en el rango seleccionado
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-50 flex-wrap">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#000080]">
                        {o.id}
                      </span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{o.date}</span>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="px-5 py-3 space-y-1.5">
                    {o.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="text-gray-700">
                          {item.product.name} ×{item.qty}
                        </span>
                        <span className="font-medium shrink-0">
                          {fmt(item.product.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    {o.rejectReason && (
                      <p className="text-xs text-red-600 pt-1">
                        Pago rechazado: {o.rejectReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs text-gray-400 truncate">
                      {o.billing.method} · {o.address}
                    </span>
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      {o.status === "pendiente" && (
                        <button
                          onClick={() => setCancelId(o.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Cancelar orden
                        </button>
                      )}
                      {o.receiptNo && (
                        <button
                          onClick={() => printReceipt(o)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#000080] text-white text-xs font-semibold hover:bg-[#0000a0]"
                        >
                          <Printer size={13} />
                          Recibo
                        </button>
                      )}
                      <span className="text-right">
                        <span className="block font-bold text-[#C8102E]">
                          {fmt(o.total)}
                        </span>
                        {o.rate && (
                          <span className="block text-[10px] text-gray-400">
                            {o.currency === "VES" ? "Pagado " : "Ref. "}
                            {fmtBs(o.total * o.rate.value)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {cancelId && (
        <ConfirmDialog
          title="¿Cancelar esta orden?"
          message="La orden se anulará y los artículos volverán a estar disponibles."
          confirmLabel="Cancelar orden"
          onCancel={() => setCancelId(null)}
          onConfirm={() => {
            changeStatus(cancelId, "cancelado", {
              rejectReason: "Cancelada por el cliente",
            });
            setCancelId(null);
          }}
        />
      )}
    </div>
  );
}
