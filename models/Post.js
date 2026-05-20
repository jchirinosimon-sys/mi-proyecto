const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "El contenido es requerido"],
    minlength: 1,
    maxlength: 5000,
  },
  author: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  photos: [
    {
      type: String,
      default: null,
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      authorName: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      likes: {
        type: Number,
        default: 0,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
      },
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  privacy: {
    type: String,
    enum: ["public", "friends", "only_me"],
    default: "public",
  },
  hashtags: [{ type: String }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  poll: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", default: null },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null,
  },
  gifUrl: { type: String, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================
// Índices para optimizar búsquedas
// ============================================
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });

// ============================================
// Middleware
// ============================================

// Actualizar fecha de modificación
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// ============================================
// Métodos de Instancia
// ============================================

// Contar likes
postSchema.methods.getLikeCount = function () {
  return this.likes.length;
};

// Verificar si un usuario le dio like
postSchema.methods.hasLike = function (userId) {
  return this.likes.some((id) => id.equals(userId));
};

// Contar comentarios
postSchema.methods.getCommentCount = function () {
  return this.comments.length;
};

// Agregar like
postSchema.methods.addLike = async function (userId) {
  if (!this.hasLike(userId)) {
    this.likes.push(userId);
    return await this.save();
  }
  return this;
};

// Remover like
postSchema.methods.removeLike = async function (userId) {
  this.likes = this.likes.filter((id) => !id.equals(userId));
  return await this.save();
};

// Agregar comentario
postSchema.methods.addComment = async function (authorId, authorName, content) {
  this.comments.push({
    author: authorId,
    authorName: authorName,
    content: content,
  });
  return await this.save();
};

// Remover comentario
postSchema.methods.removeComment = async function (commentId) {
  this.comments = this.comments.filter((c) => !c._id.equals(commentId));
  return await this.save();
};

// Soft delete
postSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return await this.save();
};

// Restaurar post eliminado
postSchema.methods.restore = async function () {
  this.isDeleted = false;
  return await this.save();
};

// ============================================
// Métodos Estáticos
// ============================================

// Obtener posts activos
postSchema.statics.getActive = function () {
  return this.find({ isDeleted: false }).sort({ createdAt: -1 });
};

// Obtener posts de un usuario
postSchema.statics.getByUser = function (userId) {
  return this.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Post", postSchema);
