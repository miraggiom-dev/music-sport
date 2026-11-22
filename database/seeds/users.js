
import bcrypt from 'bcryptjs';
import db from '../connection.js';

const users = [
  {
    nombre: 'Administrador',
    correo: 'admin@musicsport.com',
    telefono: '04120000001',
    contrasena: 'admin123',
    rol: 'admin',
    estado: 'activo'
  },
  {
    nombre: 'Vendedor Demo',
    correo: 'vendedor@musicsport.com',
    telefono: '04120000002',
    contrasena: 'vendor123',
    rol: 'vendor',
    estado: 'activo'
  },
  {
    nombre: 'Cliente Demo',
    correo: 'cliente@demo.com',
    telefono: '04120000003',
    contrasena: 'cliente123',
    rol: 'client',
    estado: null
  }
];

async function seedUsers() {
  try {
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO USUARIO
      (nombre, correo, telefono, contrasena, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertClient = db.prepare(`
      INSERT OR IGNORE INTO CLIENTE
      (id_usuario, direccion, identificacion)
      VALUES (?, ?, ?)
    `);

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.contrasena, 10);

      insertUser.run(
        user.nombre,
        user.correo,
        user.telefono,
        passwordHash,
        user.rol,
        user.estado
      );

      if (user.rol === 'client') {
        const savedUser = db.prepare(`
          SELECT id_usuario
          FROM USUARIO
          WHERE correo = ?
        `).get(user.correo);

        insertClient.run(
          savedUser.id_usuario,
          'Dirección de demostración',
          'V-00000000'
        );
      }
    }

    console.log('Usuarios de demostración creados correctamente.');

    const result = db.prepare(`
      SELECT id_usuario, nombre, correo, rol, estado
      FROM USUARIO
      ORDER BY id_usuario
    `).all();

    console.table(result);

  } catch (error) {
    console.error('Error al crear usuarios:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

await seedUsers();
