
import type { Client } from "@/types";

const API_URL = "/api/clients";

interface ClientResponse {
  success: boolean;
  message?: string;
  clients?: Client[];
  client?: Client;
}

async function request(
  url: string,
  options: RequestInit = {},
): Promise<ClientResponse> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: ClientResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "No se pudo completar la operación.");
  }

  return data;
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    const data = await request(API_URL);
    return data.clients ?? [];
  },

  async create(client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    docId: string;
    password: string;
  }): Promise<Client> {
    const data = await request(API_URL, {
      method: "POST",
      body: JSON.stringify(client),
    });

    if (!data.client) {
      throw new Error("El servidor no devolvió el cliente creado.");
    }

    return data.client;
  },

  async update(
    id: string,
    client: {
      name: string;
      email: string;
      phone: string;
      address: string;
      docId: string;
    },
  ): Promise<Client> {
    const data = await request(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    });

    if (!data.client) {
      throw new Error("El servidor no devolvió el cliente actualizado.");
    }

    return data.client;
  },

  async remove(id: string): Promise<void> {
    await request(`${API_URL}/${id}`, {
      method: "DELETE",
    });
  },
};
