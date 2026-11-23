import type { Role } from "@/types";

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "activo" | "inactivo" | null;
  createdAt: string;
  clientId?: number;
  address?: string;
  docId?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  docId: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: BackendUser;
}

export interface AuthService {
  login(email: string, password: string): Promise<BackendUser>;
  register(data: RegisterData): Promise<BackendUser>;
  getCurrentUser(): Promise<BackendUser | null>;
  logout(): Promise<void>;
}

async function authRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<AuthResponse> {
  const response = await fetch(`/api/auth${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.message || "Error de autenticación.");
  }

  return data;
}

export const authService: AuthService = {
  async login(email, password) {
    const data = await authRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data.user) {
      throw new Error("El servidor no devolvió los datos del usuario.");
    }

    return data.user;
  },

  async register(registerData) {
    const data = await authRequest("/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    if (!data.user) {
      throw new Error("El servidor no devolvió los datos de la cuenta.");
    }

    return data.user;
  },

  async getCurrentUser() {
    try {
      const data = await authRequest("/me");
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  async logout() {
    await authRequest("/logout", {
      method: "POST",
    });
  },
};
