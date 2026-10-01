const prisma = require('../config/db');

/**
 * POST /api/games/record
 * Record verified game score in PostgreSQL and award bounded XP
 */
const recordGameResult = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { gameId, gameTitle, subject, score, accuracy, durationSeconds, mistakes } = req.body;

    if (!gameId || !gameTitle) {
      return res.status(400).json({ success: false, message: 'Game ID and title are required' });
    }

    const numericScore = Math.max(0, parseInt(score, 10) || 0);
    const numericAccuracy = Math.min(100, Math.max(0, parseFloat(accuracy) || 0));
    const duration = Math.max(1, parseInt(durationSeconds, 10) || 30);

    // Calculate server-verified XP based on score, accuracy, and duration (maximum 150 per game)
    const rawXp = Math.floor((numericScore / 10) * (numericAccuracy / 100)) + 20;
    const xpEarned = Math.min(150, Math.max(10, rawXp));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record game session
      const entry = await tx.gameResult.create({
        data: {
          userId,
          gameId,
          gameTitle,
          subject: subject || 'General',
          score: numericScore,
          accuracy: numericAccuracy,
          durationSeconds: duration,
          xpEarned,
          mistakes: Array.isArray(mistakes) ? mistakes : [],
        },
      });

      // 2. Award XP transaction
      await tx.xpTransaction.create({
        data: {
          userId,
          amount: xpEarned,
          sourceTitle: `Game: ${gameTitle} (${numericScore} pts)`,
        },
      });

      // 3. Update learner XP & level (upsert for new learners)
      const profile = await tx.learnerProfile.findUnique({ where: { userId } });
      const currentXp = profile ? profile.xp : 0;
      const newXp = currentXp + xpEarned;
      const newLevel = Math.floor(newXp / 500) + 1;

      await tx.learnerProfile.upsert({
        where: { userId },
        create: {
          userId,
          xp: newXp,
          level: newLevel,
        },
        update: {
          xp: newXp,
          level: newLevel,
        },
      });

      return entry;

    });

    return res.status(201).json({
      success: true,
      message: `Game result recorded! +${xpEarned} XP awarded.`,
      data: result,
      xpAwarded: xpEarned,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/games/bests
 * Personal bests aggregated from real PostgreSQL data
 */
const getPersonalBests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalGames, stats] = await Promise.all([
      prisma.gameResult.count({ where: { userId } }),
      prisma.gameResult.aggregate({
        where: { userId },
        _max: {
          score: true,
          accuracy: true,
        },
      }),
    ]);

    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: { streakDays: true },
    });

    return res.json({
      success: true,
      data: {
        highScore: stats._max.score || 0,
        highestAccuracy: Math.round(stats._max.accuracy || 0),
        totalGames,
        currentStreak: profile?.streakDays || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/games/history
 * Recent game results for user
 */
const getGameHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, gameId } = req.query;

    const where = { userId };
    if (gameId) where.gameId = gameId;

    const results = await prisma.gameResult.findMany({
      where,
      take: Math.min(100, parseInt(limit, 10) || 20),
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/games/leaderboard
 * Global leaderboard for a game
 */
const getGameLeaderboard = async (req, res, next) => {
  try {
    const { gameId, limit = 10 } = req.query;

    const where = {};
    if (gameId) where.gameId = gameId;

    const topScores = await prisma.gameResult.findMany({
      where,
      take: Math.min(50, parseInt(limit, 10) || 10),
      orderBy: [{ score: 'desc' }, { accuracy: 'desc' }],
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return res.json({
      success: true,
      data: topScores.map((t, idx) => ({
        rank: idx + 1,
        id: t.id,
        playerName: t.user.name,
        avatar: t.user.avatar,
        score: t.score,
        accuracy: t.accuracy,
        gameTitle: t.gameTitle,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/games/generate
 * Generate dynamic educational game challenges via Gemini AI & PostgreSQL Subjects
 */
const generateAiGameContent = async (req, res, next) => {
  try {
    const { gameType = 'RAPID', subject = 'Physics', topic = '', difficulty = 'INTERMEDIATE' } = req.body || {};
    const geminiProvider = require('../ai/geminiProvider');
    const { synthesizeDatabaseGameContent } = require('../services/gameSynthesizer');

    // 1. Fetch relevant topics from database if subject exists
    let dbTopics = [];
    try {
      const dbSub = await prisma.subject.findFirst({
        where: { name: { contains: subject, mode: 'insensitive' } },
        include: { topics: { take: 5 } }
      });
      if (dbSub?.topics) {
        dbTopics = dbSub.topics.map(t => t.title);
      }
    } catch (e) {
      // ignore db error, proceed with fallback
    }

    // 2. Attempt dynamic Gemini generation if configured
    if (geminiProvider.isConfigured()) {
      try {
        const prompt = `You are EduNova AI Game Master. Generate 6 educational questions/cards for a "${gameType}" game mode on subject "${subject}" (Focus topic: "${topic || dbTopics[0] || 'Core concepts'}", Difficulty: ${difficulty}).
Format: Return valid JSON matching the game structure:
- For RAPID: Array of objects with { question: string, options: [string, string, string], answer: string }
- For FORMULA: Array of objects with { formulaName: string, equation: string, options: [string, string, string], answer: string }
- For MEMORY: Array of objects with { id: string, term: string, match: string }
- For CONCEPT: Array of objects with { id: string, concept: string, match: string, category: string }
- For FIX: Array of objects with { flawedStatement: string, errorDescription: string, correctedStatement: string, options: [string, string, string], answer: string }
- For BOSS: Object with { bossName: string, maxHp: 400, questions: [{ question: string, options: [string, string, string], answer: string, damage: 100 }] }
Ensure all factual academic knowledge is strictly correct.`;

        const aiResult = await geminiProvider.generateStructuredJson({
          prompt,
          systemInstruction: 'You are an expert academic curriculum game engine for STEM and humanities.'
        });

        if (aiResult) {
          return res.json({
            success: true,
            source: 'gemini',
            data: aiResult
          });
        }
      } catch (geminiErr) {
        console.warn('[Gemini AI Game Generation] Fallback to database synthesizer:', geminiErr.message);
      }
    }

    // 3. Structured Academic Fallback
    const content = synthesizeDatabaseGameContent(gameType, subject, dbTopics);
    return res.json({
      success: true,
      source: 'database-curriculum',
      data: content
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordGameResult,
  getPersonalBests,
  getGameHistory,
  getGameLeaderboard,
  generateAiGameContent,
};
