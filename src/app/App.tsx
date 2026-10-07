import { useState, useEffect, useRef, useContext, Suspense, lazy } from "react";
import logoImg from "@/imports/Logo.png";
import {
  ShoppingCart,
  Search,
  Bell,
  LogOut,
  User,
  Package,
  BarChart2,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  TrendingUp,
  FileText,
  Home,
  X,
  Menu,
  Star,
  Minus,
  ArrowRight,
  Clock,
  DollarSign,
  RefreshCw,
  Lock,
  Mail,
  Phone,
  MapPin,
  Save,
  Download,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  Tag,
  Layers,
  Activity,
  ShoppingBag,
  Upload,
  Image as ImageIcon,
  Truck,
  Printer,
  KeyRound,
  Calendar,
  EyeOff,
  Coins,
  Info,
  ShieldCheck,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Toaster, toast as notify } from "sonner";
import { useLocation, useNavigate } from "react-router";
import type {
  Account,
  AddToCart,
  Billing,
  CartItem,
  ChangeStatus,
  Client,
  ExchangeRate,
  InternalUser,
  Lockout,
  Order,
  OrderStatus,
  Period,
  Product,
  RateSnap,
  ReportType,
  Role,
  TaxType,
  View,
} from "@/types";
import {
  initClients,
  initOrders,
  initProducts,
  initRates,
  initUsers,
} from "@/data/mockData";
import { printDocument } from "@/lib/generatePDF";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RateContext } from "@/contexts/RateContext";
import { pathForView, viewForPath } from "./routeConfig";
import {
  ROLE_VIEWS,
  GUEST_VIEWS,
  homeFor,
  canAccessView,
} from "@/lib/permissions";
import {
  TAX_RATES,
  PAID_STATUSES,
  OPEN_STATUSES,
  ORDER_STATUSES,
  BS_METHODS,
  RATE_STALE_HOURS,
  LOCK_ATTEMPTS,
  LOCK_MINUTES,
  IDLE_MINUTES,
} from "@/lib/constants";
import {
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidSku,
  isValidPrice,
  isValidStock,
  isValidPass,
  isValidDocId,
} from "@/lib/validation";
import { authService } from "@/services/authService";
import { clientService } from "@/services/clientService";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { rateService } from "@/services/rateService";
import { AdminArea } from "./admin";
import { VendorArea } from "./vendedor";
import { ClientArea } from "./cliente";
import { AuthArea } from "./auth";
const AdminDashboardPage = lazy(() => import("./admin/dashboard/page"));
const AdminProductsPage = lazy(() => import("./admin/productos/page"));
const AdminInventoryPage = lazy(() => import("./admin/inventario/page"));
const AdminUsersPage = lazy(() => import("./admin/usuarios/page"));
const AdminClientsPage = lazy(() => import("./admin/clientes/page"));
const AdminOrdersPage = lazy(() => import("./admin/ordenes/page"));
const AdminReportsPage = lazy(() => import("./admin/informes/page"));
const AdminRatesPage = lazy(() => import("./admin/tasas/page"));
const VendorDashboard = lazy(() => import("./vendedor/panel/Lazy"));
const VendorOrders = lazy(() => import("./vendedor/ordenes/Lazy"));
const VendorPayment = lazy(() => import("./vendedor/pagos/Lazy"));
import {
  ClientNav,
  Catalog,
  CatalogFooter,
  ProductDetail,
  CartView,
  Checkout,
  OrderConfirm,
  ClientProfile,
  ClientOrders,
} from "@/components/cliente";
import { StatusBadge, Logo, Input, StatCard } from "@/components/shared";
const LoginView = lazy(() => import("./auth/login/Lazy"));
const RegisterView = lazy(() => import("./auth/LazyRegister"));
import { round2, fmt, fmtBs } from "@/lib/formatCurrency";

function PageLoading() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#f4f5f7]">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-[#000080]/20 border-t-[#000080]"
        aria-label="Cargando página"
      />
    </div>
  );
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const taxLabel = (t: TaxType) => `${t} (${TAX_RATES[t] * 100}%)`;
// Todos los montos se guardan en USD con 2 decimales (DECIMAL(10,2)); los bolívares solo se calculan para mostrar
// Pago en bolívares → IVA 16%; pago en dólares → IGTF 3% (sin IVA)
const calcTotals = (items: CartItem[], taxType: TaxType) => {
  const subtotal = round2(
    items.reduce((a, i) => a + i.product.price * i.qty, 0),
  );
  const tax = round2(subtotal * TAX_RATES[taxType]);
  return { subtotal, tax, taxType, total: round2(subtotal + tax) };
};
// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
const fmtDateTime = (iso: string) =>
  `${fmtDay(iso)} ${new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`;
const rateAgeHours = (r: ExchangeRate) =>
  (Date.now() - new Date(r.updatedAt).getTime()) / 3600000;
const rateNote = (r: RateSnap) => `Tasa ${r.name} al ${fmtDay(r.updatedAt)}`;
const useRate = () => useContext(RateContext);

// Referencia en bolívares: "Bs. 4.532,00 · Tasa BCV al 06/10/2026"
export function BsRef({
  usd,
  className = "",
}: {
  usd: number;
  className?: string;
}) {
  const rate = useRate();
  if (!rate) return null;
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      <span className="font-semibold text-gray-700">
        {fmtBs(usd * rate.value)}
      </span>{" "}
      · {rateNote(rate)}
    </p>
  );
}

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
const statusLabel: Record<OrderStatus, string> = {
  pendiente: "Pendiente de pago",
  procesando: "Pagada · procesando",
  despachado: "Despachado",
  completado: "Completado",
  cancelado: "Cancelado",
};
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMG_MAX_MB = 2;
const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eef0f5"/><path d="M30 66l14-18 10 12 8-9 12 15z" fill="#c5cad8"/><circle cx="38" cy="36" r="6" fill="#c5cad8"/></svg>',
  );
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const t = e.currentTarget;
  if (t.src !== FALLBACK_IMG) t.src = FALLBACK_IMG;
};
const escapeHtml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

// ─── PERIOD HELPERS (informes y dashboard) ────────────────────────────────────
const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const periodKey = (date: string, p: Period) =>
  p === "diario" ? date : p === "mensual" ? date.slice(0, 7) : date.slice(0, 4);
const currentPeriodKey = (p: Period) => periodKey(toISODate(new Date()), p);
const periodName: Record<Period, string> = {
  diario: "Hoy",
  mensual: "Este mes",
  anual: "Este año",
};
// Últimos N buckets de la granularidad elegida: 7 días / 6 meses / 5 años
function trendBuckets(p: Period): { key: string; label: string }[] {
  const now = new Date();
  if (p === "diario")
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { key: toISODate(d), label: `${d.getDate()}/${d.getMonth() + 1}` };
    });
  if (p === "mensual")
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: toISODate(d).slice(0, 7), label: MONTHS[d.getMonth()] };
    });
  return Array.from({ length: 5 }, (_, i) => {
    const y = String(now.getFullYear() - (4 - i));
    return { key: y, label: y };
  });
}
const salesTrend = (orders: Order[], p: Period) => {
  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  return trendBuckets(p).map((b) => {
    const inB = paid.filter((o) => periodKey(o.date, p) === b.key);
    return {
      label: b.label,
      ventas: inB.reduce((a, o) => a + o.total, 0),
      ordenes: inB.length,
    };
  });
};

let logoCache = "";
async function getLogoBase64() {
  if (logoCache) return logoCache;
  try {
    const blob = await (await fetch(logoImg)).blob();
    logoCache = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch (_) {}
  return logoCache;
}

const docStyles = `*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4;margin:12mm}
body{font-family:Arial,sans-serif;color:#0a0a1a;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@media print{.header,.sh,th,.kpi{ -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }}
.header{display:flex;background-color:#000080;background-image:linear-gradient(135deg,#000080 40%,#C8102E 100%);padding:18px 28px;align-items:center;gap:18px;border-radius:8px}
.header img{width:64px;height:64px;object-fit:contain}
.company{font-size:24px;font-weight:900;color:#fff}.tagline{font-size:11px;color:rgba(255,255,255,.75);letter-spacing:2px;text-transform:uppercase;margin-top:3px}
.body{padding:18px 4px}.title{font-size:18px;font-weight:bold;color:#000080;border-left:4px solid #C8102E;padding-left:10px;margin-bottom:4px}
.meta{color:#666;font-size:12px;margin-bottom:14px;padding-left:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:12px;margin-bottom:16px}.grid b{display:block;color:#888;font-size:10px;text-transform:uppercase;font-weight:normal}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.kpi{border-radius:8px;padding:12px 8px;text-align:center;color:#fff}
.k0{background-color:#000080;background:#000080}.k1{background-color:#1560BD;background:#1560BD}.k2{background-color:#C8102E;background:#C8102E}.k3{background-color:#800000;background:#800000}.kv{font-size:20px;font-weight:bold}.kl{font-size:9px;opacity:.85;margin-top:4px;text-transform:uppercase}
.chart{background:#f8f9ff;border:1px solid #dde2f0;border-radius:8px;padding:12px;margin-bottom:16px}
.sh{background-color:#000080;background:#000080;color:#fff;font-size:11px;font-weight:bold;padding:7px 10px;border-radius:5px 5px 0 0;text-transform:uppercase;letter-spacing:1px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}th{background-color:#000080;background:#000080;color:#fff;padding:7px 10px;text-align:left}
td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f0f4ff}.r{text-align:right}.c{text-align:center}
.tot td{background:#fff!important;border:none;padding:4px 10px}.grand td{font-size:14px;font-weight:bold;color:#C8102E;border-top:2px solid #000080}
.footer{margin-top:10px;padding-top:8px;border-top:2px solid #000080;display:flex;justify-content:space-between;font-size:10px;color:#999}`;

const docHeader = (logo: string) =>
  `<div class="header">${logo ? `<img src="${logo}" alt="Logo"/>` : ""}<div><div class="company">Music&amp;Sport DSS, C.A.</div><div class="tagline">Gestión de inventario y ventas</div></div></div>`;

async function printReceipt(order: Order) {
  const logo = await getLogoBase64();
  // Moneda principal: USD salvo que el pago se haya hecho en bolívares
  const inBs = order.currency === "VES" && !!order.rate;
  const r = order.rate;
  const m = (usd: number) => (inBs && r ? fmtBs(usd * r.value) : fmt(usd));
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.product.name)}</td><td>${escapeHtml(i.product.sku)}</td><td class="c">${i.qty}</td><td class="r">${m(i.product.price)}</td><td class="r">${m(i.product.price * i.qty)}</td></tr>`,
    )
    .join("");
  const footNote = !r
    ? ""
    : inBs
      ? `Pagado en bolívares a ${r.value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Bs/USD (${rateNote(r)}). Equivalente en dólares: <strong>${fmt(order.total)}</strong>.`
      : `Equivalente referencial en bolívares: <strong>${fmtBs(order.total * r.value)}</strong> (${rateNote(r)}). La transacción se realizó en dólares.`;
  const b = order.billing;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo ${order.receiptNo ?? order.id}</title><style>${docStyles}</style></head><body>
  ${docHeader(logo)}<div class="body">
  <div class="title">Recibo de pago ${order.receiptNo ?? ""}</div>
  <div class="meta">Orden <strong>${order.id}</strong> · Emitida ${order.date}${order.paidAt ? ` · Pago aprobado ${order.paidAt}` : ""} · Estado: <strong>${statusLabel[order.status]}</strong></div>
  <div class="grid">
    <div><b>Facturar a</b>${escapeHtml(b.name)}</div><div><b>Cédula / RIF</b>${escapeHtml(b.docId)}</div>
    <div><b>Correo</b>${escapeHtml(b.email)}</div><div><b>Teléfono</b>${escapeHtml(b.phone)}</div>
    <div><b>Dirección</b>${escapeHtml(b.address)}</div><div><b>Método de pago</b>${escapeHtml(b.method)}${b.reference ? ` · Ref. ${escapeHtml(b.reference)}` : ""}</div>
  </div>
  <div class="sh">Detalle</div>
  <table><thead><tr><th>Producto</th><th>SKU</th><th class="c">Cant.</th><th class="r">P. unit.</th><th class="r">Importe</th></tr></thead><tbody>${rows}
  <tr class="tot"><td colspan="4" class="r">Subtotal</td><td class="r">${m(order.subtotal)}</td></tr>
  <tr class="tot"><td colspan="4" class="r">${taxLabel(order.taxType)}</td><td class="r">${m(order.tax)}</td></tr>
  <tr class="tot grand"><td colspan="4" class="r">TOTAL ${inBs ? "Bs." : "USD"}</td><td class="r">${m(order.total)}</td></tr></tbody></table>
  ${footNote ? `<p style="font-size:10px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-bottom:12px">${footNote}</p>` : ""}
  <p style="text-align:center;font-size:11px;color:#666">¡Gracias por su compra en Music&amp;Sport DSS, C.A.!</p>
  <div class="footer"><span>Music&amp;Sport DSS, C.A.</span><span>Generado el ${new Date().toLocaleString("es-VE")}</span></div>
  </div></body></html>`;
  printDocument(html);
}

const statusColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  procesando: "bg-blue-100 text-blue-800",
  despachado: "bg-indigo-100 text-indigo-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};
const statusIcon: Record<string, JSX.Element> = {
  pendiente: <Clock size={12} />,
  procesando: <RefreshCw size={12} />,
  despachado: <Truck size={12} />,
  completado: <CheckCircle size={12} />,
  cancelado: <XCircle size={12} />,
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["procesando", "cancelado"],
  procesando: ["despachado", "cancelado"],
  despachado: ["completado"],
  completado: [],
  cancelado: [],
};

// ─── INPUT (con botón para mostrar/ocultar contraseña) ───────────────────────

// ─── LOGO ─────────────────────────────────────────────────────────────────────

// ─── NOTIFICATION BELL ────────────────────────────────────────────────────────
function NotificationBell({
  products,
  pendingOrders = 0,
  rateAlert = "",
}: {
  products: Product[];
  pendingOrders?: number;
  rateAlert?: string;
}) {
  const [open, setOpen] = useState(false);
  const lowStock = products.filter((p) => p.stock <= p.minStock && p.active);
  const count =
    lowStock.length + (pendingOrders > 0 ? 1 : 0) + (rateAlert ? 1 : 0);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-[#C8102E] rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-[#000080] text-white flex items-center justify-between">
            <span
              className="font-semibold text-sm"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Alertas
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>
          {rateAlert && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-amber-50">
              <Coins size={16} className="text-amber-600 shrink-0" />
              <p className="text-sm text-gray-700">{rateAlert}</p>
            </div>
          )}
          {pendingOrders > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-blue-50/60">
              <ShoppingBag size={16} className="text-[#1560BD]" />
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{pendingOrders}</span> orden(es)
                esperando aprobación de pago
              </p>
            </div>
          )}
          {lowStock.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Sin alertas de stock
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50"
                >
                  <AlertTriangle
                    size={16}
                    className={
                      p.stock === 0 ? "text-red-600" : "text-amber-500"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p
                      className={`text-xs ${p.stock === 0 ? "text-red-500" : "text-amber-600"}`}
                    >
                      {p.stock === 0
                        ? "AGOTADO"
                        : `Stock: ${p.stock} (mín: ${p.minStock})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN/VENDOR SIDEBAR ─────────────────────────────────────────────────────
function Sidebar({
  role,
  view,
  setView,
  onLogout,
  mobileOpen,
  setMobileOpen,
}: {
  role: Role;
  view: View;
  setView: (v: View) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const adminLinks = [
    {
      icon: <Home size={18} />,
      label: "Dashboard",
      view: "admin-dashboard" as View,
    },
    {
      icon: <Package size={18} />,
      label: "Productos",
      view: "admin-products" as View,
    },
    {
      icon: <Layers size={18} />,
      label: "Inventario",
      view: "admin-inventory" as View,
    },
    {
      icon: <Users size={18} />,
      label: "Usuarios internos",
      view: "admin-users" as View,
    },
    {
      icon: <User size={18} />,
      label: "Clientes",
      view: "admin-clients" as View,
    },
    {
      icon: <ShoppingBag size={18} />,
      label: "Órdenes",
      view: "admin-orders" as View,
    },
    {
      icon: <BarChart2 size={18} />,
      label: "Informes",
      view: "admin-reports" as View,
    },
    {
      icon: <Coins size={18} />,
      label: "Tasas de cambio",
      view: "admin-rates" as View,
    },
  ];
  const vendorLinks = [
    {
      icon: <Home size={18} />,
      label: "Panel",
      view: "vendor-dashboard" as View,
    },
    {
      icon: <ShoppingBag size={18} />,
      label: "Órdenes",
      view: "vendor-orders" as View,
    },
    {
      icon: <Layers size={18} />,
      label: "Inventario",
      view: "admin-inventory" as View,
    },
  ];
  const links = role === "admin" ? adminLinks : vendorLinks;
  const handleNav = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };
  const toggleSidebar = () => {
    if (mobileOpen) {
      setMobileOpen(false);
      return;
    }
    setCollapsed((c) => !c);
  };

  const asideContent = (
    <aside
      className="relative z-30 flex flex-col h-full min-h-0 transition-all duration-300"
      style={{
        width: mobileOpen ? 240 : collapsed ? 64 : 240,
        background: "linear-gradient(180deg,#000080 0%,#000060 100%)",
      }}
    >
      <div className="flex items-center justify-between px-3 py-5 border-b border-white/10">
        {collapsed ? (
          <img
            src={logoImg}
            alt="M&S DSS"
            className="w-9 h-9 object-contain mx-auto"
          />
        ) : (
          <Logo size={34} white />
        )}
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label={mobileOpen ? "Cerrar menú" : "Colapsar menú"}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white ml-2 shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label={mobileOpen ? "Cerrar menú" : "Expandir menú"}
            className="absolute -right-3 top-6 z-40 p-1 rounded-full bg-[#1560BD] border border-white/30 text-white shadow-md hover:bg-[#C8102E] transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="px-4 py-3">
          <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
            {role === "admin" ? "Administración" : "Ventas"}
          </span>
        </div>
      )}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
        {links.map((l) => (
          <button
            key={l.view}
            onClick={() => handleNav(l.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${
                view === l.view
                  ? "bg-[#C8102E] text-white shadow-lg shadow-red-900/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
          >
            <span className="shrink-0">{l.icon}</span>
            {(!collapsed || mobileOpen) && (
              <span
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: "0.95rem",
                  letterSpacing: "0.02em",
                }}
              >
                {l.label}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm transition-all"
        >
          <LogOut size={18} />
          {(!collapsed || mobileOpen) && (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
              Cerrar Sesión
            </span>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden pt-[var(--safe-top)] pb-[env(safe-area-inset-bottom)] bg-[#000080] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {asideContent}
      </div>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full relative z-40 shrink-0">
        {asideContent}
      </div>
    </>
  );
}

// ─── ADMIN TOPBAR ─────────────────────────────────────────────────────────────
function AdminTopBar({
  user,
  products,
  pendingOrders,
  view,
  onToggleSidebar,
  rateAlert,
}: {
  user: InternalUser;
  products: Product[];
  pendingOrders: number;
  view: View;
  onToggleSidebar: () => void;
  rateAlert: string;
}) {
  const rate = useRate();
  const titles: Partial<Record<View, string>> = {
    "admin-dashboard": "Dashboard",
    "admin-products": "Gestión de productos",
    "admin-inventory": "Control de inventario",
    "admin-users": "Usuarios internos",
    "admin-clients": "Gestión de clientes",
    "admin-orders": "Órdenes",
    "admin-reports": "Informes",
    "vendor-dashboard": "Panel de vendedor",
    "vendor-orders": "Gestión de órdenes",
    "vendor-payment": "Procesar pago",
    "admin-rates": "Tasas de cambio",
  };
  return (
    <header className="relative z-30 shrink-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1
          className="font-bold text-[#000080]"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "1.4rem",
            letterSpacing: "0.02em",
          }}
        >
          {titles[view] ?? "Panel"}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <NotificationBell
            products={products}
            pendingOrders={pendingOrders}
            rateAlert={rateAlert}
          />
        </div>
        <div
          className={`hidden lg:flex flex-col items-end px-3 border-l border-gray-200 ${rateAlert ? "text-amber-700" : "text-gray-600"}`}
          title="Tasa activa"
        >
          {rate ? (
            <>
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: "'DM Mono',monospace" }}
              >
                {rate.name}:{" "}
                {rate.value.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                Bs/$
              </span>
              <span className="text-[10px] text-gray-400">
                Act. {fmtDateTime(rate.updatedAt)}
              </span>
            </>
          ) : (
            <span className="text-xs text-amber-700">Sin tasa activa</span>
          )}
        </div>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#000080] flex items-center justify-center text-white font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{user.name}</p>
            <p className="text-[10px] text-gray-400 capitalize">
              {user.role === "admin" ? "Administrador" : "Vendedor"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

// ─── ADMIN DASHBOARD VIEW ─────────────────────────────────────────────────────

// ─── VENDOR ORDERS VIEW ───────────────────────────────────────────────────────

export default function App() {
  // Tabla TASA_CAMBIO (en memoria); la tasa activa se comparte por contexto
  const [rates, setRates] = useState<ExchangeRate[]>(rateService.list());
  return (
    <RateContext.Provider value={rates.find((r) => r.active) ?? null}>
      <AuthProvider>
        <AppMain rates={rates} setRates={setRates} />
      </AuthProvider>
    </RateContext.Provider>
  );
}

function AppMain({
  rates,
  setRates,
}: {
  rates: ExchangeRate[];
  setRates: (r: ExchangeRate[]) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setViewRaw] = useState<View>(
    () => viewForPath(location.pathname) ?? "login",
  );
  const {
    role,
    setRole,
    currentUser,
    setCurrentUser,
    currentClientId,
    setCurrentClientId,
    notice,
    setNotice,
  } = useAuth();
  const [products, setProducts] = useState<Product[]>(productService.list());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedCarts, setSavedCarts] = useState<Record<string, CartItem[]>>({});
  const [orders, setOrders] = useState<Order[]>(orderService.list());
  const [clients, setClients] = useState<Client[]>(clientService.list());
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>(initUsers);
  const activeRate = rates.find((r) => r.active) ?? null;
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const rateAlert =
    role !== "admin"
      ? ""
      : !activeRate
        ? "No hay una tasa de cambio activa: los precios en bolívares no se mostrarán."
        : clock - new Date(activeRate.updatedAt).getTime() >
            RATE_STALE_HOURS * 3600000
          ? `La tasa ${activeRate.name} lleva más de ${RATE_STALE_HOURS} h sin actualizarse (última: ${fmtDateTime(activeRate.updatedAt)}).`
          : "";
  const [lockouts, setLockouts] = useState<Record<string, Lockout>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // En móvil las alertas van abajo para no chocar con el notch / isla dinámica
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const currentClient = clients.find((c) => c.id === currentClientId) ?? null;
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? null;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const pendingOrders = orders.filter((o) => o.status === "pendiente").length;

  // Guardia de roles: cualquier vista no permitida redirige al inicio del rol
  const canSee = (v: View, r: Role | null) => canAccessView(v, r);
  const goTo = (nextView: View) => {
    setViewRaw(nextView);
    const nextPath = pathForView(nextView);
    if (location.pathname !== nextPath) navigate(nextPath);
  };
  const setView = (v: View) => {
    if (!canSee(v, role)) {
      if (!role && ROLE_VIEWS.client.includes(v))
        notify.info("Inicia sesión para continuar");
      else if (role)
        notify.error("No tienes permisos para acceder a esa sección");
      goTo(homeFor(role));
    } else goTo(v);
    window.scrollTo?.(0, 0);
  };
  useEffect(() => {
    const routedView = viewForPath(location.pathname);
    if (routedView && routedView !== view) setViewRaw(routedView);
  }, [location.pathname]);
  useEffect(() => {
    if (canSee(view, role)) return;
    const nextView = homeFor(role);
    if (view !== nextView) goTo(nextView);
  }, [view, role]);
  useEffect(() => {
    // usuario suspendido o eliminado mientras tenía sesión
    if (
      currentUser &&
      !internalUsers.some(
        (u) => u.id === currentUser.id && u.status === "activo",
      )
    )
      logout("Tu cuenta fue suspendida o eliminada.");
  }, [internalUsers]);

  // Alertas automáticas de stock bajo (CU-03)
  const prevProducts = useRef(products);
  useEffect(() => {
    if (role === "admin" || role === "vendor") {
      products.forEach((p) => {
        const before = prevProducts.current.find((x) => x.id === p.id);
        if (before && before.stock > p.minStock && p.stock <= p.minStock) {
          notify.warning(
            p.stock === 0 ? `Agotado: ${p.name}` : `Stock bajo: ${p.name}`,
            { description: `Quedan ${p.stock} (mínimo ${p.minStock})` },
          );
        }
      });
    }
    prevProducts.current = products;
  }, [products]);

  // Cierre de sesión por inactividad
  const logoutRef = useRef<(msg?: string) => void>(() => {});
  useEffect(() => {
    if (!role) return;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(
        () =>
          logoutRef.current(
            "Tu sesión expiró por inactividad. Vuelve a iniciar sesión.",
          ),
        IDLE_MINUTES * 60000,
      );
    };
    const evs = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [role]);

  function logout(msg = "") {
    if (currentClientId)
      setSavedCarts((s) => ({ ...s, [currentClientId]: cart }));
    setRole(null);
    setCurrentUser(null);
    setCurrentClientId(null);
    setCart([]);
    setSelectedOrderId(null);
    setSelectedProductId(null);
    setLastOrderId(null);
    setSidebarOpen(false);
    setNotice(msg);
    goTo("login");
  }
  logoutRef.current = logout;

  const findAccount = (email: string): Account | null =>
    authService.findAccount(email, internalUsers, clients);
  const onLogin = (acc: Account) => {
    setNotice("");
    if (acc.kind === "staff") {
      setRole(acc.user.role);
      setCurrentUser(acc.user);
      setCurrentClientId(null);
      setCart([]);
      goTo(homeFor(acc.user.role));
      const low = products.filter(
        (p) => p.active && p.stock <= p.minStock,
      ).length;
      if (low) notify.warning(`${low} producto(s) con stock bajo o agotado`);
      if (pendingOrders)
        notify.info(`${pendingOrders} orden(es) pendientes de verificación`);
      if (acc.user.role === "admin") {
        if (!activeRate)
          notify.warning("No hay una tasa de cambio activa", {
            description: "Regístrala en Tasas de cambio.",
          });
        else if (rateAgeHours(activeRate) > RATE_STALE_HOURS)
          notify.warning(
            `La tasa ${activeRate.name} lleva más de 24 h sin actualizarse`,
          );
      }
    } else {
      // Conserva lo agregado como invitado y lo une al carrito guardado del cliente
      const merged = [...(savedCarts[acc.user.id] ?? [])];
      cart.forEach((i) => {
        const ex = merged.find((m) => m.product.id === i.product.id);
        if (ex) ex.qty += i.qty;
        else merged.push(i);
      });
      setCart(
        merged
          .map((i) => ({
            ...i,
            qty: Math.min(
              i.qty,
              products.find((p) => p.id === i.product.id)?.stock ?? 0,
            ),
          }))
          .filter((i) => i.qty > 0),
      );
      setRole("client");
      setCurrentUser(null);
      setCurrentClientId(acc.user.id);
      goTo(cart.length ? "cart" : "catalog");
      notify.success(`Bienvenido(a), ${acc.user.name.split(" ")[0]}`);
    }
  };
  const resetPassword = (acc: Account, password: string) => {
    if (acc.kind === "staff")
      setInternalUsers((us) =>
        us.map((u) => (u.id === acc.user.id ? { ...u, password } : u)),
      );
    else
      setClients((cs) =>
        cs.map((c) => (c.id === acc.user.id ? { ...c, password } : c)),
      );
  };
  const emailTaken = (email: string) => !!findAccount(email);

  const addToCart: AddToCart = (productId, qty) => {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.active || p.stock === 0) {
      notify.error("Producto no disponible");
      return false;
    }
    const have = cart.find((i) => i.product.id === productId)?.qty ?? 0;
    if (have + qty > p.stock) {
      notify.error(`Solo hay ${p.stock} unidad(es) disponibles`, {
        description: have ? `Ya tienes ${have} en el carrito.` : undefined,
      });
      return false;
    }
    setCart(
      have
        ? cart.map((i) =>
            i.product.id === productId ? { product: p, qty: have + qty } : i,
          )
        : [...cart, { product: p, qty }],
    );
    notify.success(`${p.name} agregado al carrito`, { duration: 1800 });
    return true;
  };

  const placeOrder = (billing: Billing): Order | null => {
    if (!currentClient) return null;
    const lines = cart.map((i) => ({
      product: products.find((p) => p.id === i.product.id),
      qty: i.qty,
    }));
    const conflict = lines.find(
      (l) => !l.product || !l.product.active || l.qty > l.product.stock,
    );
    if (conflict) {
      notify.error("El stock cambió mientras comprabas", {
        description: `${conflict.product?.name ?? "Un producto"} ya no tiene la cantidad solicitada. Revisa tu carrito.`,
      });
      goTo("cart");
      return null;
    }
    const items = lines.map((l) => ({ product: l.product!, qty: l.qty }));
    const num =
      Math.max(
        1000,
        ...orders.map((o) => Number(o.id.replace(/\D/g, "")) || 0),
      ) + 1;
    const order: Order = {
      id: `ORD-${num}`,
      clientId: currentClient.id,
      clientName: billing.name,
      clientEmail: billing.email,
      items,
      ...calcTotals(
        items,
        BS_METHODS.includes(billing.method) ? "IVA" : "IGTF",
      ),
      status: "pendiente",
      date: toISODate(new Date()),
      address: billing.address,
      phone: billing.phone,
      billing,
      currency: BS_METHODS.includes(billing.method) ? "VES" : "USD",
      rate: activeRate
        ? {
            name: activeRate.name,
            value: activeRate.value,
            updatedAt: activeRate.updatedAt,
          }
        : undefined,
    };
    if (order.currency === "VES" && !order.rate) {
      notify.error("No hay tasa de cambio activa para pagos en bolívares");
      return null;
    }
    setProducts((ps) =>
      ps.map((p) => {
        const l = items.find((i) => i.product.id === p.id);
        return l ? { ...p, stock: p.stock - l.qty } : p;
      }),
    );
    setOrders((os) => [order, ...os]);
    setCart([]);
    setLastOrderId(order.id);
    notify.success(`Orden ${order.id} emitida`);
    return order;
  };

  const changeStatus: ChangeStatus = (id, status, extra = {}) => {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status === status) return;
    if (status === "cancelado" && o.status !== "cancelado") {
      setProducts((ps) =>
        ps.map((p) => {
          const l = o.items.find((i) => i.product.id === p.id);
          return l ? { ...p, stock: p.stock + l.qty } : p;
        }),
      );
    }
    const patch: Partial<Order> = { ...extra, status };
    if (status === "procesando" && !o.receiptNo) {
      patch.receiptNo = patch.receiptNo ?? `REC-${o.id.replace(/\D/g, "")}`;
      patch.paidAt = patch.paidAt ?? toISODate(new Date());
    }
    setOrders((os) => os.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const isInternal = role === "admin" || role === "vendor";

  // ─ AUTH VIEWS ────────────────────────────────────────────────────────────────
  const toaster = (
    <Toaster
      richColors
      closeButton
      position={isMobile ? "bottom-center" : "top-right"}
      offset={{
        top: "calc(16px + var(--safe-top))",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
      }}
      mobileOffset={{
        top: "calc(12px + var(--safe-top))",
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        left: "12px",
        right: "12px",
      }}
    />
  );
  if (view === "login")
    return (
      <Suspense
        fallback={
          <div className="p-8 text-center">Cargando autenticación…</div>
        }
      >
        <AuthArea>
          {toaster}
          <LoginView
            setView={setView}
            findAccount={findAccount}
            onLogin={onLogin}
            lockouts={lockouts}
            setLockouts={setLockouts}
            resetPassword={resetPassword}
            notice={notice}
          />
        </AuthArea>
      </Suspense>
    );
  if (view === "register")
    return (
      <Suspense
        fallback={
          <div className="p-8 text-center">Cargando autenticación…</div>
        }
      >
        <AuthArea>
          {toaster}
          <RegisterView
            setView={setView}
            emailTaken={emailTaken}
            onRegister={(c) => {
              setClients((cs) => [...cs, c]);
              onLogin({ kind: "client", user: c });
            }}
          />
        </AuthArea>
      </Suspense>
    );

  // ─ INTERNAL PANEL ────────────────────────────────────────────────────────────
  if (isInternal && currentUser) {
    return (
      <AdminArea>
        {toaster}
        <Sidebar
          role={currentUser.role}
          view={view}
          setView={setView}
          onLogout={() => logout()}
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopBar
            user={currentUser}
            products={products}
            pendingOrders={pendingOrders}
            rateAlert={rateAlert}
            view={view}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />
          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            <Suspense fallback={<PageLoading />}>
              {view === "admin-dashboard" && (
                <AdminDashboardPage
                  products={products}
                  orders={orders}
                  rateAlert={rateAlert}
                  setView={setView}
                />
              )}
              {view === "admin-rates" && (
                <AdminRatesPage
                  rates={rates}
                  setRates={setRates}
                  users={internalUsers}
                  currentUserId={currentUser.id}
                />
              )}
              {view === "admin-products" && (
                <AdminProductsPage
                  products={products}
                  setProducts={setProducts}
                  orders={orders}
                />
              )}
              {view === "admin-inventory" && (
                <AdminInventoryPage
                  products={products}
                  setProducts={setProducts}
                  canEdit={role === "admin"}
                />
              )}
              {view === "admin-users" && (
                <AdminUsersPage
                  currentUserId={currentUser.id}
                  users={internalUsers}
                  setUsers={setInternalUsers}
                  setCurrentUser={setCurrentUser}
                  clientEmails={clients.map((c) => c.email.toLowerCase())}
                />
              )}
              {view === "admin-clients" && (
                <AdminClientsPage
                  clients={clients}
                  setClients={setClients}
                  orders={orders}
                />
              )}
              {view === "admin-orders" && (
                <AdminOrdersPage orders={orders} changeStatus={changeStatus} />
              )}
              {view === "admin-reports" && (
                <AdminReportsPage orders={orders} products={products} />
              )}
              <VendorArea>
                {view === "vendor-dashboard" && (
                  <VendorDashboard
                    orders={orders}
                    products={products}
                    setView={setView}
                  />
                )}
                {view === "vendor-orders" && (
                  <VendorOrders
                    orders={orders}
                    changeStatus={changeStatus}
                    setView={setView}
                    setSelectedOrderId={setSelectedOrderId}
                  />
                )}
                {view === "vendor-payment" &&
                  (selectedOrder ? (
                    <VendorPayment
                      order={selectedOrder}
                      changeStatus={changeStatus}
                      setView={setView}
                    />
                  ) : (
                    <VendorOrders
                      orders={orders}
                      changeStatus={changeStatus}
                      setView={setView}
                      setSelectedOrderId={setSelectedOrderId}
                    />
                  ))}
              </VendorArea>
            </Suspense>
          </main>
        </div>
      </AdminArea>
    );
  }

  // ─ CLIENT PORTAL ─────────────────────────────────────────────────────────────
  const catalog = (
    <Catalog
      products={products}
      cart={cart}
      addToCart={addToCart}
      setView={setView}
      setSelectedProductId={setSelectedProductId}
    />
  );
  return (
    <ClientArea>
      {toaster}
      <ClientNav
        cart={cart}
        setView={setView}
        currentUser={currentClient}
        onLogout={() => logout()}
      />
      <Suspense fallback={<PageLoading />}>
        {view === "catalog" && (
          <>
            <main>{catalog}</main>
            <CatalogFooter setView={setView} />
          </>
        )}
        {view === "product-detail" &&
          (selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              cart={cart}
              addToCart={addToCart}
              setView={setView}
            />
          ) : (
            catalog
          ))}
        {view === "cart" && (
          <CartView
            cart={cart}
            setCart={setCart}
            products={products}
            setView={setView}
            currentUser={currentClient}
          />
        )}
        {view === "checkout" && currentClient && (
          <Checkout
            cart={cart}
            products={products}
            placeOrder={placeOrder}
            currentUser={currentClient}
            setView={setView}
          />
        )}
        {view === "order-confirm" && (
          <OrderConfirm
            order={orders.find((o) => o.id === lastOrderId) ?? null}
            setView={setView}
          />
        )}
        {view === "client-profile" && currentClient && (
          <ClientProfile
            client={currentClient}
            clients={clients}
            takenEmails={internalUsers.map((u) => u.email.toLowerCase())}
            orders={orders}
            onSave={(c) =>
              setClients((cs) => cs.map((x) => (x.id === c.id ? c : x)))
            }
            onDelete={() => {
              const id = currentClient.id;
              setSavedCarts((s) => {
                const n = { ...s };
                delete n[id];
                return n;
              });
              setCart([]);
              setClients((cs) => cs.filter((x) => x.id !== id));
              setCurrentClientId(null);
              logout("Tu cuenta fue eliminada.");
            }}
          />
        )}
        {view === "client-orders" && currentClient && (
          <ClientOrders
            orders={orders}
            clientId={currentClient.id}
            changeStatus={changeStatus}
          />
        )}
      </Suspense>
    </ClientArea>
  );
}
