import type { Client, Order } from "@/types";
import {
  isValidEmail,
  isValidDocId,
  isValidName,
  isValidPass,
  isValidPhone,
} from "@/lib/validation";

export type ProfileForm = Pick<
  Client,
  "name" | "email" | "phone" | "address" | "docId"
>;

export type PasswordFields = {
  current: string;
  next: string;
  confirm: string;
};

export type ProfileErrorKey =
  | keyof ProfileForm
  | keyof PasswordFields;

export type ProfileErrors = Partial<Record<ProfileErrorKey, string>>;

export const hasIssuedOrder = (
  clientId: string,
  orders: Pick<Order, "clientId">[],
) => orders.some((order) => order.clientId === clientId);

export const isDocumentLocked = (
  client: Pick<Client, "docId" | "id">,
  orders: Pick<Order, "clientId">[],
) => Boolean(client.docId.trim()) || hasIssuedOrder(client.id, orders);

export const isCompleteClientProfile = (
  client: Pick<Client, "name" | "docId" | "email" | "phone" | "address">,
) =>
  isValidName(client.name) &&
  isValidDocId(client.docId) &&
  isValidEmail(client.email) &&
  isValidPhone(client.phone) &&
  client.address.trim().length >= 10;

export function validateClientProfile(
  form: ProfileForm,
  password: PasswordFields,
  client: Pick<Client, "id" | "password">,
  clients: Pick<Client, "id" | "email">[],
  takenEmails: string[],
): ProfileErrors {
  const errors: ProfileErrors = {};
  const email = form.email.trim().toLowerCase();
  const normalizedTakenEmails = takenEmails.map((taken) =>
    taken.trim().toLowerCase(),
  );

  if (!isValidName(form.name))
    errors.name = "Nombre requerido (mín. 3 caracteres)";
  if (!isValidEmail(email)) errors.email = "Correo electrónico inválido";
  else if (
    clients.some(
      (candidate) =>
        candidate.id !== client.id &&
        candidate.email.trim().toLowerCase() === email,
    ) ||
    normalizedTakenEmails.includes(email)
  ) {
    errors.email = "El correo ya está en uso";
  }
  if (!isValidPhone(form.phone))
    errors.phone = "Teléfono inválido (ej: 0414-1234567)";
  if (form.address.trim().length < 10)
    errors.address = "Dirección requerida (mín. 10 caracteres)";
  if (form.docId.trim() && !isValidDocId(form.docId))
    errors.docId = "Formato inválido (ej: V-123456789)";

  if (password.current || password.next || password.confirm) {
    if (password.current !== client.password)
      errors.current = "La contraseña actual no es correcta";
    if (!isValidPass(password.next)) errors.next = "Entre 6 y 50 caracteres";
    if (password.next !== password.confirm)
      errors.confirm = "Las contraseñas no coinciden";
  }

  return errors;
}
