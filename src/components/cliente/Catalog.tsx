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
function ProductCard({
  p,
  inCart,
  onAdd,
  onOpen,
}: {
  p: Product;
  inCart: number;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const left = p.stock - inCart;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
      <button
        className="aspect-square bg-gray-50 overflow-hidden"
        onClick={onOpen}
        aria-label={`Ver ${p.name}`}
      >
        <img
          src={p.image || FALLBACK_IMG}
          onError={onImgError}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </button>
      <div className="p-3 flex flex-col flex-1">
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${p.category === "Música" ? "text-[#C8102E]" : "text-[#1560BD]"}`}
        >
          {p.subcategory}
        </span>
        <button
          onClick={onOpen}
          className="text-left text-sm font-semibold text-gray-800 mt-0.5 line-clamp-2 leading-tight hover:text-[#C8102E]"
        >
          {p.name}
        </button>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span
            className="font-bold text-lg text-[#000080]"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            {fmt(p.price)}
          </span>
          <span
            className={`text-xs ${p.stock <= p.minStock ? "text-amber-600 font-medium" : "text-gray-400"}`}
          >
            {p.stock} disp.
          </span>
        </div>
        <button
          onClick={onAdd}
          disabled={left <= 0}
          className="w-full mt-2 py-2 bg-[#C8102E] text-white rounded-lg text-xs font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-1 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {left <= 0 ? (
            <>Máximo en carrito</>
          ) : (
            <>
              <Plus size={12} />
              Agregar{inCart > 0 && ` (${inCart})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Catalog({
  products,
  cart,
  addToCart,
  setView,
  setSelectedProductId,
}: {
  products: Product[];
  cart: CartItem[];
  addToCart: AddToCart;
  setView: (v: View) => void;
  setSelectedProductId: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");
  const [sub, setSub] = useState("Todos");

  const inCart = (id: string) =>
    cart.find((i) => i.product.id === id)?.qty ?? 0;
  const visible = products.filter((p) => p.active);
  const available = visible.filter((p) => p.stock > 0);
  const inCategory = visible.filter(
    (p) => cat === "Todos" || p.category === cat,
  );
  const subcats = [
    "Todos",
    ...Array.from(new Set(inCategory.map((p) => p.subcategory))),
  ];
  const q = search.trim().toLowerCase();
  const filtered = available.filter((p) => {
    const matchSearch =
      !q ||
      [p.name, p.description, p.subcategory, p.category].some((t) =>
        t.toLowerCase().includes(q),
      );
    const matchCat = cat === "Todos" || p.category === cat;
    const matchSub = sub === "Todos" || p.subcategory === sub;
    return matchSearch && matchCat && matchSub;
  });
  const scopeOutOfStock =
    !q &&
    inCategory.filter((p) => sub === "Todos" || p.subcategory === sub).length >
      0 &&
    filtered.length === 0;
  const suggestions =
    filtered.length === 0
      ? available
          .filter((p) => cat === "Todos" || p.category === cat)
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 4)
      : [];
  const open = (p: Product) => {
    setSelectedProductId(p.id);
    setView("product-detail");
  };
  const reset = () => {
    setSearch("");
    setCat("Todos");
    setSub("Todos");
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div
        className="relative rounded-2xl overflow-hidden mb-8 h-44 md:h-64"
        style={{
          background: "linear-gradient(135deg,#000080 0%,#C8102E 100%)",
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=400&fit=crop&auto=format"
          alt=""
          onError={(e) => (e.currentTarget.style.display = "none")}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-12">
          <h1
            className="text-white font-black text-3xl md:text-5xl leading-tight"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            TODO LO QUE
            <br />
            NECESITAS
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2">
            {available.length} productos de deportes y música disponibles
          </p>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2 mb-4">
        <Info size={13} className="mt-px shrink-0 text-[#1560BD]" />
        Precios expresados en dólares (USD). Los montos en bolívares son
        referenciales y están sujetos a la tasa vigente al momento del pago.
      </p>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Buscar por nombre, descripción o categoría..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {["Todos", "Deportes", "Música"].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCat(c);
                setSub("Todos");
              }}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${cat === c ? "bg-[#000080] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {subcats.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {subcats.map((s) => (
            <button
              key={s}
              onClick={() => setSub(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${sub === s ? "bg-[#C8102E] text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 && (q || cat !== "Todos" || sub !== "Todos") && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} resultado(s)
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          {scopeOutOfStock ? (
            <Package size={40} className="mx-auto text-amber-300 mb-3" />
          ) : (
            <Search size={40} className="mx-auto text-gray-200 mb-3" />
          )}
          <p className="text-gray-600 font-medium">
            {scopeOutOfStock
              ? `La categoría "${sub !== "Todos" ? sub : cat}" está temporalmente sin artículos disponibles`
              : q
                ? `No encontramos coincidencias para "${search.trim()}"`
                : "No hay productos disponibles con ese criterio"}
          </p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-[#C8102E] font-semibold hover:underline"
          >
            Limpiar filtros
          </button>
          {suggestions.length > 0 && (
            <div className="mt-10 text-left">
              <p className="text-sm font-semibold text-[#000080] mb-3">
                Te podría interesar
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {suggestions.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    inCart={inCart(p.id)}
                    onAdd={() => addToCart(p.id, 1)}
                    onOpen={() => open(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              inCart={inCart(p.id)}
              onAdd={() => addToCart(p.id, 1)}
              onOpen={() => open(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
