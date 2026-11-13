import { afterEach, describe, expect, it, vi } from "vitest";

// Las fechas de la app son de Caracas; se fija la zona para que los tests
// den lo mismo en cualquier PC o en CI.
vi.stubEnv("TZ", "America/Caracas");
import {
  currentPeriodKey,
  escapeHtml,
  isValidPrice,
  isValidStock,
  round2,
} from "@/components/shared";
import { stockStatus } from "./Inventory";
import { parseRateInput } from "./Rates";
import { trendBuckets } from "./Reports";

afterEach(() => vi.useRealTimers());

describe("trendBuckets (Informes)", () => {
  it("los 7 días cruzan bien el cambio de mes", () => {
    const keys = trendBuckets("diario", new Date(2026, 2, 2)).map((b) => b.key);
    expect(keys).toEqual([
      "2026-02-24",
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });
});

describe("currentPeriodKey (Informes)", () => {
  it("usa la fecha local, no UTC (21:30 en Caracas)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T21:30:00-04:00"));
    expect(currentPeriodKey("diario")).toBe("2026-11-11");
    expect(currentPeriodKey("mensual")).toBe("2026-11");
  });

  it("último día del mes a las 23:00 sigue siendo ese mes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-30T23:00:00-04:00"));
    expect(currentPeriodKey("mensual")).toBe("2026-11");
  });
});

describe("stockStatus (Inventario, Dashboard, Informes)", () => {
  it.each([
    [0, 2, "agotado"],
    [1, 2, "bajo"],
    [2, 2, "bajo"],
    [3, 2, "normal"],
  ] as const)("stock %i con mínimo %i es %s", (stock, minStock, expected) => {
    expect(stockStatus({ stock, minStock })).toBe(expected);
  });
});

describe("validaciones de producto", () => {
  it("precio", () => {
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(-1)).toBe(false);
    expect(isValidPrice(0.01)).toBe(true);
    expect(isValidPrice(1_000_000)).toBe(false);
    expect(isValidPrice(NaN)).toBe(false);
  });

  it("stock", () => {
    expect(isValidStock(0)).toBe(true);
    expect(isValidStock(1.5)).toBe(false);
    expect(isValidStock(-1)).toBe(false);
    expect(isValidStock(NaN)).toBe(false);
  });
});

describe("precio de producto con redondeo", () => {
  it("un precio que redondea a 0 no es válido", () => {
    expect(isValidPrice(round2(0.004))).toBe(false);
    expect(isValidPrice(round2(0.005))).toBe(true);
  });
});

describe("escapeHtml (PDF de informes)", () => {
  it("neutraliza HTML en nombres de producto o cliente", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});

describe("parseRateInput (Tasas)", () => {
  it.each([
    ["873,87", 873.87],
    ["873.87", 873.87],
    ["1.234,56", 1234.56],
    ["1.234.567", null], // supera el máximo
    ["36,12345", null],
    ["0", null],
    ["-5", null],
    ["abc", null],
    ["", null],
  ] as const)("%s → %s", (raw, expected) => {
    expect(parseRateInput(raw)).toBe(expected);
  });
});
