const mongoose = require('mongoose');

const storyReplySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    media: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    text: {
        type: String,
        default: '',
        maxlength: 220
    },
    replies: [storyReplySchema],
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000
    }
});

storySchema.index({ expiresAt: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
