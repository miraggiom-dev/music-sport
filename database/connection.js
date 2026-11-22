
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, '..');

const dataDirectory = resolve(projectRoot, 'data');
mkdirSync(dataDirectory, { recursive: true });

const databasePath = resolve(dataDirectory, 'music-sport.db');

const db = new Database(databasePath);

// Activar claves foráneas
db.pragma('foreign_keys = ON');

// Mejorar la gestión de lecturas y escrituras
db.pragma('journal_mode = WAL');

console.log('Base de datos SQLite conectada correctamente.');

export default db;