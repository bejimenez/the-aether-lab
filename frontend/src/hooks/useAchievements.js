import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../lib/utils.js';
import { supabase } from '../lib/supabase';

const API_BASE_URL = getApiBaseUrl();

// Helper function to get authentication headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

// Enhanced helper for handling API responses with authentication
const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    
    // Merge with any existing headers
    const headers = {
      ...authHeaders,
      ...options.headers
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle the response
    if (response.ok) {
      return response.json();
    }
    
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: 'An unknown error occurred' };
    }
    
    console.error('API Error:', response.status, errorData);
    
    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      await supabase.auth.signOut();
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * Custom hook for managing achievements
 * @param {number} userId - The user ID to fetch achievements for
 * @returns {object} Achievement state and functions
 */
export const useAchievements = (userId) => {
  const [achievements, setAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user achievements
  const fetchAchievements = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/achievements?user_id=${userId}`
      );
      setAchievements(response.achievements || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch achievement notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/achievements/notifications?user_id=${userId}`
      );
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userId]);

  // Trigger achievement check
  const triggerAchievementCheck = useCallback(async () => {
    if (!userId) return { newly_completed: [] };

    setLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/achievements/check`,
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId })
        }
      );

      // Refresh achievements after check
      await fetchAchievements();
      await fetchNotifications();

      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error triggering achievement check:', err);
      return { newly_completed: [] };
    } finally {
      setLoading(false);
    }
  }, [userId, fetchAchievements, fetchNotifications]);

  // Mark notification as viewed
  const markNotificationViewed = useCallback(async (notificationId) => {
    try {
      await makeAuthenticatedRequest(
        `${API_BASE_URL}/achievements/notifications/${notificationId}/mark-viewed`,
        {
          method: 'PUT'
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_viewed: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as viewed:', err);
    }
  }, []);

  // Auto-trigger achievement check when user adds cards
  const checkAchievementsAfterCardAdd = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await triggerAchievementCheck();
      
      // Show notifications for newly completed achievements
      if (response.newly_completed && response.newly_completed.length > 0) {
        console.log('New achievements earned:', response.newly_completed);
        // You could show toast notifications here
      }
      
      return response;
    } catch (err) {
      console.error('Error checking achievements after card add:', err);
      return { newly_completed: [] };
    }
  }, [userId, triggerAchievementCheck]);

  // Load achievements on mount and when userId changes
  useEffect(() => {
    fetchAchievements();
    fetchNotifications();
  }, [fetchAchievements, fetchNotifications]);

  // Computed values
  const completedAchievements = achievements.filter(achievement => achievement.is_completed);
  const totalPoints = completedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
  const unreadNotifications = notifications.filter(notif => !notif.is_viewed);

  return {
    achievements,
    notifications,
    loading,
    error,
    
    // Computed values
    completedAchievements,
    totalPoints,
    unreadNotifications,
    
    // Functions
    fetchAchievements,
    fetchNotifications,
    triggerAchievementCheck,
    markNotificationViewed,
    checkAchievementsAfterCardAdd
  };
};

export default useAchievements;