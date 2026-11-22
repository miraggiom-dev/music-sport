import { Router } from 'express';
import db from '../../database/connection.js';

const router = Router();

function requireStaff(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión.'
    });
  }

  if (!['admin', 'vendor'].includes(req.session.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para consultar esta información.'
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión.'
    });
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Solo un administrador puede realizar esta operación.'
    });
  }

  next();
}

function getProductId(value) {
  const match = /^P?(\d+)$/i.exec(String(value || ''));

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function formatProduct(product) {
  return {
    id: `P${product.id_producto}`,
    name: product.nombre,
    category: product.categoria,
    subcategory: product.subcategoria || '',
    price: Number(product.precio),
    stock: Number(product.cantidad),
    minStock: Number(product.stock_minimo),
    description: product.descripcion || '',
    image: product.imagen || '',
    sku: product.sku,
    active: Boolean(product.activo)
  };
}

function getProduct(id) {
  return db.prepare(`
    SELECT
      p.id_producto,
      p.sku,
      p.nombre,
      p.descripcion,
      p.categoria,
      p.subcategoria,
      p.precio,
      p.imagen,
      p.activo,
      i.cantidad,
      i.stock_minimo
    FROM PRODUCTO p
    INNER JOIN INVENTARIO i
      ON i.id_producto = p.id_producto
    WHERE p.id_producto = ?
  `).get(id);
}

function validateProduct(body) {
  const name = String(body.name || '').trim();
  const sku = String(body.sku || '').trim().toUpperCase();
  const category = String(body.category || '').trim();
  const subcategory = String(body.subcategory || '').trim();
  const description = String(body.description || '').trim();
  const image = String(body.image || '');
  const price = Number(body.price);
  const stock = Number(body.stock);
  const minStock = Number(body.minStock);
  const active = body.active === false || body.active === 0 ? 0 : 1;

  if (name.length < 3 || name.length > 150) {
    return { error: 'El nombre debe tener entre 3 y 150 caracteres.' };
  }

  if (!/^[A-Z0-9_-]{2,20}$/.test(sku)) {
    return { error: 'El SKU debe tener entre 2 y 20 caracteres alfanuméricos o guiones.' };
  }

  if (!['Deportes', 'Música'].includes(category)) {
    return { error: 'La categoría seleccionada no es válida.' };
  }

  if (!subcategory || subcategory.length > 80) {
    return { error: 'La subcategoría es obligatoria y no puede superar 80 caracteres.' };
  }

  if (description.length < 10) {
    return { error: 'La descripción debe tener al menos 10 caracteres.' };
  }

  if (!Number.isFinite(price) || price <= 0 || price > 999999) {
    return { error: 'El precio debe ser mayor que 0 y no superar 999999.' };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'El stock debe ser un número entero mayor o igual a 0.' };
  }

  if (!Number.isInteger(minStock) || minStock < 1) {
    return { error: 'El stock mínimo debe ser un entero mayor o igual a 1.' };
  }

  if (image && image.length > 3_000_000) {
    return { error: 'La imagen supera el tamaño permitido.' };
  }

  if (
    image &&
    !/^data:image\/(jpeg|png|webp);base64,/i.test(image) &&
    !/^https?:\/\//i.test(image)
  ) {
    return { error: 'El formato de imagen no es válido.' };
  }

  return {
    value: {
      name,
      sku,
      category,
      subcategory,
      description,
      image,
      price: Math.round((price + Number.EPSILON) * 100) / 100,
      stock,
      minStock,
      active
    }
  };
}

// GET: consultar productos e inventario.
// Administradores y vendedores pueden consultar.
router.get('/', requireStaff, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT
        p.id_producto,
        p.sku,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.subcategoria,
        p.precio,
        p.imagen,
        p.activo,
        i.cantidad,
        i.stock_minimo
      FROM PRODUCTO p
      INNER JOIN INVENTARIO i
        ON i.id_producto = p.id_producto
      ORDER BY p.id_producto ASC
    `).all();

    return res.json({
      success: true,
      products: products.map(formatProduct)
    });
  } catch (error) {
    console.error('Error al consultar productos:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los productos.'
    });
  }
});

// POST: crear producto e inventario.
router.post('/', requireAdmin, (req, res) => {
  try {
    const validation = validateProduct(req.body);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const product = validation.value;

    const duplicateSku = db.prepare(`
      SELECT id_producto
      FROM PRODUCTO
      WHERE sku = ?
    `).get(product.sku);

    if (duplicateSku) {
      return res.status(409).json({
        success: false,
        message: 'Este SKU ya está registrado.'
      });
    }

    const duplicateName = db.prepare(`
      SELECT id_producto
      FROM PRODUCTO
      WHERE nombre = ? COLLATE NOCASE
    `).get(product.name);

    if (duplicateName) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un producto con este nombre.'
      });
    }

    const createProduct = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO PRODUCTO (
          sku, nombre, descripcion, categoria,
          subcategoria, precio, imagen, activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.sku,
        product.name,
        product.description,
        product.category,
        product.subcategory,
        product.price,
        product.image,
        product.active
      );

      const id = Number(result.lastInsertRowid);

      db.prepare(`
        INSERT INTO INVENTARIO (
          id_producto, cantidad, stock_minimo
        )
        VALUES (?, ?, ?)
      `).run(id, product.stock, product.minStock);

      return id;
    });

    const id = createProduct();
    const created = getProduct(id);

    return res.status(201).json({
      success: true,
      message: 'Producto registrado correctamente.',
      product: formatProduct(created)
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'El SKU ya está registrado.'
      });
    }

    console.error('Error al crear producto:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo registrar el producto.'
    });
  }
});

// PUT: editar producto y sus datos de inventario.
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const id = getProductId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de producto inválido.'
      });
    }

    const existing = getProduct(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    const validation = validateProduct(req.body);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const product = validation.value;

    const duplicateSku = db.prepare(`
      SELECT id_producto
      FROM PRODUCTO
      WHERE sku = ? AND id_producto != ?
    `).get(product.sku, id);

    if (duplicateSku) {
      return res.status(409).json({
        success: false,
        message: 'Este SKU ya está registrado por otro producto.'
      });
    }

    const duplicateName = db.prepare(`
      SELECT id_producto
      FROM PRODUCTO
      WHERE nombre = ? COLLATE NOCASE AND id_producto != ?
    `).get(product.name, id);

    if (duplicateName) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro producto con este nombre.'
      });
    }

    const updateProduct = db.transaction(() => {
      db.prepare(`
        UPDATE PRODUCTO
        SET
          sku = ?,
          nombre = ?,
          descripcion = ?,
          categoria = ?,
          subcategoria = ?,
          precio = ?,
          imagen = ?,
          activo = ?
        WHERE id_producto = ?
      `).run(
        product.sku,
        product.name,
        product.description,
        product.category,
        product.subcategory,
        product.price,
        product.image,
        product.active,
        id
      );

      db.prepare(`
        UPDATE INVENTARIO
        SET
          cantidad = ?,
          stock_minimo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = ?
      `).run(product.stock, product.minStock, id);
    });

    updateProduct();

    return res.json({
      success: true,
      message: 'Producto actualizado correctamente.',
      product: formatProduct(getProduct(id))
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'El SKU ya está registrado.'
      });
    }

    console.error('Error al actualizar producto:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el producto.'
    });
  }
});

// PATCH: modificar únicamente las existencias.
router.patch('/:id/stock', requireAdmin, (req, res) => {
  try {
    const id = getProductId(req.params.id);
    const stock = Number(req.body.stock);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de producto inválido.'
      });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock debe ser un número entero mayor o igual a 0.'
      });
    }

    const existing = getProduct(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    db.prepare(`
      UPDATE INVENTARIO
      SET cantidad = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_producto = ?
    `).run(stock, id);

    return res.json({
      success: true,
      message: 'Stock actualizado correctamente.',
      product: formatProduct(getProduct(id))
    });
  } catch (error) {
    console.error('Error al actualizar stock:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el stock.'
    });
  }
});

// DELETE: eliminar solo si no existe historial de compras.
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = getProductId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de producto inválido.'
      });
    }

    const existing = getProduct(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    const orderReferences = db.prepare(`
      SELECT COUNT(*) AS total
      FROM DETALLE_COMPRA
      WHERE id_producto = ?
    `).get(id).total;

    if (orderReferences > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este producto porque forma parte del historial de compras. Desactívalo en su lugar.'
      });
    }

    db.prepare(`
      DELETE FROM PRODUCTO
      WHERE id_producto = ?
    `).run(id);

    return res.json({
      success: true,
      message: 'Producto eliminado correctamente.'
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el producto porque tiene registros relacionados. Desactívalo en su lugar.'
      });
    }

    console.error('Error al eliminar producto:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el producto.'
    });
  }
});

export default router;