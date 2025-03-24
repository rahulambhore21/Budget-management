import axios from 'axios';

const API_URL = 'http://localhost:5000/api/savings-goals';

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

// Get all savings goals
export const getSavingsGoals = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get a specific savings goal
export const getSavingsGoalById = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching savings goal:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Create a new savings goal
export const createSavingsGoal = async (goalData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, goalData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error creating savings goal:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Update a savings goal
export const updateSavingsGoal = async (id, goalData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}`, goalData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error updating savings goal:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete a savings goal
export const deleteSavingsGoal = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Add contribution to a savings goal
export const addContribution = async (id, amount) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${API_URL}/${id}/contribute`, { amount }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error adding contribution:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
