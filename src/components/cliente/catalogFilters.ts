import type { Product } from "@/types";

export type CatalogCategory = "Todos" | Product["category"];

export interface CatalogFilters {
  search: string;
  category: CatalogCategory;
  subcategory: string;
}

export function isValidCatalogQuantity(quantity: number) {
  return Number.isInteger(quantity) && quantity > 0;
}

export function getCatalogSubcategories(
  products: Product[],
  category: CatalogCategory,
) {
  const subcategories = products
    .filter(
      (product) =>
        product.active &&
        (category === "Todos" || product.category === category),
    )
    .map((product) => product.subcategory);

  return ["Todos", ...Array.from(new Set(subcategories))];
}

export function filterCatalogProducts(
  products: Product[],
  { search, category, subcategory }: CatalogFilters,
) {
  const query = search.trim().toLowerCase();

  return products.filter((product) => {
    if (!product.active || product.stock <= 0) return false;
    if (category !== "Todos" && product.category !== category) return false;
    if (subcategory !== "Todos" && product.subcategory !== subcategory)
      return false;

    return (
      !query ||
      [product.name, product.description, product.subcategory, product.category].some(
        (value) => value.toLowerCase().includes(query),
      )
    );
  });
}

export function parseCatalogFilters(search: string): CatalogFilters {
  const params = new URLSearchParams(search);
  const category = params.get("categoria");
  return {
    search: params.get("buscar") ?? "",
    category:
      category === "Deportes" || category === "Música" ? category : "Todos",
    subcategory: params.get("subcategoria") ?? "Todos",
  };
}

export function catalogFiltersSearch(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("buscar", filters.search.trim());
  if (filters.category !== "Todos") params.set("categoria", filters.category);
  if (filters.subcategory !== "Todos")
    params.set("subcategoria", filters.subcategory);
  const value = params.toString();
  return value ? `?${value}` : "";
}
