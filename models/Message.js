const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El remitente es requerido']
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El destinatario es requerido']
    },
    content: {
        type: String,
        required: [true, 'El contenido del mensaje es requerido'],
        maxlength: 5000
    },
    read: {
        type: Boolean,
        default: false
    },
    delivered: {
        type: Boolean,
        default: false
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reactions: [{
        emoji: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'file', 'audio'],
            default: 'file'
        },
        url: String,
        size: Number,
        name: String
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// ============================================
// Índices para optimizar búsquedas
// ============================================

// Conversaciones eficientes (bidireccional)
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

// Mensajes no leídos
messageSchema.index({ receiver: 1, read: 1 });

// TTL Index: Eliminar mensajes después de 1 año (si lo necesitas)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// ============================================
// Métodos de Instancia
// ============================================

// Marcar como leído
messageSchema.methods.markAsRead = async function() {
    this.read = true;
    return await this.save();
};

// ============================================
// Métodos Estáticos
// ============================================

// Obtener conversación entre dos usuarios
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50) {
    return this.find({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 }
        ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'firstName lastName avatar')
    .populate('receiver', 'firstName lastName avatar');
};

// Obtener mensajes no leídos de un usuario
messageSchema.statics.getUnread = function(userId) {
    return this.find({ receiver: userId, read: false })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName avatar');
};

// Contar mensajes no leídos
messageSchema.statics.countUnread = function(userId) {
    return this.countDocuments({ receiver: userId, read: false });
};

// Marcar todos los mensajes de un remitente como leídos
messageSchema.statics.markConversationAsRead = function(userId1, userId2) {
    return this.updateMany(
        { sender: userId1, receiver: userId2, read: false },
        { $set: { read: true } }
    );
};

module.exports = mongoose.model('Message', messageSchema);