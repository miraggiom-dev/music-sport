import bcrypt from "bcryptjs";

// Este procedimiento solo debe ejecutarse expresamente en producción.
if (process.env.NODE_ENV !== "production") {
  throw new Error("Este procedimiento solo puede ejecutarse en producción.");
}

if (!process.env.DATA_DIRECTORY) {
  throw new Error(
    "Debes configurar DATA_DIRECTORY con la ruta del almacenamiento.",
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
  const admin = db
    .prepare(
      `
    SELECT id_usuario
    FROM USUARIO
    WHERE correo = ? AND rol = 'admin'
  `,
    )
    .get("admin@musicsport.com");

  if (!admin) {
    throw new Error("No se encontró el administrador inicial de Music&Sport.");
  }

  const emailInUse = db
    .prepare(
      `
    SELECT id_usuario
    FROM USUARIO
    WHERE correo = ? AND id_usuario <> ?
  `,
    )
    .get(email, admin.id_usuario);

  if (emailInUse) {
    throw new Error("El correo indicado ya está registrado por otro usuario.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  db.prepare(
    `
    UPDATE USUARIO
    SET nombre = ?,
        correo = ?,
        telefono = ?,
        contrasena = ?
    WHERE id_usuario = ?
  `,
  ).run(name, email, phone, passwordHash, admin.id_usuario);

  console.log("Administrador actualizado correctamente.");
  console.log(`Correo: ${email}`);
} catch (error) {
  console.error("No se pudo actualizar el administrador:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
