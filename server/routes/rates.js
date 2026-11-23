import { Router } from "express";
import db from "../../database/connection.js";

const router = Router();

function requireSession(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión.",
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión.",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Solo un administrador puede gestionar las tasas.",
    });
  }

  next();
}

function parseRateId(value) {
  const match = /^T?(\d+)$/i.exec(String(value || ""));

  if (!match) return null;

  const id = Number(match[1]);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateRate(body) {
  const name = String(body.name || "").trim();
  const value = Number(body.value);

  if (name.length < 2 || name.length > 30) {
    return { error: "El nombre debe tener entre 2 y 30 caracteres." };
  }

  if (!Number.isFinite(value) || value <= 0 || value >= 1000000) {
    return { error: "La tasa debe ser un número positivo menor que 1000000." };
  }

  return {
    value: {
      name,
      value: Math.round(value * 10000) / 10000,
      active: body.active === true,
    },
  };
}

function formatRate(row) {
  return {
    id: `T${row.id_tasa}`,
    name: row.nombre,
    value: Number(row.valor),
    active: Boolean(row.activa),
    updatedAt: row.fecha_actualizacion,
    userId: String(row.id_usuario),
    updatedByName: row.nombre_usuario,
  };
}

function getRate(id) {
  return db
    .prepare(
      `
    SELECT
      t.id_tasa,
      t.nombre,
      t.valor,
      t.activa,
      t.fecha_actualizacion,
      t.id_usuario,
      u.nombre AS nombre_usuario
    FROM TASA_CAMBIO t
    INNER JOIN USUARIO u ON u.id_usuario = t.id_usuario
    WHERE t.id_tasa = ?
  `,
    )
    .get(id);
}

// Consultar tasas: cualquier usuario autenticado puede leerlas.
router.get("/", requireSession, (req, res) => {
  try {
    const rates = db
      .prepare(
        `
      SELECT
        t.id_tasa,
        t.nombre,
        t.valor,
        t.activa,
        t.fecha_actualizacion,
        t.id_usuario,
        u.nombre AS nombre_usuario
      FROM TASA_CAMBIO t
      INNER JOIN USUARIO u ON u.id_usuario = t.id_usuario
      ORDER BY t.activa DESC, t.nombre COLLATE NOCASE ASC
    `,
      )
      .all();

    return res.json({
      success: true,
      rates: rates.map(formatRate),
    });
  } catch (error) {
    console.error("Error al consultar tasas:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudieron consultar las tasas.",
    });
  }
});

// Registrar una tasa.
router.post("/", requireAdmin, (req, res) => {
  try {
    const validation = validateRate(req.body);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const rate = validation.value;
    const userId = Number(req.session.user.id);
    const now = new Date().toISOString();

    const createRate = db.transaction(() => {
      if (rate.active) {
        db.prepare(
          `
          UPDATE TASA_CAMBIO
          SET activa = 0
          WHERE activa = 1
        `,
        ).run();
      }

      const result = db
        .prepare(
          `
        INSERT INTO TASA_CAMBIO (
          nombre,
          valor,
          activa,
          fecha_actualizacion,
          id_usuario
        )
        VALUES (?, ?, ?, ?, ?)
      `,
        )
        .run(rate.name, rate.value, rate.active ? 1 : 0, now, userId);

      return Number(result.lastInsertRowid);
    });

    const id = createRate();

    return res.status(201).json({
      success: true,
      message: "Tasa registrada correctamente.",
      rate: formatRate(getRate(id)),
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una tasa con ese nombre.",
      });
    }

    console.error("Error al registrar tasa:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo registrar la tasa.",
    });
  }
});

// Actualizar una tasa.
router.put("/:id", requireAdmin, (req, res) => {
  try {
    const id = parseRateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identificador de tasa inválido.",
      });
    }

    if (!getRate(id)) {
      return res.status(404).json({
        success: false,
        message: "Tasa no encontrada.",
      });
    }

    const validation = validateRate(req.body);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const rate = validation.value;
    const userId = Number(req.session.user.id);
    const now = new Date().toISOString();

    const updateRate = db.transaction(() => {
      if (rate.active) {
        db.prepare(
          `
          UPDATE TASA_CAMBIO
          SET activa = 0
          WHERE activa = 1
        `,
        ).run();
      }

      db.prepare(
        `
        UPDATE TASA_CAMBIO
        SET
          nombre = ?,
          valor = ?,
          activa = ?,
          fecha_actualizacion = ?,
          id_usuario = ?
        WHERE id_tasa = ?
      `,
      ).run(rate.name, rate.value, rate.active ? 1 : 0, now, userId, id);
    });

    updateRate();

    return res.json({
      success: true,
      message: "Tasa actualizada correctamente.",
      rate: formatRate(getRate(id)),
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una tasa con ese nombre.",
      });
    }

    console.error("Error al actualizar tasa:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo actualizar la tasa.",
    });
  }
});

// Activar una tasa y desactivar las demás.
router.patch("/:id/active", requireAdmin, (req, res) => {
  try {
    const id = parseRateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identificador de tasa inválido.",
      });
    }

    if (!getRate(id)) {
      return res.status(404).json({
        success: false,
        message: "Tasa no encontrada.",
      });
    }

    const now = new Date().toISOString();
    const userId = Number(req.session.user.id);

    const activateRate = db.transaction(() => {
      db.prepare(
        `
        UPDATE TASA_CAMBIO
        SET activa = 0
        WHERE activa = 1
      `,
      ).run();

      db.prepare(
        `
        UPDATE TASA_CAMBIO
        SET
          activa = 1,
          fecha_actualizacion = ?,
          id_usuario = ?
        WHERE id_tasa = ?
      `,
      ).run(now, userId, id);
    });

    activateRate();

    return res.json({
      success: true,
      message: "Tasa activada correctamente.",
      rate: formatRate(getRate(id)),
    });
  } catch (error) {
    console.error("Error al activar tasa:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo activar la tasa.",
    });
  }
});

// Eliminar una tasa inactiva.
router.delete("/:id", requireAdmin, (req, res) => {
  try {
    const id = parseRateId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identificador de tasa inválido.",
      });
    }

    const rate = getRate(id);

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: "Tasa no encontrada.",
      });
    }

    if (rate.activa) {
      return res.status(409).json({
        success: false,
        message: "No puedes eliminar la tasa activa.",
      });
    }

    db.prepare(
      `
      DELETE FROM TASA_CAMBIO
      WHERE id_tasa = ?
    `,
    ).run(id);

    return res.json({
      success: true,
      message: "Tasa eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar tasa:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo eliminar la tasa.",
    });
  }
});

export default router;
