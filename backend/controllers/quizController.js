/**
 * EduNova Quiz Controller
 * 
 * Endpoints:
 * - GET  /api/quizzes/:id         (Retrieve quiz with answer keys stripped)
 * - POST /api/quizzes/:id/submit  (Server-side evaluation, attempt logging & XP awarding)
 * - GET  /api/quizzes             (Catalog listing)
 * - POST /api/quizzes             (Admin/Instructor quiz creation)
 */

const quizService = require('../services/quizService');

class QuizController {
  /**
   * GET /api/quizzes/:id
   * Get quiz questions with answer keys removed to prevent frontend cheating
   */
  async getQuiz(req, res, next) {
    try {
      // Instructors and Admins can view answers; students receive sanitized questions
      const isPrivileged = ['ADMIN', 'INSTRUCTOR'].includes(req.user?.role);
      const quiz = await quizService.getQuizQuestions(req.params.id, {
        sanitize: !isPrivileged,
      });

      return res.json({
        success: true,
        message: 'Quiz retrieved successfully',
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/quizzes/:id/submit
   * Server-side evaluation of student answers with atomic score, attempt, and XP updates
   */
  async submitQuiz(req, res, next) {
    try {
      const { answers, userAnswers, timeSpentSec } = req.body;
      const submittedAnswers = answers || userAnswers || [];

      const result = await quizService.submitQuiz(
        req.user.id,
        req.params.id,
        submittedAnswers,
        timeSpentSec
      );

      return res.json({
        success: true,
        message: `Quiz evaluated: ${result.score}/${result.totalQuestions} (${result.accuracy}%)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/quizzes
   * Catalog of available quizzes
   */
  async listQuizzes(req, res, next) {
    try {
      const { subjectId, topicId, difficulty, search, page, limit } = req.query;
      const quizzes = await quizService.listQuizzes({
        subjectId,
        topicId,
        difficulty,
        search,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Quizzes retrieved successfully',
        data: quizzes,
        count: quizzes.length,
        pagination: {
          page: Math.max(1, parseInt(page, 10) || 1),
          limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/quizzes
   * Create a new quiz with questions
   */
  async createQuiz(req, res, next) {
    try {
      const { subjectId, topicId, title, difficulty, questions } = req.body;
      const quiz = await quizService.createQuiz({
        subjectId,
        topicId,
        title,
        difficulty,
        questions,
      });

      return res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/quizzes/generate
   * Generate an academic quiz via Gemini AI and save directly into PostgreSQL
   */
  async generateAiQuiz(req, res, next) {
    try {
      const {
        subjectId,
        topicName,
        difficulty = 'INTERMEDIATE',
        count = 5,
      } = req.body;

      const prisma = require('../config/db');
      const geminiProvider = require('../ai/geminiProvider');
      const { synthesizeDatabaseGameContent } = require('../services/gameSynthesizer');

      // 1. Resolve subject from database
      let dbSubject = null;
      if (subjectId) {
        dbSubject = await prisma.subject.findUnique({
          where: { id: subjectId },
          include: { topics: true },
        });
      }
      if (!dbSubject) {
        dbSubject = await prisma.subject.findFirst({
          include: { topics: true },
        });
      }

      if (!dbSubject) {
        return res.status(404).json({ success: false, message: 'No subjects found in database.' });
      }

      const subjectName = dbSubject.name;
      const targetTopic = topicName || dbSubject.topics?.[0]?.title || 'Core Syllabus';
      const prompt = `Generate ${count} academic multiple-choice quiz questions for subject "${subjectName}", topic "${targetTopic}", difficulty "${difficulty}".
Output strictly valid RFC-8259 JSON array of question objects:
[
  {
    "question": "Clear question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed theoretical explanation"
  }
]`;

      let questions = null;
      if (geminiProvider.isConfigured()) {
        try {
          const raw = await geminiProvider.generateStructuredJson({
            prompt,
            systemInstruction: 'You are an elite academic curriculum examiner. Return strict JSON array only.',
          });
          if (Array.isArray(raw) && raw.length > 0) {
            questions = raw.map((q) => ({
              questionText: q.question || q.questionText,
              options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
              correctOptionIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (q.correctOptionIndex || 0),
              explanation: q.explanation || `Core concept in ${subjectName}`,
            }));
          }
        } catch (aiErr) {
          console.warn('[Gemini Quiz Notice]', aiErr.message);
        }
      }

      // Fallback synthesis from database topics if Gemini is temporarily constrained
      if (!questions || !questions.length) {
        const rapidItems = synthesizeDatabaseGameContent('RAPID', subjectName, dbSubject.topics || []);
        questions = rapidItems.slice(0, count).map((item) => ({
          questionText: item.question,
          options: item.options.length >= 4 ? item.options : [...item.options, 'None of the above'],
          correctOptionIndex: item.options.indexOf(item.answer) >= 0 ? item.options.indexOf(item.answer) : 0,
          explanation: `Fundamental conceptual principle of ${targetTopic}.`,
        }));
      }

      // Find matching topicId in DB if exists
      const matchedTopic = dbSubject.topics?.find((t) => t.title.toLowerCase() === targetTopic.toLowerCase());

      // Save quiz directly to PostgreSQL
      const createdQuiz = await quizService.createQuiz({
        subjectId: dbSubject.id,
        topicId: matchedTopic?.id || null,
        title: `Sage AI: ${subjectName} — ${targetTopic} (${difficulty})`,
        difficulty,
        questions,
      });

      // Fetch sanitized for student client
      const sanitized = await quizService.getQuizQuestions(createdQuiz.id, { sanitize: true });

      return res.status(201).json({
        success: true,
        message: 'AI Quiz generated and saved to database successfully',
        data: sanitized,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/quizzes/attempts/my
   * Get authenticated user's attempt history
   */
  async getMyAttempts(req, res, next) {
    try {
      const attempts = await quizService.getUserAttempts(req.user.id, {
        limit: req.query.limit,
      });
      return res.json({
        success: true,
        data: attempts,
        count: attempts.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuizController();
