const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { isAdminUser } = require("../utils/admin");
const userPublicFields = require("../utils/userPublicFields");

const router = express.Router();

async function userCanModerate(req, ownerId) {
  if (!ownerId) {
    return false;
  }

  if (String(ownerId) === String(req.userId)) {
    return true;
  }

  const user = await User.findById(req.userId).select("email isAdmin");
  return isAdminUser(user);
}

// Configurar multer para subida de archivos
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
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB para videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = /image\/|video\//.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes o videos"));
    }
  },
});

async function getPopulatedPost(postId) {
  return Post.findById(postId)
    .populate("userId", userPublicFields)
    .populate("likes", userPublicFields)
    .populate({
      path: "comments.author",
      select: userPublicFields,
    });
}

function deletePostPhotos(photoPaths = []) {
  photoPaths.forEach((photoPath) => {
    if (!photoPath) {
      return;
    }

    const normalizedPath = photoPath.replace(/^\/+/, "");
    const absolutePath = path.join(__dirname, "..", normalizedPath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  });
}

/**
 * GET /api/posts
 * Obtener todos los posts (feed)
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const feedQuery = { privacy: { $ne: "only_me" } };

    const posts = await Post.find(feedQuery)
      .populate("userId", userPublicFields)
      .populate("likes", userPublicFields)
      .populate({
        path: "comments.author",
        select: userPublicFields,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(feedQuery);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener posts:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/posts/saved (auth)
 * Posts guardados del usuario autenticado
 * IMPORTANTE: registrada ANTES de /:postId para evitar conflictos
 */
router.get("/saved", auth, async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.userId })
      .populate("userId", userPublicFields)
      .populate("likes", userPublicFields)
      .populate({
        path: "comments.author",
        select: userPublicFields,
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error al obtener posts guardados:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/posts/hashtag/:tag
 * Posts por hashtag (auth opcional)
 * IMPORTANTE: registrada ANTES de /:postId para evitar conflictos
 */
router.get("/hashtag/:tag", async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({
      hashtags: tag,
      privacy: { $ne: "only_me" },
      isDeleted: false,
    })
      .populate("userId", userPublicFields)
      .populate("likes", userPublicFields)
      .populate({
        path: "comments.author",
        select: userPublicFields,
      })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (error) {
    console.error("Error al obtener posts por hashtag:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/friends", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const user = await User.findById(req.userId).select("friends");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const query = {
      userId: { $in: user.friends },
      isDeleted: false,
    };

    const posts = await Post.find(query)
      .populate("userId", userPublicFields)
      .populate("likes", userPublicFields)
      .populate({
        path: "comments.author",
        select: userPublicFields,
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: 1,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener posts de amigos:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/posts/usuario/:userId
 * Obtener posts de un usuario específico (con filtro de privacidad)
 */
router.get("/usuario/:userId", async (req, res) => {
  try {
    // Intentar leer el token del header de forma opcional
    const token = req.headers.authorization?.split(" ")[1];
    let viewerId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      viewerId = decoded.userId || decoded.id || decoded._id;
    } catch (e) {
      // Token ausente o inválido: continuar como anónimo
    }

    const profileUserId = req.params.userId;

    // Construir filtro de privacidad
    let privacyFilter;

    if (viewerId && viewerId.toString() === profileUserId.toString()) {
      // El propio usuario ve todos sus posts
      privacyFilter = {};
    } else if (viewerId) {
      // Comprobar si el viewer es amigo del dueño del perfil
      const profileUser = await User.findById(profileUserId).select("friends");
      const areFriends =
        profileUser &&
        profileUser.friends.some((id) => id.toString() === viewerId.toString());

      if (areFriends) {
        // Amigos ven public y friends
        privacyFilter = { privacy: { $in: ["public", "friends"] } };
      } else {
        // Extraños autenticados solo ven public
        privacyFilter = { privacy: "public" };
      }
    } else {
      // Anónimos solo ven public
      privacyFilter = { privacy: "public" };
    }

    const posts = await Post.find({ userId: profileUserId, ...privacyFilter })
      .populate("userId", userPublicFields)
      .populate("likes", userPublicFields)
      .populate({
        path: "comments.author",
        select: userPublicFields,
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error al obtener posts del usuario:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", auth, upload.array("photos", 5), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "El contenido del post es requerido" });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Procesar las fotos subidas
    const photos = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    // Extraer hashtags del contenido
    const hashtags = (content.match(/#[\w\u00C0-\u024F]+/g) || []).map((h) =>
      h.slice(1).toLowerCase(),
    );

    const nuevoPost = new Post({
      content: content.trim(),
      author: `${user.firstName} ${user.lastName}`,
      userId: req.userId,
      photos: photos,
      hashtags: hashtags,
    });

    await nuevoPost.save();
    const populatedPost = await getPopulatedPost(nuevoPost._id);

    res.status(201).json({
      message: "Post creado exitosamente",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error al crear post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/posts/:postId
 * Editar un post
 */
router.put("/:postId", auth, async (req, res) => {
  try {
    const { content } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    if (!(await userCanModerate(req, post.userId))) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para editar este post" });
    }

    if (content) post.content = content;
    if (
      req.body.privacy &&
      ["public", "friends", "only_me"].includes(req.body.privacy)
    ) {
      post.privacy = req.body.privacy;
    }
    post.updatedAt = Date.now();

    await post.save();
    const updatedPost = await getPopulatedPost(post._id);

    res.json({
      message: "Post actualizado exitosamente",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error al actualizar post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/posts/:postId
 * Eliminar un post
 */
router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    if (!(await userCanModerate(req, post.userId))) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar este post" });
    }

    deletePostPhotos(post.photos);
    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: "Post eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/posts/:postId/like
 * Dar like a un post
 */
router.post("/:postId/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    const yaLiked = post.likes.includes(req.userId);

    if (yaLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    const updatedPost = await getPopulatedPost(post._id);

    res.json({
      message: yaLiked ? "Like removido" : "Post likeado",
      post: updatedPost,
      liked: !yaLiked,
    });
  } catch (error) {
    console.error("Error al dar like:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/posts/:postId/comentar
 * Agregar un comentario
 */
router.post("/:postId/comentar", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "El comentario no puede estar vacío" });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const nuevoComentario = {
      author: req.userId,
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      content: content.trim(),
      createdAt: Date.now(),
    };

    post.comments.push(nuevoComentario);
    await post.save();

    // Obtener el post actualizado con comentarios poblados
    const updatedPost = await getPopulatedPost(post._id);

    res.status(201).json({
      message: "Comentario agregado exitosamente",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error al comentar:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/posts/:postId/save (auth)
 * Toggle guardar/desguardar un post
 */
router.post("/:postId/save", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    const alreadySaved = post.savedBy.some(
      (id) => id.toString() === req.userId.toString(),
    );

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter(
        (id) => id.toString() !== req.userId.toString(),
      );
    } else {
      post.savedBy.push(req.userId);
    }

    await post.save();

    res.json({
      saved: !alreadySaved,
      message: alreadySaved
        ? "Post eliminado de guardados"
        : "Post guardado exitosamente",
    });
  } catch (error) {
    console.error("Error al guardar/desguardar post:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/posts/:postId/comentarios/:commentId
 * Eliminar un comentario
 */
router.delete("/:postId/comentarios/:commentId", auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    // Encontrar el comentario
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    if (!(await userCanModerate(req, comment.author))) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar este comentario" });
    }

    // Eliminar el comentario
    post.comments.id(commentId).deleteOne();
    await post.save();

    // Obtener el post actualizado
    const updatedPost = await getPopulatedPost(postId);

    res.json({
      message: "Comentario eliminado exitosamente",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
