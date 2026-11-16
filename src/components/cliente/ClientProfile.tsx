import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
  MessageCircle,
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
  useRate,
  rateNote,
} from "@/components/shared";
import logoImg from "@/imports/Logo.png";
import {
  isDocumentLocked,
  validateClientProfile,
  type ProfileForm,
  type ProfileErrors,
} from "./profileValidation";

const SUPPORT_WHATSAPP_URL = "https://wa.me/584246243241";

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
  const [form, setForm] = useState<ProfileForm>(() => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    docId: client.docId,
  }));
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const documentLocked = isDocumentLocked(client, orders);
  const openOrders = orders.filter(
    (o) => o.clientId === client.id && OPEN_STATUSES.includes(o.status),
  );

  useEffect(() => {
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      docId: client.docId,
    });
    setPass({ current: "", next: "", confirm: "" });
    setErrors({});
  }, [client]);

  const handleSave = () => {
    const email = form.email.trim().toLowerCase();
    const e = validateClientProfile(form, pass, client, clients, takenEmails);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }
    if (saving) return;

    setSaving(true);
    onSave({
      ...client,
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
    setSaving(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave();
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
    options: { autoComplete?: string; disabled?: boolean } = {},
  ) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={options.autoComplete}
        disabled={options.disabled}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${errors[key] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
      />
      {errors[key] && (
        <p id={`${key}-error`} className="text-red-500 text-xs mt-1">
          {errors[key]}
        </p>
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
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
          aria-busy={saving}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fieldInput("name", "Nombre completo *", form.name, (v) =>
              setForm((p) => ({ ...p, name: v })),
              "text",
              { autoComplete: "name" },
            )}
            <div>
              {fieldInput(
                "docId",
                "Cédula / RIF",
                form.docId,
                (v) => setForm((p) => ({ ...p, docId: v })),
                "text",
                { disabled: documentLocked },
              )}
              <p className="text-xs text-gray-500 mt-1">
                {documentLocked
                  ? "La cédula/RIF está bloqueada. ¿Te equivocaste al escribirla? Contacta a soporte para corregirla."
                  : "Puedes editarla hasta completar tu primera orden."}
              </p>
            </div>
            {fieldInput(
              "email",
              "Correo electrónico *",
              form.email,
              (v) => setForm((p) => ({ ...p, email: v })),
              "email",
              { autoComplete: "email" },
            )}
            {fieldInput(
              "phone",
              "Teléfono *",
              form.phone,
              (v) => setForm((p) => ({ ...p, phone: v })),
              "tel",
              { autoComplete: "tel" },
            )}
          </div>
          {fieldInput("address", "Dirección de envío *", form.address, (v) =>
            setForm((p) => ({ ...p, address: v })),
            "text",
            { autoComplete: "street-address" },
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
                { autoComplete: "current-password" },
              )}
              {fieldInput(
                "next",
                "Nueva",
                pass.next,
                (v) => setPass((p) => ({ ...p, next: v })),
                "password",
                { autoComplete: "new-password" },
              )}
              {fieldInput(
                "confirm",
                "Confirmar",
                pass.confirm,
                (v) => setPass((p) => ({ ...p, confirm: v })),
                "password",
                { autoComplete: "new-password" },
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors flex items-center justify-center gap-2 mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
        <div className="mx-6 mb-6 rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <MessageCircle
              size={20}
              className="mt-0.5 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-green-900">
                ¿Necesitas corregir tu cédula/RIF?
              </p>
              <p className="text-xs text-green-800 mt-1">
                Contacta a soporte por WhatsApp para solicitar la corrección.
              </p>
            </div>
          </div>
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shrink-0"
          >
            Abrir WhatsApp
          </a>
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
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete();
          }}
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
