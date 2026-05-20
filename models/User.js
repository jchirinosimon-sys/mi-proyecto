const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "El nombre es requerido"],
    trim: true,
    minlength: 2,
  },
  lastName: {
    type: String,
    required: [true, "El apellido es requerido"],
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: [true, "El email es requerido"],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
    select: false, // No mostrar por defecto
  },
  googleId: {
    type: String,
    default: null,
    sparse: true,
  },
  avatar: {
    type: String,
    default: "👤",
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lastLogin: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: null,
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  activityLog: [
    {
      action: { type: String },
      target: { type: String },
      targetId: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
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
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// Middleware - Hook antes de guardar
// ============================================

// Actualizar fecha de modificación
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Hash de contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// Métodos de Instancia
// ============================================

// Comparar contraseña
userSchema.methods.comparePassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Obtener perfil público (sin datos sensibles)
userSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.email;
  return obj;
};

// Formato JSON (no mostrar contraseña)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ============================================
// Métodos Estáticos
// ============================================

// Buscar por email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Contar amigos
userSchema.methods.friendCount = function () {
  return this.friends.length;
};

// Verificar si dos usuarios son amigos
userSchema.methods.isFriend = function (userId) {
  return this.friends.some((id) => id.equals(userId));
};

module.exports = mongoose.model("User", userSchema);
