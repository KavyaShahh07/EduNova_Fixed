/**
 * Unit Tests: Gamification & XP Logic
 * Lead Architect & Engineer: Prince
 */

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6500, 8000, 10000];

const calculateLevel = (xp) => {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};

describe('Gamification Service Unit Tests', () => {
  test('should accurately calculate Level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  test('should advance to Level 2 at 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(250)).toBe(2);
  });

  test('should advance to higher levels progressively', () => {
    expect(calculateLevel(300)).toBe(3);
    expect(calculateLevel(600)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
    expect(calculateLevel(10000)).toBe(13);
  });

  test('should handle mission progress clamping to 100%', () => {
    const clampProgress = (val) => Math.min(Math.max(val, 0), 100);
    expect(clampProgress(120)).toBe(100);
    expect(clampProgress(45)).toBe(45);
    expect(clampProgress(-10)).toBe(0);
  });
});
