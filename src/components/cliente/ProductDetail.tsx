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
export function ProductDetail({
  product,
  cart,
  addToCart,
  setView,
}: {
  product: Product | null;
  cart: CartItem[];
  addToCart: AddToCart;
  setView: (v: View) => void;
}) {
  const [qty, setQty] = useState(1);
  const inCart = product
    ? cart.find((i) => i.product.id === product.id)?.qty ?? 0
    : 0;
  const maxAdd = product ? Math.max(0, product.stock - inCart) : 0;

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, maxAdd || 1)));
  }, [maxAdd]);

  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-gray-200 mb-3" />
        <h1 className="text-lg font-semibold text-gray-700">
          Producto no encontrado
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          El producto ya no está disponible o el enlace no es válido.
        </p>
        <button
          onClick={() => setView("catalog")}
          className="mt-4 px-6 py-3 bg-[#C8102E] text-white rounded-xl font-semibold"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }
  const unavailable = !product.active || product.stock === 0;

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
            src={safeImageSource(product.image, FALLBACK_IMG)}
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
