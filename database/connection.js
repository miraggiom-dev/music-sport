
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync, readFileSync } from "node:fs";
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

const initialization = db.prepare(`
  SELECT valor
  FROM INICIALIZACION
  WHERE clave = ?
`);

const setInitialization = db.prepare(`
  INSERT INTO INICIALIZACION (clave, valor, fecha_actualizacion)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(clave) DO UPDATE SET
    valor = excluded.valor,
    fecha_actualizacion = CURRENT_TIMESTAMP
`);

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

// Los datos de demostración se cargan solamente en una base nueva.
// La tabla INICIALIZACION impide repeticiones y los errores revierten
// toda la carga mediante una transacción SQLite.
const demoStatus = initialization.get("demo-data");

if (!demoStatus) {
  const userCount = db.prepare("SELECT COUNT(*) AS total FROM USUARIO").get().total;
  const productCount = db.prepare("SELECT COUNT(*) AS total FROM PRODUCTO").get().total;

  const shouldLoadDemo = userCount === 1 && productCount === 0;

  if (shouldLoadDemo) {
    try {
      const demoPath = resolve(projectRoot, "database", "demo-data.sql");
      const demoSql = readFileSync(demoPath, "utf8").replace(/^\uFEFF/, "");

      db.exec("BEGIN IMMEDIATE");
      db.exec(demoSql);
      setInitialization.run("demo-data", "loaded");
      db.exec("COMMIT");

      console.log("Datos de demostración cargados correctamente.");
    } catch (error) {
      if (db.inTransaction) {
        db.exec("ROLLBACK");
      }
      throw new Error(`No se pudo cargar los datos de demostración: ${error.message}`);
    }
  } else {
    setInitialization.run("demo-data", "skipped-existing-data");
    console.log("Inicialización omitida: la base contiene datos existentes.");
  }
}

// Completar imágenes solamente en productos demostrativos sin imagen.
// Esta operación no reemplaza fotografías existentes ni modifica productos personalizados.
const demoImages = [
  ["MS-MUS-001", "/product-images/guitarra.webp"],
  ["MS-MUS-002", "/product-images/teclado.webp"],
  ["MS-MUS-003", "/product-images/microfono.webp"],
  ["MS-DEP-004", "/product-images/balon-adidas.webp"],
  ["MS-DEP-005", "/product-images/balon-baloncesto.webp"],
  ["MS-DEP-006", "/product-images/balon-volleyball.webp"],
  ["MS-FIT-007", "/product-images/mancuernas.webp"],
  ["MS-FIT-008", "/product-images/colchoneta.webp"],
  ["MS-DEP-009", "/product-images/raqueta.webp"],
  ["MS-MUS-010", "/product-images/baquetas.webp"],
];

const updateDemoImage = db.prepare(`
  UPDATE PRODUCTO
  SET imagen = ?
  WHERE sku = ?
    AND (
      imagen IS NULL
      OR TRIM(imagen) = ''
      OR imagen LIKE 'https://images.unsplash.com/%'
      OR imagen LIKE '/product-images/ms-%'
    )
`);

for (const [sku, image] of demoImages) {
  updateDemoImage.run(image, sku);
}

console.log("Base de datos Music&Sport conectada y esquema inicializado.");

export default db;
