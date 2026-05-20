const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    participantKey: {
        type: String,
        required: true,
        unique: true
    },
    typing: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ participantKey: 1 }, { unique: true });

conversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

conversationSchema.statics.buildParticipantKey = function(userId1, userId2) {
    return [userId1.toString(), userId2.toString()].sort().join(':');
};

module.exports = mongoose.model('Conversation', conversationSchema);
