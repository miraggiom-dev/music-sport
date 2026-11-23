import session from "express-session";

const SESSION_DURATION = 1000 * 60 * 60 * 8;

export class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();

    this.db = db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS SESION (
        id_sesion TEXT PRIMARY KEY,
        datos TEXT NOT NULL,
        fecha_expiracion INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sesion_expiracion
      ON SESION(fecha_expiracion);
    `);

    this.getStatement = db.prepare(`
      SELECT datos, fecha_expiracion
      FROM SESION
      WHERE id_sesion = ?
    `);

    this.setStatement = db.prepare(`
      INSERT INTO SESION (id_sesion, datos, fecha_expiracion)
      VALUES (?, ?, ?)
      ON CONFLICT(id_sesion) DO UPDATE SET
        datos = excluded.datos,
        fecha_expiracion = excluded.fecha_expiracion
    `);

    this.deleteStatement = db.prepare(`
      DELETE FROM SESION WHERE id_sesion = ?
    `);

    this.touchStatement = db.prepare(`
      UPDATE SESION
      SET fecha_expiracion = ?
      WHERE id_sesion = ?
    `);

    this.cleanupStatement = db.prepare(`
      DELETE FROM SESION WHERE fecha_expiracion <= ?
    `);

    this.cleanupStatement.run(Date.now());
  }

  get(sid, callback) {
    try {
      const row = this.getStatement.get(sid);

      if (!row) {
        return callback(null, null);
      }

      if (row.fecha_expiracion <= Date.now()) {
        this.deleteStatement.run(sid);
        return callback(null, null);
      }

      return callback(null, JSON.parse(row.datos));
    } catch (error) {
      return callback(error);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie?.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + (sessionData.cookie?.maxAge ?? SESSION_DURATION);

      this.setStatement.run(sid, JSON.stringify(sessionData), expiresAt);

      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }

  destroy(sid, callback) {
    try {
      this.deleteStatement.run(sid);
      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie?.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + (sessionData.cookie?.maxAge ?? SESSION_DURATION);

      this.touchStatement.run(expiresAt, sid);

      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }
}
