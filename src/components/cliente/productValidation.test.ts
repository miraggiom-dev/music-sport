import { describe, expect, it } from "vitest";
import { getValidProducts, safeImageSource, validateProducts } from "./productValidation";
import type { Product } from "@/types";

const product: Product = {
  id: "P001",
  name: "Producto válido",
  category: "Música",
  subcategory: "Audio",
  price: 10,
  stock: 1,
  minStock: 1,
  description: "Descripción válida",
  image: "https://example.com/image.jpg",
  sku: "AUD-001",
  active: true,
};

describe("product validation", () => {
  it("detects duplicate IDs and invalid fields", () => {
    const invalid = { ...product, id: "P001", price: 0, stock: -1 };
    const issues = validateProducts([product, invalid]);
    expect(issues.map((issue) => issue.message)).toEqual([
      "ID duplicado",
      "Precio inválido",
      "Stock inválido",
    ]);
    expect(getValidProducts([product, invalid])).toEqual([product]);
  });

  it("allows HTTPS or same-origin images and rejects unsafe protocols", () => {
    expect(safeImageSource("https://example.com/image.jpg", "fallback")).toBe(
      "https://example.com/image.jpg",
    );
    expect(safeImageSource("javascript:alert(1)", "fallback")).toBe("fallback");
    expect(safeImageSource("", "fallback")).toBe("fallback");
  });
});
