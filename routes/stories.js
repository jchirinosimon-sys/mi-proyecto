const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdminUser } = require('../utils/admin');
const { uploadFileBuffer, deleteCloudinaryAsset } = require('../utils/cloudinary');
const userPublicFields = require('../utils/userPublicFields');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /image\/|video\//.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(new Error('Solo se permiten fotos o videos para historias'));
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const stories = await Story.find({ expiresAt: { $gt: new Date() } })
            .populate('userId', userPublicFields)
            .populate('replies.userId', userPublicFields)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(stories);
    } catch (error) {
        console.error('Error al obtener historias:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, upload.single('media'), async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Selecciona una foto o video' });
        }

        const uploadedMedia = await uploadFileBuffer(req.file, 'sinergia/stories');

        const story = new Story({
            userId: req.userId,
            media: uploadedMedia.secure_url,
            mediaType: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
            text: String(req.body.text || '').trim()
        });

        await story.save();
        const populatedStory = await Story.findById(story._id).populate('userId', userPublicFields);

        res.status(201).json({
            message: 'Historia publicada',
            story: populatedStory
        });
    } catch (error) {
        console.error('Error al crear historia:', error);
        res.status(500).json({ error: error.message });
    }
});

// Responder a una historia - DEBE ESTAR ANTES DE /:id
router.post('/:id/reply', auth, async (req, res) => {
    console.log('POST /:id/reply recibido para story:', req.params.id);
    try {
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'El texto de la respuesta es requerido' });
        }

        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ error: 'Historia no encontrada' });
        }

        if (story.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Esta historia ha expirado' });
        }

        const reply = {
            userId: req.userId,
            text: text.trim(),
            createdAt: new Date()
        };

        story.replies.push(reply);
        await story.save();

        // Obtener la respuesta con el usuario poblado
        const populatedStory = await Story.findById(req.params.id)
            .populate('userId', userPublicFields)
            .populate('replies.userId', userPublicFields);

        const newReply = populatedStory.replies[populatedStory.replies.length - 1];

        res.status(201).json({
            message: 'Respuesta enviada',
            reply: newReply
        });
    } catch (error) {
        console.error('Error al responder historia:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar historia propia
router.delete('/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Historia no encontrada' });
        const user = await User.findById(req.userId).select('email isAdmin');
        const canDelete = String(story.userId) === String(req.userId) || isAdminUser(user);

        if (!canDelete) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta historia' });
        }
        // Borrar archivo físico
        if (/^https?:\/\//i.test(story.media)) {
            await deleteCloudinaryAsset(story.media);
        } else {
            const filePath = path.join(__dirname, '..', story.media);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Story.findByIdAndDelete(req.params.id);
        res.json({ message: 'Historia eliminada' });
    } catch (error) {
        console.error('Error al eliminar historia:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
