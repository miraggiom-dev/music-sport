import type { Product } from "@/types";
import { initProducts } from "@/data/mockData";
export interface ProductService { list(): Product[]; findById(id: string): Product | undefined; }
export const productService: ProductService = {
  list: () => [...initProducts],
  findById: id => initProducts.find(product => product.id === id),
};
