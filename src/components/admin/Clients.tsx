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
export function AdminClients({
  clients,
  setClients,
  orders,
}: {
  clients: Client[];
  setClients: (c: Client[]) => void;
  orders: Order[];
}) {
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const tryDelete = (c: Client) => {
    const open = orders.filter(
      (o) => o.clientId === c.id && OPEN_STATUSES.includes(o.status),
    ).length;
    if (open > 0) {
      notify.error(`No se puede eliminar a ${c.name}`, {
        description: `Tiene ${open} orden(es) sin resolver. Resuélvelas o cancélalas primero.`,
      });
      return;
    }
    setToDelete(c);
  };
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Cliente",
                  "Contacto",
                  "Dirección",
                  "Órdenes",
                  "Total Gastado",
                  "Miembro desde",
                  "",
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
              {filtered.map((c) => {
                const clientOrders = orders.filter((o) => o.clientId === c.id);
                const totalSpent = clientOrders
                  .filter((o) => PAID_STATUSES.includes(o.status))
                  .reduce((a, o) => a + o.total, 0);
                return (
                  <tr
                    key={c.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8102E] to-[#800000] flex items-center justify-center text-white font-bold text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{c.email}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                      {c.address}
                    </td>
                    <td className="px-5 py-3 font-semibold text-center text-[#000080]">
                      {clientOrders.length}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {fmt(totalSpent)}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {c.createdAt}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => tryDelete(c)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                        aria-label="Eliminar cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-400 text-sm"
                  >
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar cliente?"
          message={`Se eliminará la cuenta de ${toDelete.name}. Su historial de órdenes cerradas se conserva.`}
          confirmLabel="Eliminar"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            setClients(clients.filter((x) => x.id !== toDelete.id));
            setToDelete(null);
            notify.success("Cliente eliminado");
          }}
        />
      )}
    </div>
  );
}
