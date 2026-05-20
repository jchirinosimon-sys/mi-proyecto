const mongoose = require('mongoose');
const pollSchema = new mongoose.Schema({
    question: { type: String, required: true, maxlength: 300 },
    options: [{
        text: { type: String, required: true, maxlength: 100 },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endsAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, immutable: true }
});
pollSchema.index({ postId: 1 });
module.exports = mongoose.model('Poll', pollSchema);
