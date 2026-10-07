import {
  BsRef,
  StatusBadge,
  Logo,
  Input,
  StatCard,
  StatusFilter,
  OrderDetailModal,
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
function ProductModal({
  product,
  products,
  onSave,
  onClose,
}: {
  product?: Product;
  products: Product[];
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const blank: Product = {
    id: `P${Date.now()}`,
    name: "",
    category: "Deportes",
    subcategory: "",
    price: 0,
    stock: 0,
    minStock: 2,
    description: "",
    image: "",
    sku: "",
    active: true,
  };
  const [form, setForm] = useState<Product>(product ?? blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const others = products.filter((p) => p.id !== form.id);
    if (!isValidName(form.name))
      e.name = "Nombre requerido (mín. 3 caracteres)";
    else if (
      others.some(
        (p) => p.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      )
    )
      e.name = "Ya existe un producto con este nombre. Modifica el existente.";
    if (!form.sku.trim()) e.sku = "SKU requerido";
    else if (!isValidSku(form.sku))
      e.sku =
        "SKU inválido (2-20 caracteres alfanuméricos, guiones permitidos)";
    else if (
      others.some(
        (p) => p.sku.trim().toLowerCase() === form.sku.trim().toLowerCase(),
      )
    )
      e.sku = "Este SKU ya está registrado. Modifica el producto existente.";
    if (!Number.isFinite(form.price) || !isValidPrice(form.price))
      e.price = "Mayor a 0";
    if (!Number.isFinite(form.stock) || !isValidStock(form.stock))
      e.stock = "Entero ≥ 0";
    if (
      !Number.isFinite(form.minStock) ||
      !isValidStock(form.minStock) ||
      form.minStock < 1
    )
      e.minStock = "Entero ≥ 1";
    if (!form.subcategory.trim()) e.subcategory = "Subcategoría requerida";
    if (form.description.trim().length < 10)
      e.description = "Descripción requerida (mín. 10 caracteres)";
    if (!form.image) e.image = "Debes cargar una fotografía del producto";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave({
      ...form,
      price: round2(form.price),
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      subcategory: form.subcategory.trim(),
      description: form.description.trim(),
    });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!IMG_TYPES.includes(file.type)) {
      setErrors((er) => ({
        ...er,
        image: "Formato no soportado. Usa JPG, PNG o WEBP.",
      }));
      return;
    }
    if (file.size > IMG_MAX_MB * 1024 * 1024) {
      setErrors((er) => ({
        ...er,
        image: `La imagen excede el límite de ${IMG_MAX_MB} MB.`,
      }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, image: reader.result as string }));
      setErrors((er) => {
        const { image, ...rest } = er;
        return rest;
      });
    };
    reader.readAsDataURL(file);
  };

  const field = (
    label: string,
    key: keyof Product,
    type = "text",
    extra?: object,
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={
          typeof form[key] === "number" && Number.isNaN(form[key])
            ? ""
            : String(form[key])
        }
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [key]:
              type === "number"
                ? e.target.value === ""
                  ? NaN
                  : Number(e.target.value)
                : e.target.value,
          }))
        }
        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors[key] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
        {...extra}
      />
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#000080] rounded-t-2xl">
          <h2
            className="text-white font-bold"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.2rem",
            }}
          >
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 flex items-center gap-2">
              <AlertTriangle size={14} />
              Revisa los campos resaltados antes de guardar.
            </div>
          )}
          {field("Nombre del Producto *", "name")}
          {field("SKU / Código *", "sku")}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as Product["category"],
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
              >
                <option>Deportes</option>
                <option>Música</option>
              </select>
            </div>
            {field("Subcategoría *", "subcategory")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field("Precio (USD) *", "price", "number")}
            {field("Stock *", "stock", "number")}
            {field("Stock Mínimo *", "minStock", "number")}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Descripción *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 resize-none ${errors.description ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Imagen del producto *{" "}
              <span className="font-normal text-gray-400">
                (JPG, PNG o WEBP · máx. {IMG_MAX_MB} MB)
              </span>
            </label>
            <div className="flex gap-3 items-center">
              {form.image ? (
                <img
                  src={form.image}
                  alt="preview"
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed ${errors.image ? "border-red-400" : "border-gray-300"} flex items-center justify-center shrink-0`}
                >
                  <ImageIcon size={22} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#C8102E]/30 bg-[#C8102E]/5 hover:bg-[#C8102E]/10 transition-colors text-sm font-medium text-[#C8102E]">
                  <Upload size={14} />
                  {form.image ? "Cambiar imagen" : "Seleccionar imagen"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
                  >
                    Eliminar imagen
                  </button>
                )}
              </div>
            </div>
            {errors.image && (
              <p className="text-red-500 text-xs mt-1">{errors.image}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-600">
              Estado:
            </label>
            <button
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${form.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {form.active ? (
                <ToggleRight size={14} />
              ) : (
                <ToggleLeft size={14} />
              )}
              {form.active ? "Activo" : "Inactivo"}
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25] transition-colors"
          >
            {product ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminProducts({
  products,
  setProducts,
  orders,
}: {
  products: Product[];
  setProducts: (p: Product[]) => void;
  orders: Order[];
}) {
  const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status));
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({
    open: false,
  });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === "Todas" || p.category === cat;
    return matchSearch && matchCat;
  });

  const handleSave = (p: Product) => {
    if (products.find((x) => x.id === p.id)) {
      setProducts(products.map((x) => (x.id === p.id ? p : x)));
      showToast("Producto actualizado correctamente");
    } else {
      setProducts([...products, p]);
      showToast("Producto registrado correctamente");
    }
    setModal({ open: false });
  };

  const handleDelete = (id: string) => {
    if (openOrders.some((o) => o.items.some((i) => i.product.id === id))) {
      setDeleteId(null);
      showToast(
        "No se puede eliminar: el producto está en órdenes abiertas. Desactívalo en su lugar.",
      );
      return;
    }
    setProducts(products.filter((p) => p.id !== id));
    setDeleteId(null);
    showToast("Producto eliminado");
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-[calc(1rem+var(--safe-top))] right-4 z-50 bg-[#000080] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} className="text-green-300" />
          {toast}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none"
        >
          <option>Todas</option>
          <option>Deportes</option>
          <option>Música</option>
        </select>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-[#a80d25] transition-colors"
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Producto",
                  "SKU",
                  "Categoría",
                  "Precio",
                  "Stock",
                  "Estado",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || FALLBACK_IMG}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        onError={onImgError}
                      />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">{p.subcategory}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.category === "Música" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {fmt(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${p.stock === 0 ? "text-red-600" : p.stock <= p.minStock ? "text-amber-600" : "text-green-600"}`}
                    >
                      {p.stock === 0 ? "Agotado" : p.stock}
                    </span>
                    {p.stock <= p.minStock && p.stock > 0 && (
                      <AlertTriangle
                        size={12}
                        className="inline ml-1 text-amber-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({ open: true, product: p })}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-400 text-sm"
                  >
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <ProductModal
          product={modal.product}
          products={products}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
              <Trash2 className="text-red-600" size={22} />
            </div>
            <h3 className="text-center font-bold text-gray-800">
              ¿Eliminar producto?
            </h3>
            <p className="text-center text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
