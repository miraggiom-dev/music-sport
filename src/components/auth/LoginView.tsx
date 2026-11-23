import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Mail,
  Lock,
} from "lucide-react";
import type { Account, Lockout, View } from "@/types";
import { isValidEmail, Logo, Input } from "@/components/shared";
import { AuthShell } from "./AuthShell";
import { authService } from "@/services/authService";

const LOCK_ATTEMPTS = 3;
const LOCK_MINUTES = 5;

export function LoginView({
  setView,
  onLogin,
  lockouts,
  setLockouts,
  notice,
}: {
  setView: (v: View) => void;
  onLogin: (a: Account) => void;
  lockouts: Record<string, Lockout>;
  setLockouts: React.Dispatch<React.SetStateAction<Record<string, Lockout>>>;
  notice: string;
}) {
  const [mode, setMode] = useState<"login" | "recover-email" | "recover-done">(
    "login",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const key = email.trim().toLowerCase();
  const lock = lockouts[key];

  const lockedFor =
    lock && lock.until > now ? Math.ceil((lock.until - now) / 1000) : 0;

  useEffect(() => {
    if (!lockedFor) return;

    const t = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(t);
  }, [lockedFor]);

  // Inicio de sesión conectado al backend
  const handleLogin = async () => {
    if (submitting) return;

    setNow(Date.now());

    const e: Record<string, string> = {};

    if (!key) e.email = "Ingresa tu correo";
    else if (!isValidEmail(key)) {
      e.email = "Formato de correo inválido";
    }

    if (!password) e.password = "Ingresa tu contraseña";

    setErrors(e);
    setError("");

    if (Object.keys(e).length) return;
    if (lock && lock.until > Date.now()) return;

    setSubmitting(true);

    try {
      const user = await authService.login(key, password);

      let account: Account;

      if (user.role === "client") {
        if (!user.clientId) {
          throw new Error("La cuenta no tiene un perfil de cliente válido.");
        }

        account = {
          kind: "client",
          user: {
            id: String(user.clientId),
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address ?? "",
            docId: user.docId ?? "",
            createdAt: user.createdAt,
            password: "",
          },
        };
      } else {
        account = {
          kind: "staff",
          user: {
            id: String(user.id),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role as "admin" | "vendor",
            status: user.status === "inactivo" ? "inactivo" : "activo",
            createdAt: user.createdAt,
            password: "",
          },
        };
      }

      setLockouts((l) => {
        const n = { ...l };
        delete n[key];
        return n;
      });

      onLogin(account);
    } catch (err) {
      const attempts =
        (lock && lock.until <= Date.now() && lock.until > 0
          ? 0
          : (lock?.attempts ?? 0)) + 1;

      if (attempts >= LOCK_ATTEMPTS) {
        setLockouts((l) => ({
          ...l,
          [key]: {
            attempts,
            until: Date.now() + LOCK_MINUTES * 60000,
          },
        }));

        setError(
          `Demasiados intentos fallidos. Acceso bloqueado por ${LOCK_MINUTES} minutos.`,
        );
      } else {
        setLockouts((l) => ({
          ...l,
          [key]: { attempts, until: 0 },
        }));

        setError(
          err instanceof Error
            ? err.message
            : `Correo o contraseña incorrectos. Te queda(n) ${LOCK_ATTEMPTS - attempts} intento(s).`,
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Recuperación pendiente de implementar con envío real de correo
  const sendCode = () => {
    if (!isValidEmail(key)) {
      setErrors({
        email: "Formato de correo inválido",
      });
      return;
    }

    setErrors({
      email: "La recuperación de contraseña estará disponible próximamente.",
    });
  };

  const field = (
    k: string,
    label: string,
    icon: JSX.Element,
    value: string,
    onChange: (v: string) => void,
    type: string,
    onEnter: () => void,
    placeholder = "",
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>

        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setErrors((er) => ({ ...er, [k]: "" }));
          }}
          type={type}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${
            errors[k]
              ? "border-red-400 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        />
      </div>

      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
    </div>
  );

  const banner = (tone: "red" | "amber" | "green", text: string) => (
    <div
      className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 text-xs border ${
        tone === "red"
          ? "bg-red-50 border-red-200 text-red-600"
          : tone === "amber"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-green-50 border-green-200 text-green-700"
      }`}
    >
      {tone === "green" ? (
        <CheckCircle size={14} className="mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      )}

      <p>{text}</p>
    </div>
  );

  const title = (t: string, sub: string) => (
    <>
      <div className="flex justify-center mb-6">
        <Logo size={44} />
      </div>

      <h2
        className="text-2xl font-black text-center text-[#000080] mb-1"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        {t}
      </h2>

      <p className="text-center text-gray-400 text-sm mb-6">{sub}</p>
    </>
  );

  const back = () => {
    setMode("login");
    setErrors({});
    setError("");
  };

  if (mode === "recover-email") {
    return (
      <AuthShell>
        {title(
          "Recuperar contraseña",
          "La recuperación estará disponible próximamente",
        )}

        <div className="space-y-4">
          {field(
            "email",
            "Correo electrónico",
            <Mail size={15} />,
            email,
            setEmail,
            "email",
            sendCode,
            "correo@ejemplo.com",
          )}

          <button
            onClick={sendCode}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25]"
          >
            Solicitar recuperación
          </button>

          <button
            onClick={back}
            className="w-full text-sm text-gray-500 hover:text-[#C8102E] flex items-center justify-center gap-1"
          >
            <ChevronLeft size={14} />
            Volver al inicio de sesión
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {title("Iniciar sesión", "Ingresa tus credenciales para continuar")}

      {mode === "recover-done" &&
        banner("green", "Contraseña actualizada. Ya puedes iniciar sesión.")}

      {notice && !error && banner("amber", notice)}

      {lockedFor > 0
        ? banner(
            "red",
            `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${Math.floor(lockedFor / 60)}:${String(lockedFor % 60).padStart(2, "0")} o recupera tu contraseña.`,
          )
        : error && banner("red", error)}

      <div className="space-y-4">
        {field(
          "email",
          "Correo electrónico",
          <Mail size={15} />,
          email,
          (v) => {
            setEmail(v);
            setError("");
          },
          "email",
          handleLogin,
          "correo@ejemplo.com",
        )}

        {field(
          "password",
          "Contraseña",
          <Lock size={15} />,
          password,
          setPassword,
          "password",
          handleLogin,
          "••••••••",
        )}

        <div className="flex justify-end -mt-2">
          <button
            onClick={() => {
              setMode("recover-email");
              setErrors({});
              setError("");
            }}
            className="text-xs text-[#1560BD] hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={lockedFor > 0 || submitting}
          className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {lockedFor > 0
            ? "Acceso bloqueado"
            : submitting
              ? "Verificando..."
              : "Ingresar"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mt-4">
        ¿No tienes cuenta?{" "}
        <button
          onClick={() => setView("register")}
          className="text-[#C8102E] font-semibold hover:underline"
        >
          Regístrate
        </button>
      </p>

      <button
        onClick={() => setView("catalog")}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
      >
        Ver catálogo como invitado
      </button>
    </AuthShell>
  );
}
