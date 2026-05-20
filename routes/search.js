const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');

const userPublicFields = require('../utils/userPublicFields');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();

        if (query.length < 2) {
            return res.json({ users: [], posts: [] });
        }

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedQuery, 'i');

        const [users, posts] = await Promise.all([
            User.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: ['$firstName', ' ', '$lastName'] },
                                regex: escapedQuery,
                                options: 'i'
                            }
                        }
                    }
                ]
            })
                .select(`${userPublicFields} bio`)
                .limit(6),
            Post.find({
                isDeleted: false,
                content: searchRegex
            })
                .populate('userId', userPublicFields)
                .populate('likes', userPublicFields)
                .populate({
                    path: 'comments.author',
                    select: userPublicFields
                })
                .sort({ createdAt: -1 })
                .limit(8)
        ]);

        res.json({ users, posts });
    } catch (error) {
        console.error('Error al buscar:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
