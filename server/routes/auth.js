import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "node:crypto";
import db from "../../database/connection.js";

const router = Router();

// Crear una sesión nueva después de autenticar al usuario.
function regenerateSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        return reject(error);
      }

      req.session.user = user;

      req.session.save((saveError) => {
        if (saveError) {
          return reject(saveError);
        }

        resolve();
      });
    });
  });
}

// Inicio de sesión.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Debes introducir el correo y la contraseña.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db
      .prepare(
        `
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
    `,
      )
      .get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos.",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.contrasena);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos.",
      });
    }

    if (user.rol !== "client" && user.estado !== "activo") {
      return res.status(403).json({
        success: false,
        message: "Esta cuenta se encuentra inactiva.",
      });
    }

    if (user.rol === "client" && !user.id_cliente) {
      return res.status(403).json({
        success: false,
        message: "La cuenta de cliente no tiene un perfil válido.",
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
      ...(user.rol === "client" && {
        clientId: user.id_cliente,
        address: user.direccion,
        docId: user.identificacion,
      }),
    };

    await regenerateSession(req, authenticatedUser);

    return res.json({
      success: true,
      message: "Inicio de sesión exitoso.",
      user: authenticatedUser,
    });
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);

    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al iniciar sesión.",
    });
  }
});

// Registro de clientes.
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, address, docId, password } = req.body || {};

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const normalizedName = typeof name === "string" ? name.trim() : "";

    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

    const normalizedAddress = typeof address === "string" ? address.trim() : "";

    const normalizedDocId =
      typeof docId === "string" ? docId.trim().toUpperCase() : "";

    if (
      !normalizedName ||
      !normalizedEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Completa los campos obligatorios.",
      });
    }

    if (normalizedName.length < 3 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "El nombre debe tener entre 3 y 100 caracteres.",
      });
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico no es válido.",
      });
    }

    if (password.length < 6 || password.length > 50) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener entre 6 y 50 caracteres.",
      });
    }

    const existingUser = db
      .prepare(
        `
      SELECT id_usuario
      FROM USUARIO
      WHERE correo = ?
    `,
      )
      .get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Este correo electrónico ya está registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const createClient = db.transaction(() => {
      const userResult = db
        .prepare(
          `
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
      `,
        )
        .run(
          normalizedName,
          normalizedEmail,
          normalizedPhone,
          passwordHash,
          createdAt,
        );

      const userId = Number(userResult.lastInsertRowid);

      const clientResult = db
        .prepare(
          `
        INSERT INTO CLIENTE (
          id_usuario,
          direccion,
          identificacion
        )
        VALUES (?, ?, ?)
      `,
        )
        .run(userId, normalizedAddress, normalizedDocId);

      return {
        userId,
        clientId: Number(clientResult.lastInsertRowid),
      };
    });

    const ids = createClient();

    const authenticatedUser = {
      id: ids.userId,
      clientId: ids.clientId,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: "client",
      status: null,
      createdAt,
      address: normalizedAddress,
      docId: normalizedDocId,
    };

    await regenerateSession(req, authenticatedUser);

    return res.status(201).json({
      success: true,
      message: "Cuenta creada correctamente.",
      user: authenticatedUser,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "Este correo electrónico ya está registrado.",
      });
    }

    console.error("Error en el registro:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo crear la cuenta.",
    });
  }
});

// Solicitar recuperación de contraseña (modo simulado).
router.post("/forgot-password", (req, res) => {
  try {
    if (process.env.RECOVERY_MODE !== "simulated") {
      return res.status(503).json({
        success: false,
        message: "La recuperación simulada no está habilitada.",
      });
    }

    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Debes introducir un correo electrónico.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db
      .prepare(
        `
        SELECT id_usuario, correo
        FROM USUARIO
        WHERE correo = ?
      `,
      )
      .get(normalizedEmail);

    // La respuesta es la misma exista o no la cuenta.
    const genericResponse = {
      success: true,
      message:
        "Si el correo está registrado, se generó un código de recuperación. Consulta la consola del servidor.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Código numérico aleatorio de 8 dígitos.
    const recoveryCode = String(randomInt(10000000, 100000000));

    // En la base de datos solo se almacena el hash del código.
    const tokenHash = createHash("sha256").update(recoveryCode).digest("hex");

    const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const createRecoveryToken = db.transaction(() => {
      // Invalidar códigos anteriores del mismo usuario.
      db.prepare(
        `
        UPDATE TOKEN_RECUPERACION
        SET usado = 1
        WHERE id_usuario = ? AND usado = 0
      `,
      ).run(user.id_usuario);

      db.prepare(
        `
        INSERT INTO TOKEN_RECUPERACION (
          id_usuario,
          token_hash,
          fecha_expiracion,
          usado
        )
        VALUES (?, ?, ?, 0)
      `,
      ).run(user.id_usuario, tokenHash, expiration);
    });

    createRecoveryToken();

    // El código solo se muestra en la consola local del servidor.
    console.log("\n========================================");
    console.log("   MUSIC&SPORT - RECUPERACIÓN SIMULADA");
    console.log("========================================");
    console.log(`Correo: ${user.correo}`);
    console.log(`Código de recuperación: ${recoveryCode}`);
    console.log("Vigencia: 15 minutos");
    console.log("========================================\n");

    return res.json(genericResponse);
  } catch (error) {
    console.error("Error solicitando recuperación:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo procesar la solicitud de recuperación.",
    });
  }
});

// Restablecer contraseña mediante código de recuperación.
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !normalizedEmail ||
      typeof code !== "string" ||
      !/^\d{8}$/.test(code) ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Los datos de recuperación no son válidos.",
      });
    }

    if (newPassword.length < 6 || newPassword.length > 50) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener entre 6 y 50 caracteres.",
      });
    }

    const user = db
      .prepare(
        `
        SELECT id_usuario
        FROM USUARIO
        WHERE correo = ?
      `,
      )
      .get(normalizedEmail);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "El código es inválido, ha vencido o ya fue utilizado.",
      });
    }

    const tokenHash = createHash("sha256").update(code).digest("hex");

    const recoveryToken = db
      .prepare(
        `
        SELECT id_token, fecha_expiracion
        FROM TOKEN_RECUPERACION
        WHERE id_usuario = ?
          AND token_hash = ?
          AND usado = 0
      `,
      )
      .get(user.id_usuario, tokenHash);

    if (
      !recoveryToken ||
      Date.now() > Date.parse(recoveryToken.fecha_expiracion)
    ) {
      return res.status(400).json({
        success: false,
        message: "El código es inválido, ha vencido o ya fue utilizado.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const resetPassword = db.transaction(() => {
      // Verificar nuevamente que el código siga disponible.
      const currentToken = db
        .prepare(
          `
          SELECT id_token
          FROM TOKEN_RECUPERACION
          WHERE id_token = ?
            AND id_usuario = ?
            AND token_hash = ?
            AND usado = 0
            AND fecha_expiracion > ?
        `,
        )
        .get(
          recoveryToken.id_token,
          user.id_usuario,
          tokenHash,
          new Date().toISOString(),
        );

      if (!currentToken) {
        return false;
      }

      db.prepare(
        `
        UPDATE USUARIO
        SET contrasena = ?
        WHERE id_usuario = ?
      `,
      ).run(passwordHash, user.id_usuario);

      // Marcar el código utilizado.
      db.prepare(
        `
        UPDATE TOKEN_RECUPERACION
        SET usado = 1
        WHERE id_token = ?
      `,
      ).run(recoveryToken.id_token);

      // Invalidar cualquier otro código pendiente del usuario.
      db.prepare(
        `
        UPDATE TOKEN_RECUPERACION
        SET usado = 1
        WHERE id_usuario = ? AND usado = 0
      `,
      ).run(user.id_usuario);

      return true;
    });

    if (!resetPassword()) {
      return res.status(400).json({
        success: false,
        message: "El código es inválido, ha vencido o ya fue utilizado.",
      });
    }

    return res.json({
      success: true,
      message: "La contraseña se actualizó correctamente.",
    });
  } catch (error) {
    console.error("Error restableciendo contraseña:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo restablecer la contraseña.",
    });
  }
});

// Consultar la sesión actual.
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "No hay una sesión iniciada.",
    });
  }

  return res.json({
    success: true,
    user: req.session.user,
  });
});

// Cerrar sesión.
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo cerrar la sesión.",
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      success: true,
      message: "Sesión cerrada correctamente.",
    });
  });
});

export default router;
