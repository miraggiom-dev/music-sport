
import express from 'express';
import db from '../database/connection.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Music&Sport API funcionando correctamente',
    status: 'online'
  });
});

// Comprobar conexión con SQLite
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