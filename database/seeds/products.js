const products = [
  {
    sku: 'GTR-F310',
    nombre: 'Guitarra acústica Yamaha F310',
    descripcion: 'Guitarra acústica de cuerpo clásico, ideal para principiantes y músicos en formación.',
    categoria: 'Música',
    subcategoria: 'Cuerdas',
    precio: 189.99,
    imagen: 'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800&auto=format&fit=crop',
    cantidad: 6,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'KEY-CTS200',
    nombre: 'Teclado electrónico Casio CT-S200',
    descripcion: 'Teclado compacto con sonidos integrados y diseño ligero para estudio o escenario.',
    categoria: 'Música',
    subcategoria: 'Teclados',
    precio: 249.50,
    imagen: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop',
    cantidad: 3,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'MIC-DYN01',
    nombre: 'Micrófono dinámico profesional',
    descripcion: 'Micrófono dinámico para voces, ensayos, presentaciones y grabaciones en vivo.',
    categoria: 'Música',
    subcategoria: 'Audio',
    precio: 74.95,
    imagen: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop',
    cantidad: 12,
    stockMinimo: 3,
    activo: 1
  },
  {
    sku: 'FUT-PRO01',
    nombre: 'Balón de fútbol profesional',
    descripcion: 'Balón de fútbol de entrenamiento con cubierta resistente y buena retención de aire.',
    categoria: 'Deportes',
    subcategoria: 'Fútbol',
    precio: 39.90,
    imagen: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop',
    cantidad: 10,
    stockMinimo: 3,
    activo: 1
  },
  {
    sku: 'TEN-BLADE',
    nombre: 'Raqueta de tenis Wilson Blade',
    descripcion: 'Raqueta de tenis equilibrada para jugadores que buscan control y precisión.',
    categoria: 'Deportes',
    subcategoria: 'Tenis',
    precio: 159,
    imagen: 'https://images.unsplash.com/photo-1617083934555-5c0c6d5f7c4c?w=800&auto=format&fit=crop',
    cantidad: 4,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'FIT-DUM20',
    nombre: 'Mancuernas ajustables 20 kg',
    descripcion: 'Set de mancuernas ajustables para entrenamiento de fuerza en casa o gimnasio.',
    categoria: 'Deportes',
    subcategoria: 'Fitness',
    precio: 119.99,
    imagen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop',
    cantidad: 2,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'RUN-SPEED',
    nombre: 'Zapatillas de running',
    descripcion: 'Zapatillas ligeras con amortiguación para entrenamientos y carreras urbanas.',
    categoria: 'Deportes',
    subcategoria: 'Running',
    precio: 89,
    imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop',
    cantidad: 0,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'BAT-5PCS',
    nombre: 'Batería acústica de cinco piezas',
    descripcion: 'Batería acústica completa para ensayos, clases y presentaciones en vivo.',
    categoria: 'Música',
    subcategoria: 'Percusión',
    precio: 699,
    imagen: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop',
    cantidad: 1,
    stockMinimo: 1,
    activo: 1
  },
  {
    sku: 'TSH-MSPORT',
    nombre: 'Camiseta deportiva Music&Sport',
    descripcion: 'Camiseta deportiva de secado rápido para entrenamientos y actividades diarias.',
    categoria: 'Deportes',
    subcategoria: 'Indumentaria',
    precio: 24.90,
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop',
    cantidad: 8,
    stockMinimo: 2,
    activo: 1
  },
  {
    sku: 'ACC-HIDDEN',
    nombre: 'Producto temporalmente oculto',
    descripcion: 'Producto de demostración inactivo para verificar filtros de visibilidad.',
    categoria: 'Música',
    subcategoria: 'Accesorios',
    precio: 12.50,
    imagen: '',
    cantidad: 5,
    stockMinimo: 1,
    activo: 0
  }
];

export function seedProducts(db) {
  const total = db.prepare(
    'SELECT COUNT(*) AS total FROM PRODUCTO'
  ).get().total;

  if (total > 0) {
    return;
  }

  const insertProduct = db.prepare(`
    INSERT INTO PRODUCTO (
      sku, nombre, descripcion, categoria,
      subcategoria, precio, imagen, activo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInventory = db.prepare(`
    INSERT INTO INVENTARIO (
      id_producto, cantidad, stock_minimo
    )
    VALUES (?, ?, ?)
  `);

  const seed = db.transaction(() => {
    for (const product of products) {
      const result = insertProduct.run(
        product.sku,
        product.nombre,
        product.descripcion,
        product.categoria,
        product.subcategoria,
        product.precio,
        product.imagen,
        product.activo
      );

      insertInventory.run(
        Number(result.lastInsertRowid),
        product.cantidad,
        product.stockMinimo
      );
    }
  });

  seed();

  console.log('Productos e inventario de demostración inicializados.');
}