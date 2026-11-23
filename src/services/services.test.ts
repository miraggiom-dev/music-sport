import { describe, expect, it } from "vitest";
import { canAccessView, homeFor } from "@/lib/permissions";
import {
  pathForProduct,
  pathForView,
  productIdForPath,
  viewForPath,
} from "@/app/routeConfig";

describe("roles and navigation", () => {
  it("allows only the appropriate role views", () => {
    expect(canAccessView("admin-dashboard", "admin")).toBe(true);
    expect(canAccessView("admin-dashboard", "client")).toBe(false);
    expect(canAccessView("admin-dashboard", null)).toBe(false);
    expect(canAccessView("admin-inventory", "vendor")).toBe(true);
    expect(canAccessView("admin-users", "vendor")).toBe(false);
  });

  it("returns safe destinations after logout", () => {
    expect(homeFor(null)).toBe("login");
  });

  it("maps views to real routes", () => {
    expect(pathForView("vendor-orders")).toBe("/vendedor/ordenes");
    expect(viewForPath("/catalogo")).toBe("catalog");
  });

  it("encodes and decodes product identifiers", () => {
    expect(pathForProduct("P 001")).toBe("/catalogo/producto/P%20001");

    expect(productIdForPath("/catalogo/producto/P%20001")).toBe("P 001");
  });

  it("handles product routes and unknown routes", () => {
    expect(viewForPath("/catalogo/producto/P001")).toBe("product-detail");

    expect(viewForPath("/catalogo/producto")).toBe("catalog");
    expect(viewForPath("/ruta-inexistente")).toBeNull();
  });
});
