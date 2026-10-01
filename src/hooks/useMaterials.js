import { useState, useEffect, useCallback } from 'react';
import { materialService } from '../services/materialService';

export const useMaterials = (subjectId, filterType = 'All', topicId = null) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshMaterials = useCallback(async () => {
    setLoading(true);
    await materialService.fetchFromServer(subjectId);
    const data = materialService.getMaterialsBySubject(subjectId, filterType, topicId);
    setMaterials(data);
    setLoading(false);
  }, [subjectId, filterType, topicId]);

  useEffect(() => {
    refreshMaterials();

    const handleUpdate = () => refreshMaterials();
    window.addEventListener('edunova_materials_updated', handleUpdate);
    return () => window.removeEventListener('edunova_materials_updated', handleUpdate);
  }, [refreshMaterials]);

  const uploadFile = async (formData) => {
    const uploaded = await materialService.uploadFileMaterial(formData);
    await refreshMaterials();
    return uploaded;
  };

  const deleteMaterial = async (id) => {
    await materialService.deleteMaterial(id);
    await refreshMaterials();
  };

  const search = (query) => {
    const results = materialService.searchMaterials(subjectId, query);
    setMaterials(results);
  };

  return {
    materials,
    loading,
    uploadFile,
    deleteMaterial,
    refreshMaterials,
    search
  };
};

export default useMaterials;
