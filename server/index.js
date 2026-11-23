
import express from "express";
import session from "express-session";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import db from "../database/connection.js";
import { SQLiteSessionStore } from "./sessionStore.js";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import clientsRoutes from "./routes/clients.js";
import productsRoutes from "./routes/products.js";
import ordersRoutes from "./routes/orders.js";
import ratesRoutes from "./routes/rates.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const sessionSecret = isProduction
  ? process.env.SESSION_SECRET
  : process.env.SESSION_SECRET ||
    "music-sport-local-development-secret-change-before-production";

if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error(
    "En producción, SESSION_SECRET debe tener al menos 32 caracteres.",
  );
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "5mb" }));

// Almacenamiento persistente de sesiones en SQLite.
const sessionStore = new SQLiteSessionStore(db);

app.use(
  session({
    name: "connect.sid",
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

// Rutas de la API.
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/rates", ratesRoutes);

// Estado de la API.
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "Music&Sport API funcionando correctamente",
    status: "online",
  });
});

// Estado de SQLite.
app.get("/api/db-status", (req, res) => {
  try {
    const result = db.prepare("SELECT 1 AS connected").get();

    res.json({
      success: true,
      message: "Base de datos conectada correctamente",
      database: result.connected === 1 ? "online" : "offline",
    });
  } catch (error) {
    console.error("Error comprobando SQLite:", error);

    res.status(500).json({
      success: false,
      message: "Error al conectar con la base de datos",
    });
  }
});

// Servir la aplicación React compilada.
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "..");
const distDirectory = resolve(projectRoot, "dist");
const indexFile = resolve(distDirectory, "index.html");

if (!existsSync(indexFile)) {
  console.warn(
    "No se encontró dist/index.html. Ejecuta pnpm build para compilar el frontend.",
  );
} else {
  app.use(express.static(distDirectory));

  // Fallback compatible con Express 5 y React Router.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      return next();
    }

    res.sendFile(indexFile, (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Music&Sport disponible en el puerto ${PORT}`);
  console.log("Almacenamiento de sesiones: SQLite");
  console.log(`Frontend: ${existsSync(indexFile) ? "disponible" : "no compilado"}`);
  console.log(`Entorno: ${isProduction ? "producción" : "desarrollo"}`);
});
