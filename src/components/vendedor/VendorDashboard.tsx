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
import "./setup";

export function VendorDashboard({
  orders,
  products,
  setView,
}: {
  orders: Order[];
  products: Product[];
  setView: (v: View) => void;
}) {
  const rate = useRate();

  const pending = orders.filter((o) => o.status === "pendiente").length;
  const processing = orders.filter((o) => o.status === "procesando").length;
  const lowStock = products.filter(
    (p) => p.active && p.stock <= p.minStock,
  ).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pagos por verificar"
          value={String(pending)}
          sub="Órdenes pendientes"
          icon={<Clock size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Por despachar"
          value={String(processing)}
          sub="Pago aprobado"
          icon={<Truck size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Stock bajo o agotado"
          value={String(lowStock)}
          sub="Productos activos"
          icon={<AlertTriangle size={20} />}
          color="#800000"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#1560BD] text-white flex items-center justify-center shrink-0">
          <Coins size={20} />
        </div>
        {rate ? (
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Tasa activa · {rate.name}
            </p>
            <p
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {rate.value.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{" "}
              Bs/USD
            </p>
            <p className="text-xs text-gray-400">
              Última actualización: {fmtDateTime(rate.updatedAt)} · Solo lectura
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay una tasa de cambio activa. Solicita al administrador que la
            registre.
          </p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3
          className="font-bold text-[#000080] mb-4"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "1.1rem",
          }}
        >
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setView("vendor-orders")}
            className="flex items-center gap-3 p-4 bg-[#C8102E] text-white rounded-xl hover:bg-[#a80d25] transition-colors"
          >
            <ShoppingBag size={20} />
            <div className="text-left">
              <p className="font-semibold text-sm">Gestionar órdenes</p>
              <p className="text-white/60 text-xs">
                Verificar pagos y despachar
              </p>
            </div>
          </button>
          <button
            onClick={() => setView("admin-inventory")}
            className="flex items-center gap-3 p-4 bg-[#000080] text-white rounded-xl hover:bg-[#0000a0] transition-colors"
          >
            <Package size={20} />
            <div className="text-left">
              <p className="font-semibold text-sm">Consultar inventario</p>
              <p className="text-white/60 text-xs">Solo lectura</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

if (typeof document !== "undefined") {
  const content = "width=device-width, initial-scale=1, viewport-fit=cover";
  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "viewport";
    document.head.prepend(meta);
  }
  meta.content = content;
  const applySafeTop = () => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const measured = probe.getBoundingClientRect().height;
    probe.remove();
    const ua = navigator.userAgent;
    const iOS =
      /iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) &&
        navigator.maxTouchPoints > 1 &&
        Math.min(screen.width, screen.height) < 500);
    const portrait = window.innerHeight >= window.innerWidth;
    const tall = Math.max(screen.width, screen.height);
    const fullScreen =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone ||
      window.innerHeight >= screen.height - 40;
    let top = measured;
    if (!top && fullScreen && iOS && portrait && tall >= 812)
      top = tall >= 852 ? 59 : 47;
    else if (
      !top &&
      fullScreen &&
      /Android/.test(ua) &&
      portrait &&
      window.innerHeight >= screen.height - 4
    )
      top = 28;
    document.documentElement.style.setProperty("--safe-top", `${top}px`);
  };
  const runSafe = () => {
    if (document.body) applySafeTop();
    else
      document.addEventListener("DOMContentLoaded", applySafeTop, {
        once: true,
      });
  };
  runSafe();
  window.addEventListener("resize", runSafe);
  window.addEventListener("orientationchange", () => setTimeout(runSafe, 300));
  if (!document.getElementById("ms-global-style")) {
    const st = document.createElement("style");
    st.id = "ms-global-style";
    st.textContent = `
      html, body, #root { scrollbar-width: none; -ms-overflow-style: none; overscroll-behavior-y: none; }
      html, body { overflow-x: hidden; max-width: 100%; background: #f4f5f7; }
      *, *::before, *::after { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      *::-webkit-scrollbar, html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }
    `;
    document.head.appendChild(st);
  }
}

const ROLE_VIEWS: Record<Role, View[]> = {
  admin: [
    "admin-dashboard",
    "admin-products",
    "admin-inventory",
    "admin-users",
    "admin-clients",
    "admin-orders",
    "admin-reports",
    "admin-rates",
  ],
  vendor: [
    "vendor-dashboard",
    "vendor-orders",
    "vendor-payment",
    "admin-inventory",
  ],
  client: [
    "catalog",
    "product-detail",
    "cart",
    "checkout",
    "order-confirm",
    "client-profile",
    "client-orders",
  ],
};
const GUEST_VIEWS: View[] = [
  "login",
  "register",
  "catalog",
  "product-detail",
  "cart",
];
const homeFor = (r: Role | null): View =>
  r === "admin"
    ? "admin-dashboard"
    : r === "vendor"
      ? "vendor-dashboard"
      : r === "client"
        ? "catalog"
        : "login";
export function VendorOrders({
  orders,
  changeStatus,
  setView,
  setSelectedOrderId,
}: {
  orders: Order[];
  changeStatus: ChangeStatus;
  setView: (v: View) => void;
  setSelectedOrderId: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("pendiente");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = orders.find((o) => o.id === detailId) ?? null;
  const today = toISODate(new Date());
  const list = orders
    .filter((o) => statusFilter === "todas" || o.status === statusFilter)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pendientes"
          value={String(orders.filter((o) => o.status === "pendiente").length)}
          sub="Esperan aprobación de pago"
          icon={<Clock size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Por despachar"
          value={String(orders.filter((o) => o.status === "procesando").length)}
          sub="Pagadas"
          icon={<RefreshCw size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Completadas hoy"
          value={String(
            orders.filter(
              (o) => o.status === "completado" && o.paidAt === today,
            ).length,
          )}
          sub="Órdenes"
          icon={<CheckCircle size={20} />}
          color="#000080"
        />
      </div>
      <StatusFilter
        value={statusFilter}
        onChange={setStatusFilter}
        orders={orders}
      />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
            <p>No hay órdenes en este estado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((o) => (
              <div
                key={o.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#000080]">
                      {o.id}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {o.clientName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {o.items.reduce((a, i) => a + i.qty, 0)} artículo(s) ·{" "}
                    {o.date} · {o.billing.method}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-800 mr-1">
                    {fmt(o.total)}
                  </span>
                  <button
                    onClick={() => setDetailId(o.id)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    aria-label="Ver detalle"
                  >
                    <Eye size={15} />
                  </button>
                  {o.status === "pendiente" && (
                    <button
                      onClick={() => {
                        setSelectedOrderId(o.id);
                        setView("vendor-payment");
                      }}
                      className="px-4 py-2 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-[#a80d25] transition-colors"
                    >
                      Revisar pago
                    </button>
                  )}
                  {o.status === "procesando" && (
                    <button
                      onClick={() => changeStatus(o.id, "despachado")}
                      className="px-4 py-2 bg-[#1560BD] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-[#0f4c97]"
                    >
                      <Truck size={14} />
                      Despachar
                    </button>
                  )}
                  {o.status === "despachado" && (
                    <button
                      onClick={() => changeStatus(o.id, "completado")}
                      className="px-4 py-2 bg-[#000080] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-[#0000a0]"
                    >
                      <CheckCircle size={14} />
                      Completar
                    </button>
                  )}
                  {o.receiptNo && (
                    <button
                      onClick={() => printReceipt(o)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      aria-label="Imprimir recibo"
                    >
                      <Printer size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {detail && (
        <OrderDetailModal order={detail} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

export function VendorPayment({
  order,
  changeStatus,
  setView,
}: {
  order: Order;
  changeStatus: ChangeStatus;
  setView: (v: View) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");

  const approve = () => changeStatus(order.id, "procesando");
  const reject = () => {
    if (reason.trim().length < 5) {
      setReasonErr("Indica el motivo del rechazo (mín. 5 caracteres)");
      return;
    }
    changeStatus(order.id, "cancelado", { rejectReason: reason.trim() });
    setRejecting(false);
    setView("vendor-orders");
  };

  if (order.status !== "pendiente") {
    const approved = PAID_STATUSES.includes(order.status);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className={`${approved ? "bg-[#000080]" : "bg-[#800000]"} px-6 sm:px-8 py-6 text-white text-center`}
          >
            <div className="flex justify-center mb-2">
              <Logo size={44} white />
            </div>
            <p className="text-white/60 text-sm mt-2">
              {approved ? "Pago aprobado · Recibo" : "Pago rechazado"}
            </p>
            <p className="font-mono text-lg font-bold mt-1">
              {order.receiptNo ?? order.id}
            </p>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div>
                <p className="text-xs text-gray-400">Cliente</p>
                <p className="font-medium">{order.billing.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cédula / RIF</p>
                <p className="font-medium">{order.billing.docId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Orden</p>
                <p className="font-medium font-mono">{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Estado</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
            {order.rejectReason && (
              <p className="text-sm text-red-600">
                Motivo: {order.rejectReason}
              </p>
            )}
            <div className="space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-3 py-1 border-b border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmt(item.product.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    {fmt(item.product.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{taxLabel(order.taxType)}</span>
                <span>{fmt(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-[#C8102E] pt-2 border-t">
                <span>TOTAL</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>
          <div className="px-6 sm:px-8 pb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setView("vendor-orders")}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium"
            >
              Volver a órdenes
            </button>
            {approved && (
              <button
                onClick={() => printReceipt(order)}
                className="flex-1 py-3 rounded-xl bg-[#000080] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#0000a0]"
              >
                <Printer size={16} />
                Imprimir recibo (PDF)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => setView("vendor-orders")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C8102E]"
      >
        <ChevronLeft size={16} />
        Órdenes
      </button>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h3
          className="font-bold text-[#000080]"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "1.2rem",
          }}
        >
          Verificar pago — {order.id}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400">Facturar a</p>
            <p className="font-medium">
              {order.billing.name} · {order.billing.docId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Teléfono</p>
            <p className="font-medium">{order.billing.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Método de pago</p>
            <p className="font-medium">{order.billing.method}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Referencia</p>
            <p className="font-medium font-mono">
              {order.billing.reference || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-400">Dirección</p>
            <p className="font-medium">{order.billing.address}</p>
          </div>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center gap-3 py-2 border-b border-gray-50 text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">{item.product.name}</p>
                <p className="text-xs text-gray-400">
                  SKU: {item.product.sku} · Cant: {item.qty}
                </p>
              </div>
              <span className="font-semibold shrink-0">
                {fmt(item.product.price * item.qty)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-gray-500 pt-1">
            <span>{taxLabel(order.taxType)}</span>
            <span>{fmt(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#C8102E] text-lg pt-1">
            <span>Total a verificar</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              setRejecting(true);
              setReason("");
              setReasonErr("");
            }}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Rechazar pago
          </button>
          <button
            onClick={approve}
            className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Aprobar pago y emitir recibo
          </button>
        </div>
      </div>
      {rejecting && (
        <ConfirmDialog
          title="Rechazar pago"
          message="La orden pasará a cancelada y las unidades regresarán al inventario."
          confirmLabel="Rechazar"
          onCancel={() => setRejecting(false)}
          onConfirm={reject}
        >
          <div>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonErr("");
              }}
              rows={3}
              placeholder="Motivo (ej. referencia no encontrada)"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none ${reasonErr ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            {reasonErr && (
              <p className="text-red-500 text-xs mt-1">{reasonErr}</p>
            )}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
