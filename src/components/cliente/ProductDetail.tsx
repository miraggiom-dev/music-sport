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
export function ProductDetail({
  product,
  cart,
  addToCart,
  setView,
}: {
  product: Product;
  cart: CartItem[];
  addToCart: AddToCart;
  setView: (v: View) => void;
}) {
  const [qty, setQty] = useState(1);
  const inCart = cart.find((i) => i.product.id === product.id)?.qty ?? 0;
  const maxAdd = Math.max(0, product.stock - inCart);
  const unavailable = !product.active || product.stock === 0;
  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, maxAdd || 1)));
  }, [maxAdd]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <button
        onClick={() => setView("catalog")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C8102E] mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Volver al catálogo
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          <img
            src={product.image || FALLBACK_IMG}
            onError={onImgError}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-4">
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${product.category === "Música" ? "text-[#C8102E]" : "text-[#1560BD]"}`}
            >
              {product.category} · {product.subcategory}
            </span>
            <h1
              className="text-3xl font-black text-[#000080] mt-1 leading-tight"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              SKU: {product.sku}
            </p>
          </div>
          <p
            className="text-4xl font-black text-[#C8102E]"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            {fmt(product.price)}
          </p>
          <BsRef usd={product.price} className="-mt-3" />
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span
              className={`px-3 py-1 rounded-full font-semibold text-xs ${unavailable ? "bg-red-50 text-red-700" : product.stock > product.minStock ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
            >
              {unavailable
                ? "Agotado"
                : product.stock > product.minStock
                  ? `${product.stock} disponibles`
                  : `¡Solo quedan ${product.stock}!`}
            </span>
            {inCart > 0 && (
              <span className="text-xs text-gray-500">
                {inCart} ya en tu carrito
              </span>
            )}
          </div>
          {!unavailable && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                Cantidad:
              </span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="px-3 py-2 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="Disminuir"
                >
                  <Minus size={14} />
                </button>
                <span
                  className="px-4 py-2 font-semibold text-sm"
                  style={{ fontFamily: "'DM Mono',monospace" }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(maxAdd, q + 1))}
                  disabled={qty >= maxAdd}
                  className="px-3 py-2 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="Aumentar"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-xs text-gray-400">máx. {maxAdd}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                if (addToCart(product.id, qty)) setQty(1);
              }}
              disabled={unavailable || maxAdd <= 0}
              className="flex-1 py-3.5 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {unavailable
                ? "Sin stock"
                : maxAdd <= 0
                  ? "Máximo disponible en carrito"
                  : "Agregar al carrito"}
            </button>
            <button
              onClick={() => setView("cart")}
              className="px-6 py-3.5 rounded-xl border-2 border-[#000080] text-[#000080] font-bold hover:bg-[#000080] hover:text-white transition-colors"
            >
              Ver carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                      src={item.product.image || FALLBACK_IMG}
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
export function Checkout({
  cart,
  products,
  placeOrder,
  currentUser,
  setView,
}: {
  cart: CartItem[];
  products: Product[];
  placeOrder: (b: Billing) => Order | null;
  currentUser: Client;
  setView: (v: View) => void;
}) {
  const rate = useRate();
  const [form, setForm] = useState<Billing>({
    name: currentUser.name,
    docId: currentUser.docId,
    email: currentUser.email,
    phone: currentUser.phone,
    address: currentUser.address,
    method: "",
    reference: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lines = cart.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.product.id) ?? i.product,
  }));
  const subtotal = calcTotals(lines, "IGTF").subtotal;
  const taxType: TaxType | null = form.method
    ? BS_METHODS.includes(form.method)
      ? "IVA"
      : "IGTF"
    : null;
  const totals = taxType === null ? null : calcTotals(lines, taxType);
  const tax = totals?.tax ?? 0;
  const total = totals?.total ?? 0;
  const needsRef = form.method !== "" && form.method !== "Efectivo en tienda";

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-500">No hay artículos para procesar.</p>
        <button
          onClick={() => setView("catalog")}
          className="mt-4 px-6 py-3 bg-[#C8102E] text-white rounded-xl font-semibold"
        >
          Ir al catálogo
        </button>
      </div>
    );
  }

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!isValidName(form.name)) e.name = "Nombre o razón social requerido";
    if (!isValidDocId(form.docId))
      e.docId = "Formato inválido (ej: V-12345678 o J-12345678-9)";
    if (!isValidEmail(form.email)) e.email = "Correo electrónico inválido";
    if (!isValidPhone(form.phone))
      e.phone = "Teléfono inválido (ej: 0414-1234567)";
    if (form.address.trim().length < 10)
      e.address = "Dirección de facturación completa (mín. 10 caracteres)";
    if (!form.method) e.method = "Selecciona un método de pago";
    else if (BS_METHODS.includes(form.method) && !rate)
      e.method =
        "Pagos en bolívares no disponibles: no hay tasa de cambio activa. Usa Zelle, Binance o efectivo.";
    if (needsRef && !/^[A-Za-z0-9-]{4,30}$/.test(form.reference.trim()))
      e.reference =
        "Número de referencia o confirmación requerido (4-30 caracteres)";
    setErrors(e);
    if (Object.keys(e).length) {
      notify.error("Completa los campos marcados en rojo");
      return;
    }
    const order = placeOrder({
      ...form,
      reference: needsRef ? form.reference.trim() : "",
    });
    if (order) setView("order-confirm");
  };

  const input = (
    key: keyof Billing,
    label: string,
    icon: JSX.Element,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
        {icon}
        {label}
      </label>
      <input
        value={form[key]}
        onChange={(ev) => {
          setForm((p) => ({ ...p, [key]: ev.target.value }));
          setErrors((er) => ({ ...er, [key]: "" }));
        }}
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors[key] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
      />
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <button
        onClick={() => setView("cart")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C8102E] mb-4"
      >
        <ChevronLeft size={16} />
        Volver al carrito
      </button>
      <h1
        className="text-3xl font-black text-[#000080] mb-6"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        Emitir orden de compra
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Datos de facturación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input("name", "Nombre / Razón social *", <User size={13} />)}
              {input("docId", "Cédula / RIF *", <FileText size={13} />, {
                placeholder: "V-12345678",
              })}
              {input("email", "Correo *", <Mail size={13} />, {
                type: "email",
              })}
              {input("phone", "Teléfono *", <Phone size={13} />, {
                type: "tel",
              })}
            </div>
            {input(
              "address",
              "Dirección de facturación y entrega *",
              <MapPin size={13} />,
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-800">Método de pago *</h3>
            <div className="grid grid-cols-2 gap-2">
              {PAY_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setForm((p) => ({ ...p, method: m }));
                    setErrors((er) => ({ ...er, method: "" }));
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${form.method === m ? "border-[#000080] bg-[#000080]/5 text-[#000080]" : errors.method ? "border-red-300" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {m}
                  <span className="block text-[10px] font-normal text-gray-400">
                    {BS_METHODS.includes(m)
                      ? rate
                        ? "Pago en bolívares"
                        : "No disponible (sin tasa)"
                      : "Pago en dólares"}
                  </span>
                </button>
              ))}
            </div>
            {errors.method && (
              <p className="text-red-500 text-xs">{errors.method}</p>
            )}
            {form.method && <PayDetails method={form.method} total={total} />}
            {needsRef &&
              input(
                "reference",
                "Número de referencia del pago *",
                <DollarSign size={13} />,
                {
                  inputMode:
                    form.method === "Zelle" || form.method === "Binance"
                      ? "text"
                      : "numeric",
                  placeholder:
                    form.method === "Zelle" || form.method === "Binance"
                      ? "Código de confirmación"
                      : "Ej. 00123456",
                },
              )}
            <p className="text-xs text-gray-400">
              Un vendedor verificará tu pago. La orden quedará en estado
              "pendiente de pago" hasta su aprobación.
            </p>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-bold text-gray-800">Resumen del pedido</h3>
          <div className="space-y-2">
            {lines.map((i) => (
              <div
                key={i.product.id}
                className="flex gap-3 py-2 border-b border-gray-50"
              >
                <img
                  src={i.product.image || FALLBACK_IMG}
                  onError={onImgError}
                  alt={i.product.name}
                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {i.product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Cant: {i.qty} · {fmt(i.product.price)} c/u
                  </p>
                </div>
                <span className="font-semibold text-sm shrink-0">
                  {fmt(i.product.price * i.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {form.method ? (
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {taxLabel(taxType ?? "IGTF")}
                  {taxType === "IGTF"
                    ? " · pago en divisas"
                    : " · pago en bolívares"}
                </span>
                <span>{fmt(tax)}</span>
              </div>
            ) : (
              <p className="text-xs text-amber-700">
                Selecciona el método de pago para calcular el impuesto (IVA 16%
                en Bs · IGTF 3% en USD).
              </p>
            )}
            <div className="flex justify-between font-bold text-lg text-[#C8102E]">
              <span>Total</span>
              <span>{form.method ? fmt(total) : "—"}</span>
            </div>
            {form.method && <BsRef usd={total} className="text-right" />}
            {form.method && (
              <p className="text-[11px] text-gray-400 text-right">
                Monto en bolívares referencial; varía según la tasa vigente.
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Procesar orden
          </button>
          <button
            onClick={() => {
              notify("Orden cancelada", {
                description: "Tus artículos siguen en el carrito.",
              });
              setView("cart");
            }}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderConfirm({
  order,
  setView,
}: {
  order: Order | null;
  setView: (v: View) => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h1
        className="text-3xl font-black text-[#000080] mb-2"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        ¡Orden emitida!
      </h1>
      {order && (
        <div className="inline-flex flex-col items-center bg-white border border-gray-100 rounded-xl px-6 py-3 mb-4">
          <span className="text-xs text-gray-400">Número de seguimiento</span>
          <span className="font-mono font-bold text-lg text-[#000080]">
            {order.id}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Total {fmt(order.total)} · {statusLabel[order.status]}
          </span>
        </div>
      )}
      <p className="text-gray-500 mb-6">
        Los vendedores fueron notificados. Recibirás tu recibo cuando se apruebe
        el pago.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => setView("client-orders")}
          className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
        >
          Ver mis órdenes
        </button>
        <button
          onClick={() => setView("catalog")}
          className="px-6 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25]"
        >
          Seguir comprando
        </button>
      </div>
    </div>
  );
}

export function ClientProfile({
  client,
  clients,
  takenEmails,
  orders,
  onSave,
  onDelete,
}: {
  client: Client;
  clients: Client[];
  takenEmails: string[];
  orders: Order[];
  onSave: (c: Client) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState(client);
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const openOrders = orders.filter(
    (o) => o.clientId === client.id && OPEN_STATUSES.includes(o.status),
  );

  const handleSave = () => {
    const e: Record<string, string> = {};
    const email = form.email.trim().toLowerCase();
    if (!isValidName(form.name))
      e.name = "Nombre requerido (mín. 3 caracteres)";
    if (!isValidEmail(email)) e.email = "Correo electrónico inválido";
    else if (
      clients.some(
        (c) => c.id !== client.id && c.email.toLowerCase() === email,
      ) ||
      takenEmails.includes(email)
    )
      e.email = "El correo ya está en uso";
    if (!isValidPhone(form.phone))
      e.phone = "Teléfono inválido (ej: 0414-1234567)";
    if (form.address.trim().length < 10)
      e.address = "Dirección requerida (mín. 10 caracteres)";
    if (form.docId && !isValidDocId(form.docId))
      e.docId = "Formato inválido (ej: V-12345678)";
    if (pass.next || pass.current) {
      if (pass.current !== client.password)
        e.current = "La contraseña actual no es correcta";
      if (!isValidPass(pass.next)) e.next = "Entre 6 y 50 caracteres";
      if (pass.next !== pass.confirm)
        e.confirm = "Las contraseñas no coinciden";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({
      ...form,
      email,
      name: form.name.trim(),
      address: form.address.trim(),
      password: pass.next || client.password,
    });
    setPass({ current: "", next: "", confirm: "" });
    notify.success("Perfil actualizado", {
      description: "Tus próximas órdenes usarán estos datos de contacto.",
    });
  };

  const tryDelete = () => {
    if (openOrders.length) {
      notify.error("No puedes eliminar tu cuenta todavía", {
        description: `Tienes ${openOrders.length} orden(es) sin resolver. Espera a que se completen o cancélalas desde "Mis órdenes".`,
      });
      return;
    }
    setConfirmDelete(true);
  };

  const fieldInput = (
    key: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    type = "text",
  ) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors[key] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
      />
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <h1
        className="text-3xl font-black text-[#000080]"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        Mi perfil
      </h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#000080] to-[#1560BD] px-6 py-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-2xl shrink-0">
            {client.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-xl truncate">
              {client.name}
            </h2>
            <p className="text-white/60 text-sm truncate">{client.email}</p>
            <p className="text-white/40 text-xs">
              Miembro desde {client.createdAt}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldInput("name", "Nombre completo *", form.name, (v) =>
              setForm((p) => ({ ...p, name: v })),
            )}
            {fieldInput("docId", "Cédula / RIF", form.docId, (v) =>
              setForm((p) => ({ ...p, docId: v })),
            )}
            {fieldInput(
              "email",
              "Correo electrónico *",
              form.email,
              (v) => setForm((p) => ({ ...p, email: v })),
              "email",
            )}
            {fieldInput(
              "phone",
              "Teléfono *",
              form.phone,
              (v) => setForm((p) => ({ ...p, phone: v })),
              "tel",
            )}
          </div>
          {fieldInput("address", "Dirección de envío *", form.address, (v) =>
            setForm((p) => ({ ...p, address: v })),
          )}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <KeyRound size={12} />
              Cambiar contraseña (opcional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fieldInput(
                "current",
                "Actual",
                pass.current,
                (v) => setPass((p) => ({ ...p, current: v })),
                "password",
              )}
              {fieldInput(
                "next",
                "Nueva",
                pass.next,
                (v) => setPass((p) => ({ ...p, next: v })),
                "password",
              )}
              {fieldInput(
                "confirm",
                "Confirmar",
                pass.confirm,
                (v) => setPass((p) => ({ ...p, confirm: v })),
                "password",
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Save size={16} />
            Guardar cambios
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-red-100 p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">Eliminar cuenta</p>
          <p className="text-xs text-gray-500">
            {openOrders.length
              ? `Tienes ${openOrders.length} orden(es) sin resolver; debes resolverlas antes de eliminar la cuenta.`
              : "Esta acción es permanente."}
          </p>
        </div>
        <button
          onClick={tryDelete}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2 shrink-0 ${openOrders.length ? "opacity-60" : ""}`}
        >
          {openOrders.length ? <Lock size={14} /> : <Trash2 size={14} />}
          Eliminar mi cuenta
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar tu cuenta?"
          message="Perderás el acceso y tu sesión se cerrará. Esta acción no se puede deshacer."
          confirmLabel="Eliminar cuenta"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

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
