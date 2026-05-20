const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const auth = require("../middleware/auth");
const userPublicFields = require("../utils/userPublicFields");

const router = express.Router();

async function findLastMessage(userId, friendId) {
  return Message.findOne({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
  })
    .populate("sender", userPublicFields)
    .populate("receiver", userPublicFields)
    .sort({ createdAt: -1 });
}

async function getOrCreateConversation(userId, friendId) {
  const participantKey = Conversation.buildParticipantKey(userId, friendId);

  let conversation = await Conversation.findOne({ participantKey });
  if (!conversation) {
    conversation = new Conversation({
      participants: [userId, friendId],
      participantKey,
    });
    await conversation.save();
  }

  return conversation;
}

/**
 * GET /api/chat/friends
 * Obtener lista de amigos del usuario autenticado
 */
router.get("/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "friends",
      `${userPublicFields} bio`,
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user.friends);
  } catch (error) {
    console.error("Error al obtener amigos:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/friends/:friendId
 * Agregar amigo
 */
router.post("/friends/:friendId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.friends.some((id) => id.toString() === req.params.friendId)) {
      return res.status(400).json({ error: "Ya es amigo" });
    }

    user.friends.push(req.params.friendId);
    await user.save();

    res.json({ message: "Amigo agregado" });
  } catch (error) {
    console.error("Error al agregar amigo:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/friends/:friendId
 * Eliminar amigo
 */
router.delete("/friends/:friendId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    user.friends = user.friends.filter(
      (id) => id.toString() !== req.params.friendId,
    );
    await user.save();

    res.json({ message: "Amigo eliminado" });
  } catch (error) {
    console.error("Error al eliminar amigo:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/conversations
 * Obtener lista de conversaciones guardadas
 */
router.get("/conversations", auth, async (req, res) => {
  try {
    const savedConversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", `${userPublicFields} bio`)
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(
      savedConversations.map(async (conversation) => {
        const friend = conversation.participants.find((participant) => {
          return participant._id.toString() !== req.userId;
        });

        if (!friend) {
          return null;
        }

        const lastMessage = await findLastMessage(req.userId, friend._id);

        return {
          conversationId: conversation._id,
          friend,
          lastMessage,
        };
      }),
    );

    res.json(conversations.filter(Boolean));
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/conversations/:friendId
 * Obtener conversacion con un amigo
 */
router.get("/conversations/:friendId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.friendId },
        { sender: req.params.friendId, receiver: req.userId },
      ],
      deletedBy: { $ne: req.userId },
    })
      .populate("sender", userPublicFields)
      .populate("receiver", userPublicFields)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error al obtener conversacion:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/conversations/:friendId
 * Crear o recuperar una conversacion con un amigo
 */
router.post("/conversations/:friendId", auth, async (req, res) => {
  try {
    if (req.params.friendId === req.userId) {
      return res
        .status(400)
        .json({ error: "No puedes crear un chat contigo mismo" });
    }

    const user = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId).select(
      `${userPublicFields} bio`,
    );

    if (!user || !friend) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const isFriend = user.friends.some(
      (id) => id.toString() === req.params.friendId,
    );
    if (!isFriend) {
      return res
        .status(403)
        .json({ error: "Solo puedes chatear con amigos agregados" });
    }

    const conversation = await getOrCreateConversation(
      req.userId,
      req.params.friendId,
    );
    const lastMessage = await findLastMessage(req.userId, req.params.friendId);

    res.status(201).json({
      conversationId: conversation._id,
      friend,
      lastMessage,
    });
  } catch (error) {
    console.error("Error al crear conversacion:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/messages
 * Enviar mensaje
 */
router.post("/messages", auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res
        .status(400)
        .json({ error: "receiverId y content son requeridos" });
    }

    const conversation = await getOrCreateConversation(req.userId, receiverId);

    const message = new Message({
      sender: req.userId,
      receiver: receiverId,
      content,
    });

    await message.save();
    conversation.updatedAt = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", userPublicFields)
      .populate("receiver", userPublicFields);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/messages/:messageId
 * Eliminar mensaje (soft delete solo para el usuario que lo borra)
 */
router.delete("/messages/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    // Verificar que el usuario sea el remitente
    if (message.sender.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Solo puedes eliminar tus propios mensajes" });
    }

    // Agregar al array deletedBy solo para el usuario actual (soft delete)
    if (!message.deletedBy.includes(req.userId)) {
      message.deletedBy.push(req.userId);
      await message.save();
    }

    res.json({ message: "Mensaje eliminado" });
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/typing/:friendId
 * Indicar que el usuario está escribiendo
 */
router.post("/typing/:friendId", auth, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(
      req.userId,
      req.params.friendId,
    );

    // Limpiar typing antiguo del mismo usuario
    conversation.typing = conversation.typing.filter(
      (t) => t.user.toString() !== req.userId,
    );

    // Agregar nuevo estado de typing
    conversation.typing.push({
      user: req.userId,
      timestamp: new Date(),
    });

    await conversation.save();
    res.json({ status: "typing" });
  } catch (error) {
    console.error("Error al indicar typing:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/typing/:friendId
 * Obtener estado de typing de un usuario
 */
router.get("/typing/:friendId", auth, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(
      req.userId,
      req.params.friendId,
    );

    // Filtrar typing antiguo (más de 10 segundos)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    conversation.typing = conversation.typing.filter(
      (t) => t.timestamp > tenSecondsAgo,
    );
    await conversation.save();

    // Verificar si el otro usuario está escribiendo
    const isTyping = conversation.typing.some(
      (t) => t.user.toString() === req.params.friendId,
    );

    res.json({ isTyping });
  } catch (error) {
    console.error("Error al obtener typing:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/messages/:messageId/react
 * Agregar reacción a un mensaje
 */
router.post("/messages/:messageId/react", auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    // Verificar que el usuario sea el remitente o destinatario
    if (
      message.sender.toString() !== req.userId &&
      message.receiver.toString() !== req.userId
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para reaccionar a este mensaje" });
    }

    // Eliminar reacción anterior del mismo usuario
    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.userId,
    );

    // Agregar nueva reacción
    message.reactions.push({
      emoji,
      user: req.userId,
    });

    await message.save();

    const updatedMessage = await Message.findById(message._id).populate(
      "reactions.user",
      userPublicFields,
    );

    res.json(updatedMessage);
  } catch (error) {
    console.error("Error al agregar reacción:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/messages/:messageId/read
 * Marcar mensaje como leído
 */
router.post("/messages/:messageId/read", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    // Solo el destinatario puede marcar como leído
    if (message.receiver.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Solo el destinatario puede marcar como leído" });
    }

    message.read = true;
    message.delivered = true;
    await message.save();

    res.json({ message: "Mensaje marcado como leído" });
  } catch (error) {
    console.error("Error al marcar como leído:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/conversations/:friendId/archive
 * Archivar conversación
 */
router.post("/conversations/:friendId/archive", auth, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(
      req.userId,
      req.params.friendId,
    );

    if (!conversation.archivedBy.includes(req.userId)) {
      conversation.archivedBy.push(req.userId);
      await conversation.save();
    }

    res.json({ message: "Conversación archivada" });
  } catch (error) {
    console.error("Error al archivar conversación:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/conversations/:friendId/unarchive
 * Desarchivar conversación
 */
router.post("/conversations/:friendId/unarchive", auth, async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(
      req.userId,
      req.params.friendId,
    );

    conversation.archivedBy = conversation.archivedBy.filter(
      (id) => id.toString() !== req.userId,
    );
    await conversation.save();

    res.json({ message: "Conversación desarchivada" });
  } catch (error) {
    console.error("Error al desarchivar conversación:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/conversations/:friendId/search?q=texto
 * Buscar mensajes en una conversación por contenido
 */
router.get("/conversations/:friendId/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res
        .status(400)
        .json({ error: "El parámetro de búsqueda q es requerido" });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.friendId },
        { sender: req.params.friendId, receiver: req.userId },
      ],
      deletedBy: { $ne: req.userId },
      content: { $regex: q, $options: "i" },
    })
      .populate("sender", userPublicFields)
      .populate("receiver", userPublicFields)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error al buscar mensajes:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/messages/voice
 * Enviar un mensaje de voz (audio en base64)
 */
router.post("/messages/voice", auth, async (req, res) => {
  try {
    const { receiverId, audioData, duration } = req.body;

    if (!receiverId || !audioData) {
      return res
        .status(400)
        .json({ error: "receiverId y audioData son requeridos" });
    }

    const conversation = await getOrCreateConversation(req.userId, receiverId);

    const message = new Message({
      sender: req.userId,
      receiver: receiverId,
      content: "[Mensaje de voz]",
      attachments: [
        {
          type: "audio",
          url: audioData,
          size: duration || 0,
        },
      ],
    });

    await message.save();
    conversation.updatedAt = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", userPublicFields)
      .populate("receiver", userPublicFields);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error al enviar mensaje de voz:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/messages/:messageId/reply
 * Responder a un mensaje existente
 */
router.post("/messages/:messageId/reply", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "El contenido de la respuesta es requerido" });
    }

    const originalMessage = await Message.findById(req.params.messageId);

    if (!originalMessage) {
      return res.status(404).json({ error: "Mensaje original no encontrado" });
    }

    // Determinar el destinatario: si yo soy el sender original, el receiver es el destinatario; si no, el sender original
    const receiverId =
      originalMessage.sender.toString() === req.userId
        ? originalMessage.receiver
        : originalMessage.sender;

    const conversation = await getOrCreateConversation(
      req.userId,
      receiverId.toString(),
    );

    const replyMessage = new Message({
      sender: req.userId,
      receiver: receiverId,
      content: content.trim(),
      replyTo: originalMessage._id,
    });

    await replyMessage.save();
    conversation.updatedAt = Date.now();
    await conversation.save();

    const populatedReply = await Message.findById(replyMessage._id)
      .populate("sender", userPublicFields)
      .populate("receiver", userPublicFields)
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: userPublicFields },
      });

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error("Error al responder mensaje:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
