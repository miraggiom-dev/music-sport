import { describe, expect, it } from "vitest";
import {
  catalogFiltersSearch,
  filterCatalogProducts,
  getCatalogSubcategories,
  isValidCatalogQuantity,
  parseCatalogFilters,
} from "./catalogFilters";
import type { Product } from "@/types";

const products: Product[] = [
  {
    id: "P001",
    name: "Guitarra acústica",
    category: "Música",
    subcategory: "Cuerdas",
    price: 100,
    stock: 2,
    minStock: 1,
    description: "Instrumento para principiantes",
    image: "",
    sku: "GTR-001",
    active: true,
  },
  {
    id: "P002",
    name: "Balón de fútbol",
    category: "Deportes",
    subcategory: "Fútbol",
    price: 30,
    stock: 0,
    minStock: 1,
    description: "Balón para entrenamiento",
    image: "",
    sku: "FUT-001",
    active: true,
  },
  {
    id: "P003",
    name: "Producto oculto",
    category: "Música",
    subcategory: "Audio",
    price: 50,
    stock: 4,
    minStock: 1,
    description: "No debe aparecer",
    image: "",
    sku: "AUD-001",
    active: false,
  },
];

describe("catalog filters", () => {
  it("filters by text, category, subcategory, active state, and stock", () => {
    expect(
      filterCatalogProducts(products, {
        search: "guitarra",
        category: "Música",
        subcategory: "Cuerdas",
      }).map((product) => product.id),
    ).toEqual(["P001"]);
    expect(
      filterCatalogProducts(products, {
        search: "",
        category: "Deportes",
        subcategory: "Todos",
      }),
    ).toEqual([]);
  });

  it("returns unique subcategories for the selected category", () => {
    expect(getCatalogSubcategories(products, "Música")).toEqual([
      "Todos",
      "Cuerdas",
    ]);
  });

  it("serializes and parses URL filters", () => {
    const filters = {
      search: " guitarra ",
      category: "Música" as const,
      subcategory: "Cuerdas",
    };
    expect(parseCatalogFilters(catalogFiltersSearch(filters))).toEqual({
      search: "guitarra",
      category: "Música",
      subcategory: "Cuerdas",
    });
  });

  it("accepts only positive integer quantities", () => {
    expect(isValidCatalogQuantity(1)).toBe(true);
    expect(isValidCatalogQuantity(0)).toBe(false);
    expect(isValidCatalogQuantity(-1)).toBe(false);
    expect(isValidCatalogQuantity(1.5)).toBe(false);
    expect(isValidCatalogQuantity(Number.NaN)).toBe(false);
  });
});
