
import express from 'express';
import session from 'express-session';
import db from '../database/connection.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import clientsRoutes from './routes/clients.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';

const app = express();
const PORT = 3000;

// Permitir imágenes codificadas en Base64 de hasta 2 MB.
app.use(express.json({ limit: '5mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'music-sport-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// Rutas de la API.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Music&Sport API funcionando correctamente',
    status: 'online'
  });
});

// Comprobar conexión con SQLite.
app.get('/api/db-status', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 AS connected').get();

    res.json({
      success: true,
      message: 'Base de datos conectada correctamente',
      database: result.connected === 1 ? 'online' : 'offline'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Music&Sport API disponible en http://localhost:${PORT}`);
});
