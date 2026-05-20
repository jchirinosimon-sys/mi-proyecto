const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdminUser } = require('../utils/admin');
const userPublicFields = require('../utils/userPublicFields');

const router = express.Router();

/**
 * POST /api/reports
 * Crear un reporte (auth requerido)
 */
router.post('/', auth, async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ error: 'targetType, targetId y reason son requeridos' });
        }

        // Verificar que no exista ya un reporte del mismo usuario para el mismo targetId
        const existingReport = await Report.findOne({
            reporter: req.userId,
            targetId
        });

        if (existingReport) {
            return res.status(400).json({ error: 'Ya reportaste este contenido' });
        }

        const report = new Report({
            reporter: req.userId,
            targetType,
            targetId,
            reason,
            description: description || ''
        });

        await report.save();

        // Registrar en activityLog del usuario
        await User.findByIdAndUpdate(req.userId, {
            $push: {
                activityLog: {
                    action: 'report',
                    target: targetType,
                    targetId: targetId.toString(),
                    createdAt: new Date()
                }
            }
        });

        res.status(201).json({ message: 'Reporte enviado' });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/reports
 * Listar reportes (solo admin)
 */
router.get('/', auth, async (req, res) => {
    try {
        // Verificar que el usuario es admin
        const user = await User.findById(req.userId).select('email isAdmin');
        if (!isAdminUser(user)) {
            return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
        }

        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const reports = await Report.find(filter)
            .populate('reporter', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ reports });
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
