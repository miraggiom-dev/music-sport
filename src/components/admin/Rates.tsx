import { useState } from "react";
import { AlertTriangle, Coins, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast as notify } from "sonner";
import type { ExchangeRate, InternalUser } from "@/types";
import { RATE_STALE_HOURS, fmtDateTime, rateAgeHours } from "./shared";

type RateModal = { rate?: ExchangeRate };

export function AdminRates({
  rates,
  setRates,
  users,
  currentUserId,
}: {
  rates: ExchangeRate[];
  setRates: (rates: ExchangeRate[]) => void;
  users: InternalUser[];
  currentUserId: string;
}) {
  const [modal, setModal] = useState<RateModal | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<ExchangeRate | null>(null);

  const sorted = [...rates].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
  );

  const openModal = (rate?: ExchangeRate) => {
    setModal({ rate });
    setName(rate?.name ?? "");
    setValue(rate ? String(rate.value) : "");
    setMakeActive(rate ? rate.active : !rates.some((item) => item.active));
    setErrors({});
  };

  const closeModal = () => setModal(null);

  const save = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedName = name.trim();
    const parsedValue = Number(value.replace(",", "."));

    if (normalizedName.length < 2 || normalizedName.length > 30) {
      nextErrors.name = "Entre 2 y 30 caracteres";
    } else if (
      rates.some(
        (rate) =>
          rate.id !== modal?.rate?.id &&
          rate.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      nextErrors.name = "Ya existe una tasa con ese nombre";
    }
    if (!/^\d{1,6}([.,]\d{1,4})?$/.test(value.trim()) || !(parsedValue > 0)) {
      nextErrors.value = "Valor positivo, máx. 4 decimales";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const stamp = {
      updatedAt: new Date().toISOString(),
      userId: currentUserId,
    };
    let nextRates = modal?.rate
      ? rates.map((rate) =>
          rate.id === modal.rate!.id
            ? {
                ...rate,
                name: normalizedName,
                value: Math.round(parsedValue * 10000) / 10000,
                ...stamp,
              }
            : rate,
        )
      : [
          ...rates,
          {
            id: `T${Date.now()}`,
            name: normalizedName,
            value: Math.round(parsedValue * 10000) / 10000,
            active: false,
            ...stamp,
          },
        ];

    const savedId = modal?.rate?.id ?? nextRates[nextRates.length - 1].id;
    if (makeActive)
      nextRates = nextRates.map((rate) => ({
        ...rate,
        active: rate.id === savedId,
      }));
    setRates(nextRates);
    closeModal();
    notify.success(modal?.rate ? "Tasa actualizada" : "Tasa registrada");
  };

  const remove = () => {
    if (!toDelete) return;
    setRates(rates.filter((rate) => rate.id !== toDelete.id));
    setToDelete(null);
    notify.success("Tasa eliminada");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm leading-5 text-gray-500">
          Los precios se guardan en dólares. La tasa activa solo se usa para
          mostrar el equivalente en bolívares y para los pagos por transferencia
          o pago móvil. Actualízala a diario.
        </p>
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a90d26]"
        >
          <Plus size={17} strokeWidth={2.5} />
          Nueva tasa
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex min-h-[184px] flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-4 text-center shadow-sm">
          <Coins size={40} className="mb-3 text-gray-200" strokeWidth={1.8} />
          <p className="text-sm text-gray-500">
            No hay tasas registradas. Registra la tasa BCV para mostrar precios
            en bolívares.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((rate) => {
            const stale = rateAgeHours(rate) > RATE_STALE_HOURS;
            return (
              <div
                key={rate.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${rate.active ? "border-[#000080]" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{rate.name}</p>
                    <p className="text-2xl font-black text-[#000080]">
                      {rate.value.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        Bs/USD
                      </span>
                    </p>
                  </div>
                  {rate.active ? (
                    <span className="rounded-full bg-[#000080] px-2 py-0.5 text-xs text-white">
                      Activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setRates(
                          rates.map((item) => ({
                            ...item,
                            active: item.id === rate.id,
                          })),
                        )
                      }
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Usar como activa
                    </button>
                  )}
                </div>
                <p
                  className={`mt-3 text-xs ${stale ? "text-amber-700" : "text-gray-400"}`}
                >
                  {stale && <AlertTriangle size={11} className="mr-1 inline" />}
                  Actualizada {fmtDateTime(rate.updatedAt)} por{" "}
                  {users.find((user) => user.id === rate.userId)?.name ??
                    "Usuario eliminado"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(rate)}
                    className="flex-1 rounded-lg border py-2 text-sm"
                  >
                    <RefreshCw size={13} className="mr-1 inline" />
                    Actualizar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      rate.active
                        ? notify.error("No puedes eliminar la tasa activa")
                        : setToDelete(rate)
                    }
                    className="rounded-lg border px-3 py-2 text-gray-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeModal()
          }
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rate-modal-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="rate-modal-title" className="font-bold text-[#000080]">
                {modal.rate ? "Actualizar tasa" : "Nueva tasa"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar"
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rate-name"
                  className="mb-1 block text-xs font-semibold text-gray-600"
                >
                  Nombre <span className="text-gray-500">*</span>
                </label>
                <input
                  id="rate-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej. Dólar BCV, Euro BCV..."
                  className={`w-full rounded-xl border bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#000080] ${errors.name ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="rate-value"
                  className="mb-1 block text-xs font-semibold text-gray-600"
                >
                  Valor (Bs. por 1 USD) <span className="text-gray-500">*</span>
                </label>
                <input
                  id="rate-value"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="Ej. 873,87"
                  className={`w-full rounded-xl border bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#000080] ${errors.value ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.value && (
                  <p className="mt-1 text-xs text-red-500">{errors.value}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={makeActive}
                  onChange={(event) => setMakeActive(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#C8102E]"
                />
                Usar como tasa activa
              </label>
              <p className="text-xs leading-4 text-gray-400">
                Se registrará la fecha y hora actual y tu usuario como
                responsable.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="flex-1 rounded-xl bg-[#C8102E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a90d26]"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="space-y-4 rounded-xl bg-white p-6 shadow-2xl">
            <p>¿Eliminar la tasa {toDelete.name}?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="rounded border px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
