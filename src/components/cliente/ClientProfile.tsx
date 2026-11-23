import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  KeyRound,
  Lock,
  MessageCircle,
  Save,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast as notify } from "sonner";
import type { Client, Order } from "@/types";
import { fmtDay, OPEN_STATUSES } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared";
import {
  isDocumentLocked,
  validateClientProfile,
  type ProfileForm,
  type ProfileErrorKey,
  type ProfileErrors,
} from "./profileValidation";

const SUPPORT_WHATSAPP_URL = "https://wa.me/584246243241";

interface ClientProfileUpdate {
  name: string;
  email: string;
  phone: string;
  address: string;
  docId: string;
  currentPassword?: string;
  newPassword?: string;
}

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
  onSave: (profile: ClientProfileUpdate) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<ProfileForm>(() => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    docId: client.docId,
  }));

  const [pass, setPass] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

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

    setPass({
      current: "",
      next: "",
      confirm: "",
    });

    setShowPasswords({
      current: false,
      next: false,
      confirm: false,
    });

    setErrors({});
  }, [client]);

  const handleSave = async () => {
    if (saving) return;

    const email = form.email.trim().toLowerCase();

    const formToValidate = documentLocked
      ? { ...form, docId: client.docId }
      : form;

    const validationErrors = validateClientProfile(
      formToValidate,
      pass,
      client,
      clients,
      takenEmails,
    );

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
          ?.focus();
      });

      return;
    }

    const profile: ClientProfileUpdate = {
      name: form.name.trim(),
      email,
      phone: form.phone.trim(),
      address: form.address.trim(),
      docId: documentLocked ? client.docId : form.docId.trim().toUpperCase(),
    };

    if (pass.current || pass.next || pass.confirm) {
      profile.currentPassword = pass.current;
      profile.newPassword = pass.next;
    }

    setSaving(true);

    try {
      await onSave(profile);

      setPass({
        current: "",
        next: "",
        confirm: "",
      });

      setShowPasswords({
        current: false,
        next: false,
        confirm: false,
      });

      notify.success("Perfil actualizado", {
        description: "Tus próximas órdenes usarán estos datos de contacto.",
      });
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el perfil",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSave();
  };

  const tryDelete = () => {
    if (openOrders.length > 0) {
      notify.error("No puedes eliminar tu cuenta todavía", {
        description: `Tienes ${openOrders.length} orden(es) sin resolver. Espera a que se completen o cancélalas desde "Mis órdenes".`,
      });

      return;
    }

    setConfirmDelete(true);
  };

  const fieldInput = (
    key: ProfileErrorKey,
    label: string,
    value: string,
    onChange: (value: string) => void,
    type = "text",
    options: {
      autoComplete?: string;
      disabled?: boolean;
      placeholder?: string;
      showPassword?: boolean;
      onTogglePassword?: () => void;
    } = {},
  ) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <div className="relative">
        <input
          type={type === "password" && options.showPassword ? "text" : type}
          value={value}
          onChange={(event) => {
            setErrors((previous) => {
              if (!previous[key]) return previous;

              const next = { ...previous };
              delete next[key];

              return next;
            });

            onChange(event.target.value);
          }}
          autoComplete={options.autoComplete}
          disabled={options.disabled || saving}
          placeholder={options.placeholder}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          className={`w-full px-3 py-2.5 ${
            type === "password" ? "pr-11" : ""
          } rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${
            errors[key]
              ? "border-red-400 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        />

        {type === "password" && options.onTogglePassword && (
          <button
            type="button"
            onClick={options.onTogglePassword}
            disabled={saving}
            aria-label={
              options.showPassword
                ? `Ocultar ${label.toLowerCase()}`
                : `Mostrar ${label.toLowerCase()}`
            }
            aria-pressed={Boolean(options.showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#000080] disabled:opacity-50"
          >
            {options.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

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
        style={{
          fontFamily: "'Barlow Condensed',sans-serif",
        }}
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
              Miembro desde{" "}
              {client.createdAt
                ? fmtDay(client.createdAt)
                : "Fecha no disponible"}
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
            {fieldInput(
              "name",
              "Nombre completo *",
              form.name,
              (value) =>
                setForm((previous) => ({
                  ...previous,
                  name: value,
                })),
              "text",
              { autoComplete: "name" },
            )}

            <div>
              {fieldInput(
                "docId",
                "Cédula / RIF",
                form.docId,
                (value) =>
                  setForm((previous) => ({
                    ...previous,
                    docId: value,
                  })),
                "text",
                {
                  disabled: documentLocked,
                  placeholder: "Ej: V-123456789",
                },
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
              (value) =>
                setForm((previous) => ({
                  ...previous,
                  email: value,
                })),
              "email",
              { autoComplete: "email" },
            )}

            {fieldInput(
              "phone",
              "Teléfono *",
              form.phone,
              (value) =>
                setForm((previous) => ({
                  ...previous,
                  phone: value,
                })),
              "tel",
              {
                autoComplete: "tel",
                placeholder: "Ej: 0414-1234567",
              },
            )}
          </div>

          {fieldInput(
            "address",
            "Dirección de envío *",
            form.address,
            (value) =>
              setForm((previous) => ({
                ...previous,
                address: value,
              })),
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
                (value) =>
                  setPass((previous) => ({
                    ...previous,
                    current: value,
                  })),
                "password",
                {
                  autoComplete: "current-password",
                  showPassword: showPasswords.current,
                  onTogglePassword: () =>
                    setShowPasswords((previous) => ({
                      ...previous,
                      current: !previous.current,
                    })),
                },
              )}

              {fieldInput(
                "next",
                "Nueva",
                pass.next,
                (value) =>
                  setPass((previous) => ({
                    ...previous,
                    next: value,
                  })),
                "password",
                {
                  autoComplete: "new-password",
                  showPassword: showPasswords.next,
                  onTogglePassword: () =>
                    setShowPasswords((previous) => ({
                      ...previous,
                      next: !previous.next,
                    })),
                },
              )}

              {fieldInput(
                "confirm",
                "Confirmar",
                pass.confirm,
                (value) =>
                  setPass((previous) => ({
                    ...previous,
                    confirm: value,
                  })),
                "password",
                {
                  autoComplete: "new-password",
                  showPassword: showPasswords.confirm,
                  onTogglePassword: () =>
                    setShowPasswords((previous) => ({
                      ...previous,
                      confirm: !previous.confirm,
                    })),
                },
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
          type="button"
          onClick={tryDelete}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2 shrink-0 ${
            openOrders.length ? "opacity-60" : ""
          }`}
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

            if (openOrders.length > 0) {
              notify.error("No puedes eliminar tu cuenta todavía", {
                description: `Tienes ${openOrders.length} orden(es) sin resolver.`,
              });

              return;
            }

            onDelete();
          }}
        />
      )}
    </div>
  );
}
