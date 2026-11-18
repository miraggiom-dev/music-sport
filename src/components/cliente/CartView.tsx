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
import { safeImageSource } from "./productValidation";
export function CartView({
  cart,
  setCart,
  products,
  setView,
  currentUser,
}: {
  cart: CartItem[];
  setCart: (c: CartItem[]) => void;
  products: Product[];
  setView: (v: View) => void;
  currentUser: Client | null;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const live = (id: string) => products.find((p) => p.id === id);
  const lines = cart.map((i) => ({
    ...i,
    product: live(i.product.id) ?? i.product,
  }));
  const usd = calcTotals(lines, "IGTF");
  const bs = calcTotals(lines, "IVA");
  const { subtotal } = usd;
  const problems = lines.filter(
    (i) => !i.product.active || i.qty > i.product.stock,
  );

  const updateQty = (id: string, qty: number) => {
    const p = live(id);
    if (qty <= 0) {
      setCart(cart.filter((i) => i.product.id !== id));
      return;
    }
    if (p && qty > p.stock) {
      notify.error(`Solo hay ${p.stock} unidad(es) disponibles de "${p.name}"`);
      return;
    }
    setCart(cart.map((i) => (i.product.id === id ? { ...i, qty } : i)));
  };
  const fixProblems = () => {
    setCart(
      lines
        .filter((i) => i.product.active && i.product.stock > 0)
        .map((i) => ({
          product: i.product,
          qty: Math.min(i.qty, i.product.stock),
        })),
    );
    notify.success("Carrito ajustado al stock disponible");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <h1
        className="text-3xl font-black text-[#000080] mb-6"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        Carrito de compras{" "}
        <span className="text-gray-400 font-normal text-xl">
          ({cart.reduce((a, i) => a + i.qty, 0)} artículos)
        </span>
      </h1>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ShoppingCart size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-600 font-semibold text-lg">
            Tu carrito está vacío
          </p>
          <p className="text-gray-400 text-sm mt-1">Subtotal: {fmt(0)}</p>
          <button
            onClick={() => setView("catalog")}
            className="mt-5 px-6 py-3 bg-[#C8102E] text-white rounded-xl font-semibold hover:bg-[#a80d25] transition-colors inline-flex items-center gap-2"
          >
            Explorar catálogo
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {problems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={15} />
                  Algunos artículos ya no tienen stock suficiente.
                </span>
                <button
                  onClick={fixProblems}
                  className="text-xs font-semibold underline"
                >
                  Ajustar carrito
                </button>
              </div>
            )}
            {lines.map((item) => {
              const over =
                !item.product.active || item.qty > item.product.stock;
              return (
                <div
                  key={item.product.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 ${over ? "border-amber-300" : "border-gray-100"}`}
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={safeImageSource(item.product.image, FALLBACK_IMG)}
                      onError={onImgError}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.product.subcategory} · {item.product.stock}{" "}
                        disponibles
                      </p>
                      <p className="font-bold text-[#000080] mt-1">
                        {fmt(item.product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => updateQty(item.product.id, 0)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        aria-label="Disminuir"
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        className="w-8 text-center font-semibold text-sm"
                        style={{ fontFamily: "'DM Mono',monospace" }}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.qty >= item.product.stock ? "border-gray-100 text-gray-300" : "border-gray-200 hover:bg-gray-50"}`}
                        aria-label="Aumentar"
                      >
                        <Plus size={12} />
                      </button>
                      {item.qty >= item.product.stock && !over && (
                        <span className="text-[11px] text-amber-600 ml-1">
                          Máx. {item.product.stock}
                        </span>
                      )}
                      {over && (
                        <span className="text-[11px] text-red-600 ml-1">
                          {item.product.stock === 0 || !item.product.active
                            ? "Agotado"
                            : `Solo ${item.product.stock} disp.`}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800">
                      {fmt(item.product.price * item.qty)}
                    </p>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} />
              Vaciar carrito
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit space-y-3 lg:sticky lg:top-24">
            <h3
              className="font-bold text-[#000080]"
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: "1.2rem",
              }}
            >
              Resumen
            </h3>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">
                  Pago en dólares{" "}
                  <span className="text-gray-400 text-xs">+ IGTF 3%</span>
                </span>
                <span className="font-bold text-[#C8102E]">
                  {fmt(usd.total)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">
                  Pago en bolívares{" "}
                  <span className="text-gray-400 text-xs">+ IVA 16%</span>
                </span>
                <span className="font-bold text-[#C8102E]">
                  {fmt(bs.total)}
                </span>
              </div>
              <BsRef usd={bs.total} className="text-right" />
              <p className="text-[11px] text-gray-400">
                El impuesto final depende del método de pago que elijas al
                emitir la orden.
              </p>
            </div>
            <button
              disabled={problems.length > 0}
              onClick={() =>
                currentUser ? setView("checkout") : setView("login")
              }
              className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentUser ? (
                <>
                  <ArrowRight size={16} />
                  Continuar con la orden
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Ingresar para comprar
                </>
              )}
            </button>
            <button
              onClick={() => setView("catalog")}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}
      {confirmClear && (
        <ConfirmDialog
          title="¿Vaciar el carrito?"
          message="Se eliminarán todos los artículos de tu carrito."
          confirmLabel="Vaciar"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setCart([]);
            setConfirmClear(false);
          }}
        />
      )}
    </div>
  );
}

const PAY_METHODS = [
  "Transferencia",
  "Pago móvil",
  "Zelle",
  "Binance",
  "Efectivo en tienda",
];
const COMPANY = { name: "Music&Sport DSS, C.A.", rif: "J-50123456-7" };
const PAY_DETAILS: Record<string, { label: string; value: string }[]> = {
  Transferencia: [
    { label: "Titular", value: COMPANY.name },
    { label: "RIF", value: COMPANY.rif },
    { label: "Banco", value: "BNC — Banco Nacional de Crédito" },
    { label: "Número de cuenta", value: "0191-0123-45-6789012345" },
  ],
  "Pago móvil": [
    { label: "RIF", value: COMPANY.rif },
    { label: "Teléfono", value: "0414-1234567" },
    { label: "Banco", value: "BNC — Banco Nacional de Crédito (0191)" },
  ],
  Zelle: [
    { label: "Titular", value: COMPANY.name },
    { label: "Correo Zelle", value: "pagos@musicsport.com" },
  ],
  Binance: [
    { label: "Titular", value: COMPANY.name },
    { label: "Correo Binance", value: "pagos@musicsport.com" },
    { label: "Monedas aceptadas", value: "USDT / USDC" },
  ],
  "Efectivo en tienda": [
    {
      label: "Indicación",
      value:
        "Paga en caja al retirar tu pedido presentando el número de orden.",
    },
  ],
};
function PayDetails({ method, total }: { method: string; total: number }) {
  const rate = useRate();

  const inBs = BS_METHODS.includes(method);
  const rows = PAY_DETAILS[method];
  if (!rows) return null;
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).then(
      () => notify.success("Copiado"),
      () => notify.error("No se pudo copiar"),
    );
  };
  return (
    <div className="rounded-xl border border-[#000080]/15 bg-[#000080]/[0.03] p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[#000080]">
        Datos para pagar con {method}
      </p>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-start justify-between gap-3 text-sm"
        >
          <span className="text-gray-500 shrink-0">{r.label}</span>
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-800 text-right break-all">
              {r.value}
            </span>
            {method !== "Efectivo en tienda" && (
              <button
                onClick={() => copy(r.value.replace(/ \(.*\)$/, ""))}
                className="text-[11px] text-[#1560BD] hover:underline shrink-0"
              >
                Copiar
              </button>
            )}
          </span>
        </div>
      ))}
      <div className="flex justify-between text-sm pt-2 border-t border-[#000080]/10">
        <span className="text-gray-500">Monto a pagar</span>
        <span className="text-right">
          {inBs && rate ? (
            <>
              <span className="block font-bold text-[#C8102E]">
                {fmtBs(total * rate.value)}
              </span>
              <span className="block text-[11px] text-gray-500">
                {fmt(total)} · {rateNote(rate)}
              </span>
            </>
          ) : (
            <span className="font-bold text-[#C8102E]">{fmt(total)}</span>
          )}
        </span>
      </div>
      {method !== "Efectivo en tienda" && (
        <p className="text-[11px] text-gray-500">
          Realiza el pago y luego ingresa el número de referencia abajo.
        </p>
      )}
    </div>
  );
}
