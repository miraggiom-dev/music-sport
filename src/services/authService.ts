import type { Account, Client, InternalUser } from "@/types";

export interface AuthService {
  findAccount(email: string, users: InternalUser[], clients: Client[]): Account | null;
  canLogin(account: Account): boolean;
}
export const authService: AuthService = {
  findAccount(email, users, clients) {
    const normalized = email.trim().toLowerCase();
    const staff = users.find(user => user.email.toLowerCase() === normalized);
    if (staff) return { kind: "staff", user: staff };
    const client = clients.find(user => user.email.toLowerCase() === normalized);
    return client ? { kind: "client", user: client } : null;
  },
  canLogin(account) { return account.kind === "client" || account.user.status === "activo"; },
};
