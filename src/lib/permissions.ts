import type { Role, View } from "@/types";

export const ROLE_VIEWS: Record<Role, readonly View[]> = {
  admin: ["admin-dashboard", "admin-products", "admin-inventory", "admin-users", "admin-clients", "admin-orders", "admin-reports", "admin-rates"],
  vendor: ["vendor-dashboard", "vendor-orders", "vendor-payment", "admin-inventory"],
  client: ["catalog", "product-detail", "cart", "checkout", "order-confirm", "client-profile", "client-orders"],
};
export const GUEST_VIEWS: readonly View[] = ["login", "register", "catalog", "product-detail", "cart"];
export const homeFor = (role: Role | null): View => role === "admin" ? "admin-dashboard" : role === "vendor" ? "vendor-dashboard" : role === "client" ? "catalog" : "login";
export const canAccessView = (view: View, role: Role | null) =>
  role ? ROLE_VIEWS[role].includes(view) : GUEST_VIEWS.includes(view);

