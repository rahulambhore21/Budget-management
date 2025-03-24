import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notifications';

// Get auth header with token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token is missing');
  }
  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Get all notifications
export const getNotifications = async (options = {}) => {
  try {
    const { limit, unreadOnly } = options;
    const params = {};
    if (limit) params.limit = limit;
    if (unreadOnly !== undefined) params.unreadOnly = unreadOnly;
    
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, {
      ...authHeader,
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}/read`, {}, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/read-all`, {}, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
