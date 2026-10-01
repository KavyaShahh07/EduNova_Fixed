/**
 * EduNova Smart Task Manager Service (src/services/taskService.js)
 * High-performance task management service with local persistence.
 */

import { taskApi, gamificationApi, learnerApi } from '../lib/apiClient';

const STORAGE_KEY = 'edunova_tasks_v1';
const GOALS_KEY = 'edunova_goals_v1';

class TaskService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(GOALS_KEY)) {
      localStorage.setItem(GOALS_KEY, JSON.stringify([]));
    }
  }

  getAllTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveAllTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edunova_task_updated'));
    }
  }

  getAllGoals() {
    try {
      const data = localStorage.getItem(GOALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveAllGoals(goals) {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('edunova_goals_updated'));
      }
    } catch (e) {}
  }

  async getGoals() {
    try {
      const res = await learnerApi.getGoals();
      if (res && res.success && Array.isArray(res.data)) {
        this.saveAllGoals(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('[taskService] Failed to fetch goals from backend, using local cache:', err.message);
    }
    return this.getAllGoals();
  }

  async createGoal(goalData) {
    const localGoals = this.getAllGoals();
    const tempId = `goal-${Date.now()}`;
    const newGoal = {
      id: tempId,
      title: goalData.title || 'Learning Goal',
      targetDate: goalData.targetDate || '',
      progress: Number(goalData.progress) || 0,
      createdAt: new Date().toISOString(),
    };

    localGoals.unshift(newGoal);
    this.saveAllGoals(localGoals);

    try {
      const res = await learnerApi.addGoal(newGoal);
      if (res && res.success && res.data) {
        const idx = localGoals.findIndex((g) => g.id === tempId);
        if (idx !== -1) {
          localGoals[idx] = res.data;
          this.saveAllGoals(localGoals);
        }
        return res.data;
      }
    } catch (err) {
      console.warn('[taskService] Backend add goal failed, saved locally:', err.message);
    }

    return newGoal;
  }

  async updateGoal(goalId, goalData) {
    const localGoals = this.getAllGoals();
    const idx = localGoals.findIndex((g) => g.id === goalId);
    if (idx !== -1) {
      localGoals[idx] = { ...localGoals[idx], ...goalData };
      this.saveAllGoals(localGoals);
    }

    try {
      const res = await learnerApi.updateGoal(goalId, goalData);
      if (res && res.success && res.data) {
        if (idx !== -1) {
          localGoals[idx] = res.data;
          this.saveAllGoals(localGoals);
        }
        return res.data;
      }
    } catch (err) {
      console.warn('[taskService] Backend update goal failed, updated locally:', err.message);
    }

    return idx !== -1 ? localGoals[idx] : null;
  }

  async deleteGoal(goalId) {
    const localGoals = this.getAllGoals().filter((g) => g.id !== goalId);
    this.saveAllGoals(localGoals);

    try {
      await learnerApi.deleteGoal(goalId);
    } catch (err) {
      console.warn('[taskService] Backend delete goal failed:', err.message);
    }
    return true;
  }

  async getTasks(filters = {}) {
    try {
      const res = await taskApi.getTasks(filters);
      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(t => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          startDate: t.startDate ? t.startDate.split('T')[0] : '',
        }));
        const isUnfiltered = !filters || Object.values(filters).every(v => !v || v === 'ALL' || v === '');
        if (isUnfiltered) {
          this.saveAllTasks(normalized);
        }
        return normalized;
      }
    } catch (err) {
      console.warn('[taskService] Backend tasks fetch failed, falling back to local cache:', err.message);
    }
    return this.getLocalTasks(filters);
  }

  getLocalTasks(filters = {}) {
    let tasks = this.getAllTasks();
    const today = new Date().toISOString().split('T')[0];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) || 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.topic && t.topic.toLowerCase().includes(q))
      );
    }

    if (filters.subject && filters.subject !== 'ALL' && filters.subject !== '') {
      const targetSub = filters.subject.toLowerCase();
      tasks = tasks.filter(t => {
        if (!t.subject) return false;
        const sub = t.subject.toLowerCase();
        return sub === targetSub || sub.includes(targetSub) || targetSub.includes(sub);
      });
    }

    if (filters.type && filters.type !== 'ALL') {
      tasks = tasks.filter(t => t.type === filters.type);
    }

    if (filters.priority && filters.priority !== 'ALL') {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }

    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'OVERDUE') {
        tasks = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && t.dueDate < today);
      } else if (filters.status === 'TODAY') {
        tasks = tasks.filter(t => t.dueDate === today);
      } else if (filters.status === 'UPCOMING') {
        tasks = tasks.filter(t => t.dueDate && t.dueDate > today && t.status !== 'COMPLETED');
      } else {
        tasks = tasks.filter(t => t.status === filters.status);
      }
    }

    if (filters.importantOnly) {
      tasks = tasks.filter(t => t.isImportant);
    }

    return tasks;
  }

  async getSummary() {
    try {
      const res = await taskApi.getSummary();
      if (res?.success && res.data) {
        return {
          total: res.data.total || 0,
          completed: res.data.completed || 0,
          todayTasks: res.data.todayTasks || res.data.today || 0,
          today: res.data.today || 0,
          overdue: res.data.overdue || 0,
          upcoming: res.data.upcoming || 0,
          important: res.data.important || 0,
          completionRate: res.data.completionRate || 0,
        };
      }
    } catch (err) {
      console.warn('[taskService] Backend summary fetch failed, using local calculation:', err.message);
    }

    const tasks = this.getAllTasks();
    const today = new Date().toISOString().split('T')[0];

    const todayTasks = tasks.filter(t => t.dueDate === today && t.status !== 'COMPLETED').length;
    const upcoming = tasks.filter(t => t.dueDate > today && t.status !== 'COMPLETED').length;
    const overdue = tasks.filter(t => t.dueDate < today && t.status !== 'COMPLETED').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const important = tasks.filter(t => t.isImportant && t.status !== 'COMPLETED').length;

    return {
      total: tasks.length,
      todayTasks,
      today: todayTasks,
      upcoming,
      overdue,
      completed,
      important,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }

  async createTask(taskData) {
    const tasks = this.getAllTasks();
    const tempId = `task-${Date.now()}`;
    const newTask = {
      id: tempId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      subject: taskData.subject || 'General',
      topic: taskData.topic || '',
      type: taskData.type || 'Study',
      priority: taskData.priority || 'MEDIUM',
      status: taskData.status || 'NOT_STARTED',
      startDate: taskData.startDate || new Date().toISOString().split('T')[0],
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      estimatedDuration: Number(taskData.estimatedDuration) || 30,
      difficulty: taskData.difficulty || 'Medium',
      goalId: taskData.goalId || '',
      isImportant: Boolean(taskData.isImportant),
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
      notes: taskData.notes || '',
      xpReward: Number(taskData.xpReward) || 50,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    this.saveAllTasks(tasks);

    try {
      const res = await taskApi.createTask(newTask);
      if (res?.success && res.data) {
        const saved = {
          ...res.data,
          dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : newTask.dueDate,
          startDate: res.data.startDate ? res.data.startDate.split('T')[0] : newTask.startDate,
        };
        const idx = tasks.findIndex(t => t.id === tempId);
        if (idx !== -1) {
          tasks[idx] = saved;
          this.saveAllTasks(tasks);
        }
        return saved;
      }
    } catch (err) {
      console.warn('[taskService] Backend create task error:', err.message);
    }

    return newTask;
  }

  async updateTask(taskId, updates) {
    const tasks = this.getAllTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates };
      this.saveAllTasks(tasks);

      try {
        let res;
        if (updates.status === 'COMPLETED') {
          res = await taskApi.completeTask(taskId);
          if (res?.xpAwarded > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('edunova_xp_updated', { detail: { xp: res.xpAwarded } }));
          }
        } else {
          res = await taskApi.updateTask(taskId, updates);
        }
        if (res?.data) {
          tasks[idx] = {
            ...tasks[idx],
            ...res.data,
            dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : tasks[idx].dueDate,
          };
          this.saveAllTasks(tasks);
        }
      } catch (err) {
        console.warn('[taskService] Backend update task error:', err.message);
      }

      return tasks[idx];
    }
    return null;
  }

  async deleteTask(taskId) {
    let tasks = this.getAllTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    this.saveAllTasks(tasks);

    try {
      await taskApi.deleteTask(taskId);
    } catch (err) {
      console.warn('[taskService] Backend delete task error:', err.message);
    }
    return true;
  }

  async toggleSubtask(taskId, subtaskId) {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const st = task.subtasks.find(s => s.id === subtaskId);
      if (st) {
        st.completed = !st.completed;
        
        const completedCount = task.subtasks.filter(s => s.completed).length;
        if (completedCount === task.subtasks.length) {
          task.status = 'COMPLETED';
        } else if (completedCount > 0 && task.status === 'NOT_STARTED') {
          task.status = 'IN_PROGRESS';
        }
        this.saveAllTasks(tasks);

        try {
          const res = await taskApi.toggleSubtask(taskId, subtaskId);
          if (res?.data) {
            Object.assign(task, res.data);
            this.saveAllTasks(tasks);
          }
        } catch (err) {
          console.warn('[taskService] Backend toggle subtask error:', err.message);
        }
      }
    }
    return task;
  }

  async rescheduleTask(taskId, newDueDate) {
    return await this.updateTask(taskId, { dueDate: newDueDate });
  }

  getInsights(providedTasks = null) {
    const tasks = Array.isArray(providedTasks) ? providedTasks : this.getAllTasks();
    const total = tasks.length;
    if (total === 0) {
      return {
        completedRate: 0,
        completedCount: 0,
        overdueCount: 0,
        avgDuration: 0,
        mostActiveSubject: 'None',
        streak: 0
      };
    }

    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const completedRate = Math.round((completedCount / total) * 100);
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'COMPLETED').length;

    const subjects = {};
    tasks.forEach(t => {
      if (t.subject) {
        subjects[t.subject] = (subjects[t.subject] || 0) + 1;
      }
    });

    let maxSub = 'General';
    let maxCount = 0;
    Object.entries(subjects).forEach(([sub, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxSub = sub;
      }
    });

    return {
      completedRate,
      completedCount,
      overdueCount,
      avgDuration: 45,
      mostActiveSubject: maxSub,
      streak: 3
    };
  }
}

export const taskService = new TaskService();
export default taskService;

