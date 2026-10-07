import { describe, expect, it } from "vitest";
import { authService } from "./authService";
import { orderService } from "./orderService";
import { productService } from "./productService";
import { rateService } from "./rateService";
import { canAccessView, homeFor } from "@/lib/permissions";
import { pathForView, viewForPath } from "@/app/routeConfig";
import { initClients, initOrders, initUsers } from "@/data/mockData";
import type { Order } from "@/types";

describe("auth, roles and navigation", () => {
  it("logs in a demo staff account and rejects unknown credentials", () => {
    expect(authService.findAccount(" ADMIN@MUSICSPORT.COM ", initUsers, initClients)?.kind).toBe("staff");
    expect(authService.findAccount("unknown@example.com", initUsers, initClients)).toBeNull();
  });

  it("finds client accounts and blocks inactive staff accounts", () => {
    const account = authService.findAccount("cliente@demo.com", initUsers, initClients);
    expect(account?.kind).toBe("client");
    expect(account && authService.canLogin(account)).toBe(true);

    const inactive = { ...initUsers[0], status: "inactivo" as const };
    const inactiveAccount = authService.findAccount(inactive.email, [inactive], []);
    expect(inactiveAccount && authService.canLogin(inactiveAccount)).toBe(false);
  });

  it("allows only the appropriate role views", () => {
    expect(canAccessView("admin-dashboard", "admin")).toBe(true);
    expect(canAccessView("admin-dashboard", "client")).toBe(false);
    expect(canAccessView("admin-dashboard", null)).toBe(false);
    expect(canAccessView("admin-inventory", "vendor")).toBe(true);
    expect(canAccessView("admin-users", "vendor")).toBe(false);
  });

  it("returns safe destinations after logout and maps real routes", () => {
    expect(homeFor(null)).toBe("login");
    expect(pathForView("vendor-orders")).toBe("/vendedor/ordenes");
    expect(viewForPath("/catalogo")).toBe("catalog");
    expect(viewForPath("/ruta-inexistente")).toBeNull();
  });
});

describe("domain services", () => {
  it("lists the current products and handles missing products", () => {
    const products = productService.list();
    expect(products).toEqual([]);
    expect(products).not.toBe(productService.list());
    expect(productService.findById("missing")).toBeUndefined();
  });

  it("changes an order status without mutating the original", () => {
    const order = {
      ...({
        id: "O001",
        clientId: "C001",
        clientName: "Cliente",
        clientEmail: "cliente@demo.com",
        items: [],
        subtotal: 10,
        tax: 1.6,
        taxType: "IVA",
        total: 11.6,
        status: "pendiente",
        date: "2026-01-01",
        address: "",
        phone: "",
        billing: { name: "", docId: "", email: "", phone: "", address: "", method: "", reference: "" },
        currency: "USD",
      } satisfies Order),
    };
    const updated = orderService.changeStatus(order, "procesando");
    expect(updated.status).toBe("procesando");
    expect(order.status).toBe("pendiente");
    expect(orderService.list()).toEqual(initOrders);
  });

  it("returns no active rate when mock rates are empty", () => {
    expect(rateService.list()).toEqual([]);
    expect(rateService.active()).toBeUndefined();
  });
});
