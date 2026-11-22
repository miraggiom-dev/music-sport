
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../database/connection.js';

const router = Router();

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debes introducir el correo y la contraseña.'
      });
    }

    const user = db.prepare(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.contrasena,
        u.rol,
        u.estado,
        u.fecha_creacion,
        c.id_cliente,
        c.direccion,
        c.identificacion
      FROM USUARIO u
      LEFT JOIN CLIENTE c ON c.id_usuario = u.id_usuario
      WHERE u.correo = ?
    `).get(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user.contrasena
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.'
      });
    }

    if (user.rol !== 'client' && user.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra inactiva.'
      });
    }

    if (user.rol === 'client' && !user.id_cliente) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta de cliente no tiene un perfil válido.'
      });
    }

    const authenticatedUser = {
      id: user.id_usuario,
      name: user.nombre,
      email: user.correo,
      phone: user.telefono,
      role: user.rol,
      status: user.estado,
      createdAt: user.fecha_creacion,
      ...(user.rol === 'client' && {
        clientId: user.id_cliente,
        address: user.direccion,
        docId: user.identificacion
      })
    };

    req.session.user = authenticatedUser;

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      user: authenticatedUser
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);

    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al iniciar sesión.'
    });
  }
});

// Registro de clientes
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      docId,
      password
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const normalizedPhone = String(phone || '').trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedDocId = String(docId || '').trim().toUpperCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Completa los campos obligatorios.'
      });
    }

    if (normalizedName.length < 3 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener entre 3 y 100 caracteres.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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
    `).get(normalizedEmail);

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
          nombre,
          correo,
          telefono,
          contrasena,
          rol,
          estado,
          fecha_creacion
        )
        VALUES (?, ?, ?, ?, 'client', NULL, ?)
      `).run(
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        passwordHash,
        createdAt
      );

      const userId = Number(userResult.lastInsertRowid);

      const clientResult = db.prepare(`
        INSERT INTO CLIENTE (
          id_usuario,
          direccion,
          identificacion
        )
        VALUES (?, ?, ?)
      `).run(
        userId,
        normalizedAddress,
        normalizedDocId
      );

      return {
        userId,
        clientId: Number(clientResult.lastInsertRowid)
      };
    });

    const ids = createClient();

    const authenticatedUser = {
      id: ids.userId,
      clientId: ids.clientId,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: 'client',
      status: null,
      createdAt,
      address: normalizedAddress,
      docId: normalizedDocId
    };

    req.session.user = authenticatedUser;

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada correctamente.',
      user: authenticatedUser
    });

  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    console.error('Error en el registro:', error);

    return res.status(500).json({
      success: false,
      message: 'No se pudo crear la cuenta.'
    });
  }
});

// Consultar la sesión actual
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'No hay una sesión iniciada.'
    });
  }

  return res.json({
    success: true,
    user: req.session.user
  });
});

// Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo cerrar la sesión.'
      });
    }

    res.clearCookie('connect.sid');

    return res.json({
      success: true,
      message: 'Sesión cerrada correctamente.'
    });
  });
});

export default router;
