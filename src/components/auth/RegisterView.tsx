
import { useState } from "react";
import type { Client, View } from "@/types";
import {
  isValidEmail,
  isValidName,
  isValidPass,
  isValidPhone,
  Logo,
  Input,
  toISODate,
  isValidDocId,
} from "@/components/shared";
import { AuthShell } from "./AuthShell";
import { authService } from "@/services/authService";

export function RegisterView({
  setView,
  emailTaken,
  onRegister,
}: {
  setView: (v: View) => void;
  emailTaken: (email: string) => boolean;
  onRegister: (c: Client) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    docId: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (submitting) return;

    const e: Record<string, string> = {};
    const email = form.email.trim().toLowerCase();

    if (!isValidName(form.name)) {
      e.name = "Nombre requerido (mín. 3 caracteres)";
    }

    if (form.docId && !isValidDocId(form.docId)) {
      e.docId = "Formato inválido (ej: V-12345678)";
    }

    if (!isValidEmail(email)) {
      e.email = "Correo electrónico inválido";
    } else if (emailTaken(email)) {
      e.email = "Correo ya registrado";
    }

    if (form.phone && !isValidPhone(form.phone)) {
      e.phone = "Teléfono inválido (ej: 0414-1234567)";
    }

    if (!isValidPass(form.password)) {
      e.password = "Contraseña: entre 6 y 50 caracteres";
    }

    if (form.password !== form.confirm) {
      e.confirm = "Las contraseñas no coinciden";
    }

    if (!terms) {
      e.terms = "Debes aceptar los términos y condiciones";
    }

    setErrors(e);

    if (Object.keys(e).length > 0) return;

    setSubmitting(true);

    try {
      const user = await authService.register({
        name: form.name.trim(),
        email,
        phone: form.phone.trim(),
        address: form.address.trim(),
        docId: form.docId.trim().toUpperCase(),
        password: form.password,
      });

      if (!user.clientId) {
        throw new Error(
          "La cuenta fue creada, pero no se recibió su perfil de cliente.",
        );
      }

      const newClient: Client = {
        id: String(user.clientId),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        docId: user.docId ?? "",
        password: "",
        createdAt: user.createdAt || toISODate(new Date()),
      };

      // La sesión ya fue creada por el backend.
      // App recibe el cliente y lo dirige a su área.
      onRegister(newClient);

    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        server: error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta. Inténtalo nuevamente.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="flex justify-center mb-4">
        <Logo size={40} />
      </div>

      <h2
        className="text-2xl font-black text-center text-[#000080] mb-1"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        Crear cuenta
      </h2>

      <p className="text-center text-gray-400 text-sm mb-6">
        Regístrate para hacer tus compras en línea
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            {
              label: "Nombre completo *",
              key: "name",
              type: "text",
              wide: true,
            },
            {
              label: "Cédula / RIF",
              key: "docId",
              type: "text",
            },
            {
              label: "Teléfono",
              key: "phone",
              type: "tel",
            },
            {
              label: "Correo electrónico *",
              key: "email",
              type: "email",
              wide: true,
            },
            {
              label: "Dirección",
              key: "address",
              type: "text",
              wide: true,
            },
            {
              label: "Contraseña *",
              key: "password",
              type: "password",
            },
            {
              label: "Confirmar *",
              key: "confirm",
              type: "password",
            },
          ] as const).map((f) => (
            <div
              key={f.key}
              className={"wide" in f ? "sm:col-span-2" : ""}
            >
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {f.label}
              </label>

              <Input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => {
                  setForm((previous) => ({
                    ...previous,
                    [f.key]: e.target.value,
                  }));

                  setErrors((previous) => ({
                    ...previous,
                    [f.key]: "",
                    server: "",
                  }));
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${
                  errors[f.key]
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              />

              {errors[f.key] && (
                <p className="text-red-500 text-[11px] mt-0.5">
                  {errors[f.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.server && (
          <p className="text-red-500 text-xs">
            {errors.server}
          </p>
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 accent-[#C8102E]"
          />

          <label htmlFor="terms" className="text-xs text-gray-500">
            Acepto los términos y condiciones de Music&Sport DSS, C.A.
          </label>
        </div>

        {errors.terms && (
          <p className="text-red-500 text-[11px]">
            {errors.terms}
          </p>
        )}

        <button
          onClick={handleRegister}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <button
            onClick={() => setView("login")}
            className="text-[#C8102E] font-semibold hover:underline"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
