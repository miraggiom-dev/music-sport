
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../database/connection.js';

const router = Router();

// Solo los administradores pueden gestionar usuarios.
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

function formatUser(user) {
  return {
    id: String(user.id_usuario),
    name: user.nombre,
    email: user.correo,
    phone: user.telefono || '',
    role: user.rol,
    status: user.estado,
    createdAt: user.fecha_creacion,
    password: ''
  };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getUserId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/users
// Consultar administradores y vendedores.
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        id_usuario,
        nombre,
        correo,
        telefono,
        rol,
        estado,
        fecha_creacion
      FROM USUARIO
      WHERE rol IN ('admin', 'vendor')
      ORDER BY id_usuario ASC
    `).all();

    res.json({
      success: true,
      users: users.map(formatUser)
    });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los usuarios.'
    });
  }
});

// POST /api/users
// Crear un administrador o vendedor.
router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role = req.body.role;
    const password = String(req.body.password || '');

    // El teléfono es opcional.
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Completa todos los campos obligatorios.'
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Introduce un correo electrónico válido.'
      });
    }

    if (!['admin', 'vendor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol seleccionado no es válido.'
      });
    }

    if (password.length < 6 || password.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener entre 6 y 50 caracteres.'
      });
    }

    const existingUser = db.prepare(`
      SELECT id_usuario FROM USUARIO WHERE correo = ?
    `).get(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta registrada con ese correo.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO USUARIO (
        nombre,
        correo,
        telefono,
        contrasena,
        rol,
        estado
      )
      VALUES (?, ?, ?, ?, ?, 'activo')
    `).run(name, email, phone, hashedPassword, role);

    const createdUser = db.prepare(`
      SELECT
        id_usuario,
        nombre,
        correo,
        telefono,
        rol,
        estado,
        fecha_creacion
      FROM USUARIO
      WHERE id_usuario = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente.',
      user: formatUser(createdUser)
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudo crear el usuario.'
    });
  }
});

// PUT /api/users/:id
// Editar los datos de un usuario.
router.put('/:id', async (req, res) => {
  try {
    const id = getUserId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de usuario no válido.'
      });
    }

    const existingUser = db.prepare(`
      SELECT * FROM USUARIO
      WHERE id_usuario = ? AND rol IN ('admin', 'vendor')
    `).get(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.'
      });
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role = req.body.role;
    const password = String(req.body.password || '');

    // El teléfono es opcional.
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Completa todos los campos obligatorios.'
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Introduce un correo electrónico válido.'
      });
    }

    if (!['admin', 'vendor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol seleccionado no es válido.'
      });
    }

    const isCurrentUser = String(req.session.user.id) === String(id);

    if (isCurrentUser && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador.'
      });
    }

    if (password && (password.length < 6 || password.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener entre 6 y 50 caracteres.'
      });
    }

    const duplicate = db.prepare(`
      SELECT id_usuario
      FROM USUARIO
      WHERE correo = ? AND id_usuario != ?
    `).get(email, id);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Ese correo ya está siendo utilizado por otra cuenta.'
      });
    }

    let hashedPassword = existingUser.contrasena;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    db.prepare(`
      UPDATE USUARIO
      SET nombre = ?,
          correo = ?,
          telefono = ?,
          rol = ?,
          contrasena = ?
      WHERE id_usuario = ?
    `).run(name, email, phone, role, hashedPassword, id);

    const updatedUser = db.prepare(`
      SELECT
        id_usuario,
        nombre,
        correo,
        telefono,
        rol,
        estado,
        fecha_creacion
      FROM USUARIO
      WHERE id_usuario = ?
    `).get(id);

    // Mantener actualizados los datos de la sesión si se editó
    // la cuenta del administrador que inició sesión.
    if (isCurrentUser) {
      req.session.user = {
        ...req.session.user,
        name: updatedUser.nombre,
        email: updatedUser.correo,
        phone: updatedUser.telefono || '',
        role: updatedUser.rol,
        status: updatedUser.estado
      };
    }

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente.',
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el usuario.'
    });
  }
});

// PATCH /api/users/:id/status
// Suspender o reactivar una cuenta.
router.patch('/:id/status', (req, res) => {
  try {
    const id = getUserId(req.params.id);
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de usuario no válido.'
      });
    }

    if (!['activo', 'inactivo'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'El estado seleccionado no es válido.'
      });
    }

    if (String(req.session.user.id) === String(id) && status === 'inactivo') {
      return res.status(400).json({
        success: false,
        message: 'No puedes suspender tu propia cuenta.'
      });
    }

    const result = db.prepare(`
      UPDATE USUARIO
      SET estado = ?
      WHERE id_usuario = ? AND rol IN ('admin', 'vendor')
    `).run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.'
      });
    }

    res.json({
      success: true,
      message: status === 'activo'
        ? 'Usuario reactivado correctamente.'
        : 'Usuario suspendido correctamente.'
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudo cambiar el estado del usuario.'
    });
  }
});

// DELETE /api/users/:id
// Eliminar un usuario si no tiene registros asociados.
router.delete('/:id', (req, res) => {
  try {
    const id = getUserId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de usuario no válido.'
      });
    }

    if (String(req.session.user.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta.'
      });
    }

    const result = db.prepare(`
      DELETE FROM USUARIO
      WHERE id_usuario = ? AND rol IN ('admin', 'vendor')
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente.'
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar este usuario porque tiene registros asociados. Puedes suspender su cuenta para conservar el historial.'
      });
    }

    console.error('Error al eliminar usuario:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el usuario.'
    });
  }
});

export default router;
