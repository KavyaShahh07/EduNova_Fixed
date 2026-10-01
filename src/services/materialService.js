// EduNova Material Service for Learning Materials & Uploads

import { materialApi } from '../lib/apiClient';

const STORAGE_KEY = 'edunova_learning_materials';

class MaterialService {
  constructor() {
    this.materials = this.loadMaterials();
    this.fetchFromServer();
  }

  async fetchFromServer(subjectId) {
    try {
      const res = await materialApi.getMaterials(subjectId ? { subjectId } : {});
      if (res && res.data && Array.isArray(res.data)) {
        this.materials = res.data;
        this.saveMaterials(this.materials);
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to sync materials from backend:', err.message);
    }
    return this.materials;
  }

  loadMaterials() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading materials from localStorage:', e);
    }
    return [];
  }

  saveMaterials(mats) {
    this.materials = mats;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mats));
    } catch (e) {
      console.error('Error saving materials to localStorage:', e);
    }
    return this.materials;
  }

  getMaterialsBySubject(subjectId, filterType = 'All', topicId = null) {
    let list = this.materials.filter(m => !subjectId || m.subjectId === subjectId);
    
    if (topicId) {
      list = list.filter(m => m.topicId === topicId);
    }

    if (filterType && filterType !== 'All') {
      list = list.filter(m => m.type?.toLowerCase() === filterType.toLowerCase());
    }

    return list;
  }

  getMaterialById(id) {
    return this.materials.find(m => m.id === id) || null;
  }

  /**
   * Fetch active students for targeted material assignment
   */
  async getTargetStudents() {
    try {
      const res = await materialApi.getTargetStudents();
      return res?.data || [];
    } catch (err) {
      console.warn('Failed to load target students:', err.message);
      return [];
    }
  }

  /**
   * Upload real video or document file via multipart FormData directly to backend & PostgreSQL
   */
  async uploadFileMaterial(formData) {
    const res = await materialApi.uploadMaterial(formData);
    if (res && res.data) {
      this.materials = [res.data, ...this.materials];
      this.saveMaterials(this.materials);
      window.dispatchEvent(new CustomEvent('edunova_materials_updated', { detail: res.data }));
      return res.data;
    }
    throw new Error(res?.message || 'Failed to upload material');
  }

  async deleteMaterial(id) {
    await materialApi.deleteMaterial(id);
    this.materials = this.materials.filter(m => m.id !== id);
    this.saveMaterials(this.materials);
    window.dispatchEvent(new CustomEvent('edunova_materials_updated', { detail: { id, deleted: true } }));
    return true;
  }

  uploadMaterial(materialData) {
    // Legacy JSON metadata upload
    return materialApi.createMaterial(materialData).then(res => {
      if (res && res.data) {
        this.materials = [res.data, ...this.materials];
        this.saveMaterials(this.materials);
        window.dispatchEvent(new CustomEvent('edunova_materials_updated', { detail: res.data }));
        return res.data;
      }
      return null;
    });
  }

  searchMaterials(subjectId, query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.getMaterialsBySubject(subjectId);

    return this.materials.filter(m => 
      (!subjectId || m.subjectId === subjectId) &&
      ((m.title && m.title.toLowerCase().includes(q)) ||
       (m.description && m.description.toLowerCase().includes(q)) ||
       (m.tags && Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase().includes(q))))
    );
  }
}

export const materialService = new MaterialService();
export default materialService;

