import { Router } from "express";
import db from "../../database/connection.js";

const router = Router();

const STAFF_ROLES = ["admin", "vendor"];

const PAYMENT_METHODS = {
  Transferencia: "transferencia",
  "Pago móvil": "pago_movil",
  Zelle: "zelle",
  Binance: "binance",
  "Efectivo en tienda": "efectivo",
};

const NEXT_STATUS = {
  pendiente: ["procesando", "cancelado"],
  procesando: ["despachado", "cancelado"],
  despachado: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};

function requireSession(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión.",
    });
  }
  next();
}

function requireStaff(req, res, next) {
  if (!STAFF_ROLES.includes(req.session?.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para realizar esta operación.",
    });
  }
  next();
}

function productId(value) {
  const match = /^P?(\d+)$/i.exec(String(value || ""));
  return match ? Number(match[1]) : null;
}

function formatOrder(row) {
  const items = db
    .prepare(
      `
    SELECT
      d.id_producto,
      d.nombre_producto,
      d.sku,
      d.cantidad,
      d.precio_unitario,
      p.descripcion,
      p.categoria,
      p.subcategoria,
      p.imagen,
      p.activo,
      i.cantidad AS stock,
      i.stock_minimo
    FROM DETALLE_COMPRA d
    INNER JOIN PRODUCTO p ON p.id_producto = d.id_producto
    INNER JOIN INVENTARIO i ON i.id_producto = d.id_producto
    WHERE d.id_orden = ?
  `,
    )
    .all(row.id_orden)
    .map((item) => ({
      productId: `P${item.id_producto}`,
      productName: item.nombre_producto,
      sku: item.sku,
      qty: Number(item.cantidad),
      unitPrice: Number(item.precio_unitario),
      product: {
        id: `P${item.id_producto}`,
        name: item.nombre_producto,
        category: item.categoria,
        subcategory: item.subcategoria || "",
        price: Number(item.precio_unitario),
        stock: Number(item.stock),
        minStock: Number(item.stock_minimo),
        description: item.descripcion || "",
        image: item.imagen || "",
        sku: item.sku,
        active: Boolean(item.activo),
      },
    }));

  const payment = db
    .prepare(
      `
    SELECT * FROM PAGO WHERE id_orden = ?
  `,
    )
    .get(row.id_orden);

  const receipt = payment
    ? db
        .prepare(
          `
        SELECT numero_recibo FROM RECIBO WHERE id_pago = ?
      `,
        )
        .get(payment.id_pago)
    : null;

  const date = String(row.fecha_creacion).slice(0, 10);

  return {
    id: row.numero_orden,
    clientId: String(row.id_cliente),
    clientName: row.nombre_cliente,
    clientEmail: row.correo_cliente,
    items,
    subtotal: Number(row.subtotal),
    tax: Number(row.impuesto),
    taxType: row.tipo_impuesto,
    total: Number(row.total),
    status: row.estado,
    date,
    address: row.direccion_entrega,
    phone: row.telefono_destinatario || row.telefono_facturacion,
    billing: {
      name: row.nombre_facturacion,
      docId: row.identificacion_facturacion || "",
      email: row.correo_facturacion,
      phone: row.telefono_facturacion,
      address: row.direccion_facturacion,
      method:
        Object.keys(PAYMENT_METHODS).find(
          (key) => PAYMENT_METHODS[key] === payment?.metodo,
        ) || "",
      reference: payment?.numero_referencia || "",
      ...(row.nombre_destinatario
        ? {
            recipient: {
              name: row.nombre_destinatario,
              phone: row.telefono_destinatario || "",
              address: row.direccion_entrega,
            },
          }
        : {}),
    },
    receiptNo: receipt?.numero_recibo,
    paidAt: payment?.fecha_pago
      ? String(payment.fecha_pago).slice(0, 10)
      : undefined,
    rejectReason: payment?.motivo_rechazo || undefined,
    clientRequestId: row.solicitud_cliente_id || undefined,
    createdAt: row.fecha_creacion,
    updatedAt: row.fecha_actualizacion,
    cancelledAt: row.fecha_cancelacion || undefined,
    cancelledBy: row.cancelado_por || undefined,
    reviewedAt: payment?.fecha_revision || undefined,
    reviewedBy: payment?.id_revisor ? String(payment.id_revisor) : undefined,
    currency: row.moneda,
    rate:
      row.tasa_nombre && row.tasa_valor
        ? {
            name: row.tasa_nombre,
            value: Number(row.tasa_valor),
            updatedAt: row.tasa_fecha,
          }
        : undefined,
  };
}

const orderQuery = `
  SELECT
    o.*,
    c.id_cliente,
    u.nombre AS nombre_cliente,
    u.correo AS correo_cliente
  FROM ORDEN_COMPRA o
  INNER JOIN CLIENTE c ON c.id_cliente = o.id_cliente
  INNER JOIN USUARIO u ON u.id_usuario = c.id_usuario
`;

function findOrder(id) {
  return db.prepare(`${orderQuery} WHERE o.numero_orden = ?`).get(id);
}

// Consultar órdenes: el cliente solo ve las suyas.
router.get("/", requireSession, (req, res) => {
  try {
    let rows;

    if (req.session.user.role === "client") {
      rows = db
        .prepare(
          `
        ${orderQuery}
        WHERE o.id_cliente = ?
        ORDER BY o.id_orden DESC
      `,
        )
        .all(req.session.user.clientId);
    } else if (STAFF_ROLES.includes(req.session.user.role)) {
      rows = db
        .prepare(
          `
        ${orderQuery}
        ORDER BY o.id_orden DESC
      `,
        )
        .all();
    } else {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para consultar órdenes.",
      });
    }

    return res.json({
      success: true,
      orders: rows.map(formatOrder),
    });
  } catch (error) {
    console.error("Error al consultar órdenes:", error);
    return res.status(500).json({
      success: false,
      message: "No se pudieron consultar las órdenes.",
    });
  }
});

// Crear una orden y descontar inventario en una sola transacción.
router.post("/", requireSession, (req, res) => {
  try {
    const user = req.session.user;

    if (user.role !== "client" || !user.clientId) {
      return res.status(403).json({
        success: false,
        message: "Solo los clientes pueden emitir órdenes.",
      });
    }

    const billing = req.body.billing || {};
    const items = req.body.items;
    const requestId = String(billing.clientRequestId || "").trim();

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío.",
      });
    }

    if (!requestId || requestId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "La solicitud de compra no es válida.",
      });
    }

    const method = PAYMENT_METHODS[billing.method];

    if (!method) {
      return res.status(400).json({
        success: false,
        message: "El método de pago no es válido.",
      });
    }

    const existing = db
      .prepare(
        `
      SELECT numero_orden
      FROM ORDEN_COMPRA
      WHERE solicitud_cliente_id = ?
    `,
      )
      .get(requestId);

    if (existing) {
      const row = findOrder(existing.numero_orden);
      return res.json({
        success: true,
        message: "Esta orden ya había sido registrada.",
        order: formatOrder(row),
      });
    }

    const normalizedItems = [];
    const quantities = new Map();

    for (const item of items) {
      const id = productId(item.productId || item.product?.id);
      const qty = Number(item.qty);

      if (!id || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Hay un producto o una cantidad inválida.",
        });
      }

      quantities.set(id, (quantities.get(id) || 0) + qty);
    }

    for (const [id, qty] of quantities) {
      const product = db
        .prepare(
          `
        SELECT
          p.id_producto, p.sku, p.nombre, p.precio, p.activo,
          i.cantidad
        FROM PRODUCTO p
        INNER JOIN INVENTARIO i ON i.id_producto = p.id_producto
        WHERE p.id_producto = ?
      `,
        )
        .get(id);

      if (!product || !product.activo) {
        return res.status(409).json({
          success: false,
          message: "Uno de los productos ya no está disponible.",
        });
      }

      if (qty > product.cantidad) {
        return res.status(409).json({
          success: false,
          message: `Stock insuficiente para ${product.nombre}. Disponible: ${product.cantidad}.`,
        });
      }

      normalizedItems.push({ product, qty });
    }

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.product.precio) * item.qty,
      0,
    );

    const taxType = ["Transferencia", "Pago móvil"].includes(billing.method)
      ? "IVA"
      : "IGTF";

    const taxRate = taxType === "IVA" ? 0.16 : 0.03;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const currency = taxType === "IVA" ? "VES" : "USD";

    const reference = String(billing.reference || "").trim();

    if (method !== "efectivo" && !/^[A-Za-z0-9-]{4,30}$/.test(reference)) {
      return res.status(400).json({
        success: false,
        message: "La referencia de pago no es válida.",
      });
    }

    const activeRate = db
      .prepare(
        `
        SELECT nombre, valor, fecha_actualizacion
        FROM TASA_CAMBIO
        WHERE activa = 1
      `,
      )
      .get();

    if (
      currency === "VES" &&
      (!activeRate || !Number.isFinite(Number(activeRate.valor)))
    ) {
      return res.status(400).json({
        success: false,
        message: "No hay una tasa de cambio activa para este pago.",
      });
    }

    const order = db.transaction(() => {
      const nextNumber = Number(
        db
          .prepare(
            `
          SELECT COALESCE(MAX(id_orden), 1000) + 1 AS next
          FROM ORDEN_COMPRA
        `,
          )
          .get().next,
      );

      const orderNumber = `ORD-${nextNumber}`;
      const now = new Date().toISOString();
      const recipient = billing.recipient || null;
      const address = String(
        recipient?.address || billing.address || "",
      ).trim();
      const phone = String(recipient?.phone || billing.phone || "").trim();

      const result = db
        .prepare(
          `
        INSERT INTO ORDEN_COMPRA (
          numero_orden, id_cliente, estado,
          subtotal, impuesto, tipo_impuesto, total, moneda,
          tasa_nombre, tasa_valor, tasa_fecha,
          nombre_facturacion, identificacion_facturacion,
          correo_facturacion, telefono_facturacion,
          direccion_facturacion, nombre_destinatario,
          telefono_destinatario, direccion_entrega,
          solicitud_cliente_id, fecha_creacion, fecha_actualizacion
        ) VALUES (
          ?, ?, 'pendiente',
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
        )
        .run(
          orderNumber,
          user.clientId,
          subtotal,
          tax,
          taxType,
          total,
          currency,
          activeRate?.nombre || null,
          activeRate?.valor || null,
          activeRate?.fecha_actualizacion || null,
          String(billing.name || "").trim(),
          String(billing.docId || "")
            .trim()
            .toUpperCase(),
          String(billing.email || "")
            .trim()
            .toLowerCase(),
          String(billing.phone || "").trim(),
          String(billing.address || "").trim(),
          recipient?.name?.trim() || null,
          recipient?.phone?.trim() || null,
          address,
          requestId,
          now,
          now,
        );

      const orderId = Number(result.lastInsertRowid);

      const insertLine = db.prepare(`
        INSERT INTO DETALLE_COMPRA (
          id_orden, id_producto, nombre_producto,
          sku, cantidad, precio_unitario, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStock = db.prepare(`
        UPDATE INVENTARIO
        SET cantidad = cantidad - ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = ? AND cantidad >= ?
      `);

      for (const item of normalizedItems) {
        insertLine.run(
          orderId,
          item.product.id_producto,
          item.product.nombre,
          item.product.sku,
          item.qty,
          item.product.precio,
          Number(item.product.precio) * item.qty,
        );

        const updated = updateStock.run(
          item.qty,
          item.product.id_producto,
          item.qty,
        );

        if (updated.changes !== 1) {
          throw new Error(`Stock insuficiente para ${item.product.nombre}.`);
        }
      }

      db.prepare(
        `
        INSERT INTO PAGO (
          id_orden, metodo, numero_referencia,
          monto, moneda, estado
        ) VALUES (?, ?, ?, ?, ?, 'pendiente')
      `,
      ).run(orderId, method, reference || null, total, currency);

      return orderNumber;
    });

    const orderNumber = order();
    return res.status(201).json({
      success: true,
      message: "Orden emitida correctamente.",
      order: formatOrder(findOrder(orderNumber)),
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "La referencia de pago o la solicitud ya está registrada.",
      });
    }

    console.error("Error al crear orden:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "No se pudo emitir la orden.",
    });
  }
});

// Cambiar estado, aprobar pago, emitir recibo o cancelar y reponer stock.
router.patch("/:id/status", requireSession, (req, res) => {
  try {
    const user = req.session.user;
    const { status, rejectReason } = req.body;
    const row = findOrder(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada.",
      });
    }

    const isClient = user.role === "client";
    const isStaff = STAFF_ROLES.includes(user.role);

    if (
      isClient &&
      (String(row.id_cliente) !== String(user.clientId) ||
        status !== "cancelado")
    ) {
      return res.status(403).json({
        success: false,
        message: "No puedes modificar esta orden.",
      });
    }

    if (!isClient && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para modificar órdenes.",
      });
    }

    if (!NEXT_STATUS[row.estado]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: "La transición de estado no está permitida.",
      });
    }

    if (
      status === "cancelado" &&
      isStaff &&
      String(rejectReason || "").trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Indica un motivo de cancelación de al menos 5 caracteres.",
      });
    }

    const now = new Date().toISOString();

    const update = db.transaction(() => {
      if (status === "cancelado") {
        const lines = db
          .prepare(
            `
          SELECT id_producto, cantidad
          FROM DETALLE_COMPRA
          WHERE id_orden = ?
        `,
          )
          .all(row.id_orden);

        for (const line of lines) {
          db.prepare(
            `
            UPDATE INVENTARIO
            SET cantidad = cantidad + ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = ?
          `,
          ).run(line.cantidad, line.id_producto);
        }

        db.prepare(
          `
          UPDATE ORDEN_COMPRA
          SET estado = 'cancelado',
              fecha_actualizacion = ?,
              fecha_cancelacion = ?,
              cancelado_por = ?
          WHERE id_orden = ?
        `,
        ).run(now, now, isClient ? "client" : "staff", row.id_orden);

        db.prepare(
          `
          DELETE FROM RECIBO
          WHERE id_pago = (
            SELECT id_pago
            FROM PAGO
            WHERE id_orden = ?
          )
        `,
        ).run(row.id_orden);

        db.prepare(
          `
          UPDATE PAGO
          SET estado = 'rechazado',
              fecha_revision = ?,
              id_revisor = ?,
              motivo_rechazo = ?
          WHERE id_orden = ?
        `,
        ).run(
          now,
          isStaff ? user.id : null,
          String(rejectReason || "Cancelada por el cliente").trim(),
          row.id_orden,
        );
      } else {
        db.prepare(
          `
          UPDATE ORDEN_COMPRA
          SET estado = ?, fecha_actualizacion = ?
          WHERE id_orden = ?
        `,
        ).run(status, now, row.id_orden);

        if (status === "procesando") {
          const payment = db
            .prepare(
              `
            SELECT id_pago FROM PAGO WHERE id_orden = ?
          `,
            )
            .get(row.id_orden);

          if (!payment) {
            throw new Error("No se encontró el pago de esta orden.");
          }

          db.prepare(
            `
            UPDATE PAGO
            SET estado = 'aprobado',
                fecha_pago = ?,
                fecha_revision = ?,
                id_revisor = ?,
                motivo_rechazo = NULL
            WHERE id_pago = ?
          `,
          ).run(now, now, user.id, payment.id_pago);

          const receiptNumber = `REC-${String(row.numero_orden).replace(/\D/g, "")}`;

          db.prepare(
            `
            INSERT INTO RECIBO (
              id_pago, numero_recibo, subtotal, impuesto, total
            ) VALUES (?, ?, ?, ?, ?)
          `,
          ).run(
            payment.id_pago,
            receiptNumber,
            row.subtotal,
            row.impuesto,
            row.total,
          );
        }
      }
    });

    update();

    return res.json({
      success: true,
      message: "Estado de la orden actualizado.",
      order: formatOrder(findOrder(req.params.id)),
    });
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "No se pudo actualizar la orden.",
    });
  }
});

export default router;
