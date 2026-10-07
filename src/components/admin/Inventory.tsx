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
export function AdminInventory({
  products,
  setProducts,
  canEdit,
}: {
  products: Product[];
  setProducts: (p: Product[]) => void;
  canEdit: boolean;
}) {
  const lowStock = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
  const outStock = products.filter((p) => p.stock === 0);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjVal, setAdjVal] = useState("");
  const [adjErr, setAdjErr] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "normal" | "bajo" | "agotado">(
    "todos",
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };
  const stockStatus = (p: Product) =>
    p.stock === 0 ? "agotado" : p.stock <= p.minStock ? "bajo" : "normal";
  const rows = products.filter(
    (p) =>
      (filter === "todos" || stockStatus(p) === filter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const openAdjust = (p: Product) => {
    setAdjustId(p.id);
    setAdjVal(String(p.stock));
    setAdjErr("");
  };
  const handleAdjust = () => {
    const n = Number(adjVal);
    if (adjVal.trim() === "" || !isValidStock(n)) {
      setAdjErr("Ingresa un número entero mayor o igual a 0");
      return;
    }
    setProducts(
      products.map((p) => (p.id === adjustId ? { ...p, stock: n } : p)),
    );
    setAdjustId(null);
    showToast("Stock actualizado");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-[calc(1rem+var(--safe-top))] right-4 z-50 bg-[#000080] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} className="text-green-300" />
          {toast}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Productos"
          value={String(products.length)}
          sub="En catálogo"
          icon={<Package size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Stock Bajo"
          value={String(lowStock.length)}
          sub="Por debajo del mínimo"
          icon={<AlertTriangle size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Agotados"
          value={String(outStock.length)}
          sub="Sin existencias"
          icon={<XCircle size={20} />}
          color="#800000"
        />
      </div>

      {(outStock.length > 0 || lowStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="font-bold text-amber-800 text-sm">
              Alertas de stock
            </h3>
          </div>
          <div className="space-y-2">
            {[...outStock, ...lowStock].map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white rounded-lg px-4 py-2.5 border border-amber-100"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-800">
                    {p.name}
                  </span>
                  <span
                    className={`ml-2 text-xs font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}
                  >
                    {p.stock === 0
                      ? "AGOTADO"
                      : `${p.stock} uds restantes (mín: ${p.minStock})`}
                  </span>
                </div>
                {canEdit && (
                  <button
                    onClick={() => openAdjust(p)}
                    className="text-xs px-3 py-1.5 bg-[#000080] text-white rounded-lg font-medium hover:bg-[#0000a0] transition-colors"
                  >
                    Ajustar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <h3
            className="font-bold text-[#000080]"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Estado del inventario
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto o SKU..."
                className="w-full sm:w-56 pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {(["todos", "normal", "bajo", "agotado"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap ${filter === f ? "bg-[#000080] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                >
                  {f === "bajo" ? "Stock bajo" : f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Producto",
                  "SKU",
                  "Categoría",
                  "Stock Actual",
                  "Stock Mínimo",
                  "Estado",
                  "Acción",
                ].map((h) => (
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
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-400 text-sm"
                  >
                    No hay productos que coincidan
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const status = stockStatus(p);
                return (
                  <tr
                    key={p.id}
                    className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${status === "agotado" ? "bg-red-50/30" : status === "bajo" ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {p.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">
                      {p.sku}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {p.category}
                    </td>
                    <td
                      className="px-5 py-3 font-bold text-lg"
                      style={{ fontFamily: "'DM Mono',monospace" }}
                    >
                      <span
                        className={
                          status === "agotado"
                            ? "text-red-600"
                            : status === "bajo"
                              ? "text-amber-600"
                              : "text-green-600"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3 text-gray-500"
                      style={{ fontFamily: "'DM Mono',monospace" }}
                    >
                      {p.minStock}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${status === "agotado" ? "bg-red-100 text-red-700" : status === "bajo" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                      >
                        {status === "agotado"
                          ? "Agotado"
                          : status === "bajo"
                            ? "Stock Bajo"
                            : "Normal"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {!canEdit ? (
                        <span className="text-xs text-gray-300">
                          Solo lectura
                        </span>
                      ) : (
                        <button
                          onClick={() => openAdjust(p)}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-[#000080] hover:text-white transition-colors"
                        >
                          Ajustar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {adjustId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3
              className="font-bold text-[#000080]"
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: "1.2rem",
              }}
            >
              Ajustar stock: {products.find((p) => p.id === adjustId)?.name}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nueva cantidad
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={adjVal}
                onChange={(e) => {
                  setAdjVal(e.target.value);
                  setAdjErr("");
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${adjErr ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {adjErr && <p className="text-red-500 text-xs mt-1">{adjErr}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAdjustId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjust}
                className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25]"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
