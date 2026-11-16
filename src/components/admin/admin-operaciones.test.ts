import { describe, expect, it, vi } from "vitest";

// Las fechas de la app son de Caracas; se fija la zona para que los tests
// den lo mismo en cualquier PC o en CI.
vi.stubEnv("TZ", "America/Caracas");
import { NEXT_STATUS, OPEN_STATUSES, PAID_STATUSES } from "@/components/shared";
import type { Order } from "@/types";
import { niceCeil, salesByPeriod } from "./Dashboard";
import { newestFirst } from "./Orders";

const order = (
  id: string,
  date: string,
  total: number,
  status: Order["status"] = "completado",
) => ({ id, date, total, status, items: [] }) as unknown as Order;

describe("salesByPeriod (Dashboard)", () => {
  const now = new Date(2026, 10, 15); // 15 nov 2026, hora local

  it("agrupa las ventas pagadas por mes", () => {
    const data = salesByPeriod(
      [
        order("A", "2026-11-03", 100),
        order("B", "2026-09-10", 50),
        order("C", "2026-11-20", 25.5),
      ],
      "mensual",
      now,
    );
    expect(data.map((d) => d.label)).toEqual([
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
    ]);
    expect(data.map((d) => d.ventas)).toEqual([0, 0, 0, 50, 0, 125.5]);
    expect(data[data.length - 1].ordenes).toBe(2);
  });

  it("ignora órdenes pendientes y canceladas", () => {
    const data = salesByPeriod(
      [
        order("A", "2026-11-03", 100, "pendiente"),
        order("B", "2026-11-04", 80, "cancelado"),
      ],
      "mensual",
      now,
    );
    expect(data.every((d) => d.ventas === 0)).toBe(true);
  });

  it("no suma órdenes fuera de la ventana", () => {
    const data = salesByPeriod([order("A", "2025-01-01", 999)], "mensual", now);
    expect(data.reduce((a, d) => a + d.ventas, 0)).toBe(0);
  });
});

describe("transiciones de órdenes", () => {
  it("no permite salir de completado ni de cancelado", () => {
    expect(NEXT_STATUS.completado).toEqual([]);
    expect(NEXT_STATUS.cancelado).toEqual([]);
  });

  it("despachado no se puede cancelar", () => {
    expect(NEXT_STATUS.despachado).not.toContain("cancelado");
  });

  it("toda transición lleva a un estado conocido", () => {
    const all = new Set([
      ...OPEN_STATUSES,
      ...PAID_STATUSES,
      "cancelado",
      "completado",
    ]);
    Object.values(NEXT_STATUS)
      .flat()
      .forEach((s) => expect(all.has(s)).toBe(true));
  });
});

describe("newestFirst (Órdenes, Dashboard)", () => {
  it("ordena por fecha y desempata por número de orden", () => {
    const sorted = [
      order("ORD-1001", "2026-11-10", 1),
      order("ORD-1003", "2026-11-11", 1),
      order("ORD-1002", "2026-11-11", 1),
    ].sort(newestFirst);
    expect(sorted.map((o) => o.id)).toEqual([
      "ORD-1003",
      "ORD-1002",
      "ORD-1001",
    ]);
  });
});

describe("niceCeil (eje del gráfico del Dashboard)", () => {
  it.each([
    [0, 4],
    [0.5, 0.5],
    [3, 5],
    [154.5, 200],
    [240, 250],
    [1000, 1000],
  ])("%s → %s", (n, expected) => {
    expect(niceCeil(n)).toBe(expected);
  });
});
