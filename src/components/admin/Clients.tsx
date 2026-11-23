
import type { Client, Order } from "@/types";
import {
  Search,
  Trash2,
  Plus,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast as notify } from "sonner";
import { clientService } from "@/services/clientService";
import { ConfirmDialog, fmt, PAID_STATUSES } from "./shared";

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  docId: string;
  password: string;
};

const emptyForm: ClientForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  docId: "",
  password: "",
};

export function AdminClients({
  clients,
  setClients,
  orders,
}: {
  clients: Client[];
  setClients: (c: Client[]) => void;
  orders: Order[];
}) {
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getAll();
        setClients(data);
      } catch (error) {
        notify.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los clientes.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [setClients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      docId: client.docId,
      password: "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingClient(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.docId.trim() ||
      !form.phone.trim()
    ) {
      notify.error("Completa los campos obligatorios.");
      return;
    }

    if (!editingClient && !form.password.trim()) {
      notify.error("La contraseña es obligatoria para crear un cliente.");
      return;
    }

    setSaving(true);

    try {
      if (editingClient) {
        const updated = await clientService.update(editingClient.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          docId: form.docId.trim(),
        });

        setClients(
          clients.map((client) =>
            client.id === editingClient.id ? updated : client,
          ),
        );

        notify.success("Cliente actualizado correctamente.");
      } else {
        const created = await clientService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          docId: form.docId.trim(),
          password: form.password,
        });

        setClients([...clients, created]);
        notify.success("Cliente creado correctamente.");
      }

      closeForm();
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const tryDelete = (client: Client) => {
    const clientOrders = orders.filter(
      (order) => order.clientId === client.id,
    );

    if (clientOrders.length > 0) {
      notify.error(`No se puede eliminar a ${client.name}`, {
        description:
          "Este cliente tiene órdenes asociadas. Su cuenta debe conservarse para mantener el historial de compras.",
      });
      return;
    }

    setToDelete(client);
  };

  const handleDelete = async () => {
    if (!toDelete || deleting) return;

    setDeleting(true);

    try {
      await clientService.remove(toDelete.id);

      setClients(clients.filter((client) => client.id !== toDelete.id));
      setToDelete(null);
      notify.success("Cliente eliminado correctamente.");
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el cliente.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const q = search.trim().toLowerCase();

  const filtered = clients.filter((client) =>
    [
      client.name,
      client.email,
      client.docId,
      client.phone || "",
    ].some((value) => value.toLowerCase().includes(q)),
  );

  const ordersByClient = new Map<string, Order[]>();

  for (const order of orders) {
    const list = ordersByClient.get(order.clientId);

    if (list) {
      list.push(order);
    } else {
      ordersByClient.set(order.clientId, [order]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo, cédula/RIF o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000080] text-white text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Cliente",
                  "Contacto",
                  "Dirección",
                  "Órdenes",
                  "Total Gastado",
                  "Miembro desde",
                  "Acciones",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <Loader2
                      size={22}
                      className="animate-spin mx-auto text-gray-400"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Cargando clientes...
                    </p>
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((client) => {
                    const clientOrders =
                      ordersByClient.get(client.id) ?? [];

                    const totalSpent = clientOrders
                      .filter((order) =>
                        PAID_STATUSES.includes(order.status),
                      )
                      .reduce(
                        (total, order) => total + order.total,
                        0,
                      );

                    return (
                      <tr
                        key={client.id}
                        className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8102E] to-[#800000] flex items-center justify-center text-white font-bold text-xs">
                              {client.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="font-medium text-gray-800">
                                {client.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {client.docId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          <p className="text-gray-700">
                            {client.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            {client.phone || "Sin teléfono"}
                          </p>
                        </td>

                        <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                          {client.address || "Sin dirección"}
                        </td>

                        <td className="px-5 py-3 font-semibold text-center text-[#000080]">
                          {clientOrders.length}
                        </td>

                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {fmt(totalSpent)}
                        </td>

                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {client.createdAt}
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(client)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-700"
                              aria-label="Editar cliente"
                              title="Editar cliente"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => tryDelete(client)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                              aria-label="Eliminar cliente"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-gray-400 text-sm"
                      >
                        No se encontraron clientes
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingClient ? "Editar cliente" : "Nuevo cliente"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {editingClient
                    ? "Actualiza la información del cliente."
                    : "Completa los datos para registrar un cliente."}
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Cerrar formulario"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Nombre del cliente"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula / RIF *
                  </label>
                  <input
                    value={form.docId}
                    onChange={(e) =>
                      setForm({ ...form, docId: e.target.value })
                    }
                    required
                    placeholder="V-12345678"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                    placeholder="Número de teléfono"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Dirección del cliente"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {!editingClient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    minLength={6}
                    maxLength={50}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              <p className="text-xs text-gray-400">
                Los campos marcados con * son obligatorios.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000080] text-white text-sm font-medium hover:bg-blue-900 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  {saving
                    ? "Guardando..."
                    : editingClient
                      ? "Guardar cambios"
                      : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar cliente?"
          message={`Se eliminará la cuenta de ${toDelete.name}. Esta operación no se permitirá si tiene órdenes asociadas.`}
          confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
          onCancel={() => {
            if (!deleting) setToDelete(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
