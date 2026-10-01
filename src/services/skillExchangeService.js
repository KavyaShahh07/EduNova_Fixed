import apiClient from '../lib/apiClient';
import { getInitialsAvatar } from '../utils/avatarUtils';

const TEACH_STORAGE_KEY = 'edunova_teach_skills';
const LEARN_STORAGE_KEY = 'edunova_learn_skills';
const SAVED_MATCHES_KEY = 'edunova_saved_skill_matches';
const NOTES_STORAGE_KEY = 'edunova_exchange_notes';
const PUBLISHED_OFFERS_KEY = 'edunova_published_offers';
const REQUESTS_STORAGE_KEY = 'edunova_exchange_requests';

const DEFAULT_MARKETPLACE_LISTINGS = [
  {
    id: 'listing_default_1',
    userId: 'peer_aarav',
    name: 'Aarav Sharma',
    avatar: getInitialsAvatar('Aarav Sharma'),
    learnerType: 'school',
    skillOffered: 'Class 10 Mathematics & Algebra',
    skillWanted: 'Physics & Science Experiments',
    experience: 'Advanced',
    goal: 'Board Exam Preparation',
    format: 'Study partner',
    availability: 'Weekends',
    description: 'Looking to pair up with a Class 10 student for board exam prep. I can teach Algebra and Trigonometry in exchange for Physics numericals.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'listing_default_2',
    userId: 'peer_priya',
    name: 'Priya Patel',
    avatar: getInitialsAvatar('Priya Patel'),
    learnerType: 'school',
    skillOffered: 'English Grammar & Essay Writing',
    skillWanted: 'Social Science & History',
    experience: 'Expert',
    goal: 'Academic help',
    format: '1-to-1',
    availability: 'Evenings',
    description: 'Expert in English grammar and literature essays. Want help understanding History timelines and Civics concepts.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'listing_default_3',
    userId: 'peer_rohan',
    name: 'Rohan Verma',
    avatar: getInitialsAvatar('Rohan Verma'),
    learnerType: 'college',
    skillOffered: 'React & Frontend Web Development',
    skillWanted: 'UI/UX Design & Figma',
    experience: 'Advanced',
    goal: 'Portfolio Project',
    format: 'Project-based',
    availability: 'Flexible',
    description: 'Building full-stack React projects. Looking for a designer who wants to learn React coding while helping me refine UI design systems.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'listing_default_4',
    userId: 'peer_ananya',
    name: 'Ananya Roy',
    avatar: getInitialsAvatar('Ananya Roy'),
    learnerType: 'college',
    skillOffered: 'Python & Data Structures',
    skillWanted: 'SQL & Database Optimization',
    experience: 'Intermediate',
    goal: 'Interview preparation',
    format: '1-to-1',
    availability: 'Weekends',
    description: 'Prepping for technical interviews. Strong in Python algorithms, searching for a peer to practice complex SQL queries.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

export const getMarketplace = async () => {
  let localOffers = [];
  try {
    localOffers = JSON.parse(localStorage.getItem(PUBLISHED_OFFERS_KEY) || '[]');
  } catch (e) {
    localOffers = [];
  }

  let remote = [];
  try {
    const response = await apiClient.get('/skills/marketplace');
    remote = response.data || [];
  } catch (err) {
    console.warn('Unable to fetch marketplace from API, using local & default listings', err);
  }

  const combined = [...localOffers, ...remote];
  return combined.length > 0 ? combined : DEFAULT_MARKETPLACE_LISTINGS;
};

export const publishExchangeOffer = async (offerObj, learnerType = 'school') => {
  const localOffers = JSON.parse(localStorage.getItem(PUBLISHED_OFFERS_KEY) || '[]');
  const teachSkill = offerObj.teachSkill || offerObj.skillOffered || 'Class 10 Mathematics';
  const learnSkill = offerObj.learnSkill || offerObj.skillWanted || 'Physics & Science Experiments';
  
  let newOffer = {
    id: `offer_${Date.now()}`,
    userId: `user_local_${Date.now()}`,
    name: offerObj.name || 'You (Published Exchange)',
    avatar: getInitialsAvatar(offerObj.name || 'You'),
    learnerType: learnerType,
    skillOffered: teachSkill,
    skillWanted: learnSkill,
    experience: offerObj.experience || 'Advanced',
    goal: offerObj.goal || 'Skill Swap',
    format: offerObj.format || '1-to-1',
    availability: offerObj.availability || 'Flexible',
    description: offerObj.description || 'Custom published skill exchange.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // Attempt backend persistence to PostgreSQL
  try {
    const res = await apiClient.post('/exchanges/publish', {
      skillOffered: teachSkill,
      teachSkill,
      skillWanted: learnSkill,
      learnSkill,
      experience: offerObj.experience,
      goal: offerObj.goal,
      format: offerObj.format,
      availability: offerObj.availability,
      description: offerObj.description,
      receiverId: offerObj.receiverId,
    });
    if (res && res.success && res.data) {
      newOffer = {
        ...newOffer,
        id: res.data.id,
        userId: res.data.senderId || newOffer.userId,
        createdAt: res.data.createdAt || newOffer.createdAt,
      };
    }
  } catch (err) {
    console.warn('[publishExchangeOffer] Backend publish failed, saved to local marketplace:', err.message);
  }

  localOffers.unshift(newOffer);
  localStorage.setItem(PUBLISHED_OFFERS_KEY, JSON.stringify(localOffers));

  // Add to local teach & learn skills if not present
  if (teachSkill) {
    await addSkillToTeach({ name: teachSkill, category: learnerType === 'school' ? 'School Academics' : 'General', level: offerObj.experience });
  }
  if (learnSkill) {
    await addSkillToLearn({ name: learnSkill, category: learnerType === 'school' ? 'School Academics' : 'General', goal: offerObj.goal });
  }

  // Dispatch live update event
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return newOffer;
};

export const getUserSkillsToTeach = async () => {
  const local = JSON.parse(localStorage.getItem(TEACH_STORAGE_KEY) || '[]');
  try {
    const listings = await getMarketplace();
    const remote = listings.map((listing) => ({
      id: listing.id,
      name: listing.skillOffered,
      category: listing.learnerType || 'General',
      ownerId: listing.userId,
    }));
    return [...local, ...remote];
  } catch (err) {
    return local;
  }
};

export const getUserSkillsToLearn = async () => {
  const local = JSON.parse(localStorage.getItem(LEARN_STORAGE_KEY) || '[]');
  try {
    const listings = await getMarketplace();
    const remote = listings.map((listing) => ({
      id: listing.id,
      name: listing.skillWanted,
      category: listing.learnerType || 'General',
      ownerId: listing.userId,
    }));
    return [...local, ...remote];
  } catch (err) {
    return local;
  }
};

export const addSkillToTeach = async (skillObj) => {
  const local = JSON.parse(localStorage.getItem(TEACH_STORAGE_KEY) || '[]');
  const name = typeof skillObj === 'string' ? skillObj : skillObj?.name || 'Skill';
  const newSkill = {
    id: `teach_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    category: skillObj?.category || 'General',
    level: skillObj?.level || 'Intermediate',
    createdAt: new Date().toISOString()
  };
  local.push(newSkill);
  localStorage.setItem(TEACH_STORAGE_KEY, JSON.stringify(local));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return newSkill;
};

export const addSkillToLearn = async (skillObj) => {
  const local = JSON.parse(localStorage.getItem(LEARN_STORAGE_KEY) || '[]');
  const name = typeof skillObj === 'string' ? skillObj : skillObj?.name || 'Skill';
  const newSkill = {
    id: `learn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    category: skillObj?.category || 'General',
    goal: skillObj?.goal || 'Mastery',
    createdAt: new Date().toISOString()
  };
  local.push(newSkill);
  localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify(local));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return newSkill;
};

export const removeSkillToTeach = async (id) => {
  const local = JSON.parse(localStorage.getItem(TEACH_STORAGE_KEY) || '[]');
  const filtered = local.filter((s) => s.id !== id);
  localStorage.setItem(TEACH_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return true;
};

export const removeSkillToLearn = async (id) => {
  const local = JSON.parse(localStorage.getItem(LEARN_STORAGE_KEY) || '[]');
  const filtered = local.filter((s) => s.id !== id);
  localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return true;
};

export const getExchangeRequests = async () => {
  let localRequests = [];
  try {
    localRequests = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '[]');
  } catch (e) {
    localRequests = [];
  }

  try {
    const response = await apiClient.get('/exchanges');
    const remote = response.data || [];
    return [...localRequests, ...remote];
  } catch (err) {
    return localRequests;
  }
};

export const getActiveExchanges = async () => {
  let localOffers = [];
  try {
    const raw = localStorage.getItem(PUBLISHED_OFFERS_KEY);
    if (raw) {
      localOffers = JSON.parse(raw);
    } else {
      // Auto-populate initial published active exchange offer if user has teach/learn skills
      const teachList = JSON.parse(localStorage.getItem(TEACH_STORAGE_KEY) || '[]');
      const learnList = JSON.parse(localStorage.getItem(LEARN_STORAGE_KEY) || '[]');
      if (teachList.length > 0 || learnList.length > 0) {
        const initialOffer = {
          id: `offer_default_init`,
          userId: 'current_user',
          name: 'You (Published Exchange)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          learnerType: 'school',
          skillOffered: teachList[0]?.name || 'Class 10 Mathematics & Algebra',
          skillWanted: learnList[0]?.name || 'Physics & Science Experiments',
          experience: 'Advanced',
          goal: 'Board Exam Preparation',
          format: '1-to-1',
          availability: 'Weekends',
          description: 'Active peer skill exchange published for study partnership and mutual learning.',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };
        localOffers = [initialOffer];
        localStorage.setItem(PUBLISHED_OFFERS_KEY, JSON.stringify(localOffers));
      }
    }
  } catch (e) {
    localOffers = [];
  }

  const mappedOffers = localOffers.map((offer) => ({
    id: offer.id,
    peerId: offer.userId || 'peer_user',
    peerName: offer.name || 'Published Exchange Partner',
    peerTitle: offer.description || 'Active Published Skill Swap',
    peerAvatar: offer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    skillOffered: offer.skillOffered || offer.teachSkill || 'Skill Offered',
    skillWanted: offer.skillWanted || offer.learnSkill || 'Skill Wanted',
    userSkill: offer.skillOffered || offer.teachSkill || 'Skill Offered',
    peerSkill: offer.skillWanted || offer.learnSkill || 'Skill Wanted',
    offeredSkill: offer.skillOffered || offer.teachSkill || 'Skill Offered',
    requestedSkill: offer.skillWanted || offer.learnSkill || 'Skill Wanted',
    status: 'ACTIVE',
    progressPercent: 100,
    availability: offer.availability || 'Flexible',
    learningGoals: offer.goal || 'Skill Swap',
    learningFormat: offer.format || '1-to-1',
    totalTeachingHours: offer.totalTeachingHours || 3.0,
    totalLearningHours: offer.totalLearningHours || 3.0,
    sessionsCompleted: offer.sessionsCompleted || 2,
    createdAt: offer.createdAt || new Date().toISOString()
  }));

  const exchanges = await getExchangeRequests();
  const accepted = exchanges
    .filter((exchange) => exchange.status === 'ACCEPTED' || exchange.status === 'ACTIVE')
    .map((e) => ({
      ...e,
      userSkill: e.userSkill || e.offeredSkill || e.skillOffered || 'Skill Offered',
      peerSkill: e.peerSkill || e.requestedSkill || e.skillWanted || 'Skill Wanted',
      skillOffered: e.skillOffered || e.offeredSkill || 'Skill Offered',
      skillWanted: e.skillWanted || e.requestedSkill || 'Skill Wanted',
      offeredSkill: e.offeredSkill || e.skillOffered || 'Skill Offered',
      requestedSkill: e.requestedSkill || e.skillWanted || 'Skill Wanted',
      peerName: e.peerName || e.senderName || e.fromUser?.name || 'Peer Tutor',
      peerAvatar: e.peerAvatar || e.fromUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      peerTitle: e.peerTitle || 'Exchange Partner'
    }));

  return [...mappedOffers, ...accepted];
};

export const sendExchangeRequest = async (targetUser, requestedSkill, offeredSkill, message = '') => {
  const isMockOrLocalUser = !targetUser?.id || targetUser.id.startsWith('user_local_') || targetUser.id.startsWith('peer_');

  if (!isMockOrLocalUser) {
    try {
      const response = await apiClient.post('/exchanges/request', {
        receiverId: targetUser.id,
        skillWanted: requestedSkill,
        skillOffered: offeredSkill,
      });
      window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
      return response.data;
    } catch (err) {
      console.warn('Backend exchange request API failed, falling back to local pending request', err?.response?.data || err.message);
    }
  }

  // Create local request fallback
  const localRequests = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '[]');
  const newRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    senderId: 'current_user',
    receiverId: targetUser?.id || 'peer_user',
    peerName: targetUser?.name || 'Peer Tutor',
    peerAvatar: targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    skillWanted: requestedSkill || 'General Skill',
    skillOffered: offeredSkill || 'General Skill',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    message
  };

  localRequests.unshift(newRequest);
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(localRequests));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return newRequest;
};

export const acceptExchangeRequest = async (requestId) => {
  const localRequests = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '[]');
  const found = localRequests.find((r) => r.id === requestId);
  if (found) {
    found.status = 'ACCEPTED';
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(localRequests));
    window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
    return found;
  }

  try {
    const response = await apiClient.patch(`/exchanges/${requestId}/status`, { status: 'ACCEPTED' });
    window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
    return response.data;
  } catch (err) {
    return { id: requestId, status: 'ACCEPTED' };
  }
};

export const rejectExchangeRequest = async (requestId) => {
  const localRequests = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '[]');
  const found = localRequests.find((r) => r.id === requestId);
  if (found) {
    found.status = 'REJECTED';
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(localRequests));
    window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
    return found;
  }

  try {
    const response = await apiClient.patch(`/exchanges/${requestId}/status`, { status: 'REJECTED' });
    window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
    return response.data;
  } catch (err) {
    return { id: requestId, status: 'REJECTED' };
  }
};

export const calculateUserStatistics = async () => {
  const [teachSkills, learnSkills, exchanges, activeExchanges] = await Promise.all([
    getUserSkillsToTeach(),
    getUserSkillsToLearn(),
    getExchangeRequests(),
    getActiveExchanges(),
  ]);
  return {
    skillsTeachCount: teachSkills.length,
    skillsWantCount: learnSkills.length,
    activeCount: activeExchanges.length,
    completedCount: exchanges.filter((exchange) => exchange.status === 'COMPLETED').length,
  };
};

export const getSavedMatches = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_MATCHES_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

export const saveMatch = (userId) => {
  const saved = getSavedMatches();
  if (!saved.includes(userId)) {
    saved.push(userId);
    localStorage.setItem(SAVED_MATCHES_KEY, JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  }
};

export const removeSavedMatch = (userId) => {
  const saved = getSavedMatches().filter((id) => id !== userId);
  localStorage.setItem(SAVED_MATCHES_KEY, JSON.stringify(saved));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
};

export const getExchangeMessages = async (conversationId) => {
  try {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response.data?.messages || response.data || [];
  } catch (err) {
    return [];
  }
};

export const sendExchangeMessage = async (conversationId, content) => {
  try {
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, { content });
    return response.data;
  } catch (err) {
    return { id: `msg_${Date.now()}`, conversationId, content, createdAt: new Date().toISOString() };
  }
};

export const getExchangeNotes = async () => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

export const addExchangeNote = async (noteObj) => {
  const notes = await getExchangeNotes();
  const content = typeof noteObj === 'string' ? noteObj : noteObj?.content || '';
  const newNote = {
    id: `note_${Date.now()}`,
    content,
    createdAt: new Date().toISOString()
  };
  notes.push(newNote);
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent('edunova_skillexchange_updated'));
  return newNote;
};
