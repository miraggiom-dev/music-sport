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
