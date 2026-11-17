import { describe, expect, it } from "vitest";
import {
  hasIssuedOrder,
  isDocumentLocked,
  validateClientProfile,
  type ProfileForm,
} from "./profileValidation";

const client: ProfileForm & { id: string; password: string } = {
  id: "C001",
  name: "Cliente Demo",
  email: "cliente@example.com",
  phone: "0414-1234567",
  address: "Calle principal 123",
  docId: "V-12345678",
  password: "cliente123",
};

const emptyPassword = { current: "", next: "", confirm: "" };

describe("hasIssuedOrder", () => {
  it("bloquea la cédula después de la primera orden del cliente", () => {
    expect(
      hasIssuedOrder("C001", [{ clientId: "C002" }, { clientId: "C001" }]),
    ).toBe(true);
    expect(hasIssuedOrder("C001", [{ clientId: "C002" }])).toBe(false);
  });
});

describe("isDocumentLocked", () => {
  it("bloquea un documento guardado incluso sin órdenes", () => {
    expect(isDocumentLocked({ id: "C001", docId: "V-12345678" }, [])).toBe(
      true,
    );
  });

  it("permite el documento de una cuenta básica sin órdenes", () => {
    expect(isDocumentLocked({ id: "C001", docId: "" }, [])).toBe(false);
  });
});

describe("validateClientProfile", () => {
  it("rechaza nombres, teléfonos y direcciones incompletos", () => {
    const errors = validateClientProfile(
      { ...client, name: "A", phone: "12", address: "corta" },
      emptyPassword,
      client,
      [client],
      [],
    );

    expect(errors.name).toBe("Nombre requerido (mín. 3 caracteres)");
    expect(errors.phone).toBe("Teléfono inválido (ej: 0414-1234567)");
    expect(errors.address).toBe("Dirección requerida (mín. 10 caracteres)");
  });

  it("rechaza formatos inválidos de cédula o RIF", () => {
    const errors = validateClientProfile(
      { ...client, docId: "123456789" },
      emptyPassword,
      client,
      [client],
      [],
    );

    expect(errors.docId).toBe("Formato inválido (ej: V-123456789)");
  });

  it("permite dejar la cédula o RIF vacía antes de emitir una orden", () => {
    const errors = validateClientProfile(
      { ...client, docId: "" },
      emptyPassword,
      client,
      [client],
      [],
    );

    expect(errors.docId).toBeUndefined();
  });

  it("rechaza datos de contacto inválidos", () => {
    const errors = validateClientProfile(
      { ...client, email: "incorrecto", address: "corta" },
      emptyPassword,
      client,
      [client],
      [],
    );

    expect(errors.email).toBe("Correo electrónico inválido");
    expect(errors.address).toBe("Dirección requerida (mín. 10 caracteres)");
  });

  it("valida la confirmación aunque no se haya escrito la contraseña actual", () => {
    const errors = validateClientProfile(
      client,
      { current: "", next: "", confirm: "texto" },
      client,
      [client],
      [],
    );

    expect(errors.current).toBe("La contraseña actual no es correcta");
    expect(errors.next).toBe("Entre 6 y 50 caracteres");
    expect(errors.confirm).toBe("Las contraseñas no coinciden");
  });

  it("rechaza correos duplicados ignorando mayúsculas y espacios", () => {
    const errors = validateClientProfile(
      { ...client, email: " OTRO@EXAMPLE.COM " },
      emptyPassword,
      client,
      [client],
      [" otro@example.com "],
    );

    expect(errors.email).toBe("El correo ya está en uso");
  });

  it("permite una actualización válida", () => {
    const errors = validateClientProfile(
      client,
      emptyPassword,
      client,
      [client],
      [],
    );

    expect(errors).toEqual({});
  });
});
