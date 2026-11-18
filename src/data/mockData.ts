import type { Client, ExchangeRate, InternalUser, Order, Product } from "@/types";

export const initProducts: Product[] = [
  {
    id: "P001",
    name: "Guitarra acústica Yamaha F310",
    category: "Música",
    subcategory: "Cuerdas",
    price: 189.99,
    stock: 6,
    minStock: 2,
    description:
      "Guitarra acústica de cuerpo clásico, ideal para principiantes y músicos en formación.",
    image:
      "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&auto=format&fit=crop",
    sku: "GTR-F310",
    active: true,
  },
  {
    id: "P002",
    name: "Teclado electrónico Casio CT-S200",
    category: "Música",
    subcategory: "Teclados",
    price: 249.5,
    stock: 3,
    minStock: 2,
    description:
      "Teclado compacto con sonidos integrados y diseño ligero para estudio o escenario.",
    image:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop",
    sku: "KEY-CTS200",
    active: true,
  },
  {
    id: "P003",
    name: "Micrófono dinámico profesional",
    category: "Música",
    subcategory: "Audio",
    price: 74.95,
    stock: 12,
    minStock: 3,
    description:
      "Micrófono dinámico para voces, ensayos, presentaciones y grabaciones en vivo.",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop",
    sku: "MIC-DYN01",
    active: true,
  },
  {
    id: "P004",
    name: "Balón de fútbol profesional",
    category: "Deportes",
    subcategory: "Fútbol",
    price: 39.9,
    stock: 10,
    minStock: 3,
    description:
      "Balón de fútbol de entrenamiento con cubierta resistente y buena retención de aire.",
    image:
      "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop",
    sku: "FUT-PRO01",
    active: true,
  },
  {
    id: "P005",
    name: "Raqueta de tenis Wilson Blade",
    category: "Deportes",
    subcategory: "Tenis",
    price: 159,
    stock: 4,
    minStock: 2,
    description:
      "Raqueta de tenis equilibrada para jugadores que buscan control y precisión.",
    image:
      "https://images.unsplash.com/photo-1617083934555-5c0c6d5f7c4c?w=800&auto=format&fit=crop",
    sku: "TEN-BLADE",
    active: true,
  },
  {
    id: "P006",
    name: "Mancuernas ajustables 20 kg",
    category: "Deportes",
    subcategory: "Fitness",
    price: 119.99,
    stock: 2,
    minStock: 2,
    description:
      "Set de mancuernas ajustables para entrenamiento de fuerza en casa o gimnasio.",
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop",
    sku: "FIT-DUM20",
    active: true,
  },
  {
    id: "P007",
    name: "Zapatillas de running",
    category: "Deportes",
    subcategory: "Running",
    price: 89,
    stock: 0,
    minStock: 2,
    description:
      "Zapatillas ligeras con amortiguación para entrenamientos y carreras urbanas.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
    sku: "RUN-SPEED",
    active: true,
  },
  {
    id: "P008",
    name: "Batería acústica de cinco piezas",
    category: "Música",
    subcategory: "Percusión",
    price: 699,
    stock: 1,
    minStock: 1,
    description:
      "Batería acústica completa para ensayos, clases y presentaciones en vivo.",
    image:
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop",
    sku: "BAT-5PCS",
    active: true,
  },
  {
    id: "P009",
    name: "Camiseta deportiva Music&Sport",
    category: "Deportes",
    subcategory: "Indumentaria",
    price: 24.9,
    stock: 8,
    minStock: 2,
    description:
      "Camiseta deportiva de secado rápido para entrenamientos y actividades diarias.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
    sku: "TSH-MSPORT",
    active: true,
  },
  {
    id: "P010",
    name: "Producto temporalmente oculto",
    category: "Música",
    subcategory: "Accesorios",
    price: 12.5,
    stock: 5,
    minStock: 1,
    description: "Producto mock inactivo para verificar filtros de visibilidad.",
    image: "",
    sku: "ACC-HIDDEN",
    active: false,
  },
];

export const initUsers: InternalUser[] = [
  { id: "U001", name: "Administrador", email: "admin@musicsport.com", role: "admin", status: "activo", phone: "", createdAt: "2026-01-01", password: "admin123" },
  { id: "U002", name: "Vendedor", email: "vendedor@musicsport.com", role: "vendor", status: "activo", phone: "", createdAt: "2026-01-01", password: "vendor123" },
];

export const initClients: Client[] = [
  { id: "C001", name: "Cliente", email: "cliente@demo.com", phone: "", address: "", docId: "", createdAt: "2026-01-01", password: "cliente123" },
];

export const initOrders: Order[] = [];
export const initRates: ExchangeRate[] = [];
