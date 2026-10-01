/**
 * Dynamic Avatar Utility for EduNova
 * Ensures every user account has a unique, dynamically generated avatar SVG Data URI
 * based on their name/username unless a custom photo is uploaded.
 */

export const getInitialsAvatar = (name = 'EduNova User') => {
  const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'EduNova User';
  const parts = cleanName.split(' ').filter(Boolean);
  let initials = 'E';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }

  // Predefined rich gradient color pairs
  const gradients = [
    ['%2306b6d4', '%233b82f6'], // Cyan -> Blue
    ['%238b5cf6', '%23ec4899'], // Purple -> Pink
    ['%2310b981', '%2306b6d4'], // Emerald -> Cyan
    ['%23f59e0b', '%23ef4444'], // Amber -> Red
    ['%236366f1', '%23a855f7'], // Indigo -> Purple
    ['%2338bdf8', '%23818cf8'], // Light Blue -> Indigo
  ];

  let sum = 0;
  for (let i = 0; i < cleanName.length; i++) {
    sum += cleanName.charCodeAt(i);
  }
  const pair = gradients[sum % gradients.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pair[0]}"/><stop offset="100%" stop-color="${pair[1]}"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(%23g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="800">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${svg}`;
};

export const DEFAULT_STATIC_AVATAR = getInitialsAvatar('EduNova User');

/**
 * Returns user's custom avatar or a dynamically generated avatar SVG based on seed/name.
 * @param {Object|string} userOrName User object or name/url string
 * @param {string} fallbackUsername Fallback username or name string
 * @returns {string} Avatar image URL
 */
export const getDynamicAvatar = (userOrName, fallbackUsername = '') => {
  let name = 'EduNova User';
  let avatarUrl = null;

  if (userOrName && typeof userOrName === 'object') {
    avatarUrl = userOrName.avatar || userOrName.photoUrl || userOrName.picture;
    name = userOrName.name || userOrName.studentUsername || userOrName.username || userOrName.email || fallbackUsername || 'EduNova User';
  } else if (typeof userOrName === 'string' && userOrName.trim()) {
    if (userOrName.startsWith('http://') || userOrName.startsWith('https://') || userOrName.startsWith('data:image/')) {
      avatarUrl = userOrName;
    } else {
      name = userOrName;
    }
  }

  if (fallbackUsername && (!name || name === 'EduNova User')) {
    name = fallbackUsername;
  }

  // If user has a valid custom base64 photo or uploaded image URL (not broken unsplash / dicebear), use it
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() && !avatarUrl.includes('photo-1534528741775-53994a69daeb') && !avatarUrl.includes('dicebear.com')) {
    return avatarUrl;
  }

  return getInitialsAvatar(name);
};
