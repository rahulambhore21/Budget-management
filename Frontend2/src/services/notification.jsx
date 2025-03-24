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
export const getNotifications = async (params = {}) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, {
      ...authHeader,
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // If API is not available, return mock data
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        unreadCount: 2,
        data: {
          notifications: [
            {
              _id: '1',
              type: 'budget_alert',
              title: 'Budget Alert',
              message: 'You have spent 80% of your Food budget for this month.',
              relatedTo: 'budget',
              isRead: false,
              isPriority: true,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
            },
            {
              _id: '2',
              type: 'goal_reminder',
              title: 'Savings Goal Reminder',
              message: 'Your Vacation goal is 50% complete. Keep going!',
              relatedTo: 'goal',
              isRead: false,
              isPriority: false,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
            },
            {
              _id: '3',
              type: 'spending_insight',
              title: 'Spending Insight',
              message: 'You spent 20% less on Shopping this month compared to last month.',
              relatedTo: 'insight',
              isRead: true,
              isPriority: false,
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
            },
            {
              _id: '4',
              type: 'system',
              title: 'Welcome to RupeeRakshak',
              message: 'Welcome to RupeeRakshak! Start by adding your first transaction.',
              relatedTo: 'system',
              isRead: true,
              isPriority: false,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
            }
          ]
        }
      };
    }
    
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
    
    // If API is not available, return success for demo
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        message: 'Notification marked as read'
      };
    }
    
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
    
    // If API is not available, return success for demo
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        message: 'All notifications marked as read'
      };
    }
    
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
    
    // If API is not available, return success for demo
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        message: 'Notification deleted successfully'
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
