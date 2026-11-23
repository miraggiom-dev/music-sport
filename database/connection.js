
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { schema } from "./schema.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "..");

const dataDirectory = process.env.DATA_DIRECTORY
  ? resolve(process.env.DATA_DIRECTORY)
  : resolve(projectRoot, "data");

mkdirSync(dataDirectory, { recursive: true });

const databasePath = resolve(dataDirectory, "music-sport.db");

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Crear las tablas si todavía no existen.
db.exec(schema);

// Crear automáticamente el administrador principal.
const adminEmail = "admin@musicsport.com";

const existingAdmin = db
  .prepare("SELECT id_usuario FROM USUARIO WHERE correo = ?")
  .get(adminEmail);

if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync("admin123", 10);

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
  `).run(
    "Administrador Principal",
    adminEmail,
    "04120000001",
    passwordHash,
  );

  console.log("Administrador principal creado correctamente.");
}

console.log("Base de datos Music&Sport conectada y esquema inicializado.");

export default db;
