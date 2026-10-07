import {
  BsRef,
  StatusBadge,
  Logo,
  Input,
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
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: JSX.Element;
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
        <p
          className="text-2xl font-bold text-gray-800"
          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
        >
          {value}
        </p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

export function AdminDashboard({
  products,
  orders,
  rateAlert,
  setView,
}: {
  products: Product[];
  orders: Order[];
  rateAlert: string;
  setView: (v: View) => void;
}) {
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = orders.filter((o) => o.status === "pendiente").length;
  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const totalRevenue = paid.reduce((a, o) => a + o.total, 0);
  const salesData = salesTrend(orders, "mensual").map((d) => ({
    mes: d.label,
    ventas: d.ventas,
  }));
  const catTotals = (["Deportes", "Música"] as const).map((c) =>
    paid
      .flatMap((o) => o.items)
      .filter((i) => i.product.category === c)
      .reduce((a, i) => a + i.product.price * i.qty, 0),
  );
  const catSum = catTotals[0] + catTotals[1];
  const categoryData =
    catSum === 0
      ? []
      : [
          {
            name: "Deportes",
            value: Math.round((catTotals[0] / catSum) * 100),
            color: "#1560BD",
          },
          {
            name: "Música",
            value: 100 - Math.round((catTotals[0] / catSum) * 100),
            color: "#C8102E",
          },
        ];
  return (
    <div className="space-y-6">
      {rateAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            {rateAlert}
          </span>
          <button
            onClick={() => setView("admin-rates")}
            className="text-sm font-semibold text-[#000080] hover:underline shrink-0"
          >
            Actualizar tasa
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos totales"
          value={fmt(totalRevenue)}
          sub="Órdenes pagadas"
          icon={<DollarSign size={20} />}
          color="#000080"
        />
        <StatCard
          label="Órdenes pendientes"
          value={String(pendingOrders)}
          sub="Esperan aprobación de pago"
          icon={<ShoppingBag size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Productos activos"
          value={String(products.filter((p) => p.active).length)}
          sub={`${lowStockCount} con stock bajo`}
          icon={<Package size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          sub="Requieren reposición"
          icon={<AlertTriangle size={20} />}
          color="#800000"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3
            className="font-bold text-[#000080] mb-4"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Ventas de los últimos 6 meses (USD)
          </h3>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 500 200"
              width="100%"
              style={{ display: "block" }}
            >
              {(() => {
                const W = 500,
                  H = 200,
                  padL = 48,
                  padB = 32,
                  padT = 10,
                  padR = 10;
                const iW = W - padL - padR,
                  iH = H - padB - padT;
                const maxV = Math.max(...salesData.map((d) => d.ventas), 1);
                const barW = (iW / salesData.length) * 0.6;
                const gap = iW / salesData.length;
                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                      const y = padT + iH - r * iH;
                      return (
                        <g key={i}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={W - padR}
                            y2={y}
                            stroke="#f0f0f0"
                            strokeWidth={1}
                          />
                          <text
                            x={padL - 4}
                            y={y + 4}
                            textAnchor="end"
                            fontSize={9}
                            fill="#999"
                          >
                            ${Math.round(r * maxV)}
                          </text>
                        </g>
                      );
                    })}
                    {salesData.map((d, i) => {
                      const bH = (d.ventas / maxV) * iH;
                      const x = padL + i * gap + (gap - barW) / 2;
                      const y = padT + iH - bH;
                      return (
                        <g key={i}>
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={bH}
                            fill="#C8102E"
                            rx={3}
                          />
                          <text
                            x={x + barW / 2}
                            y={H - 8}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#666"
                          >
                            {d.mes}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3
            className="font-bold text-[#000080] mb-4"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Ventas por categoría
          </h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">
              Sin ventas pagadas todavía
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine
                  isAnimationActive={false}
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Participación"]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 justify-center mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="text-xs text-gray-600">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3
            className="font-bold text-[#000080]"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Órdenes recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Orden", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...orders]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[#000080] font-semibold">
                      {o.id}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{o.clientName}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {fmt(o.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status]}`}
                      >
                        {statusIcon[o.status]}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {o.date}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
