import { describe, expect, it } from "vitest";
import { fmtDay, NEXT_STATUS } from "@/components/shared";

describe("purchase flow date and order invariants", () => {
  it("formats date-only order values in the local calendar", () => {
    expect(fmtDay("2026-11-16")).toBe("16/11/2026");
  });

  it("does not allow terminal orders to transition", () => {
    expect(NEXT_STATUS.completado).toEqual([]);
    expect(NEXT_STATUS.cancelado).toEqual([]);
  });

  it("allows client cancellation only from a pending order", () => {
    expect(NEXT_STATUS.pendiente).toContain("cancelado");
    expect(NEXT_STATUS.completado).not.toContain("cancelado");
  });
});
