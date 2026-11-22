import { describe, expect, it } from "vitest";
import {
  fmtDay,
  NEXT_STATUS,
  orderLineUnitPrice,
} from "@/components/shared";
import type { OrderLine, Product } from "@/types";

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

  it("keeps the historical unit price after the catalog price changes", () => {
    const product: Product = {
      id: "P001",
      name: "Producto",
      category: "Deportes",
      subcategory: "Prueba",
      price: 120,
      stock: 5,
      minStock: 1,
      description: "Producto de prueba",
      image: "",
      sku: "PR-001",
      active: true,
    };
    const historicalLine: OrderLine = {
      product: { ...product, price: 100 },
      qty: 2,
      productId: "P001",
      productName: "Producto",
      sku: "PR-001",
      unitPrice: 100,
    };

    expect(orderLineUnitPrice(historicalLine)).toBe(100);
    expect(orderLineUnitPrice(historicalLine) * historicalLine.qty).toBe(200);
  });
});
