const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  recordGameResult,
  getPersonalBests,
  getGameHistory,
  getGameLeaderboard,
  generateAiGameContent,
} = require('../controllers/gameController');

router.use(requireAuth);

router.post('/record', recordGameResult);
router.post('/results', recordGameResult);
router.get('/bests', getPersonalBests);
router.get('/history', getGameHistory);
router.get('/leaderboard', getGameLeaderboard);
router.post('/generate', generateAiGameContent);

module.exports = router;
