import type { Product } from "@/types";
import { initProducts } from "@/data/mockData";

const API_URL = "/api/products";

interface ProductResponse {
  success: boolean;
  message?: string;
  products?: Product[];
  product?: Product;
}

async function request(
  endpoint: string,
  options: RequestInit = {},
): Promise<ProductResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: ProductResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Ocurrió un error al gestionar el producto.",
    );
  }

  return data;
}

export const productService = {
  // Compatibilidad temporal con los componentes que todavía usan datos mock.
  list: (): Product[] => [...initProducts],

  findById: (id: string): Product | undefined =>
    initProducts.find((product) => product.id === id),

  // Consultar los productos almacenados en SQLite.
  async getAll(): Promise<Product[]> {
    const data = await request("");

    return data.products || [];
  },

  // Crear un producto.
  async create(product: Product): Promise<Product> {
    const data = await request("", {
      method: "POST",
      body: JSON.stringify(product),
    });

    if (!data.product) {
      throw new Error("El servidor no devolvió el producto creado.");
    }

    return data.product;
  },

  // Actualizar un producto.
  async update(id: string, product: Product): Promise<Product> {
    const data = await request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });

    if (!data.product) {
      throw new Error("El servidor no devolvió el producto actualizado.");
    }

    return data.product;
  },

  // Ajustar las existencias del inventario.
  async updateStock(id: string, stock: number): Promise<Product> {
    const data = await request(
      `/${encodeURIComponent(id)}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      },
    );

    if (!data.product) {
      throw new Error("El servidor no devolvió el inventario actualizado.");
    }

    return data.product;
  },

  // Eliminar un producto.
  async remove(id: string): Promise<void> {
    await request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};