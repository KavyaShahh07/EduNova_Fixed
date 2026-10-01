/**
 * EduNova Peer Skill Exchange Routes
 * Base path: /api/exchanges
 */

const express = require('express');
const router = express.Router();
const skillExchangeController = require('../controllers/skillExchangeController');
const { requireAuth } = require('../middleware/auth');

// All skill exchange routes require authentication
router.use(requireAuth);

// GET /api/exchanges - List current user's sent and received proposals
router.get('/', skillExchangeController.getUserExchanges);

// Static Actions & Collection Endpoints (MUST precede /:id to avoid matching /:id)
router.post('/publish', skillExchangeController.publishOffer);
router.post('/request', skillExchangeController.createExchangeRequest);

// Global Meetings & Goals
router.get('/meetings', (req, res, next) => skillExchangeController.getMeetings(req, res, next));
router.post('/meetings', (req, res, next) => skillExchangeController.scheduleMeeting(req, res, next));
router.patch('/meetings/:id/status', (req, res, next) => skillExchangeController.updateMeetingStatus(req, res, next));

router.get('/goals', (req, res, next) => skillExchangeController.getGoals(req, res, next));
router.post('/goals', (req, res, next) => skillExchangeController.createGoal(req, res, next));
router.patch('/goals/:id/progress', (req, res, next) => skillExchangeController.updateGoalProgress(req, res, next));

// Specific Exchange Item Routes (/:id)
router.get('/:id', skillExchangeController.getExchangeById);
router.patch('/:id/status', skillExchangeController.updateExchangeStatus);

// Exchange Specific Messages, Meetings, and Goals
router.get('/:id/messages', skillExchangeController.getExchangeMessages);
router.post('/:id/messages', skillExchangeController.sendExchangeMessage);

router.get('/:id/meetings', (req, res, next) => skillExchangeController.getMeetings(req, res, next));
router.post('/:id/meetings', (req, res, next) => skillExchangeController.scheduleMeeting(req, res, next));

router.get('/:id/goals', (req, res, next) => skillExchangeController.getGoals(req, res, next));
router.post('/:id/goals', (req, res, next) => skillExchangeController.createGoal(req, res, next));
router.patch('/:id/goals/:goalId/toggle', (req, res, next) => skillExchangeController.toggleGoalMilestone(req, res, next));

module.exports = router;

