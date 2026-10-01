/**
 * Frontend Unit Test: Curriculum Service & Learner Tracks
 * Lead Architect & Engineer: Prince
 */

import { curriculumService } from '../services/curriculumService';

describe('Curriculum Service Frontend Logic', () => {
  test('should return correct category tabs for school learner track', () => {
    const tabs = curriculumService.getCategoryTabs('school');
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBeGreaterThan(0);
    expect(tabs).toContain('All');
  });

  test('should return correct category tabs for college learner track', () => {
    const tabs = curriculumService.getCategoryTabs('college');
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs).toContain('Core CS');
  });

  test('should format context badge text accurately', () => {
    const options = { class: '10', board: 'CBSE' };
    const badge = curriculumService.getCurriculumContextBadge('school', options);
    expect(badge).toContain('Class 10');
    expect(badge).toContain('CBSE');
  });
});
