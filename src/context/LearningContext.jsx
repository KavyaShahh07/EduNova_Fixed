import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { calculateLevelInfo } from '../utils/levelCalculator';
import { checkAchievementRules } from '../utils/achievementEngine';
import { sampleAchievements } from '../data/achievements';
import { gamificationApi } from '../lib/apiClient';
import { useAuth } from './AuthContext';

const LearningContext = createContext();

export const LearningProvider = ({ children }) => {
  const { user } = useAuth() || {};

  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [weeklyConsistency, setWeeklyConsistency] = useState([false, false, false, false, false, false, false]);
  const [streakShields, setStreakShields] = useState(0);

  const [achievements, setAchievements] = useState(sampleAchievements);
  const [dailyMissions, setDailyMissions] = useState([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);

  const [levelInfo, setLevelInfo] = useState(() => calculateLevelInfo(0));
  const [levelUpData, setLevelUpData] = useState(null);

  const [xpTransactions, setXpTransactions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  /**
   * Evaluates dynamic achievement unlock progress based on live user statistics
   */
  const updateAchievementProgress = useCallback((currentXp, currentStreak, customStats = {}) => {
    setAchievements((prevAchievements) => {
      const baseList = prevAchievements.length > 0 ? prevAchievements : sampleAchievements;
      const stats = {
        totalXp: currentXp,
        streakDays: currentStreak,
        lessonsCompleted: customStats.lessonsCompleted || 1,
        quizzesCompleted: customStats.quizzesCompleted || 1,
        perfectQuizzes: customStats.perfectQuizzes || 0,
        skillsMastered: customStats.skillsMastered || 1,
        xrActivities: customStats.xrActivities || 0,
        peerSessions: customStats.peerSessions || 0,
        ...customStats
      };

      const updated = checkAchievementRules(stats, baseList);
      return updated;
    });
  }, []);

  /**
   * Sync live gamification state from backend on mount or user change
   */
  const syncGamificationState = useCallback(async () => {
    if (!user) {
      setXp(0);
      setStreakDays(0);
      setBestStreak(0);
      setDailyMissions([]);
      setXpTransactions([]);
      setLevelInfo(calculateLevelInfo(0));
      setAchievements(sampleAchievements);
      return;
    }

    let currentXp = 0;
    let currentStreak = 0;

    // 1. Hydrate preliminary from user's learnerProfile if available
    if (user.learnerProfile) {
      currentXp = user.learnerProfile.xp || 0;
      currentStreak = user.learnerProfile.streakDays || 0;
      setXp(currentXp);
      setStreakDays(currentStreak);
      setBestStreak((prev) => Math.max(prev, currentStreak));
    }

    try {
      // 2. Fetch live summary and missions in parallel
      const [summaryRes, missionsRes] = await Promise.allSettled([
        gamificationApi.getSummary(),
        gamificationApi.getMissions(),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success && summaryRes.value.data) {
        const s = summaryRes.value.data;
        currentXp = s.xp ?? currentXp;
        currentStreak = s.streakDays ?? currentStreak;

        setXp(currentXp);
        setStreakDays(currentStreak);
        setBestStreak((prev) => Math.max(prev, currentStreak));

        if (Array.isArray(s.xpHistory) && s.xpHistory.length > 0) {
          setXpTransactions(
            s.xpHistory.map((t) => ({
              id: t.id,
              title: t.sourceTitle,
              xp: t.amount,
              category: 'Learning',
              createdAt: t.createdAt,
              timeAgo: new Date(t.createdAt).toLocaleDateString(),
            }))
          );
        }
      }

      if (missionsRes.status === 'fulfilled' && missionsRes.value?.success) {
        const missions = missionsRes.value.data || [];
        setDailyMissions(missions.filter((m) => m.period === 'DAILY'));
        const weekly = missions.find((m) => m.period === 'WEEKLY');
        if (weekly) setWeeklyChallenge(weekly);
      }
    } catch (err) {
      console.warn('[LearningContext] Gamification sync error:', err.message);
    } finally {
      setLoading(false);
      updateAchievementProgress(currentXp, currentStreak);
    }
  }, [userId, user, updateAchievementProgress]);

  useEffect(() => {
    syncGamificationState();

    const handleTaskUpdate = () => {
      syncGamificationState();
    };

    window.addEventListener('edunova_task_updated', handleTaskUpdate);

    return () => {
      window.removeEventListener('edunova_task_updated', handleTaskUpdate);
    };
  }, [syncGamificationState]);

  // Recalculate level info whenever XP updates
  useEffect(() => {
    const newLevelInfo = calculateLevelInfo(xp);
    setLevelInfo(newLevelInfo);
    updateAchievementProgress(xp, streakDays);
  }, [xp, streakDays, updateAchievementProgress]);

  /**
   * Real XP Awarding:
   * Calls POST /api/gamification/xp and updates client state
   */
  const earnXp = useCallback(async (amount, sourceTitle = 'Learning Activity', category = 'Learning') => {
    const safeAmount = Number(amount) || 0;
    if (safeAmount <= 0) return;

    // Optimistic UI update
    setXp((prevXp) => {
      const newXp = prevXp + safeAmount;
      updateAchievementProgress(newXp, streakDays);
      return newXp;
    });

    const tempTx = {
      id: `tx_${Date.now()}`,
      title: sourceTitle,
      xp: safeAmount,
      category,
      timeAgo: 'Just now',
    };
    setXpTransactions((prev) => [tempTx, ...prev]);

    // Persist to PostgreSQL backend
    try {
      const res = await gamificationApi.addXp(safeAmount, sourceTitle);
      const data = res?.data;

      if (data?.transaction?.id) {
        setXpTransactions((prev) =>
          prev.map((tx) => (tx.id === tempTx.id ? { ...tx, id: data.transaction.id } : tx))
        );
      }

      if (typeof data?.newXp === 'number') {
        setXp(data.newXp);
        updateAchievementProgress(data.newXp, streakDays);
      }

      if (data?.leveledUp) {
        const newLvlInfo = calculateLevelInfo(data.newXp);
        setLevelUpData({
          oldLevel: (data.newLevel || newLvlInfo.level) - 1,
          newLevel: data.newLevel || newLvlInfo.level,
          rankTitle: newLvlInfo.rankTitle || newLvlInfo.title || 'Scholar',
          perk: 'Unlocked daily challenge boost and advanced topic access!'
        });
      }
    } catch (err) {
      console.warn('[LearningContext] Failed to persist XP to backend:', err.message);
    }
  }, [streakDays, updateAchievementProgress]);

  /**
   * Real Mission Completion:
   * Calls POST /api/gamification/missions/:id/complete and synchronizes live rewards
   */
  const completeMission = useCallback(async (missionId) => {
    try {
      const res = await gamificationApi.completeMission(missionId);
      if (res?.success && res.data) {
        const { rewardXp, newXp, newLevel, streakDays: updatedStreak, leveledUp } = res.data;

        if (typeof newXp === 'number') {
          setXp(newXp);
          updateAchievementProgress(newXp, updatedStreak || streakDays);
        }
        if (typeof updatedStreak === 'number') setStreakDays(updatedStreak);

        // Update local mission completed state
        setDailyMissions((prev) =>
          prev.map((m) =>
            m.id === missionId ? { ...m, completed: true, userProgress: 100 } : m
          )
        );

        if (leveledUp) {
          const newLvlInfo = calculateLevelInfo(newXp);
          setLevelUpData({
            oldLevel: (newLevel || newLvlInfo.level) - 1,
            newLevel: newLevel || newLvlInfo.level,
            rankTitle: newLvlInfo.rankTitle || newLvlInfo.title || 'Scholar',
            perk: 'Unlocked daily challenge boost and advanced topic access!'
          });
        }

        // Add to transaction feed
        setXpTransactions((prev) => [
          {
            id: `tx_${Date.now()}`,
            title: `Mission Completed: ${res.data.missionTitle}`,
            xp: rewardXp,
            category: 'Missions',
            timeAgo: 'Just now',
          },
          ...prev,
        ]);

        return res.data;
      }
    } catch (err) {
      console.error('[LearningContext] Failed to complete mission on backend:', err.message);
      throw err;
    }
  }, [streakDays, updateAchievementProgress]);

  const useStreakShield = useCallback(() => {
    if (streakShields > 0) {
      setStreakShields((prev) => prev - 1);
      return true;
    }
    return false;
  }, [streakShields]);

  const closeLevelUpModal = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const contextValue = useMemo(() => ({
    xp,
    level: levelInfo.level,
    levelInfo,
    streakDays,
    bestStreak,
    weeklyConsistency,
    streakShields,
    achievements,
    dailyMissions,
    weeklyChallenge,
    xpTransactions,
    milestones,
    levelUpData,
    loading,
    syncGamificationState,
    earnXp,
    addXp: earnXp,
    completeMission,
    useStreakShield,
    closeLevelUpModal,
  }), [
    xp,
    levelInfo,
    streakDays,
    bestStreak,
    weeklyConsistency,
    streakShields,
    achievements,
    dailyMissions,
    weeklyChallenge,
    xpTransactions,
    milestones,
    levelUpData,
    loading,
    syncGamificationState,
    earnXp,
    completeMission,
    useStreakShield,
    closeLevelUpModal
  ]);

  return (
    <LearningContext.Provider value={contextValue}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => useContext(LearningContext);
