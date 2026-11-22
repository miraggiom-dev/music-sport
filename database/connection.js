import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { schema } from './schema.js';
import { seedProducts } from './seeds/products.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, '..');

const dataDirectory = resolve(projectRoot, 'data');
mkdirSync(dataDirectory, { recursive: true });

const databasePath = resolve(dataDirectory, 'music-sport.db');

const db = new Database(databasePath);

// Activar claves foráneas.
db.pragma('foreign_keys = ON');

// Mejorar la gestión de lecturas y escrituras.
db.pragma('journal_mode = WAL');

// Crear las tablas si todavía no existen.
db.exec(schema);

// Cargar los productos iniciales solo si la tabla está vacía.
seedProducts(db);

console.log('Base de datos Music&Sport conectada y esquema inicializado.');

export default db;