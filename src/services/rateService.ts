import type { ExchangeRate } from "@/types";

const API_URL = "/api/rates";

interface RateResponse {
  success: boolean;
  message?: string;
  rates?: ExchangeRate[];
  rate?: ExchangeRate;
}

async function request(
  endpoint: string,
  options: RequestInit = {},
): Promise<RateResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as RateResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Error al gestionar las tasas.");
  }

  return data;
}

export const rateService = {
  async getAll(): Promise<ExchangeRate[]> {
    const data = await request("");
    return data.rates || [];
  },

  async create(rate: {
    name: string;
    value: number;
    active: boolean;
  }): Promise<ExchangeRate> {
    const data = await request("", {
      method: "POST",
      body: JSON.stringify(rate),
    });

    if (!data.rate) {
      throw new Error("El servidor no devolvió la tasa registrada.");
    }

    return data.rate;
  },

  async update(
    id: string,
    rate: {
      name: string;
      value: number;
      active: boolean;
    },
  ): Promise<ExchangeRate> {
    const data = await request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(rate),
    });

    if (!data.rate) {
      throw new Error("El servidor no devolvió la tasa actualizada.");
    }

    return data.rate;
  },

  async activate(id: string): Promise<ExchangeRate> {
    const data = await request(`/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
    });

    if (!data.rate) {
      throw new Error("El servidor no devolvió la tasa activada.");
    }

    return data.rate;
  },

  async remove(id: string): Promise<void> {
    await request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
