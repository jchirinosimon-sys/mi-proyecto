const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['post', 'user', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: ['spam', 'harassment', 'hate_speech', 'misinformation', 'nudity', 'violence', 'other'], required: true },
    description: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now, immutable: true }
});
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });
module.exports = mongoose.model('Report', reportSchema);
