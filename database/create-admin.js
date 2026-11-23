
import bcrypt from "bcryptjs";

// Validar el entorno antes de abrir cualquier base de datos.
if (process.env.NODE_ENV !== "production") {
  throw new Error(
    "Este procedimiento solo puede ejecutarse en producción.",
  );
}

if (!process.env.DATA_DIRECTORY) {
  throw new Error(
    "Debes configurar DATA_DIRECTORY con la ruta del almacenamiento persistente.",
  );
}

const requiredVariables = [
  "ADMIN_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PHONE",
  "ADMIN_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]?.trim()) {
    throw new Error(`Falta configurar la variable ${variable}.`);
  }
}

const name = process.env.ADMIN_NAME.trim();
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const phone = process.env.ADMIN_PHONE.trim();
const password = process.env.ADMIN_PASSWORD;

if (password.length < 12) {
  throw new Error("La contraseña debe tener al menos 12 caracteres.");
}

const { default: db } = await import("./connection.js");

try {
  const existingUsers = db
    .prepare("SELECT COUNT(*) AS total FROM USUARIO")
    .get();

  if (existingUsers.total > 0) {
    throw new Error(
      "La base de datos ya contiene usuarios. No se creará otro administrador.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  db.prepare(`
    INSERT INTO USUARIO (
      nombre,
      correo,
      telefono,
      contrasena,
      rol,
      estado
    )
    VALUES (?, ?, ?, ?, 'admin', 'activo')
  `).run(name, email, phone, passwordHash);

  console.log("Administrador inicial creado correctamente.");
  console.log(`Correo: ${email}`);
} catch (error) {
  console.error("No se pudo crear el administrador:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
