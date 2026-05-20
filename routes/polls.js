const express = require("express");
const Poll = require("../models/Poll");
const auth = require("../middleware/auth");
const userPublicFields = require("../utils/userPublicFields");

const router = express.Router();

/**
 * POST /api/polls
 * Crear una encuesta (auth requerido)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { question, options, postId, endsAt } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "La pregunta es requerida" });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
      return res
        .status(400)
        .json({ error: "La encuesta debe tener entre 2 y 5 opciones" });
    }

    if (!postId) {
      return res.status(400).json({ error: "El postId es requerido" });
    }

    const poll = new Poll({
      question: question.trim(),
      options: options.map((text) => ({
        text: String(text).trim(),
        votes: [],
      })),
      postId,
      createdBy: req.userId,
      endsAt: endsAt || null,
    });

    await poll.save();

    res.status(201).json(poll);
  } catch (error) {
    console.error("Error al crear encuesta:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/polls/:pollId
 * Obtener encuesta con votos populados
 */
router.get("/:pollId", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId).populate(
      "options.votes",
      "firstName lastName avatar",
    );

    if (!poll) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }

    res.json(poll);
  } catch (error) {
    console.error("Error al obtener encuesta:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/polls/:pollId/vote
 * Votar en una encuesta (auth requerido)
 */
router.post("/:pollId/vote", auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;

    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ error: "optionIndex es requerido" });
    }

    const poll = await Poll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }

    if (poll.endsAt && new Date() > poll.endsAt) {
      return res.status(400).json({ error: "La encuesta ha finalizado" });
    }

    const idx = parseInt(optionIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= poll.options.length) {
      return res.status(400).json({ error: "Índice de opción inválido" });
    }

    // Remover voto anterior del usuario de todas las opciones
    poll.options.forEach((option) => {
      option.votes = option.votes.filter(
        (userId) => userId.toString() !== req.userId.toString(),
      );
    });

    // Agregar nuevo voto
    poll.options[idx].votes.push(req.userId);

    await poll.save();

    const updatedPoll = await Poll.findById(poll._id).populate(
      "options.votes",
      "firstName lastName avatar",
    );

    res.json(updatedPoll);
  } catch (error) {
    console.error("Error al votar en encuesta:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/polls/:pollId
 * Eliminar encuesta (solo el creador)
 */
router.delete("/:pollId", auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }

    if (poll.createdBy.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar esta encuesta" });
    }

    await Poll.findByIdAndDelete(req.params.pollId);

    res.json({ message: "Encuesta eliminada" });
  } catch (error) {
    console.error("Error al eliminar encuesta:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
