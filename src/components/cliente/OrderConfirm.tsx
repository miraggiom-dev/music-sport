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
export function OrderConfirm({
  order,
  setView,
}: {
  order: Order | null;
  setView: (v: View) => void;
}) {
  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">No hay una orden disponible para mostrar.</p>
        <button
          onClick={() => setView("client-orders")}
          className="mt-4 px-6 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-semibold"
        >
          Ver mis órdenes
        </button>
      </div>
    );
  }

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
      <div className="inline-flex flex-col items-center bg-white border border-gray-100 rounded-xl px-6 py-3 mb-4">
          <span className="text-xs text-gray-400">Número de seguimiento</span>
          <span className="font-mono font-bold text-lg text-[#000080]">
            {order.id}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Total {fmt(order.total)} · {statusLabel[order.status]}
          </span>
      </div>
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
