const express = require("express");
const GameScore = require("../models/GameScore");
const auth = require("../middleware/auth");
const userPublicFields = require("../utils/userPublicFields");

const router = express.Router();

const scoreGames = ["snake", "tetris", "2048", "ppt"];
const timeGames = ["memory"];
const validGames = [...scoreGames, ...timeGames];

function formatLeaderboardEntry(entry) {
  const user = entry.userId;
  return {
    user: user && typeof user === "object" ? user : null,
    score: entry.score,
    timeMs: entry.timeMs,
    playedAt: entry.playedAt,
  };
}

router.get("/leaderboard/:game", async (req, res) => {
  try {
    const { game } = req.params;

    if (!validGames.includes(game)) {
      return res.status(400).json({ error: "Juego no válido" });
    }

    const query = { game };

    if (scoreGames.includes(game)) {
      query.score = { $ne: null };
    } else {
      query.timeMs = { $ne: null };
    }

    const sort = timeGames.includes(game)
      ? { timeMs: 1, playedAt: 1 }
      : { score: -1, playedAt: 1 };

    const entries = await GameScore.find(query)
      .populate("userId", userPublicFields)
      .sort(sort)
      .limit(11);

    const { userId } = req.query;

    if (userId) {
      const top10 = entries.slice(0, 10);
      const inTop = top10.some(
        (e) => e.userId && e.userId._id && e.userId._id.toString() === userId,
      );

      let userRank = null;
      let userEntry = null;

      if (!inTop) {
        const userScore = await GameScore.findOne({ userId, game });
        if (userScore) {
          let betterQuery = { game };
          if (scoreGames.includes(game)) {
            betterQuery.score = { $gt: userScore.score || 0 };
          } else {
            betterQuery.timeMs = { $lt: userScore.timeMs };
          }
          const betterCount = await GameScore.countDocuments(betterQuery);
          userRank = betterCount + 1;
          const populated = await userScore.populate(
            "userId",
            userPublicFields,
          );
          userEntry = formatLeaderboardEntry(populated);
        }
      }

      return res.json({
        game,
        leaderboard: top10.filter((e) => e.userId).map(formatLeaderboardEntry),
        userRank,
        userEntry,
      });
    }

    // Sin userId — retornar top 10
    res.json({
      game,
      leaderboard: entries
        .slice(0, 10)
        .filter((e) => e.userId)
        .map(formatLeaderboardEntry),
    });
  } catch (error) {
    console.error("Error al obtener clasificación:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/scores", auth, async (req, res) => {
  try {
    const { game, score, timeMs } = req.body;

    if (!validGames.includes(game)) {
      return res.status(400).json({ error: "Juego no válido" });
    }

    if (scoreGames.includes(game)) {
      const parsedScore = Number(score);
      if (!Number.isFinite(parsedScore) || parsedScore < 0) {
        return res.status(400).json({ error: "Puntuación inválida" });
      }

      const existing = await GameScore.findOne({ userId: req.userId, game });

      if (
        existing &&
        existing.score !== null &&
        parsedScore <= existing.score
      ) {
        return res.json({
          message: "Puntuación registrada",
          improved: false,
          record: formatLeaderboardEntry(existing),
        });
      }

      const record = await GameScore.findOneAndUpdate(
        { userId: req.userId, game },
        {
          userId: req.userId,
          game,
          score: parsedScore,
          timeMs: null,
          playedAt: Date.now(),
        },
        { upsert: true, new: true },
      ).populate("userId", userPublicFields);

      return res.json({
        message: "Puntuación guardada",
        improved: true,
        record: formatLeaderboardEntry(record),
      });
    }

    if (timeGames.includes(game)) {
      const parsedTime = Number(timeMs);
      if (!Number.isFinite(parsedTime) || parsedTime <= 0) {
        return res.status(400).json({ error: "Tiempo inválido" });
      }

      const existing = await GameScore.findOne({ userId: req.userId, game });

      if (
        existing &&
        existing.timeMs !== null &&
        parsedTime >= existing.timeMs
      ) {
        return res.json({
          message: "Tiempo registrado",
          improved: false,
          record: formatLeaderboardEntry(existing),
        });
      }

      const record = await GameScore.findOneAndUpdate(
        { userId: req.userId, game },
        {
          userId: req.userId,
          game,
          score: null,
          timeMs: parsedTime,
          playedAt: Date.now(),
        },
        { upsert: true, new: true },
      ).populate("userId", userPublicFields);

      return res.json({
        message: "Tiempo guardado",
        improved: true,
        record: formatLeaderboardEntry(record),
      });
    }

    res.status(400).json({ error: "Juego no válido" });
  } catch (error) {
    console.error("Error al guardar puntuación:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/games/total
 * Obtener el total de puntajes de un usuario (suma de todos los juegos de puntos)
 */
router.get("/total", auth, async (req, res) => {
  try {
    const scores = await GameScore.find({
      userId: req.userId,
      game: { $in: scoreGames },
      score: { $ne: null },
    });

    const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);

    // Obtener mejor tiempo de memorama
    const memoryScore = await GameScore.findOne({
      userId: req.userId,
      game: "memory",
      timeMs: { $ne: null },
    });

    res.json({
      totalScore,
      memoryTime: memoryScore ? memoryScore.timeMs : null,
      games: scores.map((s) => ({
        game: s.game,
        score: s.score,
      })),
    });
  } catch (error) {
    console.error("Error al obtener total:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/games/total/leaderboard
 * Obtener leaderboard de total de puntajes
 */
router.get("/total/leaderboard", async (req, res) => {
  try {
    const { userId } = req.query;

    // Agregar todos los puntajes por usuario
    const pipeline = [
      {
        $match: {
          game: { $in: scoreGames },
          score: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$score" },
        },
      },
      {
        $sort: { totalScore: -1 },
      },
      {
        $limit: 11,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
          },
          totalScore: 1,
        },
      },
    ];

    const results = await GameScore.aggregate(pipeline);

    const top10 = results.slice(0, 10);

    let userRank = null;
    let userEntry = null;

    if (userId) {
      const inTop = top10.some((r) => r.user._id.toString() === userId);
      if (!inTop) {
        const userTotal = await GameScore.aggregate([
          {
            $match: {
              userId: userId,
              game: { $in: scoreGames },
              score: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$userId",
              totalScore: { $sum: "$score" },
            },
          },
        ]);

        if (userTotal.length > 0) {
          const betterCount = await GameScore.aggregate([
            {
              $match: {
                game: { $in: scoreGames },
                score: { $ne: null },
              },
            },
            {
              $group: {
                _id: "$userId",
                totalScore: { $sum: "$score" },
              },
            },
            {
              $match: {
                totalScore: { $gt: userTotal[0].totalScore },
              },
            },
            {
              $count: "count",
            },
          ]);

          userRank = (betterCount[0]?.count || 0) + 1;

          const user = await GameScore.findOne({ userId })
            .populate("userId", userPublicFields);

          userEntry = {
            user: user.userId,
            totalScore: userTotal[0].totalScore,
          };
        }
      }
    }

    res.json({
      leaderboard: top10.map((r) => ({
        user: r.user,
        totalScore: r.totalScore,
      })),
      userRank,
      userEntry,
    });
  } catch (error) {
    console.error("Error al obtener leaderboard total:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
