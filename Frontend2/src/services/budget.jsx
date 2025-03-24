import axios from 'axios';

const API_URL = 'http://localhost:5000/api/budget';

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

// Get all budget limits
export const getBudgetLimits = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget limits:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Set budget limit for a category
export const setBudgetLimit = async (category, amount) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, { category, amount }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error setting budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Update budget limit
export const updateBudgetLimit = async (id, amount) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}`, { amount }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error updating budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete budget limit
export const deleteBudgetLimit = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get budget status (current spending vs limits)
export const getBudgetStatus = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/status`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget status:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get budget tips based on spending patterns
export const getBudgetTips = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/tips`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget tips:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    // Return mock tips if the API fails
    return {
      status: 'success',
      data: {
        tips: [
          {
            id: 1,
            title: 'Reduce Food Expenses',
            content: 'Try meal planning and cooking at home to reduce your food expenses by up to 30%.'
          },
          {
            id: 2,
            title: 'Transport Savings',
            content: 'Consider using public transportation or carpooling to save on fuel costs.'
          },
          {
            id: 3,
            title: 'Shopping Wisely',
            content: 'Make a list before shopping and stick to it to avoid impulse purchases.'
          }
        ]
      }
    };
  }
};
