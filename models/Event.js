const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    date: { type: Date, required: true },
    location: { type: String, default: '', maxlength: 300 },
    cover: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rsvp: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['going', 'maybe', 'not_going'], default: 'going' }
    }],
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
});
eventSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
eventSchema.index({ date: 1, isDeleted: 1 });
eventSchema.index({ createdBy: 1 });
module.exports = mongoose.model('Event', eventSchema);
