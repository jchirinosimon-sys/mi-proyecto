const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const userPublicFields = require('../utils/userPublicFields');

const router = express.Router();

/**
 * POST /api/events
 * Crear un evento (auth requerido)
 */
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, date, location, cover } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'El título es requerido' });
        }

        if (!date) {
            return res.status(400).json({ error: 'La fecha es requerida' });
        }

        const event = new Event({
            title: title.trim(),
            description: description || '',
            date: new Date(date),
            location: location || '',
            cover: cover || null,
            createdBy: req.userId
        });

        await event.save();

        const populatedEvent = await Event.findById(event._id)
            .populate('createdBy', 'firstName lastName avatar')
            .populate('rsvp.user', userPublicFields);

        res.status(201).json({ event: populatedEvent });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/events
 * Listar eventos futuros
 */
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({
            date: { $gte: new Date() },
            isDeleted: false
        })
            .populate('createdBy', 'firstName lastName avatar')
            .populate('rsvp.user', userPublicFields)
            .sort({ date: 1 })
            .limit(20);

        res.json({ events });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/events/:eventId
 * Obtener evento individual
 */
router.get('/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId)
            .populate('createdBy', 'firstName lastName avatar')
            .populate('rsvp.user', userPublicFields);

        if (!event || event.isDeleted) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json({ event });
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/events/:eventId/rsvp
 * Confirmar asistencia a un evento (auth requerido)
 */
router.post('/:eventId/rsvp', auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['going', 'maybe', 'not_going'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido. Debe ser going, maybe o not_going' });
        }

        const event = await Event.findById(req.params.eventId);

        if (!event || event.isDeleted) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Buscar si el usuario ya tiene un rsvp
        const existingRsvp = event.rsvp.find(
            r => r.user.toString() === req.userId.toString()
        );

        if (existingRsvp) {
            existingRsvp.status = status;
        } else {
            event.rsvp.push({ user: req.userId, status });
        }

        await event.save();

        const updatedEvent = await Event.findById(event._id)
            .populate('createdBy', 'firstName lastName avatar')
            .populate('rsvp.user', userPublicFields);

        res.json({ event: updatedEvent });
    } catch (error) {
        console.error('Error al hacer RSVP:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/events/:eventId
 * Soft delete de evento (solo el creador)
 */
router.delete('/:eventId', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event || event.isDeleted) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        if (event.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este evento' });
        }

        event.isDeleted = true;
        await event.save();

        res.json({ message: 'Evento eliminado' });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
