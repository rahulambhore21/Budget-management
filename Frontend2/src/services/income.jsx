import axios from 'axios';

const API_URL = 'http://localhost:5000/api/income';

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

// Add new income
export const addIncome = async (incomeData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, incomeData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error adding income:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get all income entries
export const getIncomes = async (filters = {}) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, {
      ...authHeader,
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching income entries:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Update income entry
export const updateIncome = async (id, incomeData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}`, incomeData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error updating income entry:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete income entry
export const deleteIncome = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting income entry:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get income statistics
export const getIncomeStats = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/stats`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching income statistics:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
