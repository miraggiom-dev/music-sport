import { useEffect, useState } from "react";
const LOCK_ATTEMPTS = 3;
const LOCK_MINUTES = 5;
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
import { AuthShell } from "./AuthShell";

export function LoginView({
  setView,
  findAccount,
  onLogin,
  lockouts,
  setLockouts,
  resetPassword,
  notice,
}: {
  setView: (v: View) => void;
  findAccount: (email: string) => Account | null;
  onLogin: (a: Account) => void;
  lockouts: Record<string, Lockout>;
  setLockouts: React.Dispatch<React.SetStateAction<Record<string, Lockout>>>;
  resetPassword: (a: Account, pass: string) => void;
  notice: string;
}) {
  const [mode, setMode] = useState<
    "login" | "recover-email" | "recover-code" | "recover-done"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [rec, setRec] = useState({ code: "", sent: "", pass: "", confirm: "" });
  const key = email.trim().toLowerCase();
  const lock = lockouts[key];
  const lockedFor =
    lock && lock.until > now ? Math.ceil((lock.until - now) / 1000) : 0;

  useEffect(() => {
    if (!lockedFor) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedFor]);

  const handleLogin = () => {
    setNow(Date.now());
    const e: Record<string, string> = {};
    if (!key) e.email = "Ingresa tu correo";
    else if (!isValidEmail(key)) e.email = "Formato de correo inválido";
    if (!password) e.password = "Ingresa tu contraseña";
    setErrors(e);
    setError("");
    if (Object.keys(e).length) return;
    if (lock && lock.until > Date.now()) return;

    const acc = findAccount(key);
    if (acc && acc.user.password === password) {
      if (acc.kind === "staff" && acc.user.status === "inactivo") {
        setError("Cuenta suspendida. Contacta al administrador.");
        return;
      }
      setLockouts((l) => {
        const n = { ...l };
        delete n[key];
        return n;
      });
      onLogin(acc);
      return;
    }
    const attempts =
      (lock && lock.until <= Date.now() && lock.until > 0
        ? 0
        : (lock?.attempts ?? 0)) + 1;
    if (attempts >= LOCK_ATTEMPTS) {
      setLockouts((l) => ({
        ...l,
        [key]: { attempts, until: Date.now() + LOCK_MINUTES * 60000 },
      }));
      setError(
        `Demasiados intentos fallidos. Acceso bloqueado por ${LOCK_MINUTES} minutos.`,
      );
    } else {
      setLockouts((l) => ({ ...l, [key]: { attempts, until: 0 } }));
      setError(
        `Correo o contraseña incorrectos. Te queda(n) ${LOCK_ATTEMPTS - attempts} intento(s).`,
      );
    }
  };

  const sendCode = () => {
    if (!isValidEmail(key)) {
      setErrors({ email: "Formato de correo inválido" });
      return;
    }
    if (!findAccount(key)) {
      setErrors({ email: "No existe una cuenta registrada con ese correo" });
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setRec({ code: "", sent: code, pass: "", confirm: "" });
    setErrors({});
    notify.info(`Enlace de recuperación enviado a ${key}`, {
      description: `Simulación: tu código es ${code}`,
      duration: 15000,
    });
    setMode("recover-code");
  };
  const confirmReset = () => {
    const e: Record<string, string> = {};
    if (rec.code.trim() !== rec.sent) e.code = "Código incorrecto";
    if (!isValidPass(rec.pass)) e.pass = "Entre 6 y 50 caracteres";
    if (rec.pass !== rec.confirm) e.confirm = "Las contraseñas no coinciden";
    setErrors(e);
    if (Object.keys(e).length) return;
    const acc = findAccount(key);
    if (acc) resetPassword(acc, rec.pass);
    setLockouts((l) => {
      const n = { ...l };
      delete n[key];
      return n;
    });
    setPassword("");
    setMode("recover-done");
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
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors[k] ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}`}
        />
      </div>
      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
    </div>
  );
  const banner = (tone: "red" | "amber" | "green", text: string) => (
    <div
      className={`rounded-xl px-4 py-3 mb-4 flex items-start gap-2 text-xs border ${tone === "red" ? "bg-red-50 border-red-200 text-red-600" : tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-green-50 border-green-200 text-green-700"}`}
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

  if (mode === "recover-email")
    return (
      <AuthShell>
        {title(
          "Recuperar contraseña",
          "Te enviaremos un código a tu correo registrado",
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
            Enviar código
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
  if (mode === "recover-code")
    return (
      <AuthShell>
        {title("Nueva contraseña", `Ingresa el código enviado a ${key}`)}
        <div className="space-y-4">
          {field(
            "code",
            "Código de verificación",
            <KeyRound size={15} />,
            rec.code,
            (v) => setRec((r) => ({ ...r, code: v })),
            "text",
            confirmReset,
            "6 dígitos",
          )}
          {field(
            "pass",
            "Nueva contraseña",
            <Lock size={15} />,
            rec.pass,
            (v) => setRec((r) => ({ ...r, pass: v })),
            "password",
            confirmReset,
          )}
          {field(
            "confirm",
            "Confirmar contraseña",
            <Lock size={15} />,
            rec.confirm,
            (v) => setRec((r) => ({ ...r, confirm: v })),
            "password",
            confirmReset,
          )}
          <button
            onClick={confirmReset}
            className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25]"
          >
            Restablecer contraseña
          </button>
          <button
            onClick={sendCode}
            className="w-full text-xs text-gray-500 hover:text-[#C8102E]"
          >
            Reenviar código
          </button>
          <button
            onClick={back}
            className="w-full text-sm text-gray-500 hover:text-[#C8102E] flex items-center justify-center gap-1"
          >
            <ChevronLeft size={14} />
            Cancelar
          </button>
        </div>
      </AuthShell>
    );

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
          disabled={lockedFor > 0}
          className="w-full py-3 rounded-xl bg-[#C8102E] text-white font-bold hover:bg-[#a80d25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {lockedFor > 0 ? "Acceso bloqueado" : "Ingresar"}
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
