const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));

// Middleware de logging de peticiones (útil para depuración en Railway)
app.use((req, res, next) => {
  try {
    console.log(
      `[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`,
    );
    console.log("Headers:", JSON.stringify(req.headers));
    if (req.body && Object.keys(req.body).length) {
      console.log("Body:", JSON.stringify(req.body));
    }
    res.on("finish", () => {
      console.log(
        `[RES] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode}`,
      );
    });
  } catch (e) {
    console.error("Error en middleware de logging:", e);
  }
  next();
});

// Servir archivos estáticos
app.use(express.static("."));
app.use("/uploads", express.static("uploads"));

// Exponer el Google Client ID al frontend de forma segura (solo el ID público, no el secret)
app.get("/api/config/public", (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  });
});

// Endpoint ultrarrápido para testing del proxy (responde antes de usar la DB)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});
app.get("/quick", (req, res) => res.send("ok"));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/sirnergia")
  .then(async () => {
    console.log("✓ Conectado a MongoDB");
    try {
      await syncPrivilegedAccounts();
    } catch (error) {
      console.error(
        "No se pudieron sincronizar cuentas privilegiadas:",
        error.message,
      );
    }
  })
  .catch((err) => console.error("✗ Error al conectar a MongoDB:", err));

// Importar rutas
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chat");
const searchRoutes = require("./routes/search");
const storyRoutes = require("./routes/stories");
const gameRoutes = require("./routes/games");
const pollRoutes = require("./routes/polls");
const eventRoutes = require("./routes/events");
const reportRoutes = require("./routes/reports");
const User = require("./models/User");
const { getAdminEmails } = require("./utils/admin");
const { getVerifiedEmails } = require("./utils/verified");

async function syncPrivilegedAccounts() {
  const adminEmails = getAdminEmails();
  const verifiedEmails = getVerifiedEmails();

  if (adminEmails.length) {
    await User.updateMany(
      { email: { $in: adminEmails } },
      { $set: { isAdmin: true } },
    );
  }

  if (verifiedEmails.length) {
    await User.updateMany(
      { email: { $in: verifiedEmails } },
      { $set: { isVerified: true } },
    );
  }
}

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reports", reportRoutes);

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ status: "Servidor funcionando correctamente" });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// Capturar errores no manejados para ayudar a depuración en producción
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor ejecutándose en http://${HOST}:${PORT}`);
  console.log(`🌐 En esta computadora: http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.MONGODB_URI || process.env.MONGO_URI}`);
});

// Graceful shutdown handlers to log SIGTERM/SIGINT and disconnect MongoDB
function gracefulShutdown(signal) {
  try {
    console.log(`${signal} recibido. Cerrando servidor...`);
    if (server && server.close) {
      server.close(() => {
        console.log("Servidor HTTP cerrado.");
        mongoose
          .disconnect()
          .then(() => console.log("Desconectado de MongoDB."))
          .finally(() => process.exit(0));
      });
    } else {
      mongoose
        .disconnect()
        .then(() => console.log("Desconectado de MongoDB."))
        .finally(() => process.exit(0));
    }
    // Forzar salida si no se cierra en 10s
    setTimeout(() => {
      console.error("Shutdown forzado después de timeout");
      process.exit(1);
    }, 10000).unref();
  } catch (e) {
    console.error("Error durante gracefulShutdown:", e);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
