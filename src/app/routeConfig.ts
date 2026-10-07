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

export function viewForPath(pathname: string): View | null {
  const exact = PATH_VIEWS.find(([, path]) => path === pathname);
  return exact?.[0] ?? null;
}
