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

export function VendorPayment({
  order,
  changeStatus,
  setView,
}: {
  order: Order;
  changeStatus: ChangeStatus;
  setView: (v: View) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");

  const approve = () => changeStatus(order.id, "procesando");
  const reject = () => {
    if (reason.trim().length < 5) {
      setReasonErr("Indica el motivo del rechazo (mín. 5 caracteres)");
      return;
    }
    changeStatus(order.id, "cancelado", { rejectReason: reason.trim() });
    setRejecting(false);
    setView("vendor-orders");
  };

  if (order.status !== "pendiente") {
    const approved = PAID_STATUSES.includes(order.status);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className={`${approved ? "bg-[#000080]" : "bg-[#800000]"} px-6 sm:px-8 py-6 text-white text-center`}
          >
            <div className="flex justify-center mb-2">
              <Logo size={44} white />
            </div>
            <p className="text-white/60 text-sm mt-2">
              {approved ? "Pago aprobado · Recibo" : "Pago rechazado"}
            </p>
            <p className="font-mono text-lg font-bold mt-1">
              {order.receiptNo ?? order.id}
            </p>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div>
                <p className="text-xs text-gray-400">Cliente</p>
                <p className="font-medium">{order.billing.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cédula / RIF</p>
                <p className="font-medium">{order.billing.docId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Orden</p>
                <p className="font-medium font-mono">{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Estado</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
            {order.rejectReason && (
              <p className="text-sm text-red-600">
                Motivo: {order.rejectReason}
              </p>
            )}
            <div className="space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-3 py-1 border-b border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmt(item.product.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    {fmt(item.product.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{taxLabel(order.taxType)}</span>
                <span>{fmt(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-[#C8102E] pt-2 border-t">
                <span>TOTAL</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>
          <div className="px-6 sm:px-8 pb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setView("vendor-orders")}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium"
            >
              Volver a órdenes
            </button>
            {approved && (
              <button
                onClick={() => printReceipt(order)}
                className="flex-1 py-3 rounded-xl bg-[#000080] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#0000a0]"
              >
                <Printer size={16} />
                Imprimir recibo (PDF)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => setView("vendor-orders")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C8102E]"
      >
        <ChevronLeft size={16} />
        Órdenes
      </button>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h3
          className="font-bold text-[#000080]"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "1.2rem",
          }}
        >
          Verificar pago — {order.id}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400">Facturar a</p>
            <p className="font-medium">
              {order.billing.name} · {order.billing.docId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Teléfono</p>
            <p className="font-medium">{order.billing.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Método de pago</p>
            <p className="font-medium">{order.billing.method}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Referencia</p>
            <p className="font-medium font-mono">
              {order.billing.reference || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-400">Dirección</p>
            <p className="font-medium">{order.billing.address}</p>
          </div>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center gap-3 py-2 border-b border-gray-50 text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">{item.product.name}</p>
                <p className="text-xs text-gray-400">
                  SKU: {item.product.sku} · Cant: {item.qty}
                </p>
              </div>
              <span className="font-semibold shrink-0">
                {fmt(item.product.price * item.qty)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-gray-500 pt-1">
            <span>{taxLabel(order.taxType)}</span>
            <span>{fmt(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#C8102E] text-lg pt-1">
            <span>Total a verificar</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              setRejecting(true);
              setReason("");
              setReasonErr("");
            }}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Rechazar pago
          </button>
          <button
            onClick={approve}
            className="flex-1 py-3 rounded-xl bg-[#C8102E] text-white text-sm font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Aprobar pago y emitir recibo
          </button>
        </div>
      </div>
      {rejecting && (
        <ConfirmDialog
          title="Rechazar pago"
          message="La orden pasará a cancelada y las unidades regresarán al inventario."
          confirmLabel="Rechazar"
          onCancel={() => setRejecting(false)}
          onConfirm={reject}
        >
          <div>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonErr("");
              }}
              rows={3}
              placeholder="Motivo (ej. referencia no encontrada)"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none ${reasonErr ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            {reasonErr && (
              <p className="text-red-500 text-xs mt-1">{reasonErr}</p>
            )}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
