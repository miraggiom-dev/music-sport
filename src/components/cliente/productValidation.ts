import type { Product } from "@/types";

export interface ProductIssue {
  id: string;
  message: string;
}

export function validateProducts(products: Product[]): ProductIssue[] {
  const issues: ProductIssue[] = [];
  const ids = new Set<string>();

  products.forEach((product, index) => {
    const id = String(product?.id ?? `índice ${index}`);
    if (!product?.id) issues.push({ id, message: "ID faltante" });
    else if (ids.has(product.id))
      issues.push({ id, message: "ID duplicado" });
    else ids.add(product.id);

    if (!Number.isFinite(product?.price) || product.price <= 0)
      issues.push({ id, message: "Precio inválido" });
    if (!Number.isInteger(product?.stock) || product.stock < 0)
      issues.push({ id, message: "Stock inválido" });
    if (!product?.name?.trim()) issues.push({ id, message: "Nombre faltante" });
    if (!product?.description?.trim())
      issues.push({ id, message: "Descripción faltante" });
    if (!product?.subcategory?.trim())
      issues.push({ id, message: "Subcategoría faltante" });
    if (
      product?.category !== "Deportes" &&
      product?.category !== "Música"
    )
      issues.push({ id, message: "Categoría inválida" });
    if (!product?.sku?.trim()) issues.push({ id, message: "SKU faltante" });
  });

  return issues;
}

export function getValidProducts(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    const valid =
      Boolean(product?.id) &&
      !seen.has(product.id) &&
      Number.isFinite(product.price) &&
      product.price > 0 &&
      Number.isInteger(product.stock) &&
      product.stock >= 0 &&
      Boolean(product.name?.trim()) &&
      Boolean(product.description?.trim()) &&
      Boolean(product.subcategory?.trim()) &&
      Boolean(product.sku?.trim()) &&
      (product.category === "Deportes" || product.category === "Música");
    if (valid) seen.add(product.id);
    return valid;
  });
}

export function safeImageSource(source: string | undefined, fallback: string) {
  if (!source) return fallback;
  if (source.startsWith("data:image/")) return source;

  try {
    const origin =
      typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(source, origin);
    return url.protocol === "https:" || url.origin === origin
      ? source
      : fallback;
  } catch {
    return fallback;
  }
}
