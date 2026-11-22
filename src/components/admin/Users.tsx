
import type { InternalUser } from "@/types";
import {
  AlertTriangle,
  Edit2,
  Lock,
  Mail,
  Phone,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast as notify } from "sonner";
import { userService } from "@/services/userService";
import {
  Input,
  isValidEmail,
  isValidName,
  isValidPass,
  isValidPhone,
  toISODate,
} from "./shared";

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
          <AlertTriangle className="text-red-600" size={22} />
        </div>
        <h3 className="text-center font-bold text-gray-800">{title}</h3>
        <p className="text-center text-sm text-gray-500">{message}</p>
        {children}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsers({
  currentUserId,
  users,
  setUsers,
  setCurrentUser,
  clientEmails,
}: {
  currentUserId: string;
  users: InternalUser[];
  setUsers: (u: InternalUser[]) => void;
  setCurrentUser: (u: InternalUser) => void;
  clientEmails: string[];
}) {
  const [modal, setModal] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteUser, setDeleteUser] = useState<InternalUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const blank: InternalUser = {
    id: "",
    name: "",
    email: "",
    role: "vendor",
    status: "activo",
    phone: "",
    createdAt: toISODate(new Date()),
    password: "",
  };

  const [form, setForm] = useState<InternalUser>(blank);

  const isEditing = users.some((u) => u.id === form.id);

  // Cargar los usuarios directamente desde SQLite.
  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        const databaseUsers = await userService.getAll();

        if (mounted) {
          setUsers(databaseUsers);
        }
      } catch (error) {
        if (mounted) {
          notify.error(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los usuarios",
          );
        }
      } finally {
        if (mounted) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [setUsers]);

  const allEmails = [
    ...users.map((u) => ({ id: u.id, email: u.email })),
    ...clientEmails.map((e) => ({ id: "client", email: e })),
  ];

  const handleSave = async () => {
    const e: Record<string, string> = {};

    if (!isValidName(form.name)) {
      e.name = "Nombre requerido (mín. 3 caracteres)";
    }

    if (!isValidEmail(form.email)) {
      e.email = "Correo electrónico inválido";
    } else if (
      allEmails.some(
        (x) =>
          x.email.toLowerCase() === form.email.trim().toLowerCase() &&
          x.id !== form.id,
      )
    ) {
      e.email = "El correo ya se encuentra en uso";
    }

    if (form.phone.trim() && !isValidPhone(form.phone)) {
      e.phone = "Teléfono inválido (ej: 0414-1234567)";
    }

    if (!isEditing && !isValidPass(newPass)) {
      e.password = "Contraseña requerida (6-50 caracteres)";
    }

    if (isEditing && newPass && !isValidPass(newPass)) {
      e.password = "Contraseña: entre 6 y 50 caracteres";
    }

    if (form.id === currentUserId && form.role !== "admin") {
      e.role = "No puedes quitarte el rol de administrador";
    }

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaving(true);

    const userData = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
    };

    try {
      if (isEditing) {
        const updatedUser = await userService.update(form.id, {
          ...userData,
          ...(newPass ? { password: newPass } : {}),
        });

        setUsers(
          users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
        );

        if (updatedUser.id === currentUserId) {
          setCurrentUser(updatedUser);
        }

        notify.success("Usuario actualizado correctamente");
      } else {
        const createdUser = await userService.create({
          ...userData,
          password: newPass,
        });

        setUsers([...users, createdUser]);

        notify.success("Usuario creado y habilitado");
      }

      setModal(false);
      setErrors({});
      setNewPass("");
      setForm(blank);
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el usuario",
      );
    } finally {
      setSaving(false);
    }
  };

  const tryDelete = (u: InternalUser) => {
    if (u.id === currentUserId) {
      notify.error("No puedes eliminar tu propia cuenta");
      return;
    }

    setDeleteUser(u);
  };

  const toggleStatus = async (u: InternalUser) => {
    if (u.id === currentUserId) {
      notify.error("No puedes suspender tu propia cuenta");
      return;
    }

    const newStatus = u.status === "activo" ? "inactivo" : "activo";

    setProcessingId(u.id);

    try {
      await userService.setStatus(u.id, newStatus);

      setUsers(
        users.map((x) =>
          x.id === u.id ? { ...x, status: newStatus } : x,
        ),
      );

      notify.success(
        newStatus === "inactivo"
          ? `${u.name} suspendido (historial conservado)`
          : `${u.name} reactivado`,
      );
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del usuario",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    const userToDelete = deleteUser;

    setProcessingId(userToDelete.id);

    try {
      await userService.remove(userToDelete.id);

      setUsers(users.filter((x) => x.id !== userToDelete.id));
      setDeleteUser(null);

      notify.success("Usuario eliminado correctamente");
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setForm({ ...blank, id: "" });
            setNewPass("");
            setErrors({});
            setModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-[#a80d25] transition-colors"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {loadingUsers ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          No hay usuarios registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#000080] to-[#1560BD] flex items-center justify-center text-white font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {u.role === "admin" ? "Administrador" : "Vendedor"}
                      {u.id === currentUserId && " · Tú"}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === "activo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {u.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Mail size={11} />
                  {u.email}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Phone size={11} />
                  {u.phone || "—"}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setForm(u);
                    setNewPass("");
                    setErrors({});
                    setModal(true);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 size={12} />
                  Editar
                </button>

                <button
                  onClick={() => toggleStatus(u)}
                  disabled={
                    u.id === currentUserId || processingId === u.id
                  }
                  className="flex-1 py-1.5 disabled:opacity-40 text-xs font-medium rounded-lg bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 transition-colors flex items-center justify-center gap-1"
                >
                  {u.status === "activo" ? (
                    <ToggleRight size={12} />
                  ) : (
                    <ToggleLeft size={12} />
                  )}
                  {u.status === "activo" ? "Suspender" : "Activar"}
                </button>

                <button
                  onClick={() => tryDelete(u)}
                  disabled={
                    u.id === currentUserId || processingId === u.id
                  }
                  title={
                    u.id === currentUserId
                      ? "No puedes eliminar tu propia cuenta"
                      : undefined
                  }
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  {u.id === currentUserId ? (
                    <Lock size={12} />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#000080] flex items-center justify-between">
              <h2
                className="text-white font-bold"
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: "1.2rem",
                }}
              >
                {isEditing ? "Editar usuario" : "Nuevo usuario interno"}
              </h2>

              <button
                onClick={() => setModal(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(["name", "email", "phone"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {k === "name"
                      ? "Nombre completo *"
                      : k === "email"
                        ? "Correo electrónico *"
                        : "Teléfono"}
                  </label>

                  <input
                    value={form[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: e.target.value }))
                    }
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors[k] ? "border-red-400" : "border-gray-200 bg-gray-50"}`}
                  />

                  {errors[k] && (
                    <p className="text-red-500 text-xs mt-1">{errors[k]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isEditing
                    ? "Nueva contraseña (opcional)"
                    : "Contraseña inicial *"}
                </label>

                <Input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder={
                    isEditing
                      ? "Dejar en blanco para conservar"
                      : "Mín. 6 caracteres"
                  }
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30 ${errors.password ? "border-red-400" : "border-gray-200 bg-gray-50"}`}
                />

                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Rol *
                </label>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as InternalUser["role"],
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border bg-gray-50 text-sm focus:outline-none ${errors.role ? "border-red-400" : "border-gray-200"}`}
                >
                  <option value="vendor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>

                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setModal(false)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a80d25] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <ConfirmDialog
          title="¿Eliminar usuario interno?"
          message={`Se eliminará la cuenta de ${deleteUser.name}. Si solo necesitas quitarle el acceso temporalmente, usa "Suspender".`}
          confirmLabel="Eliminar"
          onCancel={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
