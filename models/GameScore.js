const mongoose = require("mongoose");

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  game: {
    type: String,
    enum: ["snake", "memory", "tetris", "2048", "ppt"],
    required: true,
  },
  score: {
    type: Number,
    default: null,
  },
  timeMs: {
    type: Number,
    default: null,
  },
  playedAt: {
    type: Date,
    default: Date.now,
  },
});

gameScoreSchema.index({ userId: 1, game: 1 }, { unique: true });
gameScoreSchema.index({ game: 1, score: -1 });
gameScoreSchema.index({ game: 1, timeMs: 1 });

module.exports = mongoose.model("GameScore", gameScoreSchema);
