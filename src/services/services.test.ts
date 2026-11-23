import { describe, expect, it } from "vitest";
import { authService } from "./authService";
import { productService } from "./productService";
import { rateService } from "./rateService";
import { canAccessView, homeFor } from "@/lib/permissions";
import {
  pathForProduct,
  pathForView,
  productIdForPath,
  viewForPath,
} from "@/app/routeConfig";
import { initClients, initProducts, initUsers } from "@/data/mockData";

describe("auth, roles and navigation", () => {
  it("logs in a demo staff account and rejects unknown credentials", () => {
    expect(
      authService.findAccount(" ADMIN@MUSICSPORT.COM ", initUsers, initClients)
        ?.kind,
    ).toBe("staff");

    expect(
      authService.findAccount("unknown@example.com", initUsers, initClients),
    ).toBeNull();
  });

  it("finds client accounts and blocks inactive staff accounts", () => {
    const account = authService.findAccount(
      "cliente@demo.com",
      initUsers,
      initClients,
    );

    expect(account?.kind).toBe("client");
    expect(account && authService.canLogin(account)).toBe(true);

    const inactive = {
      ...initUsers[0],
      status: "inactivo" as const,
    };

    const inactiveAccount = authService.findAccount(
      inactive.email,
      [inactive],
      [],
    );

    expect(inactiveAccount && authService.canLogin(inactiveAccount)).toBe(
      false,
    );
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
    expect(pathForProduct("P 001")).toBe("/catalogo/producto/P%20001");
    expect(productIdForPath("/catalogo/producto/P%20001")).toBe("P 001");
    expect(viewForPath("/catalogo/producto/P001")).toBe("product-detail");
    expect(viewForPath("/catalogo/producto")).toBe("catalog");
    expect(viewForPath("/ruta-inexistente")).toBeNull();
  });
});

describe("domain services", () => {
  it("lists the current products and handles missing products", () => {
    const products = productService.list();

    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(initProducts);
    expect(products.some((product) => product.category === "Música")).toBe(
      true,
    );
    expect(products.some((product) => product.category === "Deportes")).toBe(
      true,
    );
    expect(products.some((product) => product.stock === 0)).toBe(true);
    expect(products.some((product) => !product.active)).toBe(true);
    expect(products).not.toBe(productService.list());
    expect(productService.findById("missing")).toBeUndefined();
  });

  it("returns no active rate when mock rates are empty", () => {
    expect(rateService.list()).toEqual([]);
    expect(rateService.active()).toBeUndefined();
  });
});
