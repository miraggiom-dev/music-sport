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

type LoginMode = "login" | "recover-email" | "recover-code" | "recover-done";

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
  const [mode, setMode] = useState<LoginMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [lockedFor]);

  const handleLogin = async () => {
    if (submitting) return;

    setNow(Date.now());

    const validationErrors: Record<string, string> = {};

    if (!key) validationErrors.email = "Ingresa tu correo";
    else if (!isValidEmail(key)) {
      validationErrors.email = "Formato de correo inválido";
    }

    if (!password) validationErrors.password = "Ingresa tu contraseña";

    setErrors(validationErrors);
    setError("");

    if (Object.keys(validationErrors).length) return;
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

      setLockouts((current) => {
        const updated = { ...current };
        delete updated[key];
        return updated;
      });

      onLogin(account);
    } catch (err) {
      const attempts =
        (lock && lock.until <= Date.now() && lock.until > 0
          ? 0
          : (lock?.attempts ?? 0)) + 1;

      if (attempts >= LOCK_ATTEMPTS) {
        setLockouts((current) => ({
          ...current,
          [key]: {
            attempts,
            until: Date.now() + LOCK_MINUTES * 60000,
          },
        }));

        setError(
          `Demasiados intentos fallidos. Acceso bloqueado por ${LOCK_MINUTES} minutos.`,
        );
      } else {
        setLockouts((current) => ({
          ...current,
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

  const sendCode = async () => {
    if (submitting) return;

    if (!isValidEmail(key)) {
      setErrors({ email: "Formato de correo inválido" });
      return;
    }

    setErrors({});
    setError("");
    setSubmitting(true);

    try {
      await authService.requestPasswordReset(key);
      setMode("recover-code");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo solicitar la recuperación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (submitting) return;

    const validationErrors: Record<string, string> = {};

    if (!/^\d{8}$/.test(recoveryCode)) {
      validationErrors.code = "Introduce el código de 8 dígitos.";
    }

    if (newPassword.length < 6 || newPassword.length > 50) {
      validationErrors.newPassword =
        "La contraseña debe tener entre 6 y 50 caracteres.";
    }

    if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(validationErrors);
    setError("");

    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);

    try {
      await authService.resetPassword(key, recoveryCode, newPassword);

      setPassword("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setError("");
      setMode("recover-done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo restablecer la contraseña.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    fieldKey: string,
    label: string,
    icon: JSX.Element,
    value: string,
    onChange: (value: string) => void,
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
          onChange={(event) => {
            onChange(event.target.value);
            setErrors((current) => ({
              ...current,
              [fieldKey]: "",
            }));
          }}
          type={type}
          placeholder={placeholder}
          onKeyDown={(event) => event.key === "Enter" && onEnter()}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${
            errors[fieldKey]
              ? "border-red-400 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        />
      </div>

      {errors[fieldKey] && (
        <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>
      )}
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

  const title = (heading: string, subtitle: string) => (
    <>
      <div className="flex justify-center mb-6">
        <Logo size={44} />
      </div>

      <h2
        className="text-2xl font-black text-center text-[#000080] mb-1"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        {heading}
      </h2>

      <p className="text-center text-gray-400 text-sm mb-6">{subtitle}</p>
    </>
  );

  const back = () => {
    setMode("login");
    setErrors({});
    setError("");
    setRecoveryCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (mode === "recover-email") {
    return (
      <AuthShell>
        {title(
          "Recuperar contraseña",
          "Introduce el correo asociado a tu cuenta",
        )}

        {error && banner("red", error)}

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
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] disabled:opacity-50"
          >
            {submitting ? "Generando código..." : "Solicitar recuperación"}
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

  if (mode === "recover-code") {
    return (
      <AuthShell>
        {title(
          "Restablecer contraseña",
          "Introduce el código y establece una contraseña nueva",
        )}

        {banner(
          "amber",
          "Modo de prueba: el código de recuperación aparece en la consola del servidor. Tiene una vigencia de 15 minutos.",
        )}

        {error && banner("red", error)}

        <p className="text-sm text-gray-600 mb-4">
          Correo de la cuenta: <strong>{key}</strong>
        </p>

        <div className="space-y-4">
          {field(
            "code",
            "Código de recuperación",
            <Lock size={15} />,
            recoveryCode,
            setRecoveryCode,
            "text",
            handleResetPassword,
            "Código de 8 dígitos",
          )}

          {field(
            "newPassword",
            "Nueva contraseña",
            <Lock size={15} />,
            newPassword,
            setNewPassword,
            "password",
            handleResetPassword,
            "Mínimo 6 caracteres",
          )}

          {field(
            "confirmPassword",
            "Confirmar nueva contraseña",
            <Lock size={15} />,
            confirmPassword,
            setConfirmPassword,
            "password",
            handleResetPassword,
            "Repite la contraseña",
          )}

          <button
            onClick={handleResetPassword}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] disabled:opacity-50"
          >
            {submitting ? "Actualizando..." : "Cambiar contraseña"}
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
          (value) => {
            setEmail(value);
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
