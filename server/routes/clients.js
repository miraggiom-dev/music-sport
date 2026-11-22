
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../database/connection.js';

const router = Router();

// Solo los administradores pueden gestionar clientes.
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
      message: 'No tienes permisos para realizar esta operación.'
    });
  }

  next();
}

router.use(requireAdmin);

// Formatear los datos para el frontend.
function formatClient(client) {
  return {
    id: String(client.id_cliente),
    userId: String(client.id_usuario),
    name: client.nombre,
    email: client.correo,
    phone: client.telefono || '',
    address: client.direccion || '',
    docId: client.identificacion || '',
    createdAt: client.fecha_creacion,
    password: ''
  };
}

// GET: consultar todos los clientes.
router.get('/', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT
        c.id_cliente,
        u.id_usuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.fecha_creacion,
        c.direccion,
        c.identificacion
      FROM CLIENTE c
      INNER JOIN USUARIO u
        ON u.id_usuario = c.id_usuario
      WHERE u.rol = 'client'
      ORDER BY u.fecha_creacion DESC
    `).all();

    return res.json({
      success: true,
      clients: clients.map(formatClient)
    });
  } catch (error) {
    console.error('Error al consultar clientes:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los clientes.'
    });
  }
});

// POST: crear un cliente desde administración.
router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const docId = String(req.body.docId || '').trim().toUpperCase();
    const password = String(req.body.password || '');

    if (!name || !email || !docId || !phone|| !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo, identificación y contraseña son obligatorios.'
      });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener entre 3 y 100 caracteres.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no es válido.'
      });
    }

    if (password.length < 6 || password.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener entre 6 y 50 caracteres.'
      });
    }

    const existingUser = db.prepare(`
      SELECT id_usuario
      FROM USUARIO
      WHERE correo = ?
    `).get(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const createClient = db.transaction(() => {
      const userResult = db.prepare(`
        INSERT INTO USUARIO (
          nombre, correo, telefono, contrasena,
          rol, estado, fecha_creacion
        )
        VALUES (?, ?, ?, ?, 'client', NULL, ?)
      `).run(name, email, phone, passwordHash, createdAt);

      const userId = Number(userResult.lastInsertRowid);

      const clientResult = db.prepare(`
        INSERT INTO CLIENTE (
          id_usuario, direccion, identificacion
        )
        VALUES (?, ?, ?)
      `).run(userId, address, docId);

      return {
        id_cliente: Number(clientResult.lastInsertRowid),
        id_usuario: userId,
        nombre: name,
        correo: email,
        telefono: phone,
        direccion: address,
        identificacion: docId,
        fecha_creacion: createdAt
      };
    });

    const client = createClient();

    return res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente.',
      client: formatClient(client)
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    console.error('Error al crear cliente:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo crear el cliente.'
    });
  }
});

// PUT: actualizar los datos de un cliente.
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de cliente inválido.'
      });
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const docId = String(req.body.docId || '').trim().toUpperCase();

    if (!name || !email || !phone ||!docId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo e identificación son obligatorios.'
      });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener entre 3 y 100 caracteres.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no es válido.'
      });
    }

    const client = db.prepare(`
      SELECT c.id_cliente, c.id_usuario
      FROM CLIENTE c
      INNER JOIN USUARIO u ON u.id_usuario = c.id_usuario
      WHERE c.id_cliente = ? AND u.rol = 'client'
    `).get(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    const duplicate = db.prepare(`
      SELECT id_usuario
      FROM USUARIO
      WHERE correo = ? AND id_usuario != ?
    `).get(email, client.id_usuario);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    const updateClient = db.transaction(() => {
      db.prepare(`
        UPDATE USUARIO
        SET nombre = ?, correo = ?, telefono = ?
        WHERE id_usuario = ?
      `).run(name, email, phone, client.id_usuario);

      db.prepare(`
        UPDATE CLIENTE
        SET direccion = ?, identificacion = ?
        WHERE id_cliente = ?
      `).run(address, docId, id);
    });

    updateClient();

    const updated = db.prepare(`
      SELECT
        c.id_cliente,
        u.id_usuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.fecha_creacion,
        c.direccion,
        c.identificacion
      FROM CLIENTE c
      INNER JOIN USUARIO u ON u.id_usuario = c.id_usuario
      WHERE c.id_cliente = ?
    `).get(id);

    return res.json({
      success: true,
      message: 'Cliente actualizado correctamente.',
      client: formatClient(updated)
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el cliente.'
    });
  }
});

// DELETE: eliminar un cliente sin órdenes asociadas.
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de cliente inválido.'
      });
    }

    const client = db.prepare(`
      SELECT id_cliente, id_usuario
      FROM CLIENTE
      WHERE id_cliente = ?
    `).get(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    const orderCount = db.prepare(`
      SELECT COUNT(*) AS total
      FROM ORDEN_COMPRA
      WHERE id_cliente = ?
    `).get(id).total;

    if (orderCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este cliente porque tiene órdenes asociadas. Su historial debe conservarse.'
      });
    }

    db.prepare(`
      DELETE FROM USUARIO
      WHERE id_usuario = ? AND rol = 'client'
    `).run(client.id_usuario);

    return res.json({
      success: true,
      message: 'Cliente eliminado correctamente.'
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este cliente porque tiene registros relacionados.'
      });
    }

    console.error('Error al eliminar cliente:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el cliente.'
    });
  }
});

export default router;
