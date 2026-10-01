// EduNova Chat File Upload & Attachment Service
// Connected to PostgreSQL backend /api/conversations/upload with local Blob URL fallback

import { apiClient, getFileUrl } from '../lib/apiClient';

// In-Memory Attachment Cache to prevent LocalStorage QuotaExceededError
const attachmentCache = new Map();

/**
 * Upload chat file attachment to backend uploads storage with progress callback
 */
export const uploadChatFile = async (file, onProgress) => {
  if (!file) throw new Error('No file provided');

  // Validate size (e.g., 50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds maximum limit of 50MB');
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPdf = file.type === 'application/pdf';

  let fileType = 'document';
  if (isImage) fileType = 'image';
  else if (isVideo) fileType = 'video';
  else if (isPdf) fileType = 'pdf';

  if (onProgress) onProgress(25);

  // 1. Attempt persistent upload to backend /api/conversations/upload
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) onProgress(60);

    const res = await apiClient.post('/conversations/upload', formData);

    if (res && res.success && res.data) {
      if (onProgress) onProgress(100);

      const serverUrl = res.data.url.startsWith('http')
        ? res.data.url
        : getFileUrl(res.data.url);

      const attachmentObj = {
        id: res.data.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: res.data.name || file.name,
        type: res.data.type || fileType,
        mimeType: res.data.mimeType || file.type,
        size: formatFileSize(res.data.size || file.size),
        rawSize: res.data.size || file.size,
        url: serverUrl,
        thumbnailUrl: isImage ? serverUrl : null,
        uploadedAt: res.data.uploadedAt || new Date().toISOString(),
        isRemote: true,
      };

      attachmentCache.set(attachmentObj.id, attachmentObj);
      return attachmentObj;
    }
  } catch (err) {
    console.warn('[chatFileService] Backend upload failed, using local blob fallback:', err.message);
  }

  // 2. Fallback to lightweight local Blob URL if offline/upload error
  if (onProgress) onProgress(100);

  const objectUrl = URL.createObjectURL(file);
  const fallbackId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const fallbackObj = {
    id: fallbackId,
    name: file.name,
    type: fileType,
    mimeType: file.type,
    size: formatFileSize(file.size),
    rawSize: file.size,
    url: objectUrl,
    thumbnailUrl: isImage ? objectUrl : null,
    uploadedAt: new Date().toISOString(),
    isRemote: false,
  };

  attachmentCache.set(fallbackId, fallbackObj);
  return fallbackObj;
};

export const getCachedAttachment = (attachmentId) => {
  return attachmentCache.get(attachmentId);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
