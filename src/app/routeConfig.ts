import type { View } from "@/types";

export const VIEW_PATHS: Record<View, string> = {
  login: "/login",
  register: "/registro",
  catalog: "/catalogo",
  "product-detail": "/catalogo/producto",
  cart: "/carrito",
  checkout: "/checkout",
  "order-confirm": "/orden-confirmada",
  "client-profile": "/perfil",
  "client-orders": "/ordenes",
  "admin-dashboard": "/admin/dashboard",
  "admin-products": "/admin/productos",
  "admin-inventory": "/admin/inventario",
  "admin-users": "/admin/usuarios",
  "admin-clients": "/admin/clientes",
  "admin-orders": "/admin/ordenes",
  "admin-reports": "/admin/informes",
  "admin-rates": "/admin/tasas",
  "vendor-dashboard": "/vendedor/panel",
  "vendor-orders": "/vendedor/ordenes",
  "vendor-payment": "/vendedor/pagos",
};

const PATH_VIEWS = Object.entries(VIEW_PATHS) as [View, string][];

export function pathForView(view: View) {
  return VIEW_PATHS[view];
}

export function pathForProduct(productId: string) {
  return `${VIEW_PATHS["product-detail"]}/${encodeURIComponent(productId)}`;
}

export function productIdForPath(pathname: string) {
  const prefix = `${VIEW_PATHS["product-detail"]}/`;
  if (!pathname.startsWith(prefix)) return null;
  const id = pathname.slice(prefix.length).split("/")[0];
  if (!id) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function viewForPath(pathname: string): View | null {
  if (productIdForPath(pathname)) return "product-detail";
  const exact = PATH_VIEWS.find(([, path]) => path === pathname);
  if (exact?.[0] === "product-detail") return "catalog";
  return exact?.[0] ?? null;
}
