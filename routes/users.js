const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const userPublicFields = require("../utils/userPublicFields");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)"));
  },
});

function deleteAvatarFile(avatarPath) {
  if (!avatarPath || !avatarPath.startsWith("/uploads/")) {
    return;
  }

  const normalizedPath = avatarPath.replace(/^\/+/, "");
  const absolutePath = path.join(__dirname, "..", normalizedPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

/**
 * GET /api/users
 * Obtener todos los usuarios
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").limit(20);

    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/me/activity
 * Obtener historial de actividad del usuario autenticado
 */
router.get("/me/activity", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("activityLog");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const activityLog = user.activityLog
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

    res.json(activityLog);
  } catch (error) {
    console.error("Error al obtener historial de actividad:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId
 * Obtener perfil de un usuario
 */
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("friends", `${userPublicFields} bio`);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:userId
 * Actualizar perfil de usuario
 */
router.put("/:userId", auth, upload.single("avatar"), async (req, res) => {
  try {
    // Verificar que solo pueda actualizar su propio perfil
    if (req.params.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para actualizar este perfil" });
    }

    const { firstName, lastName, bio, avatar } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (typeof bio === "string") user.bio = bio;

    if (req.file) {
      deleteAvatarFile(user.avatar);
      user.avatar = `/uploads/${req.file.filename}`;
    } else if (avatar) {
      user.avatar = avatar;
    }

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: "Perfil actualizado exitosamente",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/agregar-amigo
 * Agregar un amigo
 */
router.post("/:userId/agregar-amigo", auth, async (req, res) => {
  try {
    const userActual = await User.findById(req.userId);
    const usuarioNuevo = await User.findById(req.params.userId);

    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: "No puedes agregarte a ti mismo" });
    }

    if (!usuarioNuevo) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!userActual) {
      return res
        .status(404)
        .json({ error: "Usuario autenticado no encontrado" });
    }

    // Verificar si ya es amigo
    if (userActual.friends.some((id) => id.toString() === req.params.userId)) {
      return res.status(400).json({ error: "Ya es tu amigo" });
    }

    userActual.friends.push(req.params.userId);
    usuarioNuevo.friends.push(req.userId);

    await userActual.save();
    await usuarioNuevo.save();

    res.json({ message: "Amigo agregado exitosamente" });
  } catch (error) {
    console.error("Error al agregar amigo:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/remover-amigo
 * Remover un amigo
 */
router.post("/:userId/remover-amigo", auth, async (req, res) => {
  try {
    const userActual = await User.findById(req.userId);
    const usuarioRemover = await User.findById(req.params.userId);

    if (!userActual) {
      return res
        .status(404)
        .json({ error: "Usuario autenticado no encontrado" });
    }

    if (!usuarioRemover) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Remover de ambos lados
    userActual.friends = userActual.friends.filter(
      (id) => id.toString() !== req.params.userId,
    );
    usuarioRemover.friends = usuarioRemover.friends.filter(
      (id) => id.toString() !== req.userId,
    );

    await userActual.save();
    await usuarioRemover.save();

    res.json({ message: "Amigo removido exitosamente" });
  } catch (error) {
    console.error("Error al remover amigo:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/block
 * Bloquear un usuario
 */
router.post("/:userId/block", auth, async (req, res) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: "No puedes bloquearte a ti mismo" });
    }

    const userActual = await User.findById(req.userId);

    if (!userActual) {
      return res
        .status(404)
        .json({ error: "Usuario autenticado no encontrado" });
    }

    // Verificar si ya está bloqueado
    if (
      userActual.blockedUsers.some((id) => id.toString() === req.params.userId)
    ) {
      return res.status(400).json({ error: "Ya bloqueado" });
    }

    // Bloquear usuario
    userActual.blockedUsers.push(req.params.userId);

    // Remover de friends en ambos lados
    userActual.friends = userActual.friends.filter(
      (id) => id.toString() !== req.params.userId,
    );

    const usuarioBloqueado = await User.findById(req.params.userId);
    if (usuarioBloqueado) {
      usuarioBloqueado.friends = usuarioBloqueado.friends.filter(
        (id) => id.toString() !== req.userId,
      );
      await usuarioBloqueado.save();
    }

    // Registrar en activityLog
    userActual.activityLog.push({
      action: "block",
      target: "user",
      targetId: req.params.userId,
    });

    await userActual.save();

    res.json({ message: "Usuario bloqueado" });
  } catch (error) {
    console.error("Error al bloquear usuario:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:userId/unblock
 * Desbloquear un usuario
 */
router.post("/:userId/unblock", auth, async (req, res) => {
  try {
    const userActual = await User.findById(req.userId);

    if (!userActual) {
      return res
        .status(404)
        .json({ error: "Usuario autenticado no encontrado" });
    }

    userActual.blockedUsers = userActual.blockedUsers.filter(
      (id) => id.toString() !== req.params.userId,
    );

    await userActual.save();

    res.json({ message: "Usuario desbloqueado" });
  } catch (error) {
    console.error("Error al desbloquear usuario:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
